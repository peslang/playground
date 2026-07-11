(function () {
  "use strict";

  var DEFAULT_SOURCE = [
    "импорт System",
    "",
    "System.Console.WriteLine(\"Привет, мир!\")"
  ].join("\n");

  var editor;
  var runBtn;
  var consoleOutput;

  initWorkspaceSplitter(function () {
    if (editor) {
      editor.layout();
    }
  });

  require(["vs/editor/editor.main"], function () {
    registerPesLanguage(monaco);

    editor = monaco.editor.create(document.getElementById("editor"), {
      value: DEFAULT_SOURCE,
      language: "pes",
      theme: "pes-dark",
      fontFamily: "Cascadia Code, Consolas, Liberation Mono, monospace",
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      wordWrap: "on",
      unicodeHighlight: {
        ambiguousCharacters: false,
        invisibleCharacters: false,
        nonBasicASCII: false
      }
    });

    runBtn = document.getElementById("run-btn");
    consoleOutput = document.getElementById("console-output");

    runBtn.addEventListener("click", runCode);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);

    setConsoleText("Нажмите «Запустить» или Ctrl+Enter для компиляции и выполнения.", "is-running");
  });

  async function runCode() {
    if (!editor || runBtn.disabled) {
      return;
    }

    runBtn.disabled = true;
    setConsoleText("Компиляция и запуск...", "is-running");

    try {
      var response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: editor.getValue() })
      });

      if (!response.ok) {
        var errorPayload = await safeJson(response);
        var message = (errorPayload && errorPayload.error) || ("HTTP " + response.status);
        setConsoleText(message, "is-error");
        return;
      }

      var result = await response.json();
      var output = result.output || "(нет вывода)";
      setConsoleText(output, result.success ? "" : "is-error");
    } catch (error) {
      setConsoleText("Ошибка сети: " + error.message, "is-error");
    } finally {
      runBtn.disabled = false;
    }
  }

  function setConsoleText(text, className) {
    consoleOutput.textContent = text;
    consoleOutput.className = "console-output" + (className ? " " + className : "");
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function initWorkspaceSplitter(onResize) {
    var splitter = document.getElementById("workspace-splitter");
    var workspace = document.querySelector(".workspace");
    if (!splitter || !workspace) {
      return;
    }

    var storageKeyWidth = "pes-playground-console-width";
    var storageKeyHeight = "pes-playground-console-height";
    var minConsoleSize = 160;
    var minEditorSize = 240;
    var dragging = false;
    var layoutFrame = 0;

    restoreSize();

    splitter.addEventListener("mousedown", startDrag);
    splitter.addEventListener("touchstart", startDrag, { passive: false });

    splitter.addEventListener("keydown", function (event) {
      var step = event.shiftKey ? 40 : 12;
      var vertical = isVerticalLayout();

      if (vertical && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        var height = getConsoleHeight() + (event.key === "ArrowDown" ? step : -step);
        setConsoleHeight(clampVertical(height));
        localStorage.setItem(storageKeyHeight, String(getConsoleHeight()));
        scheduleLayout(onResize);
        return;
      }

      if (!vertical && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        var width = getConsoleWidth() + (event.key === "ArrowRight" ? step : -step);
        setConsoleWidth(clampHorizontal(width));
        localStorage.setItem(storageKeyWidth, String(getConsoleWidth()));
        scheduleLayout(onResize);
      }
    });

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
    window.addEventListener("resize", function () {
      scheduleLayout(onResize);
    });

    function restoreSize() {
      var savedWidth = Number(localStorage.getItem(storageKeyWidth));
      var savedHeight = Number(localStorage.getItem(storageKeyHeight));

      if (savedWidth >= minConsoleSize) {
        setConsoleWidth(clampHorizontal(savedWidth));
      }

      if (savedHeight >= minConsoleSize) {
        setConsoleHeight(clampVertical(savedHeight));
      }
    }

    function isVerticalLayout() {
      return window.matchMedia("(max-width: 900px)").matches;
    }

    function getPointer(event) {
      if (event.touches && event.touches.length) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }

      return { x: event.clientX, y: event.clientY };
    }

    function startDrag(event) {
      if (event.type === "mousedown" && event.button !== 0) {
        return;
      }

      dragging = true;
      document.body.classList.add("is-resizing");
      if (isVerticalLayout()) {
        document.body.classList.add("is-resizing-vertical");
      }

      if (event.type === "touchstart") {
        event.preventDefault();
      }
    }

    function onDrag(event) {
      if (!dragging) {
        return;
      }

      event.preventDefault();

      var pointer = getPointer(event);
      var bounds = workspace.getBoundingClientRect();

      if (isVerticalLayout()) {
        var height = bounds.bottom - pointer.y - varSplitterSize() / 2;
        setConsoleHeight(clampVertical(height));
        localStorage.setItem(storageKeyHeight, String(getConsoleHeight()));
      } else {
        var width = bounds.right - pointer.x - varSplitterSize() / 2;
        setConsoleWidth(clampHorizontal(width));
        localStorage.setItem(storageKeyWidth, String(getConsoleWidth()));
      }

      scheduleLayout(onResize);
    }

    function stopDrag() {
      if (!dragging) {
        return;
      }

      dragging = false;
      document.body.classList.remove("is-resizing");
      document.body.classList.remove("is-resizing-vertical");
      scheduleLayout(onResize);
    }

    function clampHorizontal(width) {
      var bounds = workspace.getBoundingClientRect();
      var maxWidth = bounds.width - minEditorSize - varSplitterSize();
      return Math.max(minConsoleSize, Math.min(width, maxWidth));
    }

    function clampVertical(height) {
      var bounds = workspace.getBoundingClientRect();
      var maxHeight = bounds.height - minEditorSize - varSplitterSize();
      return Math.max(minConsoleSize, Math.min(height, maxHeight));
    }

    function varSplitterSize() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--splitter-size")) || 5;
    }

    function getConsoleWidth() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--console-width")) || 380;
    }

    function getConsoleHeight() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--console-height")) || 200;
    }

    function setConsoleWidth(width) {
      document.documentElement.style.setProperty("--console-width", width + "px");
    }

    function setConsoleHeight(height) {
      document.documentElement.style.setProperty("--console-height", height + "px");
    }

    function scheduleLayout(callback) {
      if (layoutFrame) {
        cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = requestAnimationFrame(function () {
        layoutFrame = 0;
        callback();
      });
    }
  }
})();
