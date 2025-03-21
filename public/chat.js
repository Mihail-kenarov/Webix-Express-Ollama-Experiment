webix.ready(function() {
    webix.ui({
      rows: [
        {
          view: "list",
          id: "chat_list",
          autoheight: true,
          template: "#text#",
          data: []
        },
        {
          view: "text",
          id: "chat_input",
          placeholder: "Type your message...",
          on: {
            onEnter: function() {
              sendMessage();
            }
          }
        },
        {
          view: "button",
          value: "Send",
          click: function() {
            sendMessage();
          }
        }
      ]
    });
  
    function sendMessage(){
      const message = $$("chat_input").getValue().trim();
      if(!message) return;
  
      // Add user’s message to the chat list
      $$("chat_list").add({ text: "You: " + message });
      $$("chat_input").setValue("");
  
      // Call our Node server’s /api/chat endpoint
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      })
      .then(response => response.json())
      .then(data => {
        $$("chat_list").add({
          text: "Ollama: " + (data.text || "[No response]")
        });
      })
      .catch(error => {
        console.error("Error:", error);
        $$("chat_list").add({ text: "Error calling Ollama" });
      });
    }
  });
  