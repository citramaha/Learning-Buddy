// app/Router.js
import routes from '../routes/routes.js';
import { getActiveRoute } from './routerHelper.js';

class Router {
  constructor(appInstance) {
    this.app = appInstance;

    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }

  async resolve() {
    const activeRoute = getActiveRoute();
    const page = routes[activeRoute];

    if (!page) {
      this.app.renderNotFound();
      return;
    }

    await this.app.renderPage(page);
  }
}

export default Router;
