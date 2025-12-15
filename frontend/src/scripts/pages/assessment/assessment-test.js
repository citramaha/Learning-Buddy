import AssessmentLayout from "./assessment-layout.js";
import { getLearningPaths } from "../../api/assessmentAPI.js";
import { getLatestAssessment } from "../../api/progressAPI.js";
import { supabase } from "../../api/supabaseClient.js";
import "../../../styles/assessment-test.css";

class AssessmentTest {
  async render() {
    const layout = new AssessmentLayout();

    return layout.render(`
      <section class="page assessment-test-page">

        <div class="panel assessment-test-panel" id="assessment-panel">
        <div class="assessment-title-box">
          <h3>Assessment Skill</h3>
        </div>

          <p class="assessment-desc">
            Kenali tingkat kemampuan teknis kamu secara menyeluruh.
            Hasil assessment akan digunakan untuk menyusun
            <strong>rekomendasi learning path dan roadmap belajar</strong>
            yang paling sesuai dengan tujuan kariermu.
          </p>

          <!-- GLOBAL WARNING -->
          <div id="assessment-warning" class="assessment-warning hidden"></div>

          <label for="lp-select" class="select-label">
            Pilih Learning Path / Job Role
          </label>

          <select id="lp-select">
            <option value="">-- Pilih Job Role --</option>
          </select>

          <p class="assessment-hint">
            ⏱️ Estimasi waktu pengerjaan sekitar <strong>30 menit</strong>.
            Tidak ada jawaban benar atau salah — jawablah dengan jujur
            agar hasil yang didapat lebih akurat.
          </p>

          <div class="assessment-action">
            <button id="start-test-btn" class="button-primary">
              Mulai Assessment
            </button>
          </div>

        </div>
      </section>
    `);
  }

  async afterRender() {
    const warningBox = document.getElementById("assessment-warning");
    const select = document.getElementById("lp-select");
    const panel = document.getElementById("assessment-panel");

    // ===============================
    // AUTH
    // ===============================
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;

    // ===============================
    // 🔔 CEK ASSESSMENT TERAKHIR
    // ===============================
    const latestAssessment = await getLatestAssessment(userId);

    if (latestAssessment) {
      warningBox.classList.remove("hidden");
      warningBox.innerHTML = `
        <p>⚠️ Kamu sudah pernah mengikuti assessment sebelumnya.</p>
        <p>
          Skor terakhir:
          <strong>${latestAssessment.overall_score}%</strong>
        </p>
        <button id="view-last-result-btn">
          📄 Lihat Hasil Terakhir
        </button>
      `;

      document.getElementById("view-last-result-btn").onclick = () => {
        window.location.hash =
          "#/assessment/result?assessment=" + latestAssessment.id;
      };
    }

    // ===============================
    // LOAD LEARNING PATH
    // ===============================
    const list = await getLearningPaths();

    if (!list || list.length === 0) {
      select.innerHTML =
        '<option value="">Tidak ada job role tersedia</option>';
      return;
    }

    let options = '<option value="">-- Pilih Job Role --</option>';

    list.forEach(lp => {
      options += `
        <option value="${lp.learning_path_id}">
          ${lp.learning_path_name}
        </option>
      `;
    });

    select.innerHTML = options;

    // ===============================
    // AUTO SCROLL
    // ===============================
    select.addEventListener("change", () => {
      if (!select.value) return;

      panel.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    // ===============================
    // START TEST
    // ===============================
    document
      .getElementById("start-test-btn")
      .addEventListener("click", () => {
        const lpId = select.value;

        if (!lpId) {
          alert("Pilih job role terlebih dahulu!");
          return;
        }

        window.location.hash = "#/assessment/quiz?lp=" + lpId;
      });
  }
}

export default AssessmentTest;
