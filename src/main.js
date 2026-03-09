import {
  createGameState,
  restartGame,
  setDirection,
  startGame,
  stepGame,
  togglePause
} from "./game-logic.js";
import {
  DEFAULT_SETTINGS,
  getGridSize,
  getTickInterval,
  resolveColorPattern,
  resolveDifficulty,
  resolveGridDimension
} from "./settings.js";

const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right"
};
const MOBILE_CONTROLS_MEDIA_QUERY = "(hover: none) and (pointer: coarse)";

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const scoreElement = document.querySelector("#score");
const helpElement = document.querySelector("#help");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const settingsToggleButton = document.querySelector("#settings-toggle");
const settingsModal = document.querySelector("#settings-modal");
const settingsCancelButton = document.querySelector("#settings-cancel-button");
const settingsApplyButton = document.querySelector("#settings-apply-button");
const difficultySelect = document.querySelector("#difficulty-select");
const colorPatternSelect = document.querySelector("#color-pattern-select");
const gridDimensionSelect = document.querySelector("#grid-dimension-select");
const controlButtons = Array.from(document.querySelectorAll("[data-direction]"));
const mobileControlsQuery = window.matchMedia(MOBILE_CONTROLS_MEDIA_QUERY);

let settings = { ...DEFAULT_SETTINGS };
let pendingSettings = { ...DEFAULT_SETTINGS };
let state = createGameState(getGridSize(settings.gridDimension));
let cells = [];
let tickHandle = null;
let activeTickMs = null;

applySettings();
render();
syncLoop();

window.addEventListener("keydown", handleKeyDown);
pauseButton.addEventListener("click", handlePauseToggle);
restartButton.addEventListener("click", handleRestart);
settingsToggleButton.addEventListener("click", handleSettingsToggle);
settingsCancelButton.addEventListener("click", handleSettingsCancel);
settingsApplyButton.addEventListener("click", handleSettingsApply);
settingsModal.addEventListener("click", handleSettingsModalClick);

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    queueMove(button.dataset.direction);
  });
}

if (typeof mobileControlsQuery.addEventListener === "function") {
  mobileControlsQuery.addEventListener("change", handleEnvironmentChange);
} else if (typeof mobileControlsQuery.addListener === "function") {
  mobileControlsQuery.addListener(handleEnvironmentChange);
}

function handleKeyDown(event) {
  if (!settingsModal.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      setSettingsPanelOpen(false);
    }
    return;
  }

  const direction = KEY_TO_DIRECTION[event.key];

  if (direction) {
    event.preventDefault();
    queueMove(direction);
    return;
  }

  if (event.key === " " || event.key === "p" || event.key === "P") {
    event.preventDefault();
    handlePauseToggle();
  }
}

function handlePauseToggle() {
  if (state.status === "over") {
    state = startGame(restartGame(state));
  } else {
    state = togglePause(state);
  }

  render();
  syncLoop();
}

function handleRestart() {
  state = restartGame(state);
  render();
  syncLoop();
}

function handleSettingsToggle() {
  if (state.status === "running") {
    return;
  }

  setSettingsPanelOpen(settingsModal.hidden);
}

function handleSettingsCancel() {
  setSettingsPanelOpen(false);
}

function handleSettingsApply() {
  if (state.status === "running") {
    return;
  }

  const nextSettings = readSettingsForm();
  const gridChanged = nextSettings.gridDimension !== settings.gridDimension;

  settings = nextSettings;
  pendingSettings = { ...settings };
  applyColorPattern();

  if (gridChanged) {
    const nextGridSize = getGridSize(settings.gridDimension);

    state = restartGame(state, nextGridSize);
    buildBoard(nextGridSize.width, nextGridSize.height);
    render();
  }

  setSettingsPanelOpen(false);
  updateHelpText();
  render();
  syncLoop();
}

function handleSettingsModalClick(event) {
  if (event.target === settingsModal) {
    setSettingsPanelOpen(false);
  }
}

function handleEnvironmentChange() {
  updateHelpText();
  render();
}

function queueMove(direction) {
  if (state.status === "over") {
    state = startGame(setDirection(restartGame(state), direction));
  } else {
    state = setDirection(state, direction);

    if (state.status === "ready" || state.status === "paused") {
      state = startGame(state);
    }
  }

  render();
  syncLoop();
}

function tick() {
  state = stepGame(state);
  render();
  syncLoop();
}

function syncLoop() {
  const tickMs = getTickInterval(settings.difficulty);

  if (state.status === "running" && tickHandle !== null && activeTickMs !== tickMs) {
    window.clearInterval(tickHandle);
    tickHandle = null;
    activeTickMs = null;
  }

  if (state.status === "running" && tickHandle === null) {
    tickHandle = window.setInterval(tick, tickMs);
    activeTickMs = tickMs;
  }

  if (state.status !== "running" && tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
    activeTickMs = null;
  }
}

function buildBoard(width, height) {
  boardElement.style.setProperty("--columns", width);
  boardElement.style.setProperty("--rows", height);

  const fragment = document.createDocumentFragment();
  cells = [];

  for (let index = 0; index < width * height; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "presentation");
    cells.push(cell);
    fragment.appendChild(cell);
  }

  boardElement.replaceChildren(fragment);
}

function render() {
  for (const cell of cells) {
    cell.className = "cell";
  }

  if (state.food !== null) {
    cells[toIndex(state.food.x, state.food.y)].classList.add("cell--food");
  }

  state.snake.forEach((segment, index) => {
    const cell = cells[toIndex(segment.x, segment.y)];
    cell.classList.add("cell--snake");

    if (index === 0) {
      cell.classList.add("cell--head");
    }
  });

  scoreElement.textContent = String(state.score);
  statusElement.textContent = getStatusMessage(state.status);
  pauseButton.textContent = getPauseLabel(state.status);
  updateSettingsAvailability();
}

function getStatusMessage(status) {
  if (status === "running") {
    return isMobileEnvironment()
      ? "Use arrow keys, WASD, or touch controls to move. Space or P pauses."
      : "Use arrow keys or WASD to move. Space or P pauses.";
  }

  if (status === "paused") {
    return "Paused. Press Start or choose a direction to continue.";
  }

  if (status === "over") {
    return "Game over. Restart or press a direction to play again.";
  }

  return "Press Start or choose a direction to begin.";
}

function getPauseLabel(status) {
  if (status === "running") {
    return "Pause";
  }

  if (status === "paused") {
    return "Resume";
  }

  return "Start";
}

function toIndex(x, y) {
  return y * state.width + x;
}

function applySettings() {
  settings = {
    difficulty: resolveDifficulty(settings.difficulty),
    colorPattern: resolveColorPattern(settings.colorPattern),
    gridDimension: resolveGridDimension(settings.gridDimension)
  };
  pendingSettings = { ...settings };
  syncSettingsForm();
  applyColorPattern();
  buildBoard(state.width, state.height);
  updateHelpText();
  setSettingsPanelOpen(false);
}

function syncSettingsForm() {
  difficultySelect.value = pendingSettings.difficulty;
  colorPatternSelect.value = pendingSettings.colorPattern;
  gridDimensionSelect.value = pendingSettings.gridDimension;
}

function applyColorPattern() {
  document.documentElement.dataset.theme = settings.colorPattern;
}

function updateHelpText() {
  helpElement.textContent = isMobileEnvironment()
    ? "Use arrow keys, WASD, or the on-screen controls to move. Press Space or P to pause."
    : "Use arrow keys or WASD to move. Press Space or P to pause.";
}

function setSettingsPanelOpen(isOpen) {
  const nextOpen = isOpen && state.status !== "running";
  const wasOpen = !settingsModal.hidden;

  pendingSettings = { ...settings };
  syncSettingsForm();
  settingsModal.hidden = !nextOpen;
  settingsToggleButton.setAttribute("aria-expanded", String(nextOpen));
  settingsToggleButton.setAttribute("aria-label", nextOpen ? "Close settings" : "Open settings");

  if (nextOpen) {
    difficultySelect.focus();
  } else if (wasOpen) {
    settingsToggleButton.focus();
  }
}

function isMobileEnvironment() {
  return mobileControlsQuery.matches;
}

function updateSettingsAvailability() {
  const isDisabled = state.status === "running";

  settingsToggleButton.disabled = isDisabled;
  settingsCancelButton.disabled = isDisabled;
  settingsApplyButton.disabled = isDisabled;

  if (isDisabled && !settingsModal.hidden) {
    setSettingsPanelOpen(false);
  }
}

function readSettingsForm() {
  return {
    difficulty: resolveDifficulty(difficultySelect.value),
    colorPattern: resolveColorPattern(colorPatternSelect.value),
    gridDimension: resolveGridDimension(gridDimensionSelect.value)
  };
}
