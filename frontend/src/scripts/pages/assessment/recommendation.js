import AssessmentLayout from "./assessment-layout.js";
import { supabase } from "../../api/supabaseClient.js";
import "../../../styles/recommendation.css";

import { getLatestAssessment } from "../../api/progressAPI.js";
import { getCoursesByPath } from "../../api/academyAPI.js";
import { isCourseCompleted } from "../../api/academyProgressAPI.js";

class Recommendation {
  async render() {
    const layout = new AssessmentLayout();

    return layout.render(`
      <section class="page recommendation-page">
        
        <div class="panel">
          <div class="roadmap-title">
            <h3>Roadmap Belajar Personal</h3>
          </div>
          
          <p class="subtitle">
            Ikuti roadmap ini secara berurutan untuk meningkatkan skill kamu
          </p>

          <div id="roadmap-container">
            Memuat roadmap...
          </div>
        </div>
      </section>
    `);
  }

  async afterRender() {
    const container = document.getElementById("roadmap-container");

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    if (!userId) {
      container.innerHTML = "<p>Silakan login terlebih dahulu.</p>";
      return;
    }

    const assessment = await getLatestAssessment(userId);

    if (!assessment) {
      container.innerHTML = `
        <p>Kamu belum mengerjakan assessment.</p>
        <a href="#/assessment/test">Mulai Assessment</a>
      `;
      return;
    }

    const learningPathId = assessment.learning_path_id;
    const { data: courses } = await getCoursesByPath(learningPathId);

    if (!courses || !courses.length) {
      container.innerHTML = "<p>Tidak ada roadmap untuk learning path ini.</p>";
      return;
    }

    let activeIndex = 0;
    for (let i = 0; i < courses.length; i++) {
      const completed = await isCourseCompleted(userId, courses[i].course_id);
      if (!completed) {
        activeIndex = i;
        break;
      }
    }

    container.innerHTML = `
      <div class="roadmap">
        ${await Promise.all(
          courses.map(async (course, index) => {
            const completed = await isCourseCompleted(
              userId,
              course.course_id
            );

            const isActive = index === activeIndex && !completed;
            const locked = index > activeIndex && !completed;

            return `
              <div class="roadmap-item
                ${completed ? "completed" : ""}
                ${isActive ? "active" : ""}
                ${locked ? "locked" : ""}
              ">
                
                <div class="roadmap-left">
                  <div class="roadmap-indicator">
                    ${
                      completed
                        ? `<span class="check">✔</span>`
                        : `<span class="number">${index + 1}</span>`
                    }
                  </div>
                  <div class="roadmap-connector"></div>
                </div>

                <div class="roadmap-card">
                  <h4>${course.course_name}</h4>

                  <div class="meta">
                    <span>⏱ ${course.hours_to_study ?? "-"} jam</span>
                    <span>🎯 ${course.course_level?.course_level ?? "-"}</span>
                  </div>

                  <p class="status">
                    ${
                      completed
                        ? "Course selesai"
                        : isActive
                        ? "Sedang dipelajari"
                        : "Terkunci"
                    }
                  </p>

                  <button
                    class="btn-start"
                    ${locked ? "disabled" : ""}
                    data-id="${course.course_id}"
                  >
                    ${completed ? "Lihat Ulang" : "Mulai Course"}
                  </button>
                </div>
              </div>
            `;
          })
        ).then(res => res.join(""))}
      </div>
    `;

    container.addEventListener("click", e => {
      if (e.target.classList.contains("btn-start")) {
        const courseId = e.target.dataset.id;
        window.location.hash = `#/academy/course-detail?course=${courseId}`;
      }
    });
  }
}

export default Recommendation;
