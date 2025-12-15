import { getLearningPaths } from "../../api/academyAPI.js";
import { navigateTo } from "../../app/routerHelper.js";
import"../../../styles/learning-path.css";

export default async function LearningPathPage() {
  const app = document.getElementById("main-content");

  app.innerHTML =`
  <div class="lp-wrapper">
    
    <div class="lp-container">
      <div class="lp-title">
        <h3> Learning Path </h3>
      </div>

      <p class="lp-subtitle">
        “Pilih jalur belajar yang telah disusun secara sistematis untuk membantu kamu memahami materi, meningkatkan keterampilan teknis, dan mempersiapkan diri menghadapi tantangan karier di masa depan.”
      </p>

      <div id="lp-container" class="lp-grid"></div>

    </div>
  </div>
`;


  const { data } = await getLearningPaths();
  const container = document.getElementById("lp-container");

  if (!data || data.length === 0) {
    container.innerHTML = `<p>Learning path belum tersedia.</p>`;
    return;
  }

  data.forEach(lp => {
    const card = document.createElement("div");
    card.className = "lp-card";

    card.innerHTML = `
      <div class="lp-card-content">
        <h3 class="lp-name">${lp.learning_path_name}</h3>

        <p class="lp-desc">
          ${lp.learning_path_desc ?? "Deskripsi belum tersedia."}
        </p>

        <button class="lp-btn">
          Lihat Course →
        </button>
      </div>
    `;

    card.querySelector(".lp-btn").onclick = () => {
      navigateTo(`/academy/course-list?path=${lp.learning_path_id}`);
    };

    container.appendChild(card);
  });
}
