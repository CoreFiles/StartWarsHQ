/**
 * stars.js - Efeito Hiperespaço (Star Wars) - VERSÃO OTIMIZADA
 * Focado em performance para dispositivos mais simples.
 */

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d', { alpha: false }); // Otimização: Desabilita transparência do canvas global

let width, height, centerX, centerY;
let stars = [];
const STAR_COUNT = 50; // Reduzido drasticamente para poupar CPU/GPU
let speed = 15;

// Fator de escala: O segredo para performance. 
// O canvas desenha em 50% da resolução e o CSS estica.
const RESOLUTION_SCALE = 0.4;

function initCanvas() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    width = Math.floor(displayWidth * RESOLUTION_SCALE);
    height = Math.floor(displayHeight * RESOLUTION_SCALE);

    canvas.width = width;
    canvas.height = height;

    // CSS faz o upscale suave
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    centerX = width / 2;
    centerY = height / 2;
}

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = (Math.random() - 0.5) * 1500;
        this.y = (Math.random() - 0.5) * 1500;
        this.z = Math.random() * 1500;
        this.pz = this.z;
        this.color = '#ffffff';
    }

    update() {
        this.pz = this.z;
        this.z -= speed;

        if (this.z < 1) {
            this.z = 1500;
            this.pz = this.z;
            this.x = (Math.random() - 0.5) * 1500;
            this.y = (Math.random() - 0.5) * 1500;
        }
    }

    draw() {
        const sx = (this.x / this.z) * (width / 2) + centerX;
        const sy = (this.y / this.z) * (height / 2) + centerY;
        const px = (this.x / this.pz) * (width / 2) + centerX;
        const py = (this.y / this.pz) * (height / 2) + centerY;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
    }
}

function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }
}

function animate() {
    // Pintamos o fundo com um alpha baixo para criar o rastro (motion blur)
    // Isso é muito mais leve do que desenhar centenas de gradientes
    ctx.fillStyle = 'rgba(5, 5, 8, 0.4)';
    ctx.fillRect(0, 0, width, height);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', initCanvas);

initCanvas();
createStars();
animate();
