const expressionInput = document.getElementById("expressionInput");
const evaluateBtn = document.getElementById("evaluateBtn");
const clearBtn = document.getElementById("clearBtn");
const exampleBtn = document.getElementById("exampleBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");
const stackVisual = document.getElementById("stackVisual");
const stepsBody = document.getElementById("stepsBody");
const errorCard = document.getElementById("errorCard");
const resultCard = document.getElementById("resultCard");
const progressBar = document.getElementById("progressBar");
const stepProgress = document.getElementById("stepProgress");
const actionFlash = document.getElementById("actionFlash");
const statusText = document.getElementById("statusText");
const statusDot = document.querySelector("#statusPill .dot");
const themeToggle = document.getElementById("themeToggle");
const toggleAlgoBtn = document.getElementById("toggleAlgoBtn");
const algoBody = document.getElementById("algoBody");
const opBadge = document.getElementById("opBadge");
const currentToken = document.getElementById("currentToken");
const formulaLine = document.getElementById("formulaLine");
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

let evaluation = null;
let currentIndex = -1;
let playTimer = null;
let animTimer = null;
let busy = false;
const PLAY_DELAY = 1200;
const POP_PHASE = 420;

const EMPTY_STACK = `
  <div class="stack-empty">
    <strong>Stack is empty</strong>
    <span>Evaluate an expression, then press Play to watch PUSH and POP.</span>
  </div>`;

function setStatus(state) {
  const labels = {
    ready: "Ready",
    processing: "Processing",
    completed: "Completed",
    error: "Error",
  };
  statusText.textContent = labels[state];
  statusDot.className = `dot ${state}`;
}

function setBadge(kind, label) {
  opBadge.textContent = label;
  opBadge.className = "chip " + (kind === "push" ? "chip-push" : kind === "pop" ? "chip-pop" : "chip-accent");
}

function renderStack(values, options = {}) {
  const { mode = "idle", popping = 0 } = options;
  if (!values || values.length === 0) {
    stackVisual.innerHTML = EMPTY_STACK;
    return;
  }
  stackVisual.innerHTML = values
    .map((value, index) => {
      const isTop = index === values.length - 1;
      const fromTop = values.length - 1 - index;
      const isPopping = mode === "pop" && fromTop < popping;
      const isPushing = mode === "push" && isTop;
      const classes = ["stack-item"];
      if (isTop && !isPopping) classes.push("top");
      if (isPushing) classes.push("pushing");
      if (isPopping) classes.push("popping");
      const tag = isPushing ? "PUSH" : isPopping ? "POP" : isTop ? "TOP" : "";
      return `<div class="${classes.join(" ")}">${value}${
        tag ? `<span class="item-tag">${tag}</span>` : ""
      }</div>`;
    })
    .join("");
}

function renderSteps(steps) {
  if (!steps.length) {
    stepsBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">
          <strong>No steps yet</strong><br/>
          Enter a postfix expression and click Evaluate to generate the trace.
        </td>
      </tr>`;
    return;
  }
  stepsBody.innerHTML = steps
    .map((step, i) => {
      const isPush = step.operation_type === "push";
      const pill = isPush
        ? '<span class="op-pill push">PUSH</span>'
        : '<span class="op-pill pop">POP → PUSH</span>';
      return `
      <tr data-index="${i}" class="pending">
        <td>${step.step}</td>
        <td><code>${step.token}</code></td>
        <td>${pill}</td>
        <td>${step.action}</td>
        <td class="stack-cell">[${step.stack.join(", ")}]</td>
      </tr>`;
    })
    .join("");
}

function highlightRow(index) {
  stepsBody.querySelectorAll("tr").forEach((row) => {
    const i = Number(row.dataset.index);
    row.classList.remove("current", "pending", "done");
    if (Number.isNaN(i)) return;
    if (i === index) row.classList.add("current");
    else if (i < index) row.classList.add("done");
    else row.classList.add("pending");
  });
  const row = stepsBody.querySelector(`tr[data-index="${index}"]`);
  if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function updateProgress() {
  const total = evaluation ? evaluation.steps.length : 0;
  const current = currentIndex + 1;
  stepProgress.textContent = `Step ${Math.max(current, 0)} / ${total}`;
  progressBar.style.width = total ? `${(current / total) * 100}%` : "0%";
}

function showError(title, message) {
  errorCard.hidden = false;
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  resultCard.hidden = true;
}

function hideError() {
  errorCard.hidden = true;
}

function showFinalResult() {
  resultCard.hidden = false;
  document.getElementById("resultExpression").textContent = evaluation.expression;
  document.getElementById("finalResult").textContent = evaluation.result;
  document.getElementById("totalSteps").textContent = evaluation.total_steps;
  document.getElementById("opsPerformed").textContent = evaluation.operations_performed;
}

function finishIfLast(index) {
  if (index === evaluation.steps.length - 1) {
    showFinalResult();
    setStatus("completed");
    setBadge("push", "DONE");
    stopPlay();
  }
}

function applyStep(index) {
  if (!evaluation || busy) return;
  const step = evaluation.steps[index];
  currentIndex = index;
  highlightRow(index);
  updateProgress();
  currentToken.textContent = step.token;
  formulaLine.textContent = step.formula || "";

  if (step.operation_type === "push") {
    setBadge("push", "PUSH");
    actionFlash.textContent = `PUSH ${step.pushed}`;
    renderStack(step.stack, { mode: "push" });
    finishIfLast(index);
    return;
  }

  busy = true;
  setBadge("pop", "POP");
  actionFlash.textContent = `POP ${step.popped_right}, POP ${step.popped_left}`;
  renderStack(step.stack_before || step.stack, { mode: "pop", popping: 2 });

  animTimer = setTimeout(() => {
    setBadge("push", "PUSH");
    actionFlash.textContent = `${step.formula} → PUSH ${step.pushed}`;
    renderStack(step.stack, { mode: "push" });
    busy = false;
    finishIfLast(index);
  }, POP_PHASE);
}

function stopPlay() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function resetPlayback() {
  stopPlay();
  if (animTimer) clearTimeout(animTimer);
  busy = false;
  currentIndex = -1;
  resultCard.hidden = true;
  actionFlash.textContent = evaluation
    ? "Reset. Press Play or Next Step."
    : "Waiting for an expression";
  currentToken.textContent = "—";
  formulaLine.textContent = "";
  setBadge("idle", "IDLE");
  renderStack([]);
  if (evaluation) highlightRow(-1);
  updateProgress();
  if (evaluation) setStatus("ready");
}

function nextStep() {
  if (!evaluation || busy) return;
  if (currentIndex >= evaluation.steps.length - 1) {
    showFinalResult();
    setStatus("completed");
    return;
  }
  applyStep(currentIndex + 1);
}

function startPlay() {
  if (!evaluation) return;
  if (currentIndex >= evaluation.steps.length - 1) resetPlayback();
  setStatus("processing");
  playTimer = setInterval(() => {
    if (!busy) nextStep();
  }, PLAY_DELAY);
  nextStep();
}

function setControlsEnabled(enabled) {
  playBtn.disabled = !enabled;
  pauseBtn.disabled = !enabled;
  nextBtn.disabled = !enabled;
  resetBtn.disabled = !enabled;
}

async function evaluateExpression() {
  hideError();
  resultCard.hidden = true;
  stopPlay();
  if (animTimer) clearTimeout(animTimer);
  busy = false;
  setStatus("processing");
  evaluateBtn.disabled = true;
  actionFlash.textContent = "Tokenizing and evaluating on the server…";

  try {
    const response = await fetch("/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression: expressionInput.value }),
    });
    const data = await response.json();

    if (!data.success) {
      evaluation = null;
      setControlsEnabled(false);
      renderSteps([]);
      renderStack([]);
      document.getElementById("pushCount").textContent = "0";
      document.getElementById("popCount").textContent = "0";
      currentToken.textContent = "—";
      formulaLine.textContent = "";
      setBadge("idle", "ERROR");
      updateProgress();
      showError(data.error.title, data.error.message);
      setStatus("error");
      actionFlash.textContent = "Could not evaluate this expression.";
      return;
    }

    evaluation = data;
    currentIndex = -1;
    document.getElementById("pushCount").textContent = data.push_count;
    document.getElementById("popCount").textContent = data.pop_count;
    renderSteps(data.steps);
    renderStack([]);
    setControlsEnabled(true);
    updateProgress();
    setStatus("ready");
    setBadge("idle", "READY");
    actionFlash.textContent = "Prepared. Press Play or Next Step.";
  } catch (err) {
    setStatus("error");
    showError(
      "Connection Error",
      "Could not reach the Flask server. Start the app with py -3 app.py and try again."
    );
  } finally {
    evaluateBtn.disabled = false;
  }
}

evaluateBtn.addEventListener("click", evaluateExpression);
expressionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") evaluateExpression();
});
clearBtn.addEventListener("click", () => {
  expressionInput.value = "";
  evaluation = null;
  setControlsEnabled(false);
  renderSteps([]);
  renderStack([]);
  hideError();
  resultCard.hidden = true;
  document.getElementById("pushCount").textContent = "0";
  document.getElementById("popCount").textContent = "0";
  currentIndex = -1;
  currentToken.textContent = "—";
  formulaLine.textContent = "";
  setBadge("idle", "IDLE");
  updateProgress();
  setStatus("ready");
  actionFlash.textContent = "Waiting for an expression";
});
exampleBtn.addEventListener("click", () => {
  expressionInput.value = "5 6 2 + *";
  expressionInput.focus();
});
playBtn.addEventListener("click", startPlay);
pauseBtn.addEventListener("click", () => {
  stopPlay();
  setStatus(currentIndex === (evaluation?.steps.length ?? 0) - 1 ? "completed" : "ready");
});
nextBtn.addEventListener("click", () => {
  stopPlay();
  nextStep();
});
resetBtn.addEventListener("click", resetPlayback);

document.querySelectorAll(".example-card").forEach((card) => {
  card.addEventListener("click", () => {
    expressionInput.value = card.dataset.expression;
    document.getElementById("evaluator").scrollIntoView({ behavior: "smooth" });
    expressionInput.focus();
  });
});

toggleAlgoBtn.addEventListener("click", () => {
  const wasHidden = algoBody.hidden;
  algoBody.hidden = !wasHidden;
  toggleAlgoBtn.textContent = wasHidden ? "Hide Algorithm" : "Show Algorithm";
});

themeToggle.addEventListener("click", () => {
  const next =
    document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  if (next === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  themeToggle.textContent = next === "light" ? "Dark" : "Light";
});

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mainNav.classList.remove("open"));
  });
}
