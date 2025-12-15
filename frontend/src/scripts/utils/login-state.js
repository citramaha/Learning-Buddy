const LoginState = {
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn() {
    return !!localStorage.getItem('user');
  },

  login(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  logout() {
    localStorage.removeItem('user');
  }
};

export default LoginState;
