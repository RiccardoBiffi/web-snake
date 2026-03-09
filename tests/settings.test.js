import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SETTINGS,
  getGridSize,
  getTickInterval,
  resolveColorPattern,
  resolveDifficulty,
  resolveGridDimension
} from "../src/settings.js";

test("settings helpers resolve invalid values back to defaults", () => {
  assert.equal(resolveDifficulty("impossible"), DEFAULT_SETTINGS.difficulty);
  assert.equal(resolveColorPattern("neon"), DEFAULT_SETTINGS.colorPattern);
  assert.equal(resolveGridDimension("huge"), DEFAULT_SETTINGS.gridDimension);
});

test("settings helpers expose the configured tick speeds and board sizes", () => {
  assert.equal(getTickInterval("slow"), 180);
  assert.equal(getTickInterval("fast"), 95);
  assert.deepEqual(getGridSize("small"), { width: 12, height: 12 });
  assert.deepEqual(getGridSize("big"), { width: 20, height: 20 });
});
