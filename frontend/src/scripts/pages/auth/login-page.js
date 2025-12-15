import LoginState from '../../utils/login-state';
import { loginUser } from "../../api/authAPI.js";
import '../../../styles/auth-page.css';

class LoginPage {
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
          <h2 class="auth-title">Login</h2>
          <p class="auth-subtitle">
            Masuk untuk mengakses fitur lengkap dan layanan terbaik yang kami sediakan khusus untukmu.
          </p>

          <form id="login-form" class="auth-form">
            <label for="email">Email</label>
            <input id="email" type="email" class="auth-input" required />

            <label for="password">Password</label>
            <input id="password" type="password" class="auth-input" required />

            <button type="submit" class="auth-button">LOGIN</button>
          </form>

          <div class="auth-footer">
            New User? <a href="#/register" class="auth-link-primary">Sign Up</a>
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

    const form = document.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value.trim();

      const { data, error } = await loginUser({ email, password });

      if (error) {
        alert(error.message);
        return;
      }

      LoginState.login({
        id: data.user.id,
        email: data.user.email,
      });

      alert("Login berhasil! 👋");
      document.body.classList.remove('page-auth');
      window.location.hash = "#/dashboard";
    });
  }
}

export default LoginPage;
