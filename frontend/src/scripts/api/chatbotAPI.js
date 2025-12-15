import { renderBotMessage } from "../pages/chatbot/chatbot-render.js";

const API_URL = "http://localhost:8000/chat";

let sessionId = localStorage.getItem("learning_buddy_session");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("learning_buddy_session", sessionId);
}

export async function sendToChatbot(message) {
  const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: "e87a738c-8877-4159-a02b-cf5f47d09bdb",
      message
    })
  });

  const data = await res.json();

  return data;
}

