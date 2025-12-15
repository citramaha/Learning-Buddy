// assessment-page.js
import AssessmentLayout from "./assessment-layout.js";
import LoginState from "../../utils/login-state.js";
import { getLatestAssessment } from "../../api/progressAPI.js";
import "../../../styles/assessment-page.css";
import { getLearningPathById } from "../../api/academyAPI.js";

class AssessmentPage {
  async render() {
    const layout = new AssessmentLayout();
    
    return layout.render(`
      <section class="assessment-landing">
        <div class="panel assessment-panel">

          <!-- HERO / INTRO -->
          <div class="assessment-hero">
            <div class="assessment-icon">🧠</div>
            <h3>Selamat Datang di Assessment Skill</h3>
            <p class="subtitle">
              Kenali kemampuanmu dan dapatkan rekomendasi belajar yang paling sesuai.
            </p>
          </div>

          <!-- STATUS ASSESSMENT TERAKHIR -->
          <div id="assessment-status-box" class="assessment-status loading">
            <p>Memuat status assessment...</p>
          </div>

          <!-- SECTION 1: Untuk Apa Assessment -->
          <div class="assessment-section">
            <h4 class="assessment-section-title">Untuk Apa Assessment Ini?</h4>
            <p>
              Assessment ini dirancang untuk membantu kami memahami
              <strong>level kemampuan teknis</strong> yang kamu miliki saat ini.
              Dengan begitu, kamu tidak perlu memulai dari materi yang terlalu mudah
              atau terjebak di materi yang terlalu sulit.
            </p>
          </div>

          <!-- SECTION 2: Yang Akan Kamu Dapatkan -->
          <div class="assessment-section">
            <h4 class="assessment-section-title">Yang Akan Kamu Dapatkan</h4>
            <ul class="assessment-list">
              <li>Ringkasan kemampuan skill</li>
              <li>Rekomendasi learning path & roadmap belajar</li>
              <li>Fokus pada skill yang masih perlu ditingkatkan</li>
              <li>Course yang sesuai dengan levelmu</li>
            </ul>
          </div>

          <!-- SECTION 3: Cara Kerja -->
          <div class="assessment-section">
            <h4 class="assessment-section-title">Cara Kerja</h4>
            <ol class="assessment-steps">
              <li>Pilih job role / learning path</li>
              <li>Kerjakan soal assessment (±30 menit)</li>
              <li>Lihat hasil & rekomendasi belajar</li>
              <li>Mulai belajar dengan roadmap yang disarankan</li>
            </ol>
          </div>

          <!-- FOOTER NOTE -->
          <div class="assessment-footer-note">
            <p>
              Assessment ini <strong>bukan ujian kelulusan</strong>.  
              Jawablah sejujur mungkin agar rekomendasi belajar yang kamu dapatkan
              benar-benar sesuai dengan kebutuhanmu.
            </p>
          </div>

          <!-- CTA -->
          <div class="assessment-cta">
            <p>
              Gunakan menu di sebelah kiri untuk memulai assessment
              atau melihat rekomendasi belajarmu.
            </p>
          </div>

        </div>
      </section>
    `);
  }

  async afterRender() {
    const user = LoginState.getUser();
    if (!user) return;

    const box = document.getElementById("assessment-status-box");
    const last = await getLatestAssessment(user.id);

    if (!last) {
      box.classList.remove("loading");
      box.innerHTML = `
        <div class="status-empty">
          <strong>Kamu belum pernah mengikuti assessment</strong>
          <p>Mulai assessment sekarang untuk mendapatkan rekomendasi
            learning path dan course yang paling sesuai.</p>
          <button id="start-assessment" class="button-primary">
            Mulai Assessment
          </button>
        </div>
      `;

      document.getElementById("start-assessment").onclick = () => {
        window.location.hash = "#/assessment/test";
      };
      return;
    }

    const lp = await getLearningPathById(last.learning_path_id);

    box.classList.remove("loading");
    box.innerHTML = `
      <div class="status-done">
        <h4>✅ Assessment Terakhir</h4>

        <div class="status-row">
          <span>Learning Path</span>
          <strong>${lp?.learning_path_name ?? "-"}</strong>
        </div>

        <div class="status-row">
          <span>Skor Akhir</span>
          <strong>${Math.round(last.overall_score)}%</strong>
        </div>

        <div class="status-actions">
          <button id="view-result" class="button-secondary">
            Lihat Hasil
          </button>
          <button id="retake-test" class="button-outline">
            Ulangi Assessment
          </button>
        </div>
      </div>
    `;

    document.getElementById("view-result").onclick = () => {
      window.location.hash = "#/assessment/recommendation";
    };

    document.getElementById("retake-test").onclick = () => {
      window.location.hash = "#/assessment/test";
    };
  }
}

export default AssessmentPage;