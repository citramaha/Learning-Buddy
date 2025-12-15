import AssessmentLayout from "./assessment-layout.js";
import { calculateSkillScore, determineCorrectKey } from "./quiz-utils.js";
import {
  generateRecommendations,
  saveAssessmentResult,
} from "../../api/assessmentAPI.js";
import {
  getLatestAssessment,
  compareAssessment,
  findWeakSkills,
} from "../../api/progressAPI.js";
import { mapSkillToLearningPath } from "../../utils/recommendationHelper.js";
import { supabase } from "../../api/supabaseClient.js";
import "../../../styles/assessment-result.css";

class AssessmentResult {
  async render() {
    const layout = new AssessmentLayout();

    return layout.render(`
      <section class="assessment-result-page">
        <div class="panel assessment-result-panel">
          <div id="result-container" class="result-loading">
            Menghitung hasil assessment...
          </div>
        </div>
      </section>
    `);
  }

  async afterRender() {
    const container = document.getElementById("result-container");

    /* ===============================
       AUTH CHECK
    =============================== */
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user =
      session?.user ||
      JSON.parse(localStorage.getItem("auth_user")) ||
      JSON.parse(localStorage.getItem("user"));

    if (!user) {
      container.innerHTML = `<p>Silakan login terlebih dahulu.</p>`;
      return;
    }

    /* ===============================
       LOAD DATA
    =============================== */
    const answers = JSON.parse(
      localStorage.getItem("assessment_answers") || "{}"
    );
    const questions = JSON.parse(
      localStorage.getItem("assessment_questions") || "[]"
    );
    const learningPathId = Number(
      localStorage.getItem("assessment_learning_path")
    );

    if (!questions.length) {
      container.innerHTML = "<p>Tidak ada data assessment.</p>";
      return;
    }

    /* ===============================
       CALCULATE RESULT
    =============================== */
    const result = calculateSkillScore(questions, answers);
    const weakSkills = findWeakSkills(result.skill_scores);
    mapSkillToLearningPath(weakSkills);

    const getSkillLevel = (score) => {
      if (score >= 80) return "Advanced";
      if (score >= 60) return "Intermediate";
      return "Beginner";
    };

    /* ===============================
       SAVE & COMPARE
    =============================== */
    const userId = user.id;
    let improvementData = null;

    if (userId) {
      const previous = await getLatestAssessment(userId);

      await saveAssessmentResult(
        userId,
        learningPathId,
        result.skill_scores,
        result.overall_score
      );

      if (previous) {
        improvementData = compareAssessment(previous, {
          skill_scores: result.skill_scores,
        });
      }
    }

    /* ===============================
       SUMMARY TEXT
    =============================== */
    let summaryText = `
      Berdasarkan hasil assessment, kemampuan kamu berada pada level
      <strong>${getSkillLevel(result.overall_score)}</strong>
      dengan skor keseluruhan <strong>${result.overall_score}%</strong>.
    `;

    if (weakSkills.length > 0) {
      summaryText += `
        Skill yang masih perlu ditingkatkan:
        <strong>${weakSkills.join(", ")}</strong>.
      `;
    } else {
      summaryText += `
        Semua skill kamu sudah berada pada level yang baik.
      `;
    }

    /* ===============================
       GENERATE RECOMMENDATION
    =============================== */
    await generateRecommendations(result.skill_scores, learningPathId);

    /* ===============================
       RENDER UI
    =============================== */
   container.innerHTML = `
  <!-- ===============================
       TITLE CONTAINER
       =============================== -->
  <div class="result-title-box">
    <h3>Hasil Assessment</h3>
  </div>

  <!-- ===============================
       RESULT SUMMARY
       =============================== -->
  <div class="result-summary-box">
    <div class="score-value">${result.overall_score}%</div>
    <div class="score-label">Overall Score</div>

    <div class="progress-wrap">
      <div class="progress-bar" style="width:${result.overall_score}%"></div>
    </div>

    <p class="summary-text">${summaryText}</p>
  </div>

  <!-- ===============================
       SKILL BREAKDOWN
       =============================== -->
  <div class="skill-container">
    <h4>Skill Breakdown</h4>

    ${Object.entries(result.skill_scores)
      .map(
        ([skill, score]) => `
          <div class="skill-row">
            <span class="skill-name">${skill}</span>
            <span class="skill-score">${score}%</span>
          </div>
        `
      )
      .join("")}
  </div>

  <!-- ===============================
       CTA
       =============================== -->
  <div class="result-action-center">
    <button id="btn-roadmap" class="button-primary">
      🚀 Lihat Roadmap Belajar
    </button>
  </div>

  <!-- ===============================
       DETAIL JAWABAN
       =============================== -->
  <div class="result-detail-container">
    <h4>Detail Jawaban</h4>

    <ul class="answer-list">
      ${questions
        .map((q) => {
          const correctKey = determineCorrectKey(q);
          const userAnswer = answers[q.question_id];
          const isCorrect = userAnswer === correctKey;

          return `
            <li class="answer-item">
              <div class="answer-header">
                <span class="answer-status ${
                  isCorrect ? "correct" : "wrong"
                }">
                  ${isCorrect ? "✔ Benar" : "✖ Salah"}
                </span>
              </div>

              <p class="question-text">${q.question_desc}</p>

              <p class="answer-user">
                Jawaban kamu:
                <strong>${userAnswer ?? "-"}</strong>
              </p>
            </li>
          `;
        })
        .join("")}
    </ul>
  </div>
`;



    document.getElementById("btn-roadmap").onclick = () => {
      window.location.hash = "#/assessment/recommendation";
    };
  }
}

export default AssessmentResult;
