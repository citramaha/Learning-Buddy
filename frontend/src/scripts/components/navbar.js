import LoginState from '../utils/login-state';
import { logoutUsers } from "../api/authAPI.js";

class Navbar {

  static renderPublic() {
    return `
      <li><a href="#/learning-path">Learning Path</a></li>
      <li><a href="#/program">Program</a></li>
      <li><a href="#/langganan">Langganan</a></li>
      <li><a href="#/login">Login</a></li>
    `;
  }

  static renderDashboard() {
    return `
      <li><a href="#/dashboard">Dashboard</a></li>
      <li><a href="#/academy">Academy</a></li>
      <li><a href="#/assessment">Assessment</a></li>
      <li><a href="#/lainnya">Lainnya</a></li>
      <li><a href="#" id="logout-btn">Logout</a></li>
    `;
  }

  static load() {
    const navList = document.querySelector('#nav-list');
    if (!navList) return;

    if (LoginState.isLoggedIn()) {
      navList.innerHTML = this.renderDashboard();
      this.#setupLogout();
    } else {
      navList.innerHTML = this.renderPublic();
    }

    this.initMobileNav();
  }

  static initMobileNav() {
    const drawerBtn = document.getElementById("drawer-button");
    const drawer = document.getElementById("navigation-drawer");
    const overlay = document.getElementById("nav-overlay");

    if (!drawerBtn || !drawer || !overlay) return;

    const open = () => {
      drawer.classList.add("active");
      overlay.classList.add("active");
    };

    const close = () => {
      drawer.classList.remove("active");
      overlay.classList.remove("active");
    };

    drawerBtn.onclick = open;
    overlay.onclick = close;

    drawer.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", close);
    });
  }

  static #setupLogout() {
    const logoutBtn = document.querySelector('#logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      try {
        await logoutUsers();
        LoginState.logout();
        window.location.hash = '#/login';
        window.location.reload();
      } catch (err) {
        alert("Gagal logout");
      }
    });
  }
}

export default Navbar;
