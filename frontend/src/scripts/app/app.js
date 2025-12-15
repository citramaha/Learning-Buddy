// app/App.js
class App {
  #content;
  #drawerButton;
  #navigationDrawer;

  constructor({ content }) {
    this.#content = content;
  }

  setupDrawer() {
    this.#drawerButton = document.getElementById("drawer-button");
    this.#navigationDrawer = document.getElementById("navigation-drawer");

    if (!this.#drawerButton || !this.#navigationDrawer) return;

    // reset dulu biar tidak dobel event
    this.#drawerButton.onclick = null;

    this.#drawerButton.onclick = () => {
      this.#navigationDrawer.classList.toggle("active");
    };

    document.body.onclick = (event) => {
      const outsideDrawer =
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target);

      if (outsideDrawer) {
        this.#navigationDrawer.classList.remove("active");
      }
    };
  }

  async renderPage(page) {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    const queryString =
      queryIndex !== -1 ? hash.substring(queryIndex + 1) : "";
    const params = new URLSearchParams(queryString);

    // PAGE CLASS
    if (page && typeof page.render === "function") {
      this.#content.innerHTML = await page.render(params);

      if (typeof page.afterRender === "function") {
        await page.afterRender(params);
      }
      return;
    }

    // PAGE FUNCTION
    if (typeof page === "function") {
      this.#content.innerHTML = "";
      await page(params);
      return;
    }

    this.renderNotFound();
  }

  renderNotFound() {
    this.#content.innerHTML = `<h2>404 - Page Not Found</h2>`;
  }
}

export default App;