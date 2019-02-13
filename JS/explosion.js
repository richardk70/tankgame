// EXPLOSION ////////////////////////////////////////////////////////////
let parts = [];
const LIMIT = 50;
const UP = 15;
const SPREAD = 6;
const GRAV = .5;
const LIFE = 140;
const SHRINK = .04;
const FADE = .01;

function Part(x,y, speedX, speedY, life, size) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.dx = speedX;
    this.dy = speedY;
    // this.radian = radian;
    this.life = life;
    this.opacity = 1.0;
    this.width = size;
    this.height = size;

    this.update = function() {            
        // this.dx = Math.cos(this.radian) * this.speedX;
        // this.dy += Math.sin(this.radian) * this.speedY + GRAV;
        this.dy += GRAV;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
        // if (this.speed > 0)
        //     this.speed -= 0.1;
        // else
        //     this.speed = 0;
        // if (this.dy < 0)
        //     this.speed += 0.1;
        
    };
    this.draw = function() {
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fill();
        // ctx.fillText(this.degree, this.x - 10, this.y - 5)
        ctx.closePath();
    };          
} 

function createParticle(x,y, size) {
    // vary angle with direction
    // let radian = Math.random() * 2 + 3.8; // up
    let speedX = Math.random() * SPREAD - (SPREAD/2);
    // let speedY = Math.random() * -up.value - (up.value/5);
    let speedY = gaussianRandom(-.1, -UP);
    let life = Math.round(Math.random() * LIFE);

    parts.push(new Part(x, y, speedX, speedY, life, size));
}

function gaussianRandom(start, end) {
    return Math.floor(start + gaussianRand() * (end - start + 1));
}

function gaussianRand() {
var rand = 0;
for (var i = 0; i < 8; i += 1) {
rand += Math.random();
}
return rand / 8;
}

var blasts = [];

function Blast(x,y) {
    this.x = x;
    this.y = y;

    this.draw = function() {
        ctx.beginPath();
        ctx.fillStyle = '#493d26';
        ctx.arc(this.x, this.y, 20, 0, Math.PI*180);
        ctx.fill();
        ctx.closePath();
    }
}

function smExplode(x, y, size) {
    blasts.push(new Blast(x,y));
    parts = [];
    for (var i = 0; i < LIMIT-10; i++)
        createParticle(x,y, size);
}