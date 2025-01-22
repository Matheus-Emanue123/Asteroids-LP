// title:   Asteroids
// author:  Anderson Rodrigues, Arthur Santana de Mesquisa, João Francisco Teles da SIlva, Matheus Emanuel da Silva, Rafael Adolfo Silva Ferreira
// desc:    Asteroids clone for the TIC-80 fantasy console
// site:    https://github.com/Matheus-Emanue123/Asteroids-LP
// license: MIT License (change this to your license of choice)
// version: 0.6
// script:  js

const MENU = 0;
const GAME = 1;
const GAME_OVER = 2;
const LOADING = -1; 

let gameState = LOADING;  
let loadingTimer = 0;
const LOADING_DURATION = 120;

const COLORS = [2, 4, 6, 10, 12];

const SCREEN_WIDTH = 240;
const SCREEN_HEIGHT = 136;

let shakeTimer = 0;
let shakeMagnitude = 2;
let fadeTimer = 0;
const fadeDuration = 30;

let offsetX = 0;
let offsetY = 0;

let menuFrameCounter = 0;

let ship = {
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2,
    angle: 0,
    speed: 0,
    lives: 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    invincibleTimer: 0  
};

let bullets = [];
let asteroids = [];
let score = 0;

let asteroidSpawnTimer = 0;
const ASTEROID_SPAWN_INTERVAL = 180;

let stars = [];
let particles = [];

function initStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * SCREEN_WIDTH,
            y: Math.random() * SCREEN_HEIGHT,
            brightness: Math.random(),
        });
    }
}

function updateStars() {
    for (let s of stars) {
        s.y += 0.2; 
        if (s.y > SCREEN_HEIGHT) {
            s.y = 0;
            s.x = Math.random() * SCREEN_WIDTH;
        }
    }
}

function drawStars() {
    for (let s of stars) {
        let color = s.brightness > 0.5 ? 15 : 7;
        pix(s.x + offsetX, s.y + offsetY, color);
    }
}

function drawLoading() {
    cls(0);

    if (stars.length === 0) {
        initStars(50);
    }
    updateStars();
    drawStars();

    loadingTimer++;
    let progress = loadingTimer / LOADING_DURATION;
    if (progress > 1) progress = 1;

    let startX = 0;
    let endX = SCREEN_WIDTH;
    ship.x = startX + (endX - startX) * progress;
    ship.y = SCREEN_HEIGHT / 2;  
    ship.angle = 0;             
    ship.speed = 0;             

    let trackHeight = 4;
    let trackY = ship.y - trackHeight / 2;  
    rect(0, trackY, ship.x - 4, trackHeight, ship.color);

    drawShip();

    print("LOADING...", 100, 100, ship.color);

    if (loadingTimer > LOADING_DURATION) {
        gameState = MENU;
        loadingTimer = 0;
    }
}

function updateParticles() {
    for (let p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    for (let p of particles) {
        pix(p.x + offsetX, p.y + offsetY, p.color);
    }
}

function spawnThrustParticle() {
    particles.push({
        x: ship.x - Math.cos(ship.angle) * 6 + (Math.random() - 0.5) * 2,
        y: ship.y - Math.sin(ship.angle) * 6 + (Math.random() - 0.5) * 2,
        dx: (Math.random() - 0.5) * 1,
        dy: (Math.random() - 0.5) * 1,
        life: 20,
        color: 8
    });
}

function spawnExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 3,
            dy: (Math.random() - 0.5) * 3,
            life: 30,
            color: color
        });
    }
    triggerScreenShake(3, 2);
}

function triggerScreenShake(duration, magnitude) {
    shakeTimer = duration;
    shakeMagnitude = magnitude;
}



function initAsteroids(count = 5) {
    for (let i = 0; i < count; i++) {
        spawnAsteroid();
    }
}

function spawnAsteroid(x, y, size) {
    size = size || 3;
    let spawnX, spawnY;
    const SHIP_SAFE_RADIUS = 60;

    do {
        spawnX = (x !== undefined) ? x : Math.random() * SCREEN_WIDTH;
        spawnY = (y !== undefined) ? y : Math.random() * SCREEN_HEIGHT;
    } while (distance(spawnX, spawnY, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2) < SHIP_SAFE_RADIUS);

    let newAsteroid = {
        x: spawnX,
        y: spawnY,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5,
        size: size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vertices: calculateVertices(size),
    };

    asteroids.push(newAsteroid);
}

function calculateVertices(size) {
    const VERTICE_NUMBER = 12;
    let angle = (2 * Math.PI) / VERTICE_NUMBER;
    let vertices = [];
    for (var i = 0; i < VERTICE_NUMBER; i++) {
        var variation = Math.random() * size * 1.5;
        var r = (size * 5) - variation;
        var vx = r * Math.cos(i * angle);
        var vy = r * Math.sin(i * angle);
        vertices.push({ x: vx, y: vy });
    }
    return vertices;
}

function distance(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateShip() {
    if (btn(2)) {
        ship.angle -= 0.1;
    }
    if (btn(3)) {
        ship.angle += 0.1;
    }
    if (btn(0)) {
        ship.speed += 0.1;
        spawnThrustParticle();
    } else {
        ship.speed *= 0.98;
    }
    if (ship.speed > 3) ship.speed = 3;
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    if (ship.x < 0) ship.x = SCREEN_WIDTH;
    if (ship.x > SCREEN_WIDTH) ship.x = 0;
    if (ship.y < 0) ship.y = SCREEN_HEIGHT;
    if (ship.y > SCREEN_HEIGHT) ship.y = 0;
    if (btnp(4)) {
        shoot();
    }
}

function shoot() {
    sfx(0, 24, 8, 0, 15, 1);
    bullets.push({
        x: ship.x,
        y: ship.y,
        dx: Math.cos(ship.angle) * 5,
        dy: Math.sin(ship.angle) * 5,
        life: 60
    });
}

function updateBullets() {
    for (let b of bullets) {
        b.x += b.dx;
        b.y += b.dy;
        b.life--;
        if (b.x < 0) b.x = SCREEN_WIDTH;
        if (b.x > SCREEN_WIDTH) b.x = 0;
        if (b.y < 0) b.y = SCREEN_HEIGHT;
        if (b.y > SCREEN_HEIGHT) b.y = 0;
    }
    bullets = bullets.filter(b => b.life > 0);
}

function drawBullets() {
    for (let b of bullets) {
        pix(b.x + offsetX, b.y + offsetY, COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
}

function updateAsteroids() {
    for (let i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        a.x += a.dx;
        a.y += a.dy;
        if (a.x < 0) a.x = SCREEN_WIDTH;
        if (a.x > SCREEN_WIDTH) a.x = 0;
        if (a.y < 0) a.y = SCREEN_HEIGHT;
        if (a.y > SCREEN_HEIGHT) a.y = 0;
    }
}

function drawAsteroids() {
    for (let a of asteroids) {
        for (var i = 0; i < 12; i++) {
            var next = (i + 1) % 12;
            line(
              a.vertices[i].x + a.x + offsetX,
              a.vertices[i].y + a.y + offsetY,
              a.vertices[next].x + a.x + offsetX,
              a.vertices[next].y + a.y + offsetY,
              a.color
            );
        }
    }
}

function splitAsteroid(index) {
    let parent = asteroids[index];
    let newSize = parent.size - 1;
    spawnExplosion(parent.x, parent.y, parent.color);
    if (newSize > 0) {
        for (let i = 0; i < 2; i++) {
            asteroids.push({
                x: parent.x,
                y: parent.y,
                dx: (Math.random() - 0.5) * 1.5,
                dy: (Math.random() - 0.5) * 1.5,
                size: newSize,
                vertices: calculateVertices(newSize),
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    }
    asteroids.splice(index, 1);
}

function checkBulletAsteroidCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        let radius = a.size * 5;
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (distance(a.x, a.y, b.x, b.y) < radius) {
                sfx(1, 32, 8, 0, 15, 2);
                score += (4 - a.size) * 50;
                splitAsteroid(i);
                bullets.splice(j, 1);
                break;
            }
        }
    }
}

function checkShipAsteroidCollisions() {
    if (ship.invincibleTimer > 0) return;

    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        let radius = a.size * 5;
        if (distance(ship.x, ship.y, a.x, a.y) < (radius + 5)) {
            sfx(2, 40, 8, 0, 15, 3);
            ship.lives--;
            triggerScreenShake(15, 3);
            splitAsteroid(i);
            ship.invincibleTimer = 180; // Set invincibility for ~3 seconds (180 frames at 60fps)
            break;
        }
    }
}

function resetShip() {
    ship.x = SCREEN_WIDTH / 2;
    ship.y = SCREEN_HEIGHT / 2;
    ship.angle = 0;
    ship.speed = 0;
    ship.color = COLORS[Math.floor(Math.random() * COLORS.length)];
}

function checkGameOver() {
    if (ship.lives <= 0) {
        gameState = GAME_OVER;
        fadeTimer = 0;
    }
}

function drawHUD() {
    print("SCORE: " + score, 5, 5, 12);
    print("LIVES: " + ship.lives, 5, 15, 12);
}

function drawGradientText(text, x, y, baseIndex, palette = COLORS) {
    for (let i = 0; i < text.length; i++) {
        let color = palette[(baseIndex + i) % palette.length];
        print(text[i], x + i * 6, y, color);
    }
}

function drawShip() {
    if (ship.invincibleTimer > 0) {
       
        if (Math.floor(ship.invincibleTimer / 5) % 2 === 0) {
            return; 
        }
    }

    let size = 6;
    let x1 = ship.x + Math.cos(ship.angle) * size;
    let y1 = ship.y + Math.sin(ship.angle) * size;
    let x2 = ship.x + Math.cos(ship.angle + 2.5) * size;
    let y2 = ship.y + Math.sin(ship.angle + 2.5) * size;
    let x3 = ship.x + Math.cos(ship.angle - 2.5) * size;
    let y3 = ship.y + Math.sin(ship.angle - 2.5) * size;
    line(x1 + offsetX, y1 + offsetY, x2 + offsetX, y2 + offsetY, ship.color);
    line(x2 + offsetX, y2 + offsetY, x3 + offsetX, y3 + offsetY, ship.color);
    line(x3 + offsetX, y3 + offsetY, x1 + offsetX, y1 + offsetY, ship.color);
}

function drawMenu() {
    cls(0);
   

    
    if (btnp(4)) {
        startGame();
        return;
    }

    
    if (stars.length === 0) {
        initStars(50);
    }

   
    updateStars();
    updateShip();    
    
    
    drawStars();
    drawShip();

    
    menuFrameCounter += 0.1;
    
   
    let title = "ASTEROIDS";
    let titleWidth = title.length * 6;
    let titleX = (SCREEN_WIDTH - titleWidth) / 2;
    drawGradientText(title, titleX, 50, Math.floor(menuFrameCounter));

    
    let startMsg = "PRESSIONE Z PARA INICIAR";
    let startWidth = startMsg.length * 6;
    let startX = (SCREEN_WIDTH - startWidth) / 2;
    print(startMsg, startX, 70, 12);

    
    let moveMsg = "SETAS PARA MOVER";
    let moveWidth = moveMsg.length * 6;
    let moveX = (SCREEN_WIDTH - moveWidth) / 2;
    print(moveMsg, moveX, 90, 12);
 
}

function drawGameOver() {
    cls(0);
 
    menuFrameCounter += 0.1;
    
    
    const DEAD_COLORS = [1, 2, 3]; 
    let gameover = "GAMEOVER";
    let gameoverWidth = gameover.length * 6;
    let gameoverX = (SCREEN_WIDTH - gameoverWidth) / 2;
    drawGradientText(gameover, gameoverX, 50, Math.floor(menuFrameCounter), DEAD_COLORS);

   
    let scoreMsg = ("SCORE FINAL: " + score);
    let scoreWidth = scoreMsg.length * 6;
    let scoreX = (SCREEN_WIDTH - scoreWidth) / 2;
    print(scoreMsg, scoreX, 70, 12);

    let endMsg = ("PRESSIONE Z PARA VOLTAR AO MENU");
    let endWidth = endMsg.length * 6;
    let endX = (SCREEN_WIDTH - endWidth) / 2;
    print(endMsg, endX, 90, 12);

    if (btnp(4)) {
        gameState = MENU;
        fadeTimer = 0;
    }
}

function startGame() {
    gameState = GAME;
    fadeTimer = fadeDuration;
    score = 0;
    ship.lives = 3;
    resetShip();
    asteroids = [];
    bullets = [];
    particles = [];
    ship.invincibleTimer = 0;
    initStars(50);
    initAsteroids(5);
}
music(0,0,0,1)
function TIC() {
				 
				
       // music(3, 11, 3, 1);
    
    if (gameState === LOADING) {
        drawLoading();
        return;
    }

    if (gameState === MENU) {
        drawMenu();
        return;
    }
    if (gameState === GAME_OVER) {
        drawGameOver();
        return;
    }
    
    
    if (ship.invincibleTimer > 0) {
        ship.invincibleTimer--;
    }

    cls(0);
    
    if (shakeTimer > 0) {
        offsetX = Math.random() * shakeMagnitude - shakeMagnitude / 2;
        offsetY = Math.random() * shakeMagnitude - shakeMagnitude / 2;
        shakeTimer--;
    } else {
        offsetX = 0;
        offsetY = 0;
    }
    
    drawStars();
    updateParticles();
    updateShip();
    updateBullets();
    updateAsteroids();
    checkBulletAsteroidCollisions();
    checkShipAsteroidCollisions();
    checkGameOver();
    
    asteroidSpawnTimer++;
    if (asteroidSpawnTimer > ASTEROID_SPAWN_INTERVAL) {
        spawnAsteroid();
        asteroidSpawnTimer = 0;
    }
    
    drawShip();
    drawBullets();
    drawAsteroids();
    drawHUD();
    drawParticles();
}
