# Classic Snake

A browser-based Snake game built with vanilla JavaScript, HTML, and CSS. The project keeps game rules in a separate module, serves the app with a small Node.js dev server, and uses Node's built-in test runner for coverage of the core gameplay logic.

## Requirements

- Node.js 18 or newer

## Run locally

```bash
npm run dev
```

The app binds to `0.0.0.0:3000` by default. Open `http://127.0.0.1:3000` on the same machine, or `http://<your-computer-ip>:3000` from a phone on the same local Wi-Fi network.

If you want to restrict the server to a specific interface, set `HOST`, for example:

```bash
HOST=127.0.0.1 PORT=3000 npm run dev
```

## Run tests

```bash
npm test
```

## Controls

- Arrow keys or `WASD`: move
- On touch devices, use the on-screen arrow controls
- `Space` or `P`: pause or resume
- `Start`: begin a new run or resume from pause
- `Restart`: reset the board
- `Settings` (`⚙`): adjust difficulty, color pattern, and grid size

## Project structure

- `index.html`: app shell and controls
- `styles.css`: board and UI styling
- `src/game-logic.js`: game state creation and update rules
- `src/main.js`: DOM rendering, input handling, and game loop
- `src/settings.js`: settings presets and resolution helpers
- `scripts/dev-server.mjs`: local static file server
- `tests/game-logic.test.js`: unit tests for gameplay logic

## License

MIT. See `LICENSE`.
