"use strict";


const starsPerPixel = 0.01;

const rocketConfig = {
  timeBetweenRockets:2, // Seconds between rockets
  timeRandomness: 2,
  speed: 200, // Pixels per second.
  size: [ 50, 100 ] // Size in pixels
};

const numSimultaneousExplosions = 5;

const minColor = 0.1;
const maxColor = 0.8;

const body = document.body;
const canvasContainer = document.getElementById("canvas-container");
const rocketImg = document.getElementById("rocket");


const starCanvas = createCanvas("star", -100, updateStars);
starCanvas.canvas.style.backgroundColor = "black";
const rocketCanvas = createCanvas("rocket", -1);

const canvases = [starCanvas, rocketCanvas];
const explosionCanvases = [];

for (let i = 0; i < numSimultaneousExplosions; i++) {
  const canvas = createCanvas("explosion" + i, -50);
  canvas.ctx.globalCompositeOperation = "lighter";
  canvas.used = false;
  canvases.push(canvas);
  explosionCanvases.push(canvas);
}

window.addEventListener("resize", updateCanvasSizes);
updateCanvasSizes();


let explosionLastTime = null;
let explosions = [];

function updateExplosions(now) {
  if (explosionLastTime === null) {
    explosionLastTime = now;
  }
  const deltaTime = (now - explosionLastTime) / 1000;
  explosionLastTime = now;

  const explosionsToRemove = [];

  for (let j = explosions.length - 1; j >= 0; j--) {
    const explosion = explosions[j];

    const canvas = explosion.canvas.canvas;
    const ctx = explosion.canvas.ctx;

    const f = explosion.timeLeft / 5;
    const directionFactor = deltaTime * 150 * f * f;
    const gravityFactor = explosion.gravityFactor * deltaTime;

    // Update sparkles
    for (let i = 0; i < explosion.sparkles.length; i++) {
      const sparkle = explosion.sparkles[i];

      const oldPositionX = sparkle.position[0];
      const oldPositionY = sparkle.position[1];

      const newPositionX = sparkle.position[0] + sparkle.direction[0] * directionFactor;
      const newPositionY = sparkle.position[1] + sparkle.direction[1] * directionFactor + gravityFactor;

      sparkle.position[0] = newPositionX;
      sparkle.position[1] = newPositionY;


      ctx.strokeStyle = rgbaToString(sparkle.color[0] * f, sparkle.color[1] * f, sparkle.color[2] * f);
      ctx.beginPath();
      ctx.moveTo(oldPositionX, oldPositionY);
      ctx.lineTo(newPositionX, newPositionY);
      ctx.stroke();
    }

    explosion.gravityFactor += 9.82 * deltaTime * 0.5;
    explosion.timeLeft -= deltaTime;

    if (explosion.timeLeft <= 0) {
      explosionsToRemove.push(explosion);
    }
    else if (explosion.timeLeft <= 2) {
      const fadeOut = explosion.timeLeft / 2;
      canvas.style.opacity = fadeOut;
      //canvas.style.filter = "blur(" + ((1 / fadeOut) - 1) + "px)";
    }

  }

  for (let explosionToDelete of explosionsToRemove) {
    const index = explosions.indexOf(explosionToDelete);
    explosions.splice(index,1);
    explosionToDelete.canvas.ctx.clearRect(0, 0, explosionToDelete.canvas.canvas.width, explosionToDelete.canvas.canvas.height);
    explosionToDelete.canvas.used = false;
    explosionToDelete.canvas.canvas.style.opacity = 1;
    //explosionToDelete.canvas.canvas.style.filter = "blur(0)";
  }
}

let nextRocketTime = 0;
let rockets = [];

function updateRocket(now) {
  const canvas = rocketCanvas.canvas;
  const ctx = rocketCanvas.ctx;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (rocketCanvas.lastTime == null) {
    rocketCanvas.lastTime = now;
  }

  const deltaTime = (now - rocketCanvas.lastTime) / 1000;
  rocketCanvas.lastTime = now;

  if (now >= nextRocketTime) {
    nextRocketTime = now + rocketConfig.timeBetweenRockets * 1000 + Math.random() * rocketConfig.timeRandomness * 1000;
    const xpos = Math.random() * width;
    const ypos = height;
    const targetY = Math.random() * (height - 50) + 50;
    rockets.push({ position: [xpos, ypos], targetY: targetY, speed: rocketConfig.speed});
  }

  // Update position and remove
  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];
    rocket.position[1] -= rocket.speed * deltaTime;
    if (rocket.position[1] < rocket.targetY) {
      spawnExplosion(rocket.position);
      rockets.splice(i,1);
    }
  }

  for (let rocket of rockets) {
    ctx.drawImage(rocketImg, rocket.position[0] - (rocketConfig.size[0] / 2), rocket.position[1] - (rocketConfig.size[1] / 2), rocketConfig.size[0], rocketConfig.size[1]);
  }
}

function runAnimations(now) {
  updateExplosions(now);
  updateRocket(now);

  window.requestAnimationFrame(runAnimations);
}

window.requestAnimationFrame(runAnimations);

function spawnExplosion(position) {
  for (let canvas of explosionCanvases) {
    if (canvas.used === false) {
      canvas.ctx.globalCompositeOperation = "lighter";
      const explosion = {
        canvas: canvas,
        timeLeft: 5,
        sparkles: [],
        gravityFactor: 0
      };


      const sparkleColor = [Math.random() * (maxColor - minColor) + minColor, Math.random() * (maxColor - minColor) + minColor, Math.random() * (maxColor - minColor) + minColor];
      const sparkleColor2 = [Math.random() * (maxColor - minColor) + minColor, Math.random() * (maxColor - minColor) + minColor, Math.random() * (maxColor - minColor) + minColor];

      for (let i = 0; i < 160; i++) {
        const angle = Math.random()*Math.PI*2;
        const radius = Math.random();
        const x = Math.cos(angle)*radius;
				const y = Math.sin(angle)*radius;
				const color = i % 2 == 0 ? sparkleColor : sparkleColor2;
        explosion.sparkles.push({ color: color, position: [position[0], position[1]], direction: [x, y] });
      }

      canvas.used = true;
      explosions.push(explosion);

      return;
    }
  }

  console.log("COULD NOT FIND UNUSED CANVAS");
}

function updateStars() {
  const canvas = starCanvas.canvas;
  const ctx = starCanvas.ctx;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "white";

  const stars = width * height * starsPerPixel;

  for (let i = 0; i < stars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random();
    ctx.fillRect(x, y, size, size);
  }
}


function createCanvas(name, zIndex, resizeFunc) {
  const canvas = document.createElement("canvas");
  canvas.id = name + "-canvas";
  canvas.style.zIndex = zIndex;
  const ctx = canvas.getContext("2d");

  canvasContainer.appendChild(canvas);

  return { canvas: canvas, ctx: ctx, resizeFunc: resizeFunc };
}

function updateCanvasSizes() {
  for (let canvas of canvases) {
    const c = canvas.canvas;
    c.width = body.clientWidth;
    c.height = body.clientHeight;

    if (canvas.resizeFunc !== undefined) {
      canvas.resizeFunc();
    }
  }
}

function rgbaToString(r, g, b, a) {

  return`rgba(${r * 255}, ${g * 255}, ${b * 255}, ${(a === undefined ? 1.0 : a) * 255})`;
}
