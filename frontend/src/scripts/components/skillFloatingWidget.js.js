import { supabase } from "../api/supabaseClient.js";
import { getUserProgressOverview } from "../api/progressAPI.js";

export async function initSkillFloatingWidget() {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="skill-widget-btn">📊</div>

    <div id="skill-widget-panel" class="hidden">
      <h4>Progress Skill Kamu</h4>
      <div id="skill-progress-list"></div>
    </div>
    `
  );

  // 🔁 RENDER AWAL
  await refreshSkillProgress(userId);

  // TOGGLE PANEL
  document.getElementById("skill-widget-btn").onclick = () => {
    document
      .getElementById("skill-widget-panel")
      .classList.toggle("hidden");
  };

  // 🔔 LISTEN GLOBAL EVENT (INI YANG SEBELUMNYA KURANG)
  window.addEventListener("progress-updated", async () => {
    console.log("📊 Skill progress updated");
    await refreshSkillProgress(userId);
  });
}

// ===============================
// FETCH + RENDER
// ===============================
async function refreshSkillProgress(userId) {
  const progressData = await getUserProgressOverview(userId);
  renderSkillProgress(progressData);
}

// ===============================
// RENDER PROGRESS BAR
// ===============================
function renderSkillProgress(data) {
  const container = document.getElementById("skill-progress-list");

  if (!container) return;

  if (!data || !data.length) {
    container.innerHTML = `<p>Belum ada progress</p>`;
    return;
  }

  container.innerHTML = data
    .map(skill => {
      const percent = Math.round(
        (skill.completed_count / skill.total_tutorial) * 100
      );

      return `
        <div class="skill-item">
          <div class="skill-header">
            <span>${skill.progress_name}</span>
            <span>${percent}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}
