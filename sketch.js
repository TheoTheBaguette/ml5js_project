let GAME_W = 1420;
let GAME_H = 820;
let SIDE_W = 320;
let PLAY_W = GAME_W - SIDE_W;
let PLAY_H = GAME_H;

let CAM_X = PLAY_W + 16;
let CAM_Y = 16;
let CAM_W = SIDE_W - 32;
let CAM_H = 220;

let video;
let faceMesh;

let faces = [];

let webcamReady = false;
let faceModelReady = false;
let faceError = "";
let modelsStarted = false;

let facePolling = false;

let lastFacesMs = 0;

let ship;
let asteroids = [];
let stars = [];

let scoreSeconds = 0;
let lives = 3;
let gameOver = false;
let gameStartMs = 0;
let spawnTimer = 0;
let spawnBaseInterval = 54;
let spawnInterval = spawnBaseInterval;
let invulFrames = 0;
let boostFrames = 0;
let debugMode = false;
let lastMouthGap = 0;

function recomputeGameDimensions() {
  const holder = document.getElementById("canvas-holder");

  const defaultW = windowWidth > 980 ? windowWidth - 356 : windowWidth - 24;
  const defaultH = windowWidth > 980 ? windowHeight - 24 : windowHeight - 290;

  const holderW = holder && holder.clientWidth > 0 ? holder.clientWidth - 2 : defaultW;
  const holderH = holder && holder.clientHeight > 0 ? holder.clientHeight - 2 : defaultH;

  GAME_W = constrain(floor(holderW), 760, 1700);
  GAME_H = constrain(floor(holderH), 500, 960);

  SIDE_W = constrain(floor(GAME_W * 0.22), 250, 340);
  if (GAME_W - SIDE_W < 500) {
    SIDE_W = max(220, GAME_W - 500);
  }

  PLAY_W = GAME_W - SIDE_W;
  PLAY_H = GAME_H;

  CAM_X = PLAY_W + 16;
  CAM_Y = 16;
  CAM_W = max(120, SIDE_W - 32);
  CAM_H = min(220, floor(GAME_H * 0.32));
}

function applyResize(preserveState = true) {
  const oldPlayW = PLAY_W;
  const oldPlayH = PLAY_H;

  recomputeGameDimensions();

  if (typeof resizeCanvas === "function") {
    resizeCanvas(GAME_W, GAME_H);
  }

  if (!preserveState || oldPlayW <= 0 || oldPlayH <= 0) {
    initStars();
    if (ship) {
      ship.pos = createVector(PLAY_W * 0.5, PLAY_H - 90);
      ship.targetX = PLAY_W * 0.5;
    }
    return;
  }

  const sx = PLAY_W / oldPlayW;
  const sy = PLAY_H / oldPlayH;

  if (ship) {
    ship.pos.x *= sx;
    ship.pos.y *= sy;
    ship.targetX *= sx;
    ship.keepInBounds();
  }

  for (const a of asteroids) {
    a.pos.x *= sx;
    a.pos.y *= sy;
  }

  for (const s of stars) {
    s.x *= sx;
    s.y *= sy;
  }
}


function setup() {
  recomputeGameDimensions();
  const canvas = createCanvas(GAME_W, GAME_H);
  canvas.parent("canvas-holder");

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.elt.setAttribute("playsinline", "");
  video.elt.onloadeddata = () => {
    webcamReady = true;
    startModels();
  };
  video.hide();

  const btn = document.getElementById("btn-reset");
  if (btn) {
    btn.addEventListener("click", resetGame);
  }

  const debugBtn = document.getElementById("btn-debug");
  if (debugBtn) {
    debugBtn.addEventListener("click", () => {
      debugMode = !debugMode;
      updateDebugUi();
    });
  }

  const spawnSlider = document.getElementById("spawn-rate-slider");
  if (spawnSlider) {
    spawnSlider.addEventListener("input", () => {
      const value = constrain(Number(spawnSlider.value) || 54, 20, 100);
      spawnBaseInterval = value;
      spawnInterval = min(spawnInterval, spawnBaseInterval);
      updateSpawnRateUi();
    });
  }

  initStars();
  resetGame();
  updateDebugUi();
  updateSpawnRateUi();
}

function keyPressed() {
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    updateDebugUi();
  }
}

function windowResized() {
  applyResize(true);
}

function resetGame() {
  ship = new PlayerShip();
  asteroids = [];
  scoreSeconds = 0;
  lives = 3;
  gameOver = false;
  gameStartMs = millis();
  spawnTimer = 0;
  spawnInterval = spawnBaseInterval;
  invulFrames = 0;
  boostFrames = 0;
}

function initStars() {
  stars = [];
  for (let i = 0; i < 260; i++) {
    stars.push({
      x: random(0, PLAY_W),
      y: random(0, PLAY_H),
      r: random(0.8, 2.2),
      a: random(60, 220)
    });
  }
}

function startModels() {
  if (modelsStarted) return;
  modelsStarted = true;
  startFaceDetection();
}



async function pollFaces() {
  if (!facePolling || !faceMesh || typeof faceMesh.detect !== "function") return;

  try {
    const results = await faceMesh.detect(video.elt);
    onFaces(results);
  } catch (e) {
      console.error("Erreur detection visage:", e);
  }

  setTimeout(pollFaces, 40);
}



function startFaceDetection() {
  try {
    faceError = "";
    faceMesh = ml5.faceMesh(video, () => {
      faceModelReady = true;
    });

    if (!faceMesh) {
      faceError = "faceMesh nul";
      return;
    }

    if (typeof faceMesh.on === "function") {
      faceMesh.on("predict", onFaces);
      return;
    }

    if (typeof faceMesh.detect === "function") {
      facePolling = true;
      pollFaces();
      return;
    }

    faceError = "API faceMesh non supportee";
  } catch (e) {
    faceError = "Echec chargement faceMesh";
  }
}



function onFaces(results) {
  faces = Array.isArray(results) ? results : [];
  if (faces.length) {
    lastFacesMs = millis();
  }
}

function toVideoPoint(kp) {
  if (!kp) return null;

  let x;
  let y;
  if (Array.isArray(kp) && kp.length >= 2) {
    x = kp[0];
    y = kp[1];
  } else if (typeof kp.x === "number" && typeof kp.y === "number") {
    x = kp.x;
    y = kp.y;
  } else {
    return null;
  }

  const normalized = x >= -0.2 && x <= 1.2 && y >= -0.2 && y <= 1.2;
  if (normalized) {
    x *= video.width;
    y *= video.height;
  }

  return { x, y };
}

function getBounds(keypoints) {
  if (!Array.isArray(keypoints) || !keypoints.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const kp of keypoints) {
    const p = toVideoPoint(kp);
    if (!p) continue;
    minX = min(minX, p.x);
    minY = min(minY, p.y);
    maxX = max(maxX, p.x);
    maxY = max(maxY, p.y);
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function getFaceNose(face) {
  if (!face || !Array.isArray(face.keypoints) || !face.keypoints[1]) return null;
  return toVideoPoint(face.keypoints[1]);
}

function updateControls() {
  ship.hasControl = false;
  ship.boost = false;
  lastMouthGap = 0;

  if (faces.length && video.width > 0) {
    const nose = getFaceNose(faces[0]);
    if (nose) {
      const nx = constrain(nose.x / video.width, 0.15, 0.85);
      ship.targetX = map(nx, 0.15, 0.85, PLAY_W - 44, 44, true);
      ship.hasControl = true;
    }

    // Mouth-open detection for boost
    const face = faces[0];
    if (Array.isArray(face.keypoints) && face.keypoints[13] && face.keypoints[14]) {
      const lipUp = toVideoPoint(face.keypoints[13]);
      const lipDown = toVideoPoint(face.keypoints[14]);
      if (lipUp && lipDown) {
        const mouthGap = abs(lipDown.y - lipUp.y);
        lastMouthGap = mouthGap;
        ship.boost = mouthGap > 15;
      }
    }
  }
}

function spawnAsteroids() {
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    asteroids.push(new Asteroid());
    spawnTimer = 0;
  }

  const minSpawnInterval = max(10, floor(spawnBaseInterval * 0.55));
  if (frameCount % 360 === 0 && spawnInterval > minSpawnInterval) {
    spawnInterval -= 2;
  }
}

function updateAsteroids() {
  for (const a of asteroids) {
    a.update();
  }
  asteroids = asteroids.filter((a) => !a.outOfBounds());
}

function checkCollisions() {
  if (invulFrames > 0) {
    invulFrames--;
    return;
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    const d = dist(ship.pos.x, ship.pos.y, a.pos.x, a.pos.y);
    if (d < a.radius + ship.radius * 0.68) {
      asteroids.splice(i, 1);
      lives--;
      invulFrames = 55;
      if (lives <= 0) {
        lives = 0;
        gameOver = true;
      }
      break;
    }
  }
}

function drawPlayArea() {
  noStroke();
  fill(10, 16, 34);
  rect(0, 0, PLAY_W, PLAY_H);

  for (const s of stars) {
    fill(255, 255, 255, s.a);
    circle(s.x, s.y, s.r * 2);
  }

  noFill();
  stroke(75, 105, 170, 120);
  rect(2, 2, PLAY_W - 4, PLAY_H - 4, 8);
}

function drawCameraPanel() {
  noStroke();
  fill(14, 23, 44);
  rect(PLAY_W, 0, SIDE_W, GAME_H);

  stroke(70, 104, 170, 180);
  line(PLAY_W, 0, PLAY_W, GAME_H);

  if (video && video.width > 0 && video.height > 0) {
    push();
    tint(255, 95);
    image(video, CAM_X, CAM_Y, CAM_W, CAM_H);
    noFill();
    stroke(110, 150, 230, 180);
    rect(CAM_X, CAM_Y, CAM_W, CAM_H, 8);
    pop();

    if (debugMode) {
      const sx = CAM_W / video.width;
      const sy = CAM_H / video.height;
      drawFacesOverlay(sx, sy, CAM_X, CAM_Y);
    }
  }

  drawSideText();
}



function drawFacesOverlay(scaleX, scaleY, offsetX, offsetY) {
  for (const face of faces) {
    const keypoints = Array.isArray(face.keypoints) ? face.keypoints : [];
    const b = getBounds(keypoints);
    if (b) {
      noFill();
      stroke("#59d0ff");
      strokeWeight(2);
      rect(offsetX + b.minX * scaleX, offsetY + b.minY * scaleY, b.w * scaleX, b.h * scaleY, 8);
    }

    noStroke();
    fill("#9de5ff");
    for (let i = 0; i < keypoints.length; i += 14) {
      const p = toVideoPoint(keypoints[i]);
      if (!p) continue;
      circle(offsetX + p.x * scaleX, offsetY + p.y * scaleY, 3);
    }
  }
}

function drawHud() {
  fill(228);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(22);
  text(`Temps: ${scoreSeconds}s`, 16, 14);
  textSize(19);
  text(`Vies: ${lives}`, 16, 46);

  if (gameOver) {
    textAlign(CENTER, CENTER);
    textSize(44);
    fill(255, 126, 126);
    text("GAME OVER", PLAY_W * 0.5, PLAY_H * 0.45);
    textSize(24);
    fill(226);
    text("Cliquer sur Recommencer", PLAY_W * 0.5, PLAY_H * 0.53);
  }
}

function drawAsteroidsDebug() {
  if (!debugMode) {
    return;
  }

  push();
  noFill();
  strokeWeight(1.2);

  for (const a of asteroids) {
    stroke(255, 175, 80, 180);
    circle(a.pos.x, a.pos.y, a.radius * 2);

    stroke(255, 120, 70, 200);
    line(a.pos.x, a.pos.y, a.pos.x + a.vel.x * 12, a.pos.y + a.vel.y * 12);
  }

  pop();
}

function drawSideText() {
  const now = millis();
  const facesAlive = lastFacesMs > 0 && now - lastFacesMs < 1200;

  noStroke();
  fill(226, 237, 255);
  textAlign(LEFT, TOP);

  textSize(18);
  text("Cam / Detection", PLAY_W + 16, CAM_Y + CAM_H + 16);

  textSize(14);
  const lines = [
    `Webcam: ${webcamReady ? "ok" : "en attente"}`,
    `Visage modele: ${faceModelReady ? "pret" : "chargement"}`,
    `Visages detectes: ${faces.length} (${facesAlive ? "actif" : "inactif"})`,
    `Controle visage: ${ship?.hasControl ? "oui" : "non"}`
  ];

  if (debugMode) {
    lines.push(`Bouche gap: ${lastMouthGap.toFixed(1)} (boost > 15)`);
    lines.push(`Boost actif: ${ship?.boost ? "oui" : "non"}`);
    lines.push(`Face polling: ${facePolling ? "on" : "off"}`);
    lines.push(`Asteroides: ${asteroids.length}`);
    lines.push(`Spawn interval: ${spawnInterval}f (base ${spawnBaseInterval})`);
  }

  if (faceError) {
    lines.push(faceError);
  }

  let y = CAM_Y + CAM_H + 44;
  for (const line of lines) {
    if (!line) continue;
    text(line, PLAY_W + 16, y, SIDE_W - 28);
    y += 22;
  }
}

function updateDebugUi() {
  const btn = document.getElementById("btn-debug");
  if (btn) {
    btn.textContent = debugMode ? "Mode debug (ON)" : "Mode debug";
  }
}

function updateSpawnRateUi() {
  const slider = document.getElementById("spawn-rate-slider");
  const valueBox = document.getElementById("spawn-rate-value");

  if (slider) {
    slider.value = String(spawnBaseInterval);
  }

  if (valueBox) {
    valueBox.textContent = `${spawnBaseInterval} frames`;
  }
}

function updateBoostIndicator() {
  const boost = document.getElementById("boost-indicator");
  if (!boost) return;
  
  if (ship?.boost) {
    boost.textContent = "Boost: ACTIF";
    boost.className = "boost-active";
  } else {
    boost.textContent = "Boost: Inactif";
    boost.className = "boost-inactive";
  }
}

function updateInstructionsBox() {
  const box = document.getElementById("instructions-box");
  if (!box) return;

  const facesAlive = lastFacesMs > 0 && millis() - lastFacesMs < 1200;

  if (facesAlive) {
    box.textContent = "Détection active";
    box.className = "instructions-ok";
  } else {
    box.innerHTML = " Si jamais le visage n’est pas détecté ou reste instable, actualiser la page et restez bien face à la webcam pendant le chargement (quelques secondes). Enlever aussi les lunettes le temps de la détection car elles peuvent interférer. N'hésite peut etre plusieurs essais pour que ça fonctionne bien.";
    box.className = "instructions-warning";
  }
}

function draw() {
  background(8, 14, 30);
  drawPlayArea();

  updateControls();
  updateBoostIndicator();
  updateInstructionsBox();

  if (!gameOver) {
    spawnAsteroids();
    updateAsteroids();

    ship.updateFromInput();
    ship.update();
    ship.keepInBounds();

    checkCollisions();
    scoreSeconds = floor((millis() - gameStartMs) / 1000);
  }

  for (const a of asteroids) {
    a.draw();
  }
  drawAsteroidsDebug();

  ship.draw();
  drawHud();
  drawCameraPanel();
  updateBoostIndicator();
  updateInstructionsBox();
}
