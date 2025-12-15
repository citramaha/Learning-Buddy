import gambarDicoding from '../../../assets/images/gambarDicoding.png';
import learningBuddy from '../../../assets/images/LearningBuddy.png';
import '../../../styles/home-page.css';

class HomePage {
  async render() {
    return `
      <section class="home-hero">
        <div class="home-hero-inner">
          <div class="home-hero-text">
            <h1>
              Bangun Karirmu <br />
              Sebagai Developer <br />
              Profesional
            </h1>

            <p>Mulai belajar sekarang dengan learning path</p>

            <a href="#/login" class="home-btn-primary">
              Belajar Sekarang
            </a>
          </div>

          <div class="home-hero-image">
            <img src="${gambarDicoding}" alt="Belajar coding" />
          </div>
        </div>
      </section>

      <section class="features container">
        <div class="features-content">
          <h2>Fitur Terbaru Kami</h2>
          <p>
            Platform Learning Buddy — teman belajar cerdas yang siap membantu kamu
            memahami materi, mengerjakan tugas, dan mengatur progres belajar.
          </p>
        </div>

        <div class="feature-card">
          <img src="${learningBuddy}" alt="Learning Buddy" />
        </div>
      </section>

    `;
  }
}

export default HomePage;
