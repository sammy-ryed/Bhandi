const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const replayPopup = document.getElementById("replayPopup");
const replayBtn = document.getElementById("replayBtn");
const goodTrip = document.getElementById("goodTrip");
const badTrip = document.getElementById("badTrip");

const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const helpBtn = document.getElementById("helpBtn");
const helpPopup = document.getElementById("helpPopup");
const closeHelp = document.getElementById("closeHelp");

// 🎶 Audio
const deadSfx = new Audio("assets/dead.mp3");
const gtMusic = new Audio("assets/gt.mp3");
const btMusic = new Audio("assets/bt.mp3");
const startMusic = new Audio("assets/start.mp3");
const bgMusic = new Audio("assets/bg.mp3");

deadSfx.preload = "auto";
deadSfx.load();

gtMusic.loop = true;
btMusic.loop = true;
startMusic.loop = true;
bgMusic.loop = true;

// 🎵 Volumes
bgMusic.volume = 0.45;
gtMusic.volume = 0.45;
btMusic.volume = 0.45;
startMusic.volume = 0.45;

// 🔑 Unlock audio on first input (just unlock, don't play anything yet)
let audioPrimed = false;
function primeAudio() {
  if (!audioPrimed) {
    // play and pause a dummy sound to unlock audio
    deadSfx.volume = 0;
    deadSfx.play().then(() => {
      deadSfx.pause();
      deadSfx.currentTime = 0;
      deadSfx.volume = 1;
    });
    audioPrimed = true;
  }
}
document.addEventListener("click", primeAudio, { once: true });
document.addEventListener("keydown", primeAudio, { once: true });

// 🎮 Show menu and play startMusic
menu.style.display = "flex";
canvas.style.display = "none";
startMusic.currentTime = 0;
startMusic.volume = 0.45;
startMusic.play().catch(err => console.log("Autoplay blocked:", err));

// 🎮 Start button
startBtn.onclick = async () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  gameRunning = true;

  // stop start music
  startMusic.pause();
  startMusic.currentTime = 0;

  // start bg music safely
  try {
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.45;
    await bgMusic.play();
  } catch (err) {
    console.log("Autoplay blocked:", err);
  }

  resetGame();
};

document.addEventListener("click", primeAudio, { once: true });
document.addEventListener("keydown", primeAudio, { once: true });

// Hide game elements initially
canvas.style.display = "none";
replayPopup.style.display = "none";
helpPopup.style.display = "none";

// 📏 Canvas size
canvas.width = 900;
canvas.height = 600;

// 🔥 Images
const stonerIdle = new Image();
stonerIdle.src = "assets/og.png";
const stonerSmoke = new Image();
stonerSmoke.src = "assets/ogsmoking.png";
const stonerExhale = new Image();
stonerExhale.src = "assets/ogsmoked.png";

const tokenImg = new Image();
tokenImg.src = "assets/token.png";

const copImg = new Image();
copImg.src = "assets/cop.png";

// Mobile tap = flap
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
});

// 🔥 Player
const stoner = {
  x: 50,
  y: canvas.height / 2,
  width: 60,
  height: 80,
  velocity: 0,
  gravity: -0.08,
  lift: 2.5
};

let cops = [];
let frame = 0;
let score = 0;
let gameOver = false;

// 🍄 Token + Trip
let token = null;
let inTrip = false;
let tripType = null;
let tripTimer = 0;

// 🎬 Animation
let stonerState = "idle";
let stonerAnimTimer = 0;

// 🎮 State
let gameRunning = false;

// 🎮 Controls
document.addEventListener("keydown", flap);
document.addEventListener("click", flap);

// 📏 Responsive canvas
function resizeCanvas() {
  const aspectRatio = 3 / 2;
  let width = window.innerWidth * 0.95;
  let height = width / aspectRatio;

  if (height > window.innerHeight * 0.9) {
    height = window.innerHeight * 0.9;
    width = height * aspectRatio;
  }

  canvas.width = width;
  canvas.height = height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 🕹️ Flap
function flap() {
  if (!gameOver && gameRunning) {
    if (inTrip && tripType === "bad") {
      const chaos = Math.random() * 3 + 0.5;
      stoner.velocity = chaos;
    } else {
      stoner.velocity = stoner.lift;
    }
  }
}

// 🌀 Reset
function resetGame() {
  stoner.x = 50;
  stoner.y = canvas.height / 2;
  stoner.velocity = 0;
  cops = [];
  score = 0;
  frame = 0;
  gameOver = false;
  token = null;
  inTrip = false;
  tripType = null;
  tripTimer = 0;
  stonerState = "idle";
  stonerAnimTimer = 0;
  document.body.style.background = "black";
  update();
}

// 🎶 Fade helpers
function fadeOut(audio, step = 0.05, interval = 80) {
  let fade = setInterval(() => {
    if (audio.volume > step) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fade);
    }
  }, interval);
}

function fadeIn(audio, step = 0.05, interval = 80, target = 0.6) {
  audio.volume = 0;
  audio.play();
  let fade = setInterval(() => {
    if (audio.volume < target - step) {
      audio.volume = Math.min(target, audio.volume + step);
    } else {
      audio.volume = target;
      clearInterval(fade);
    }
  }, interval);
}

// 🎲 Trips
function startTrip() {
  inTrip = true;
  tripType = Math.random() < 0.5 ? "bad" : "good";
  tripTimer = 500;

  fadeOut(bgMusic);

  if (tripType === "bad") {
    badTrip.style.display = "block";
    badTrip.currentTime = 0;
    badTrip.play();
    btMusic.currentTime = 0;
    fadeIn(btMusic, 0.05, 80, 0.4);
  } else {
    goodTrip.style.display = "block";
    goodTrip.currentTime = 0;
    goodTrip.play();
    gtMusic.currentTime = 0;
    fadeIn(gtMusic, 0.05, 0.4);
  }
}

function endTrip() {
  inTrip = false;
  tripType = null;

  badTrip.pause();
  badTrip.style.display = "none";
  goodTrip.pause();
  goodTrip.style.display = "none";

  fadeOut(btMusic);
  fadeOut(gtMusic);
  fadeIn(bgMusic, 0.05, 80, 0.6);

  document.body.style.background = "black";
}

// 🎬 Animation
function updateStonerAnimation() {
  if (stonerAnimTimer <= 0) {
    if (Math.random() < 0.004) {
      stonerState = "smoke";
      stonerAnimTimer = 100;
    } else {
      stonerState = "idle";
    }
  } else {
    stonerAnimTimer--;
    if (stonerState === "smoke" && stonerAnimTimer <= 0) {
      stonerState = "exhale";
      stonerAnimTimer = 100;
    } else if (stonerState === "exhale" && stonerAnimTimer <= 0) {
      stonerState = "idle";
    }
  }
}

// 🌆 Background
function drawBackground() {
  ctx.fillStyle = "#fdf6e3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,0,255,0.2)";
  ctx.lineWidth = 1;
  for (let y = 40; y < canvas.height; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,0,0,0.3)";
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(60, canvas.height);
  ctx.stroke();
}

// 🎮 Game loop
function update() {
  if (!gameRunning || gameOver) return;

  drawBackground();

  // physics
  stoner.velocity += stoner.gravity;
  stoner.y += stoner.velocity;
  if (stoner.y + stoner.height > canvas.height) {
    stoner.y = canvas.height - stoner.height;
    stoner.velocity = 0;
  }
  if (stoner.y < 0) {
    stoner.y = 0;
    stoner.velocity = 0;
  }

  updateStonerAnimation();
  if (stonerState === "idle") {
    ctx.drawImage(stonerIdle, stoner.x, stoner.y, stoner.width, stoner.height);
  } else if (stonerState === "smoke") {
    ctx.drawImage(stonerSmoke, stoner.x, stoner.y, stoner.width, stoner.height);
  } else if (stonerState === "exhale") {
    ctx.drawImage(stonerExhale, stoner.x, stoner.y, stoner.width, stoner.height);
  }

  // 🚔 Spawn cops + tokens
  if (frame % 150 === 0) {
    let gap = canvas.height * 0.33;
    let top = Math.random() * (canvas.height - gap - 100);
    const newCop = { x: canvas.width, top, bottom: top + gap, width: 50 };
    cops.push(newCop);

    if (!inTrip && !token && Math.random() < 0.35) {
      const tokenSize = 36, margin = 8;
      const minY = newCop.top + margin;
      const maxY = newCop.bottom - margin - tokenSize;
      let tokenY = maxY > minY ? minY + Math.random() * (maxY - minY) : newCop.top + (gap - tokenSize) / 2;
      token = {
        x: newCop.x + (newCop.width - tokenSize) / 2,
        y: tokenY,
        baseY: tokenY,
        size: tokenSize,
        bobOffset: Math.random() * Math.PI * 2
      };
    }
  }

  // 🚔 Cop movement
  let copSpeed = inTrip && tripType === "bad" ? 2 : 3;

  for (let x = 0; x < cops.length; x++) {
    let cop = cops[x];
    cop.x -= copSpeed;

    const copHeightTop = cop.top;
    const copHeightBottom = canvas.height - cop.bottom;

    if (copHeightTop > 0) ctx.drawImage(copImg, cop.x, 0, cop.width, copHeightTop);
    if (copHeightBottom > 0) ctx.drawImage(copImg, cop.x, cop.bottom, cop.width, copHeightBottom);

    if (!inTrip || tripType === "bad") {
      if (
        stoner.x < cop.x + cop.width &&
        stoner.x + stoner.width > cop.x &&
        (stoner.y < cop.top || stoner.y + stoner.height > cop.bottom)
      ) {
        gameOver = true;
        deadSfx.currentTime = 0;
        deadSfx.play();
        showReplayPopup();
      }
    }
    if (!cop.passed && cop.x + cop.width < stoner.x) {
      score++;
      cop.passed = true;
    }
  }

  // 🍄 Token
  if (token) {
    token.x -= copSpeed;
    token.y = token.baseY + Math.sin(frame / 70 + token.bobOffset) * 10;
    ctx.drawImage(tokenImg, token.x, token.y, token.size, token.size);

    if (
      stoner.x < token.x + token.size &&
      stoner.x + stoner.width > token.x &&
      stoner.y < token.y + token.size &&
      stoner.y + stoner.height > token.y
    ) {
      token = null;
      startTrip();
    }
    if (token && token.x + token.size < 0) token = null;
  }

  // 🎶 Trip timer + UI
  if (inTrip) {
    tripTimer--;
    if (tripTimer <= 0) endTrip();

    const barWidth = 200, barHeight = 20;
    const x = (canvas.width - barWidth) / 2;
    const y = canvas.height - 80;
    const progress = tripTimer / 500;

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = tripType === "bad" ? "red" : "lime";
    ctx.fillRect(x, y, barWidth * Math.max(0, Math.min(progress, 1)), barHeight);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "black";
    ctx.font = "20px Arial bold";
    ctx.textAlign = "center";
    ctx.fillText(tripType === "bad" ? "BT" : "GT", x + barWidth / 2, y - 10);
    ctx.textAlign = "left";
  }

  // 🏆 Score
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.fillText("Hits: " + score, 20, 40);

  frame++;
  requestAnimationFrame(update);
}

function showReplayPopup() {
  endTrip();
  document.getElementById("popupText").innerHTML =
    "BUSTED!<br>Hits: " + score + "<br><br>Another hit?";
  replayPopup.style.display = "flex";

  replayBtn.onclick = () => {
    replayPopup.style.display = "none";
    resetGame();
  };
}

// 🎮 Menu Controls
startBtn.onclick = async () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  gameRunning = true;

  // stop menu music
  startMusic.pause();
  startMusic.currentTime = 0;

  // start bg music safely
  try {
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.45;
    await bgMusic.play();
  } catch (err) {
    console.log("Autoplay blocked:", err);
  }

  resetGame();
};

helpBtn.onclick = () => {
  helpPopup.style.display = "flex";
};

closeHelp.onclick = () => {
  helpPopup.style.display = "none";
};
