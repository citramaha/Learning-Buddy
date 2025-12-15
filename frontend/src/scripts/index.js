// CSS
import "../styles/styles.css";
import "../styles/chatbot.css";

import App from "./app/app.js";
import Navbar from "./components/navbar.js";
import Router from "./app/router.js";
import { initChatbot } from "./pages/chatbot/chatbot.js";
import { initSkillFloatingWidget } from "./components/skillFloatingWidget.js";
import "./components/skillFloatingWidget.css";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.getElementById("main-content"),
  });

  new Router(app);

  const reloadNavbar = () => {
    Navbar.load();
    app.setupDrawer(); // 🔥 WAJIB SETELAH NAVBAR ADA
  };

  window.addEventListener("hashchange", reloadNavbar);
  reloadNavbar();

  initChatbot();
  initSkillFloatingWidget();
});
