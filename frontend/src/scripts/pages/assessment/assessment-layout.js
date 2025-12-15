import { getActiveRoute } from "../../app/routerHelper.js";

class AssessmentLayout {
  async render(contentHtml = "") {
    return `
      <section class="layout assessment-layout">
        <aside class="side-menu">
          <!-- Judul Assessment di-center -->
          <h2 class="assessment-title menu-item assessment-main">Assessment</h2>
          <ul id="assessment-menu">
            <li>
              <a href="#/assessment/test" data-route="/assessment/test">
                Assessment Test
              </a>
            </li>
            <li>
              <a href="#/assessment/result" data-route="/assessment/recommendation">
                Hasil Test
              </a>
            </li>
            <li>
              <a href="#/assessment/recommendation" data-route="/assessment/recommendation">
                Rekomendasi Belajar
              </a>
            </li>
          </ul>
        </aside>

        <main class="content">
          ${contentHtml}
        </main>
      </section>
    `;
  }

  afterRender() {
    const activeRoute = getActiveRoute();
    const links = document.querySelectorAll("#assessment-menu a");

    links.forEach(link => {
      if (activeRoute.startsWith(link.dataset.route)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
}

export default AssessmentLayout;