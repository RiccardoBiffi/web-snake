import {
  createGameState,
  restartGame,
  setDirection,
  startGame,
  stepGame,
  togglePause
} from "./game-logic.js";

const TICK_MS = 140;
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

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const scoreElement = document.querySelector("#score");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = Array.from(document.querySelectorAll("[data-direction]"));

let state = createGameState();
let cells = [];
let tickHandle = null;

buildBoard(state.width, state.height);
render();
syncLoop();

window.addEventListener("keydown", handleKeyDown);
pauseButton.addEventListener("click", handlePauseToggle);
restartButton.addEventListener("click", handleRestart);

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    queueMove(button.dataset.direction);
  });
}

function handleKeyDown(event) {
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
  if (state.status === "running" && tickHandle === null) {
    tickHandle = window.setInterval(tick, TICK_MS);
  }

  if (state.status !== "running" && tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
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
}

function getStatusMessage(status) {
  if (status === "running") {
    return "Use arrow keys or WASD to move. Space or P pauses.";
  }

  if (status === "paused") {
    return "Paused. Press Start or choose a direction to continue.";
  }

  if (status === "over") {
    return "Game over. Restart or press a direction to play again.";
  }

  return "Press Start, an arrow key, or a control button.";
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
