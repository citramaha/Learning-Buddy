import LoginState from "../../utils/login-state.js";
import {
  getLastActiveCourse,
  getCourseProgress
} from "../../api/dashboardAPI.js";
import {
  getUserProgressOverview,
  getLatestAssessment
} from "../../api/progressAPI.js";
import { supabase } from "../../api/supabaseClient.js";
import "../../../styles/dashboard-page.css";

class DashboardPage {
  async render() {
    const user = LoginState.getUser();
    if (!user) {
      window.location.hash = "/login";
      return "";
    }

    return `
      <!-- HERO BIRU -->
      <section class="dashboard-hero">
        <div class="dashboard-hero-content">
          <h2>
            Selamat datang <strong>${user.name || user.email}</strong> 👋
          </h2>
          <p class="subtitle">
            Ayo lanjutkan perjalanan belajarmu hari ini!
          </p>

          <!-- CARD PUTIH -->
          <div id="continue-learning" class="hero-card"></div>
        </div>
      </section>

      <!-- CONTENT BAWAH -->
      <section class="dashboard container">
        <div id="skill-summary" class="card">
          <h3>📊 Ringkasan Skill</h3>
          <div id="skill-summary-list">
            <p>Memuat progress skill...</p>
          </div>
        </div>

        <div id="assessment-status" class="card">
          <h3>📝 Assessment</h3>
          <div id="assessment-content">
            <p>Memuat status assessment...</p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const user = LoginState.getUser();
    if (!user) return;

    /* ======================
       LANJUTKAN BELAJAR
    ====================== */
    const continueBox = document.getElementById("continue-learning");
    const course = await getLastActiveCourse(user.id);

    if (!course) {
      // User belum memulai course
      continueBox.innerHTML = `
        <h3 class="continue-title">📘 Lanjutkan Belajar</h3>
        <div class="course-row">
          <div class="course-status">Kamu belum memulai course</div>
          <button class="button-primary" id="start-learning">Mulai Belajar</button>
        </div>
      `;

      document.getElementById("start-learning").onclick = () => {
        window.location.hash = "#/academy";
      };
    } else {
      // User sedang melanjutkan course
      const progress = await getCourseProgress(user.id, course.course_id);

      continueBox.innerHTML = `
        <h3 class="continue-title">📘 Lanjutkan Belajar</h3>
        <h4 class="course-name">${course.course_name}</h4>

        <div class="continue-row">
          <div class="continue-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${progress.percent}%"></div>
            </div>
          </div>

          <div class="continue-text">
            ${progress.done}/${progress.total} tutorial selesai
          </div>

          <button id="continue-btn" class="button-primary">
            Lanjutkan
          </button>
        </div>
      `;

      document.getElementById("continue-btn").onclick = () => {
        window.location.hash =
          `#/academy/course-detail?course=${course.course_id}`;
      };
    }

    /* ======================
       SKILL SUMMARY
    ====================== */
    const skillBox = document.getElementById("skill-summary-list");
    const progressData = await getUserProgressOverview(user.id);

    if (!progressData || progressData.length === 0) {
      skillBox.innerHTML = `<p>Belum ada progress skill.</p>`;
    } else {
      const topSkills = progressData
        .map(s => ({
          ...s,
          percent: Math.round(
            (s.completed_count / s.total_tutorial) * 100
          )
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4);

      skillBox.innerHTML = `
        ${topSkills.map(skill => `
          <div class="skill-mini">
            <div class="skill-mini-header">
              <span>${skill.progress_name}</span>
              <span>${skill.percent}%</span>
            </div>
            <div class="skill-mini-bar">
              <div class="skill-mini-fill" style="width:${skill.percent}%"></div>
            </div>
          </div>
        `).join("")}
      `;
    }

    /* ======================
       ASSESSMENT
    ====================== */
    const assessmentBox = document.getElementById("assessment-content");
    const latestAssessment = await getLatestAssessment(user.id);

    // BELUM PERNAH ASSESSMENT
    if (
      !latestAssessment ||
      Object.keys(latestAssessment).length === 0 ||
      latestAssessment.overall_score === null ||
      latestAssessment.overall_score === undefined
    ) {
      assessmentBox.innerHTML = `
        <div class="assessment-panel">
          <p>Kamu belum mengikuti assessment.</p>
          <button class="button-primary" id="start-assessment">
            Mulai Assessment
          </button>
        </div>
      `;

      document.getElementById("start-assessment").onclick = () => {
        window.location.hash = "#/assessment";
      };

      return;
    }

    // SUDAH PERNAH ASSESSMENT
    const { data: lp } = await supabase
      .from("learning_path")
      .select("learning_path_name")
      .eq("learning_path_id", latestAssessment.learning_path_id)
      .single();

    assessmentBox.innerHTML = `
      <div class="assessment-panel">
        <p>
          Learning Path:
          <strong>${lp?.learning_path_name || "-"}</strong>
        </p>
        <p>
          Skor Akhir:
          <strong>${latestAssessment.overall_score.toFixed(1)}%</strong>
        </p>
      </div>
    `;
  }
}

export default DashboardPage;