const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");

const state = {
  paddle: {
    width: 120,
    height: 14,
    x: canvas.width / 2 - 60,
    y: canvas.height - 40,
    speed: 9,
    vx: 0,
  },
  ball: {
    radius: 8,
    x: canvas.width / 2,
    y: canvas.height - 55,
    speed: 5.5,
    vx: 0,
    vy: 0,
    launched: false,
  },
  bricks: [],
  brickRows: 6,
  brickCols: 10,
  brickGap: 8,
  brickHeight: 24,
  brickTopOffset: 70,
  score: 0,
  lives: 3,
  level: 1,
  running: true,
  won: false,
};

const keys = new Set();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resetBall(launch = false) {
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - state.ball.radius - 2;
  state.ball.vx = state.ball.speed * (Math.random() > 0.5 ? 1 : -1) * 0.8;
  state.ball.vy = -state.ball.speed;
  state.ball.launched = launch;
}

function buildBricks() {
  const totalGap = state.brickGap * (state.brickCols - 1);
  const brickWidth = (canvas.width - 80 - totalGap) / state.brickCols;
  state.bricks = [];

  for (let row = 0; row < state.brickRows; row += 1) {
    for (let col = 0; col < state.brickCols; col += 1) {
      state.bricks.push({
        x: 40 + col * (brickWidth + state.brickGap),
        y: state.brickTopOffset + row * (state.brickHeight + state.brickGap),
        width: brickWidth,
        height: state.brickHeight,
        alive: true,
        hp: row < 2 && state.level > 1 ? 2 : 1,
        color: `hsl(${220 - row * 25}, 90%, ${55 - row * 4}%)`,
      });
    }
  }
}

function startLevel() {
  state.paddle.x = canvas.width / 2 - state.paddle.width / 2;
  state.paddle.vx = 0;
  buildBricks();
  resetBall(false);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = `Score: ${state.score}`;
  livesEl.textContent = `Lives: ${state.lives}`;
  levelEl.textContent = `Level: ${state.level}`;
}

function handleInput() {
  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  state.paddle.vx = 0;

  if (left && !right) state.paddle.vx = -state.paddle.speed;
  if (right && !left) state.paddle.vx = state.paddle.speed;
}

function handlePaddle() {
  state.paddle.x = clamp(state.paddle.x + state.paddle.vx, 0, canvas.width - state.paddle.width);
  if (!state.ball.launched) {
    state.ball.x = state.paddle.x + state.paddle.width / 2;
    state.ball.y = state.paddle.y - state.ball.radius - 2;
  }
}

function handleBall() {
  if (!state.ball.launched || !state.running) return;

  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  if (state.ball.x - state.ball.radius <= 0 || state.ball.x + state.ball.radius >= canvas.width) {
    state.ball.vx *= -1;
    state.ball.x = clamp(state.ball.x, state.ball.radius, canvas.width - state.ball.radius);
  }

  if (state.ball.y - state.ball.radius <= 0) {
    state.ball.vy *= -1;
    state.ball.y = state.ball.radius;
  }

  if (state.ball.y - state.ball.radius > canvas.height) {
    state.lives -= 1;
    updateHud();
    if (state.lives <= 0) {
      state.running = false;
    } else {
      resetBall(false);
    }
  }

  if (
    state.ball.y + state.ball.radius >= state.paddle.y &&
    state.ball.y - state.ball.radius <= state.paddle.y + state.paddle.height &&
    state.ball.x >= state.paddle.x &&
    state.ball.x <= state.paddle.x + state.paddle.width &&
    state.ball.vy > 0
  ) {
    const hitPoint = (state.ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
    const angle = hitPoint * (Math.PI / 3);
    const speed = Math.hypot(state.ball.vx, state.ball.vy) * 1.02;
    state.ball.vx = speed * Math.sin(angle);
    state.ball.vy = -Math.abs(speed * Math.cos(angle));
    state.ball.y = state.paddle.y - state.ball.radius - 1;
  }
}

function handleBricks() {
  if (!state.ball.launched || !state.running) return;

  for (const brick of state.bricks) {
    if (!brick.alive) continue;

    const nearestX = clamp(state.ball.x, brick.x, brick.x + brick.width);
    const nearestY = clamp(state.ball.y, brick.y, brick.y + brick.height);
    const dx = state.ball.x - nearestX;
    const dy = state.ball.y - nearestY;

    if (dx * dx + dy * dy <= state.ball.radius * state.ball.radius) {
      brick.hp -= 1;
      if (brick.hp <= 0) {
        brick.alive = false;
        state.score += 10;
      } else {
        state.score += 3;
      }
      updateHud();

      if (Math.abs(dx) > Math.abs(dy)) {
        state.ball.vx *= -1;
      } else {
        state.ball.vy *= -1;
      }
      break;
    }
  }

  const remaining = state.bricks.some((b) => b.alive);
  if (!remaining) {
    state.level += 1;
    state.ball.speed += 0.5;
    state.brickRows = Math.min(state.brickRows + 1, 8);
    startLevel();
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 45; i += 1) {
    const x = ((i * 131) % canvas.width);
    const y = ((i * 97) % canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPaddle() {
  ctx.fillStyle = "#b4c5ff";
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#e8eeff";
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    if (brick.hp > 1) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(brick.x + 4, brick.y + 4, brick.width - 8, brick.height - 8);
    }
  }
}

function drawOverlay() {
  if (state.running && state.ball.launched) return;

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  if (!state.running) {
    ctx.font = "bold 44px Inter, sans-serif";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "22px Inter, sans-serif";
    ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2 + 32);
  } else {
    ctx.font = "bold 30px Inter, sans-serif";
    ctx.fillText("Press Space to Launch", canvas.width / 2, canvas.height / 2);
  }
}

function restartGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.ball.speed = 5.5;
  state.brickRows = 6;
  state.running = true;
  updateHud();
  startLevel();
}

function loop() {
  handleInput();
  handlePaddle();
  handleBall();
  handleBricks();

  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  drawOverlay();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key);

  if (event.key === " ") {
    event.preventDefault();
    if (!state.running) {
      restartGame();
    } else if (!state.ball.launched) {
      state.ball.launched = true;
    }
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

startLevel();
loop();
