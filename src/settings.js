export const DIFFICULTY_OPTIONS = {
  slow: {
    label: "Slow",
    tickMs: 180
  },
  normal: {
    label: "Normal",
    tickMs: 140
  },
  fast: {
    label: "Fast",
    tickMs: 95
  }
};

export const COLOR_PATTERNS = {
  classic: {
    label: "Classic"
  },
  sunset: {
    label: "Sunset"
  },
  forest: {
    label: "Forest"
  }
};

export const GRID_DIMENSIONS = {
  small: {
    label: "Small",
    width: 12,
    height: 12
  },
  normal: {
    label: "Normal",
    width: 16,
    height: 16
  },
  big: {
    label: "Big",
    width: 20,
    height: 20
  }
};

export const DEFAULT_SETTINGS = {
  difficulty: "normal",
  colorPattern: "classic",
  gridDimension: "normal"
};

export function resolveDifficulty(difficulty) {
  return resolveOption(difficulty, DIFFICULTY_OPTIONS, DEFAULT_SETTINGS.difficulty);
}

export function resolveColorPattern(colorPattern) {
  return resolveOption(colorPattern, COLOR_PATTERNS, DEFAULT_SETTINGS.colorPattern);
}

export function resolveGridDimension(gridDimension) {
  return resolveOption(gridDimension, GRID_DIMENSIONS, DEFAULT_SETTINGS.gridDimension);
}

export function getTickInterval(difficulty) {
  return DIFFICULTY_OPTIONS[resolveDifficulty(difficulty)].tickMs;
}

export function getGridSize(gridDimension) {
  const { width, height } = GRID_DIMENSIONS[resolveGridDimension(gridDimension)];

  return { width, height };
}

function resolveOption(value, options, fallback) {
  return typeof value === "string" && value in options ? value : fallback;
}
