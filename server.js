const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // node-fetch v2

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static("public"));

// POST /api/chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "No message provided." });
    }

    // Call the locally running Ollama server
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userMessage,
        model: "llama3.2:latest",  // Using the latest Llama 3.2 model
        stream: false     // Disable streaming since we're handling the response differently
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Ollama API error:", errorData);
      return res.status(response.status).json({ 
        error: `Ollama API error (${response.status})`, 
        details: errorData 
      });
    }

    // For node-fetch v2, we'll use .json() instead of streaming
    const data = await response.json();
    
    // Send the response text back to the client
    res.json({ text: data.response || "[No response]" });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Server error while generating text." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Expecting Ollama to be running at http://localhost:11434`);
});