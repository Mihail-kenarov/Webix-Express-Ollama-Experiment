const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // If on Node <18, otherwise use the global fetch

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
    const response = await fetch("http://localhost:11434", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userMessage,
        model: "llama2"  // or whichever model you want
      })
    });

    // We need to read the streamed JSON lines from Ollama
    let finalText = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert Uint8Array -> string
      const chunk = decoder.decode(value, { stream: true });

      // Ollama responds in JSON lines, e.g.:
      // {"response":"...partial text...","model":"llama2"}
      // We'll parse line by line
      const lines = chunk.split("\n");
      for (let line of lines) {
        line = line.trim();
        if (!line) continue; // Skip empty lines
        try {
          const json = JSON.parse(line);
          if (json.response) {
            finalText += json.response;
          }
        } catch (err) {
          // Not a valid JSON line; ignore
        }
      }
    }

    // Send the full text back to the client
    res.json({ text: finalText });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Server error while generating text." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
