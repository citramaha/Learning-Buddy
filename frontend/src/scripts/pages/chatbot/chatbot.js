import { sendToChatbot } from "../../api/chatbotAPI.js";
import { renderBotMessage } from "./chatbot-render.js";

export function initChatbot() {
  const popup = document.getElementById("learning-buddy-popup");
  const container = document.getElementById("chatbot-container");
  const input = document.getElementById("chatbot-input");
  const messages = document.querySelector(".chatbot-messages");

  popup.addEventListener("click", () => {
    container.classList.toggle("hidden");
  });

  input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && input.value.trim() !== "") {
      const text = input.value;
      input.value = "";

      // tampilkan pesan user
      messages.innerHTML += `<div class="msg user">${text}</div>`;
      messages.scrollTop = messages.scrollHeight;

      // placeholder bot
      const botDiv = document.createElement("div");
      botDiv.className = "msg bot";
      botDiv.textContent = "⏳ Aku sedang memproses...";
      messages.appendChild(botDiv);
      messages.scrollTop = messages.scrollHeight;

      try {
        const res = await sendToChatbot(text);

        // ganti placeholder
        botDiv.textContent = res.reply;
      } catch (err) {
        botDiv.textContent = "⚠️ Gagal menghubungi server.";
      }

      messages.scrollTop = messages.scrollHeight;
    }
  });
}
