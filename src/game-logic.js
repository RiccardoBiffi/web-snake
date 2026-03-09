export const DEFAULT_BOARD_SIZE = {
  width: 16,
  height: 16
};

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE_DIRECTIONS = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function normalizeDirection(direction) {
  if (typeof direction !== "string") {
    return null;
  }

  const normalized = direction.toLowerCase();
  return normalized in DIRECTION_VECTORS ? normalized : null;
}

export function createInitialSnake(width, height) {
  const centerY = Math.floor(height / 2);
  const headX = Math.floor(width / 2);

  return [
    { x: headX, y: centerY },
    { x: headX - 1, y: centerY },
    { x: headX - 2, y: centerY }
  ];
}

export function createGameState(options = {}) {
  const width = options.width ?? DEFAULT_BOARD_SIZE.width;
  const height = options.height ?? DEFAULT_BOARD_SIZE.height;
  const snake = (options.snake ?? createInitialSnake(width, height)).map(cloneCell);
  const direction = normalizeDirection(options.direction) ?? "right";
  const randomFn = options.randomFn ?? Math.random;

  return {
    width,
    height,
    snake,
    direction,
    queuedDirection: direction,
    food: options.food ? cloneCell(options.food) : placeFood({ width, height, snake, randomFn }),
    score: options.score ?? 0,
    status: options.status ?? "ready"
  };
}

export function restartGame(state, options = {}) {
  return createGameState({
    width: options.width ?? state.width,
    height: options.height ?? state.height,
    randomFn: options.randomFn
  });
}

export function startGame(state) {
  if (state.status === "ready" || state.status === "paused") {
    return {
      ...state,
      status: "running"
    };
  }

  return state;
}

export function togglePause(state) {
  if (state.status === "running") {
    return {
      ...state,
      status: "paused"
    };
  }

  if (state.status === "paused" || state.status === "ready") {
    return {
      ...state,
      status: "running"
    };
  }

  return state;
}

export function setDirection(state, nextDirection) {
  const normalizedDirection = normalizeDirection(nextDirection);

  if (!normalizedDirection || state.status === "over") {
    return state;
  }

  if (state.queuedDirection !== state.direction) {
    return state;
  }

  if (
    state.snake.length > 1 &&
    OPPOSITE_DIRECTIONS[state.direction] === normalizedDirection
  ) {
    return state;
  }

  if (state.queuedDirection === normalizedDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: normalizedDirection
  };
}

export function stepGame(state, { randomFn = Math.random } = {}) {
  if (state.status !== "running") {
    return state;
  }

  const direction = state.queuedDirection ?? state.direction;
  const vector = DIRECTION_VECTORS[direction];
  const nextHead = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y
  };

  if (isOutOfBounds(nextHead, state.width, state.height)) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "over"
    };
  }

  const ateFood = state.food !== null && areSameCell(nextHead, state.food);
  const occupiedCells = ateFood ? state.snake : state.snake.slice(0, -1);

  if (occupiedCells.some((segment) => areSameCell(segment, nextHead))) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "over"
    };
  }

  const snake = [nextHead, ...state.snake.map(cloneCell)];

  if (!ateFood) {
    snake.pop();
  }

  const food = ateFood
    ? placeFood({ width: state.width, height: state.height, snake, randomFn })
    : state.food;

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    food,
    score: state.score + (ateFood ? 1 : 0),
    status: food === null ? "over" : state.status
  };
}

export function getAvailableCells({ width, height, snake }) {
  const occupied = new Set(snake.map(toCellKey));
  const cells = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = { x, y };

      if (!occupied.has(toCellKey(cell))) {
        cells.push(cell);
      }
    }
  }

  return cells;
}

export function placeFood({ width, height, snake, randomFn = Math.random }) {
  const availableCells = getAvailableCells({ width, height, snake });

  if (availableCells.length === 0) {
    return null;
  }

  const index = Math.min(
    availableCells.length - 1,
    Math.floor(randomFn() * availableCells.length)
  );

  return cloneCell(availableCells[index]);
}

export function areSameCell(left, right) {
  return left.x === right.x && left.y === right.y;
}

function cloneCell(cell) {
  return {
    x: cell.x,
    y: cell.y
  };
}

function isOutOfBounds(cell, width, height) {
  return cell.x < 0 || cell.y < 0 || cell.x >= width || cell.y >= height;
}

function toCellKey(cell) {
  return `${cell.x}:${cell.y}`;
}
