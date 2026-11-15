(() => {
  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.className = "theme-toggle";
  themeToggle.setAttribute("aria-pressed", "false");

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    document.body.dataset.theme = isDark ? "dark" : "light";
    themeToggle.textContent = isDark ? "☀ Light" : "☾ Dark";
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
    themeToggle.setAttribute("aria-pressed", String(isDark));
  };

  let savedTheme;
  try {
    savedTheme = window.localStorage.getItem("javascript-site-theme");
  } catch {
    savedTheme = null;
  }
  applyTheme(savedTheme === "dark" ? "dark" : "light");

  const nav = document.querySelector(".site-nav .container");
  const navActions = nav?.querySelector(".navbar-collapse");
  if (nav && navActions) {
    nav.insertBefore(themeToggle, navActions);
  }

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem("javascript-site-theme", nextTheme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const runner = document.querySelector("[data-runner]");
  if (!runner) return;

  const editor = runner.querySelector(".playground-editor");
  const output = runner.querySelector("[data-output]");
  const runButton = runner.querySelector("[data-run]");
  const initialCode = editor.value;
  let activeWorker;
  let timeoutId;
  let blobUrl;
  let hasOutput = false;

  const releaseWorker = () => {
    window.clearTimeout(timeoutId);
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = undefined;
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = undefined;
    }
    runButton.disabled = false;
  };

  const printLine = (text, isError = false) => {
    if (!hasOutput) {
      output.textContent = "";
      output.classList.remove("is-error");
      hasOutput = true;
    }
    output.textContent += `${output.textContent ? "\n" : ""}${text}`;
    if (isError) output.classList.add("is-error");
  };

  const formatValue = (value) => {
    if (typeof value === "string") return value;
    try {
      const serialized = JSON.stringify(value);
      return serialized === undefined ? String(value) : serialized;
    } catch {
      return String(value);
    }
  };

  runButton.addEventListener("click", () => {
    releaseWorker();
    hasOutput = false;
    output.classList.remove("is-error");
    output.textContent = "Running your code…";
    runButton.disabled = true;

    const workerPrelude = `
      const show = (type, values) => self.postMessage({
        type,
        text: values.map(value => {
          if (typeof value === "string") return value;
          try {
            const result = JSON.stringify(value);
            return result === undefined ? String(value) : result;
          } catch {
            return String(value);
          }
        }).join(" ")
      });
      console.log = (...values) => show("log", values);
      console.info = (...values) => show("log", values);
      console.warn = (...values) => show("warn", values);
      console.error = (...values) => show("error", values);
      self.onerror = (message, source, line) => {
        self.postMessage({ type: "error", text: String(message) + (line ? " (line " + line + ")" : "") });
      };
      self.onunhandledrejection = event => {
        self.postMessage({ type: "error", text: String(event.reason) });
      };
      try {
    `;
    const workerSource = workerPrelude + editor.value + `
      } catch (error) {
        self.postMessage({ type: "error", text: error && error.stack ? error.stack : String(error) });
      }
      self.postMessage({ type: "ready" });
    `;

    try {
      blobUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
      activeWorker = new Worker(blobUrl);
      activeWorker.onmessage = (event) => {
        const { type, text } = event.data;
        if (type === "ready") {
          if (!hasOutput) {
            output.textContent = "Code finished with no console output.";
          }
          return;
        }
        if (type === "error" || type === "warn") {
          printLine(text, type === "error");
        } else {
          printLine(text);
        }
      };
      activeWorker.onerror = (event) => {
        event.preventDefault();
        printLine(event.message || "The code could not be run.", true);
        releaseWorker();
      };
      timeoutId = window.setTimeout(() => {
        printLine("Stopped after 5 seconds to keep the page responsive.", true);
        releaseWorker();
      }, 5000);
    } catch (error) {
      printLine(`Unable to start the code worker: ${formatValue(error.message || error)}`, true);
      releaseWorker();
    }
  });

  runner.querySelector("[data-reset]").addEventListener("click", () => {
    releaseWorker();
    editor.value = initialCode;
    hasOutput = false;
    output.classList.remove("is-error");
    output.textContent = "Your output will show up here.";
  });

  runner.querySelector("[data-clear]").addEventListener("click", () => {
    hasOutput = false;
    output.classList.remove("is-error");
    output.textContent = "Console cleared.";
  });
})();
