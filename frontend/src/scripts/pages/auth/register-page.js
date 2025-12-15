import { registerUser } from "../../api/authAPI.js";
import '../../../styles/auth-page.css';

class RegisterPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-left">
          <h1>Welcome to...</h1>
          <p>
            Platform pembelajaran yang membantu kamu memahami materi dengan lebih mudah,
            personal, dan terarah. Mulai jelajahi fitur Learning Buddy yang siap menemani
            proses belajarmu kapan saja.
          </p>
        </div>

        <div class="auth-right">
          <h2 class="auth-title">Register</h2>
          <p class="auth-subtitle">
            Buat akun baru untuk memulai perjalanan belajar bersama Learning Buddy.
          </p>

          <form id="register-form" class="auth-form">
            <label for="fullname">Full Name</label>
            <input id="fullname" type="text" class="auth-input" required />

            <label for="email">Email</label>
            <input id="email" type="email" class="auth-input" required />

            <label for="password">Password</label>
            <input id="password" type="password" class="auth-input" required />

            <label for="confirm">Confirm Password</label>
            <input id="confirm" type="password" class="auth-input" required />

            <p class="auth-note">
              Pastikan data kamu benar sebelum melanjutkan.
            </p>

            <button type="submit" class="auth-button">REGISTER</button>
          </form>

          <div class="auth-footer">
            Already have an account?
            <a href="#/login" class="auth-link-primary">Login</a>
          </div>

          <div class="auth-footer">
            <a href="#/forgot-password">Forgot your password?</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    document.body.classList.add('page-auth');

    const form = document.querySelector('#register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullname = document.querySelector('#fullname').value.trim();
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value.trim();
      const confirm = document.querySelector('#confirm').value.trim();

      if (password !== confirm) {
        alert("Password tidak sama!");
        return;
      }

      const { error } = await registerUser({ fullname, email, password });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Registrasi berhasil! Silakan login.");
      window.location.hash = "#/login";
    });
  }
}

export default RegisterPage;
