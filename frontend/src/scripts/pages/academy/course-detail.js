import { supabase } from "../../api/supabaseClient.js";
import {
  getTutorials,
  getCourseById,
} from "../../api/academyAPI.js";
import {
  completeTutorial,
  getCompletedTutorialCount,
  completeAllTutorialsInCourse,
} from "../../api/academyProgressAPI.js";
import "../../../styles/course-detail.css";

export default async function CourseDetailPage() {
  const hash = window.location.hash;
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(queryString);
  const courseId = Number(params.get("course"));

  const app = document.getElementById("main-content");

  if (!courseId) {
    app.innerHTML = `<p>Course ID tidak valid.</p>`;
    return;
  }

  /* ================================
     AUTH
  ================================ */
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    app.innerHTML = `<p>Silakan login terlebih dahulu</p>`;
    return;
  }

  /* ================================
     LAYOUT
  ================================ */

  app.innerHTML =`
    <section class="course-wrapper">
      <div class="course-container">
        <div class="course-tittle-container">
            <h2 id="course-title" class="course-title">
              Course Detail
            </h2>
          </div>
        <div class="course-header">
          
          <button id="btn-complete-all" class="btn-complete-all">
            ✅ Tandai Semua Tutorial Selesai
          </button>
        </div>

        <!-- PROGRESS -->
        <div class="progress-section">
          <div class="progress">
            <div id="progress-bar"></div>
          </div>
        </div>

        <!-- TUTORIAL LIST -->
        <div id="tutorial-container"></div>

        <!-- FOOTER -->
        <div class="course-footer">
          <button id="btn-back-course-list" class="btn-back">
            ← Kembali ke Daftar Course
          </button>
        </div>

      </div>

    </section>
  `;

  /* ================================
     COURSE DATA
  ================================ */
  const { data: courseData } = await getCourseById(courseId);

  if (!courseData) {
    app.innerHTML += `<p>Course tidak ditemukan.</p>`;
    return;
  }

  document.getElementById("course-title").innerText =
    courseData.course_name;

  document.getElementById("btn-back-course-list").onclick = () => {
    window.location.hash =
      `#/academy/course-list?path=${courseData.learning_path_id}`;
  };

  /* ================================
     TUTORIAL DATA
  ================================ */
  const { data: tutorials } = await getTutorials(courseId);

  if (!tutorials || tutorials.length === 0) {
    document.getElementById("tutorial-container").innerHTML =
      `<p>Tidak ada tutorial.</p>`;
    return;
  }

  const container = document.getElementById("tutorial-container");

  /* ================================
     COURSE PROGRESS STATE
  ================================ */
  let completedCount = await getCompletedTutorialCount(
    userId,
    courseData.course_id
  );

  /* ================================
     PROGRESS BAR
  ================================ */
  function updateProgressBar() {
    const percent =
      (completedCount / tutorials.length) * 100;
    document.getElementById("progress-bar").style.width =
      `${percent}%`;
  }

  /* ================================
     RENDER TUTORIAL LIST
  ================================ */
  function renderTutorials() {
    container.innerHTML = "";

    tutorials.forEach((tut, idx) => {
      const index = idx + 1;
      const div = document.createElement("div");

      const isCompleted = index <= completedCount;
      const isActive = index === completedCount + 1;

      div.className = `
        tutorial-item
        ${isCompleted ? "completed" : ""}
        ${isActive ? "active" : ""}
      `;

      let action = `<span class="locked">🔒 Belum tersedia</span>`;

      if (isActive) {
        action = `
          <button
            class="btn-finish"
            data-id="${tut.tutorial_id}"
          >
            Selesaikan
          </button>
        `;
      } else if (isCompleted) {
        action = `<span class="done">✔ Selesai</span>`;
      }

      div.innerHTML = `
        <h4 class="tutorial-title">
          ${tut.tutorial_title}
        </h4>
        ${action}
      `;

      container.appendChild(div);
    });

    bindFinishButtons();
  }

  /* ================================
     FINISH HANDLER
  ================================ */
  function bindFinishButtons() {
    document.querySelectorAll(".btn-finish").forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.innerText = "Menyimpan...";

        await completeTutorial({
          userId,
          learningPathId: courseData.learning_path_id,
          courseId: courseData.course_id,
          tutorialId: btn.dataset.id,
        });

        completedCount++;
        updateProgressBar();
        renderTutorials();

        window.dispatchEvent(
          new Event("progress-updated")
        );
      };
    });
  }

  /* ================================
     COMPLETE ALL
  ================================ */
  document
    .getElementById("btn-complete-all")
    .onclick = async () => {
      const confirmAll = confirm(
        "Yakin ingin menandai semua tutorial sebagai selesai?"
      );
      if (!confirmAll) return;

      await completeAllTutorialsInCourse(
        userId,
        courseData.course_id
      );

      completedCount = tutorials.length;
      updateProgressBar();
      renderTutorials();

      window.dispatchEvent(
        new Event("progress-updated")
      );
    };

  /* ================================
     INIT
  ================================ */
  updateProgressBar();
  renderTutorials();
}
