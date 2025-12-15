import { supabase } from "../../api/supabaseClient.js";
import { getCoursesByPath } from "../../api/academyAPI.js";
import { isCourseCompleted } from "../../api/academyProgressAPI.js";
import "../../../styles/course-list.css";

export default async function CourseListPage() {
  const hash = window.location.hash;
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(queryString);
  const pathId = Number(params.get("path"));

  const app = document.getElementById("main-content");

  if (!pathId) {
    app.innerHTML = `<p>Path ID tidak valid.</p>`;
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    app.innerHTML = `<p>Silakan login terlebih dahulu</p>`;
    return;
  }


  /* ================================
     MAIN LAYOUT
  ================================ */
  app.innerHTML =`
    <section class="course-wrapper">

      <div class="course-container">
        <div class="c-title">        
          <h2 class="course-title">Daftar Course</h2>
        </div>

        <!-- PROGRESS -->
        <div class="progress-section">
          <div class="progress">
            <div id="progress-bar"></div>
          </div>

          <p class="progress-text">
            <span id="progressValue">0</span>% Selesai
          </p>
        </div>

        <!-- LIST -->
        <div id="course-list">Loading...</div>

        <!-- BACK BUTTON -->
        <div class="course-footer">
          <button id="btn-back-lp" class="btn-back">
            ← Kembali ke Learning Path
          </button>
        </div>

      </div>

    </section>
  `;

  /* ================================
     FETCH COURSES
  ================================ */
  const { data: courses, error } = await getCoursesByPath(pathId);

  if (error || !courses?.length) {
    document.getElementById("course-list").innerHTML =
      "<p>Tidak ada course</p>";
    return;
  }

  const container = document.getElementById("course-list");
  container.innerHTML = "";

  let completedCount = 0;

  /* ================================
     RENDER COURSE ITEM
  ================================ */
  for (const course of courses) {
    const completed = await isCourseCompleted(
      userId,
      course.course_id
    );

    if (completed) completedCount++;

    const div = document.createElement("div");
    div.className = `course-item ${completed ? "completed" : ""}`;

    div.innerHTML = `
      <span class="course-name">
        ${course.course_name}
      </span>

      <div class="course-meta">
        <span class="course-duration">
          ⏱ ${course.hours_to_study ?? "-"} jam
        </span>
        <span class="course-level">
          🎯 ${course.course_level?.course_level ?? "-"}
        </span>
      </div>

      <button
        class="course-btn ${completed ? "completed" : ""}"
        data-id="${course.course_id}"
      >
        ${completed ? "✔ Selesai" : "Mulai Course"}
      </button>
    `;

    container.appendChild(div);
  }

  /* ================================
     EVENTS
  ================================ */
  const backBtn = document.getElementById("btn-back-lp");
  if (backBtn) {
    backBtn.onclick = () => {
      window.location.hash = "#/academy/learning-path";
      };
    }

  document.querySelectorAll(".course-btn").forEach(btn => {
    btn.onclick = () => {
      window.location.hash =
        `#/academy/course-detail?course=${btn.dataset.id}`;
    };
  });

  /* ================================
     PROGRESS BAR
  ================================ */
  const percent = Math.floor(
    (completedCount / courses.length) * 100
  );

  document.getElementById("progress-bar").style.width =
    `${percent}%`;
  document.getElementById("progressValue").innerText =
    percent;
}
