import {
    createApp
} from 'vue'
import './style.css'
import App from './App.vue'

import "destyle.css";

const musicPlayer = document.getElementById('music-player');
const playPauseBtn = document.getElementById('playPauseBtn');
const restartBtnMusic = document.getElementById('restartMusicBtn');

let isPlaying = false;

playPauseBtn.addEventListener('click', () => {
  if (musicPlayer.paused) {
    musicPlayer.play();
    playPauseBtn.textContent = '⏸️'; 
    isPlaying = true;
  } else {
    musicPlayer.pause();
    playPauseBtn.textContent = '▶️'; 
    isPlaying = false;
  }
});

restartBtnMusic.addEventListener('click', () => {
  musicPlayer.currentTime = 0;
  if (!musicPlayer.paused) {
    musicPlayer.play();
  }
});


const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables pour l'animation des triangles
let progressLines = 0;
let progressTriangle1 = 0;
let progressTriangle2 = 0;
let progressZoom = 0;
const duration = 1000;
const durationTriangle2 = 2000;
const durationTriangle3 = 1500;
const zoomDuration = 3000; 
let startTime = null;
let animationComplete = false;
let zoomStarted = false;

// Variables pour la brume
let mistParticles = [];
let draw = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mistMode = true;


const finalImage = new Image();
finalImage.src = "../public/cyberpunk_2.png"; 

let revealHeight = 0;
let revealSpeed = 3;

// Tableau pour les particules néon
let neonParticles = [];
const NEON_PARTICLE_COUNT = 40;

// Particule néon 
class NeonParticle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.15 + Math.random() * 0.25;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 1.5 + Math.random() * 2.5;
        this.baseRadius = this.radius;
        this.color = [
            '#00f0ff', '#ff00f7', '#F9D700', '#00ff99', '#ff0077', '#00ffea'
        ][Math.floor(Math.random() * 6)];
        this.opacity = 0.5 + Math.random() * 0.5;
        this.twinkleSpeed = 0.002 + Math.random() * 0.003;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    update(deltaTime) {
        this.x += this.vx * deltaTime * 0.06;
        this.y += this.vy * deltaTime * 0.06;
        
        this.radius = this.baseRadius + Math.sin(performance.now() * this.twinkleSpeed + this.twinklePhase) * 0.7;
        
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
            
            if (Math.random() < 0.5) this.x = Math.random() < 0.5 ? 0 : canvas.width;
            else this.y = Math.random() < 0.5 ? 0 : canvas.height;
        }
    }
    draw(context) {
        context.save();
        context.globalAlpha = this.opacity * (0.7 + 0.3 * Math.sin(performance.now() * this.twinkleSpeed + this.twinklePhase));
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.shadowColor = this.color;
        context.shadowBlur = 18 + this.radius * 8;
        context.fillStyle = this.color;
        context.fill();
        context.restore();
    }
}

// Initialisation des particules néon
for (let i = 0; i < NEON_PARTICLE_COUNT; i++) {
    neonParticles.push(new NeonParticle());
}

// Particule de brume
class MistParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 40;
        this.y = y + (Math.random() - 0.5) * 40;
        this.radius = Math.random() * 30 + 10;
        this.maxOpacity = Math.random() * 0.3 + 0.1;
        this.opacity = this.maxOpacity;
        this.lifespan = Math.random() * 2000 + 1000;
        this.age = 0;
        this.fadeSpeed = this.maxOpacity / this.lifespan;
    }

    update(deltaTime) {
        this.age += deltaTime;

        if (this.age > this.lifespan * 0.5) {
            this.opacity -= this.fadeSpeed * deltaTime;
            this.opacity = Math.max(0, this.opacity);
        }

        this.radius += 0.01;

        return this.opacity > 0 && this.age < this.lifespan;
    }

    draw() {
        if (this.opacity <= 0) return;

        if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.radius) || !isFinite(this.opacity)) {
            return;
        }

        const gradient = context.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );

        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(200, 200, 255, ${this.opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}

// Fonction pour dessiner une ligne néon
function drawNeonLine(x1, y1, x2, y2, color, lineWidth = 2, glow = 30) {
    context.save();
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowColor = color;
    context.shadowBlur = glow;
    context.stroke();
    context.restore();
}

// Fonction pour créer l'effet de brume
function createMistEffect(x, y) {
    if (!mistMode) return;
    for (let i = 0; i < 3; i++) {
        mistParticles.push(new MistParticle(x, y));
    }
}

// Fonction pour interpoler entre deux points et créer de la brume
function createMistBetweenPoints(x1, y1, x2, y2) {
    if (!mistMode) return;

    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
        return;
    }

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    if (!isFinite(distance) || distance === 0) {
        createMistEffect(x2, y2);
        return;
    }

    const steps = Math.ceil(distance / 15);

    for (let i = 0; i <= steps; i++) {
        const t = steps > 0 ? i / steps : 0;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;

        if (isFinite(x) && isFinite(y)) {
            createMistEffect(x, y);
        }
    }
}

// Fonction pour un mouvement plus fluide
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function drawRevealingImage(context, triangleCenterX, triangleCenterY, triangleSize, zoom) {
    const size = triangleSize * zoom;
    const imgHeight = size * 1.3; 
    const x = triangleCenterX - size / 2;
    const y = triangleCenterY - imgHeight / 2;

    if (!finalImage.complete) return;

    // Met à jour la hauteur de révélation
    if (revealHeight < imgHeight) {
        revealHeight += revealSpeed;
    }

    context.save();
    context.beginPath();
    context.rect(x, y, size, revealHeight);
    context.clip();
    context.drawImage(finalImage, x, y, size, imgHeight);
    context.restore();

    // Bordure néon avec effet glitch doux (segments collés)
    context.save();
    context.strokeStyle = '#00f0ff';
    context.lineWidth = 3;
    context.shadowColor = '#00f0ff';
    context.shadowBlur = 20;
    const glitchSegments = 24; 
    const maxGlitch = 2.5; 
    const now = performance.now();
    // Bord supérieur
    context.beginPath();
    for (let i = 0; i <= glitchSegments; i++) {
        const t = i / glitchSegments;
        const gx = x + t * size;
        const gy = y + (Math.random() - 0.5) * maxGlitch * Math.sin(now / 200 + i);
        if (i === 0) context.moveTo(gx, gy);
        else context.lineTo(gx, gy);
    }
    // Bord droit
    for (let i = 1; i <= glitchSegments; i++) {
        const t = i / glitchSegments;
        const gx = x + size + (Math.random() - 0.5) * maxGlitch * Math.cos(now / 210 + i);
        const gy = y + t * imgHeight;
        context.lineTo(gx, gy);
    }
    // Bord inférieur
    for (let i = 1; i <= glitchSegments; i++) {
        const t = i / glitchSegments;
        const gx = x + size - t * size;
        const gy = y + imgHeight + (Math.random() - 0.5) * maxGlitch * Math.sin(now / 220 + i);
        context.lineTo(gx, gy);
    }
    // Bord gauche
    for (let i = 1; i <= glitchSegments; i++) {
        const t = i / glitchSegments;
        const gx = x + (Math.random() - 0.5) * maxGlitch * Math.cos(now / 230 + i);
        const gy = y + imgHeight - t * imgHeight;
        context.lineTo(gx, gy);
    }
    context.closePath();
    context.stroke();
    context.restore();

    // Lumière scintillante à la limite inférieure
    if (revealHeight < imgHeight) {
        const lightY = y + revealHeight;
        const gradient = context.createLinearGradient(x, lightY - 10, x, lightY + 10);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.5, "rgba(255,255,255,0.7)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.fillRect(x, lightY - 10, size, 20);
    }
}


// Animation principale
function animate(timestamp) {

    const currentTime = timestamp;
    const deltaTime = currentTime - (animate.lastTime || currentTime);
    animate.lastTime = currentTime;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const baseY = h * 0.6;

    const zoomLines = 1 + progressZoom * 5.1; 
    const zoomTriangle1 = 1 + progressZoom * 4.65; 
    const zoomTriangle2 = 1 + progressZoom * 2.15; 

    // Gérer l'animation des triangles
    if (!animationComplete) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // Phase 1 : Traits diagonaux
        if (elapsed < duration) {
            progressLines = elapsed / duration;
        } else {
            progressLines = 1;
        }

        // Phase 2 : Triangle extérieur
        const triangle1Start = duration;
        if (elapsed > triangle1Start && elapsed < triangle1Start + duration) {
            progressTriangle1 = (elapsed - triangle1Start) / duration;
        } else if (elapsed >= triangle1Start + duration) {
            progressTriangle1 = 1;
        }

        // Phase 3 : Triangle intérieur
        const triangle2Start = 2 * duration;
        if (elapsed > triangle2Start && elapsed < triangle2Start + duration) {
            progressTriangle2 = (elapsed - triangle2Start) / duration;
        } else if (elapsed >= triangle2Start + duration) {
            progressTriangle2 = 1;
        }

        // Phase 4 : Effet zoom
        const zoomStart = 3 * duration + 200; 
        if (elapsed > zoomStart) {
            if (!zoomStarted) {
                zoomStarted = true;
            }
            progressZoom = Math.min(1, (elapsed - zoomStart) / zoomDuration);
            progressZoom = easeOutCubic(progressZoom);
        }

        if (progressLines >= 1 && progressTriangle1 >= 1 && progressTriangle2 >= 1 && progressZoom >= 1) {
            animationComplete = true;
        }

        if (animationComplete) {
            // Position et taille du triangle 3
            const triangleSize = 240;
            const triangleCenterX = centerX;
            const triangleCenterY = baseY + 150 * zoomTriangle2; 

            drawRevealingImage(context, triangleCenterX, triangleCenterY, triangleSize, zoomTriangle2);
        }

        
    }

    // Effacer le canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Particules néon en fond
    for (let i = 0; i < neonParticles.length; i++) {
        neonParticles[i].update(deltaTime);
        neonParticles[i].draw(context);
    }

    // Dessiner les triangles néon
    // Phase 1 : Traits diagonaux avec zoom
    if (progressLines > 0) {
        const diagLength = Math.hypot(400 * zoomLines, 600 * zoomLines);
        context.save();
        context.setLineDash([diagLength * progressLines, diagLength]);
        drawNeonLine(
            centerX,
            baseY + 300 * zoomLines,
            centerX - 400 * zoomLines,
            baseY - 300 * zoomLines,
            "#00f0ff",
            4 * zoomLines,
            60 * zoomLines
        );
        drawNeonLine(
            centerX,
            baseY + 300 * zoomLines,
            centerX + 400 * zoomLines,
            baseY - 300 * zoomLines,
            "#00f0ff",
            4 * zoomLines,
            60 * zoomLines
        );
        context.restore();
    }

    // Phase 2 : Triangle extérieur avec zoom
    if (progressTriangle1 > 0) {
        const base = {
            x: centerX,
            y: baseY + 200 * zoomTriangle1
        };
        const left = {
            x: centerX - 200 * zoomTriangle1,
            y: baseY - 200 * zoomTriangle1
        };
        const right = {
            x: centerX + 200 * zoomTriangle1,
            y: baseY - 200 * zoomTriangle1
        };

        context.save();
        context.lineWidth = 5 * zoomTriangle1;
        context.shadowColor = "#F9D700";
        context.shadowBlur = 50 * zoomTriangle1;
        context.strokeStyle = "#F9D700";
        context.lineCap = "round";
        context.lineJoin = "round";

        const phase1End = 0.7;

        if (progressTriangle1 <= phase1End) {
            const sideProgress = progressTriangle1 / phase1End;

            // Tracer base → gauche
            const currentLeftX = base.x + (left.x - base.x) * sideProgress;
            const currentLeftY = base.y + (left.y - base.y) * sideProgress;

            context.beginPath();
            context.moveTo(base.x, base.y);
            context.lineTo(currentLeftX, currentLeftY);
            context.stroke();

            // Tracer base → droite
            const currentRightX = base.x + (right.x - base.x) * sideProgress;
            const currentRightY = base.y + (right.y - base.y) * sideProgress;

            context.beginPath();
            context.moveTo(base.x, base.y);
            context.lineTo(currentRightX, currentRightY);
            context.stroke();
        } else {
            // Côtés complets
            context.beginPath();
            context.moveTo(base.x, base.y);
            context.lineTo(left.x, left.y);
            context.stroke();

            context.beginPath();
            context.moveTo(base.x, base.y);
            context.lineTo(right.x, right.y);
            context.stroke();

            // Animation : base depuis les extrémités vers le centre
            const baseProgress = (progressTriangle1 - phase1End) / (1 - phase1End);
            const baseCenterX = (left.x + right.x) / 2;
            const baseCenterY = (left.y + right.y) / 2;

            context.beginPath();
            context.moveTo(left.x, left.y);
            context.lineTo(
                left.x + (baseCenterX - left.x) * baseProgress,
                left.y + (baseCenterY - left.y) * baseProgress
            );
            context.stroke();

            context.beginPath();
            context.moveTo(right.x, right.y);
            context.lineTo(
                right.x + (baseCenterX - right.x) * baseProgress,
                right.y + (baseCenterY - right.y) * baseProgress
            );
            context.stroke();
        }

        context.restore();
    }

    // Phase 3 : Triangle intérieur avec zoom (rotation 180°)
    if (progressTriangle2 > 0) {
        
        const rotationAngle = progressZoom * Math.PI; 

        // Position de base du triangle
        const baseTrianglePoints = {
            base: {
                x: 0,
                y: 120
            },
            left: {
                x: -120,
                y: -120
            },
            right: {
                x: 120,
                y: -120
            }
        };

        // Calculer le centre géométrique du triangle
        const triangleCenter = {
            x: (baseTrianglePoints.base.x + baseTrianglePoints.left.x + baseTrianglePoints.right.x) / 3,
            y: (baseTrianglePoints.base.y + baseTrianglePoints.left.y + baseTrianglePoints.right.y) / 3
        };

        // Appliquer la rotation autour du centre géométrique
        const rotatePoint = (point) => {
            
            const translatedX = point.x - triangleCenter.x;
            const translatedY = point.y - triangleCenter.y;

            // Appliquer la rotation
            const rotatedX = translatedX * Math.cos(rotationAngle) - translatedY * Math.sin(rotationAngle);
            const rotatedY = translatedX * Math.sin(rotationAngle) + translatedY * Math.cos(rotationAngle);

            // Décalage vertical progressif pour faire redescendre le triangle
            const verticalOffset = 150 * progressZoom; 
            
            return {
                x: centerX + (rotatedX + triangleCenter.x) * zoomTriangle2,
                y: baseY + (rotatedY + triangleCenter.y) * zoomTriangle2 + verticalOffset
            };
        };

        const topBase = rotatePoint(baseTrianglePoints.base);
        const topLeft = rotatePoint(baseTrianglePoints.left);
        const topRight = rotatePoint(baseTrianglePoints.right);

        context.save();
        context.lineWidth = 3 * zoomTriangle2;
        context.shadowColor = "#ff00f7";
        context.shadowBlur = 40 * zoomTriangle2;
        context.strokeStyle = "#ff00f7";
        context.lineCap = "round";
        context.lineJoin = "round";

        const phase1End = 0.7;

        if (progressTriangle2 <= phase1End) {
            const baseProgress = progressTriangle2 / phase1End;
            const centerTopX = (topLeft.x + topRight.x) / 2;
            const centerTopY = (topLeft.y + topRight.y) / 2;

            context.beginPath();
            context.moveTo(centerTopX, centerTopY);
            context.lineTo(
                centerTopX + (topLeft.x - centerTopX) * baseProgress,
                centerTopY + (topLeft.y - centerTopY) * baseProgress
            );
            context.stroke();

            context.beginPath();
            context.moveTo(centerTopX, centerTopY);
            context.lineTo(
                centerTopX + (topRight.x - centerTopX) * baseProgress,
                centerTopY + (topRight.y - centerTopY) * baseProgress
            );
            context.stroke();
        } else {
            context.beginPath();
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(topRight.x, topRight.y);
            context.stroke();

            const sideProgress = (progressTriangle2 - phase1End) / (1 - phase1End);
            const currentLeftX = topLeft.x + (topBase.x - topLeft.x) * sideProgress;
            const currentLeftY = topLeft.y + (topBase.y - topLeft.y) * sideProgress;
            const currentRightX = topRight.x + (topBase.x - topRight.x) * sideProgress;
            const currentRightY = topRight.y + (topBase.y - topRight.y) * sideProgress;

            context.beginPath();
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(currentLeftX, currentLeftY);
            context.stroke();

            context.beginPath();
            context.moveTo(topRight.x, topRight.y);
            context.lineTo(currentRightX, currentRightY);
            context.stroke();
        }
        context.restore();
    }

    // Mettre à jour et dessiner les particules de brume
    mistParticles = mistParticles.filter(particle => {
        const isAlive = particle.update(deltaTime);
        if (isAlive) {
            particle.draw();
        }
        return isAlive;
    });

    // Dessiner l'image même après que l'animation soit complète
    if (animationComplete) {
        // Ajustement de la taille et de la position de l'image révélée
        const triangleSize = 80;
        const triangleCenterX = centerX;
        const triangleCenterY = baseY + -10 * zoomTriangle2; 
        drawRevealingImage(context, triangleCenterX, triangleCenterY, triangleSize, zoomTriangle2);
    }

    requestAnimationFrame(animate);
}

// Gestion des événements de souris
canvas.addEventListener("mousemove", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if (draw && mistMode) {
        createMistBetweenPoints(lastMouseX, lastMouseY, x, y);
    }

    lastMouseX = x;
    lastMouseY = y;
});

canvas.addEventListener("mousedown", (event) => {
    if (mistMode) {
        draw = true;
        const x = event.offsetX;
        const y = event.offsetY;
        lastMouseX = x;
        lastMouseY = y;
        createMistEffect(x, y);
    }
});

canvas.addEventListener("mouseup", () => {
    draw = false;
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

// Gestion des boutons
document.getElementById('restartBtn').addEventListener('click', () => {
    progressLines = 0;
    progressTriangle1 = 0;
    progressTriangle2 = 0;
    progressZoom = 0;
    startTime = null;
    animationComplete = false;
    zoomStarted = false;
    revealHeight = 0;
});

// Redimensionner le canvas quand la fenêtre change de taille
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Réadapter les particules néon à la nouvelle taille
    neonParticles.forEach(p => {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
    });
});

// Démarrer l'animation
requestAnimationFrame(animate);
