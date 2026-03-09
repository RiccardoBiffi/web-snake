import assert from "node:assert/strict";
import test from "node:test";

import {
  createGameState,
  placeFood,
  setDirection,
  stepGame
} from "../src/game-logic.js";

test("stepGame moves the snake forward by one cell", () => {
  const state = createGameState({
    width: 6,
    height: 6,
    food: { x: 0, y: 0 },
    status: "running"
  });

  const nextState = stepGame(state);

  assert.deepEqual(nextState.snake, [
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    { x: 2, y: 3 }
  ]);
  assert.equal(nextState.score, 0);
  assert.equal(nextState.status, "running");
});

test("stepGame grows the snake and increases score when food is eaten", () => {
  const state = createGameState({
    width: 6,
    height: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 }
    ],
    direction: "right",
    food: { x: 3, y: 2 },
    status: "running"
  });

  const nextState = stepGame(state, { randomFn: () => 0 });

  assert.deepEqual(nextState.snake, [
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ]);
  assert.equal(nextState.score, 1);
  assert.deepEqual(nextState.food, { x: 0, y: 0 });
});

test("stepGame ends the game on wall collision", () => {
  const state = createGameState({
    width: 4,
    height: 4,
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: "right",
    food: { x: 0, y: 0 },
    status: "running"
  });

  const nextState = stepGame(state);

  assert.equal(nextState.status, "over");
  assert.deepEqual(nextState.snake, state.snake);
});

test("stepGame ends the game on self collision", () => {
  const state = createGameState({
    width: 5,
    height: 5,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 }
    ],
    direction: "left",
    food: { x: 4, y: 4 },
    status: "running"
  });

  const nextState = stepGame(state);

  assert.equal(nextState.status, "over");
});

test("setDirection blocks immediate reversal and extra queued turns", () => {
  const state = createGameState({
    width: 6,
    height: 6
  });

  const oppositeTurn = setDirection(state, "left");
  const queuedTurn = setDirection(state, "up");
  const ignoredSecondTurn = setDirection(queuedTurn, "left");

  assert.equal(oppositeTurn.queuedDirection, "right");
  assert.equal(queuedTurn.queuedDirection, "up");
  assert.equal(ignoredSecondTurn.queuedDirection, "up");
});

test("placeFood chooses only from open cells", () => {
  const food = placeFood({
    width: 2,
    height: 2,
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ],
    randomFn: () => 0.9
  });

  assert.deepEqual(food, { x: 1, y: 1 });
});
