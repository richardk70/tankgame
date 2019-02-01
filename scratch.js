// create the canvas
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// GLOBALS
const WIDTH = 900;
const HEIGHT = 600;
const TOPTURN = .035;
const TURN = 0.017453;
const SHOTSPD = 8;
const TREADSPD = 5;
var NUMENEMIES = 2;

var left = false; 
var right = false;
var forward = false;
var reverse = false;
let paused = false;
let mg = false;
let mainGun = false;
let reloading = false;
var dirRow = 0;
var dirCol = 0;

var diffX = 0;
var diffY = 0;

const Img = {};
Img.player =  new Image();
Img.player.src = 'images/base_tiles64.png';
Img.flash = new Image();
Img.flash.src = 'images/flash.png';
Img.shot = new Image();
Img.shot.src = 'images/shot.png';
Img.tread = new Image();
Img.tread.src = 'images/treads.png';
Img.enemy = new Image();
Img.enemy.src = 'images/enemy_tiles32.png';
Img.turret = new Image();
Img.turret.src = 'images/turret_tiles.png';
Img.powerup = {};
Img.powerup.speed = new Image();
Img.powerup.speed.src = 'images/powerup-speed.png';
Img.powerup.ammo = new Image();
Img.powerup.ammo.src = 'images/powerup-ammo.png';
Img.powerup.health = new Image();
Img.powerup.health.src = 'images/powerup-health.png';
Img.powerup.armor = new Image();
Img.powerup.armor.src = 'images/powerup-armor.png';

// feedback
const fb1 = document.getElementById('fb1');
const fb2 = document.getElementById('fb2');
const fb3 = document.getElementById('fb3');
const fb4 = document.getElementById('fb4');

// mouse position
document.onmousemove = (e) => {
    var mouseX = e.clientX - canvas.getBoundingClientRect().left;
    var mouseY  = e.clientY - canvas.getBoundingClientRect().top;

    mouseX = mouseX - player.x - player.width/2;
    mouseY = mouseY - player.y - player.height/2;


    // Math.atan2(mouseY, mouseX) + Math.PI; // as a radian
    player.aimAngle = Math.atan2(mouseY, mouseX) / Math.PI * 180;
}

// MAIN GUN ATTACK /////
document.addEventListener('click', (e) => {
    if (reloading == false && player.ammo > 0) {
        mainGun = true;
        player.fire();
    }
});

// KEYBOARD INPUT ////////////////////////////////////////////////
document.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
        case 37: left = true;
        break;
        case 39: right = true;
        break;
        case 38: forward = true;
        break;
        case 40: reverse = true;
        break;
        case 17: if (player.turbo > 0) {
            player.turbo -= 1;
            TOPSPEED = 1.75;
             setTimeout(() => {
                 TOPSPEED = 1;
             }, 1500);;
        }
        else
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.keyCode) {
        case 37: left = false;
        break;
        case 39: right = false;
        break;
        case 38: forward = false;
        break;
        case 40: reverse = false;
        break;
    }
});

// POWERUPS ///////////////////////////////////////////////////
var powerups = [];
const POWERLIMIT = 4;

function Powerup(type, x, y, numFrames, img) {
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.x = x;
    this.y = y;
    this.frameIndex = 0;
    this.ticksPerFrame = 7;
    this.numFrames = numFrames;
    this.img = img;

    this.update = () => {
        if (frameCount % 8 >= this.ticksPerFrame) {
            if (this.frameIndex == 0 && this.frameIndex < this.numFrames - 1)
                setTimeout(() => {
                    this.frameIndex += 1;
                }, 1000);

            else if (this.frameIndex < this.numFrames - 1) {
                this.frameIndex += 1;
            } else {
                this.frameIndex = 0;
            }
        }
    }

    this.draw = () => {
        // ctx.save();        
        let frameWidth = this.img.width / this.numFrames;
        ctx.drawImage(this.img,
            this.frameIndex * frameWidth, 0,
            frameWidth, 64,
            this.x, this.y,
            this.width, this.height
            );
    }
}

// create the powerup object
var createPowerUp = (powerObj) => {
    let ranCol = getRandom(1, cols - 1);
    let ranRow = getRandom(1, rows - 1);
    if (grid[ranCol][ranRow] == 0) {
        grid[ranCol][ranRow] = 2;
        powerups.push(new Powerup(powerObj.type, ranCol * CELL, ranRow * CELL, powerObj.numFrames, powerObj.img));
    } else {
        createPowerUp(powerObj);        
    }
}

// speed
var createSpeed = () => {
    let powerObj = {type: 'speed'};
    powerObj.numFrames = 8;
    powerObj.img = Img.powerup.speed;
    createPowerUp(powerObj);
}

// health
var createHealth = () => {
    let powerObj = {type: 'health'};
    powerObj.numFrames = 8;
    powerObj.img = Img.powerup.health;
    createPowerUp(powerObj);
}
// armor
var createArmor = () => {
    let powerObj = {type: 'armor'};
    powerObj.numFrames = 8;
    powerObj.img = Img.powerup.armor;
    createPowerUp(powerObj);
}
// ammo
var createAmmo = () => {
    let powerObj = {type: 'ammo'};
    powerObj.numFrames = 1;
    powerObj.img = Img.powerup.ammo;
    createPowerUp(powerObj);
}

// ENEMY TANKS ///////////////////////
var enemies = [];
function Enemy(x, y, dx, dy, attackCounter) {
    this.type = 'enemy';
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.angle = 0;
    this.rad = 0;
    this.frame = 0;
    this.width = 30;
    this.height = 30;
    this.age = 0;
    this.attackCounter = attackCounter;
    this.img = Img.enemy;
    this.aimAngle = 0;
    this.armor = 1;
    this.fp = 1;
    this.hp = 10;
    this.speed = 0.5;
    this.stuck = 0;
    this.prevX = 0;
    this.prevY = 0;

    this.fire = function() {
        x = this.x + this.width/2;
        y = this.y + this.height/2;
        rad = this.aimAngle/180 * Math.PI;
        dx = Math.cos(rad) * 9;
        dy = Math.sin(rad) * 9;
        shots.push(new Shot(x, y, dx, dy));
        setTimeout(() => {
            reloading = false;
        }, 1000);
    }

    this.update = () => {
        // get angle to player tank
        let mouseX = (player.x + player.width/2) - canvas.getBoundingClientRect().left;
        let mouseY  = (player.y + player.height/2) - canvas.getBoundingClientRect().top;
    
        mouseX = mouseX - this.x - this.width/2;
        mouseY = mouseY - this.y - this.height/2;

        this.aimAngle = Math.round(Math.atan2(mouseY, mouseX) / Math.PI * 180);
        
        // angle of tank
        this.angle = this.aimAngle + 180; // 360 degree
        this.rad = this.angle * (Math.PI / 180);
        this.dx = this.speed * Math.cos(this.rad) * -1;
        this.dy = this.speed * Math.sin(this.rad) * -1;
        
        this.x += this.dx;
        this.y += this.dy;

        if (this.stuck == 1) {
            this.addStuck();
            
        }
        
        this.wrap();
        this.draw();
    }

    this.addStuck = function() {
            // add a little box above the tank saying STUCK
            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.fillText('STUCK', this.x - this.width/4, this.y - this.height/4);
            ctx.closePath();
    }

    this.draw = function() {
        let a = Math.round(this.angle/11.25);
        let row = 0
        let col = a % 8;

        if (a >= 0 && a <= 7)
            row = 2; 
        if (a >= 8 && a <= 15)
            row = 3; 
        if (a >= 16 && a <= 23) 
            row = 0;
        if (a >= 24 && a <= 31)
            row = 1;
        if (a == 32) {
            row = 2; col = 0;
        }

        let frameWidth = this.img.width/8;
        let frameHeight = this.img.height/4;

        // ctx.save();
        ctx.drawImage(this.img,
            frameWidth * col, frameHeight * row,
            64,64,
            this.x,this.y,
            this.width, this.height
            );
    }
    
    this.wrap = function() {
        if (this.x < 0)
        this.x = 0;
        if (this.x > WIDTH - this.width)
        this.x = WIDTH - this.width;
        if (this.y < 0)
        this.y = 0;
        if (this.y > HEIGHT - this.height)
        this.y = HEIGHT - this.height;
    }
}

var createEnemy = (x,y) => {
    dx = 0; dy = 0;
    attackCounter = 25 + Math.round(Math.random() * 350);
    enemies.push(new Enemy(x, y, dx, dy, attackCounter));
}

// FLAME ////////////////////////////
var flash = new Flash();

function Flash(x,y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.img = Img.flash;
    this.spriteAnimCount = 0;
    this.width = 48;
    this.height = 48;

    this.update = function() {
        this.x = player.x + player.width/4;
        this.y = player.y + player.height/4;

        this.spriteAnimCount += .5;
    }

    this.draw = function() {
        var frameMod = Math.floor(this.spriteAnimCount % 8);
        let row = 0;
        let frameWidth = this.img.width/8;
        let frameHeight = this.img.height/8;


        // ctx.save();
        ctx.drawImage(this.img, 
            frameMod * frameWidth, row * frameHeight,
            frameWidth, frameHeight,
            this.x, this.y,
            this.width, this.height
            );

        setTimeout(() => {
            mainGun = false;
           this.spriteAnimCount = 0;
        }, 240);
    }
};

var createFlash = () => {
    flash.x = player.x + (20 * Math.cos(player.radian));
    flash.y = player.y + (20 * Math.sin(player.radian));
    flash.angle = player.aimAngle/180 * Math.PI;
};


// SHOTS ////////////////////////////
var shots = [];

function Shot(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = 4;
    this.height = 4;
    this.age = 0;
    this.type = 'shot';
    this.img = Img.shot;

    this.update = function() {
        this.age ++;
        this.x += this.dx;
        this.y += this.dy;
        this.edge();
        this.draw();
    };

    this.draw = function() {
        // ctx.save();
        ctx.drawImage(this.img,
            this.x, this.y,
            this.width, this.height);
    };

    this.edge = function() {
        if (this.x > WIDTH || this.x < 0 || this.y > HEIGHT || this.y < 0)
            shots.shift(this);
    }
}

var createShot = (actor) => {
        x = actor.x + actor.width/2;
        y = actor.y + actor.height/2;
        rad = actor.aimAngle/180 * Math.PI;
        dx = Math.cos(rad) * SHOTSPD;
        dy = Math.sin(rad) * SHOTSPD;
        shots.push(new Shot(x, y, dx, dy));
        setTimeout(() => {
            reloading = false;
        }, 1000);
}

// PLAYER /////////////////////////////////////////////////////////////
var TOPSPEED = 1.0;

var player = {
    type: 'player',
    x: 50,
    y: HEIGHT/2,
    dx: 0, 
    dy: 0,
    angle: 0,
    radian: 0,
    turnSpeed: 0,
    width: 30,
    height: 30,
    speed: 1,
    speedBonus: 1,
    turbo: 1,
    ammo: 10,
    hp: 10,
    armor: 1,
    aimAngle: 0,
    pressLeft: false,
    pressRight: false,
    pressUp: false,
    pressDown: false,
    img: Img.player,
    frame: 0,
    // methods
    draw: function() {
        let row = Math.floor(player.frame / 16);
        let col = player.frame % 16;
        // ctx.save();
        ctx.drawImage(this.img,
            col * 64, row * 64,
            64, 64,
            this.x, this.y, 
            this.width, this.height);
        // ctx.restore();
        // box around the tank
        // ctx.beginPath();
        // ctx.strokeStyle = 'red';
        // ctx.rect(this.x, this.y, this.width, this.height);
        // ctx.stroke();
        // ctx.closePath();
    },
    update: function() {
        var c = Math.cos(this.radian) * TOPSPEED;
        var s = Math.sin(this.radian) * TOPSPEED;

    if (left) {
        if (this.turnSpeed > -TOPTURN)
            this.turnSpeed -= TURN;
        if (this.turnSpeed > 0)
            this.turnSpeed = 0;
    }
    if (right) {
        if (this.turnSpeed < TOPTURN)
            this.turnSpeed += TURN;
        if (this.turnSpeed < 0)
            this.turnSpeed = 0;
    }

    if (!left && !right) {
        this.turnSpeed = 0;
    }

    if (this.radian < 0)
        this.radian = 2 * Math.PI;
    if (this.radian > 2 * Math.PI)
        this.radian = 0;

    this.radian = this.radian + this.turnSpeed;    
 
    player.angle = Math.round(player.radian * (180 /  Math.PI));

    player.frame = Math.round(player.angle / 5.625);
    if (player.frame == 64)
        player.frame = 0;
    
    if (forward) {
        let lastDX = player.dx;
        let lastDY = player.dy;
        this.dx = c;
        this.dy = s;
        // acceleration
        let spawnDust = Math.round(Math.random() * 3);

        if (spawnDust < 3) {
            createDustLeft();
            createDustRight();
        }
    }

    if (reverse){
        this.dx = -c;
        this.dy = -s;
    }

    if (!forward && !reverse) {
        this.dx = 0;
        this.dy = 0;
    }
    
    // x,y
    this.x += this.dx;
    this.y += this.dy;

    if ((forward || reverse || left || right) && (frameCount % TREADSPD == 0))
        createTread(player);

    this.edge();
    this.draw();
        
    },
    fire: function() {
        this.ammo -= 1;
        reloading = true;
        // get mouse position
        // fire toward mouse position
        createFlash();
        createShot(player);
    },
    edge: function() {
    if (this.x < 0)
        this.x = 0;
    if (this.x > WIDTH - this.width)
        this.x = WIDTH - this.width;
    if (this.y < 0)
        this.y = 0;
    if (this.y > HEIGHT - this.height)
        this.y = HEIGHT - this.height;
    },
    drawLaser: function(enemy) {
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
        ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.width/2);
        ctx.stroke();
        // ctx.closePath();
    }
}

// EXPLOSION /////////////////////////
let parts = [];
const LIMIT = 40;

function Part(x, y, life, radian){
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.speed = 0;
    this.radian = radian;
    this.life = life;
    this.opacity = 1.0;
    this.size = Math.floor(Math.random() * 3);

    this.update = function() {
        this.opacity -= 0.03;
        this.life--;
        // speed check based on size
        if (this.size > 2) {
            this.speed = 2;
        } else {
            this.speed = 4;
        }
        //edge check
        if (this.x > WIDTH || this.x < 0 || this.y > HEIGHT || this.y < 0)
            delete this;
        // age check
        if (this.life <= 0)
            delete this;
        else {
            // move out in random directions at random speeds
            this.dx = Math.cos(this.radian) * this.speed;
            this.dy = Math.sin(this.radian) * this.speed;
            this.x += this.dx;
            this.y += this.dy;
        }
    };

    this.draw = function() {
        ctx.fillStyle = 'yellow';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
        ctx.fill();
        ctx.closePath();
    };
} 

function createParticle(x,y) {
    // vary angle with direction
    // let radian = Math.random() * 2 + 3.8; // up
    let radian = Math.random() + turret.radian; 
    // var life of particles
    let life = Math.random() * 20;
    parts.push(new Part(x, y, life, radian));
}

function smExplode(x, y) {
    parts = [];
    for (var i = 0; i < LIMIT; i++)
        createParticle(x,y);
}

// TURRET ////////////////////////////
var turret = {
    x: player.x + player.width/2,
    y: player.y + player.height/2,
    angle: 0,
    radian: 0,
    img: Img.turret,

    update : function() {
        this.x = player.x;
        this.y = player.y;
        this.draw();
        this.angle = Math.round(player.aimAngle + 180); // 360
        this.radian = (this.angle - 180) * (Math.PI / 180);
    },

    draw : function() {
        let a = Math.round(this.angle/11.25);
        let row = 0;
        let col = a % 8;

        if (a >= 0 && a <= 7)
            row = 2; 
        if (a >= 8 && a <= 15)
            row = 3; 
        if (a >= 16 && a <= 23) 
            row = 0;
        if (a >= 24 && a <= 31)
            row = 1;
        if (a == 32) {
            row = 2; col = 0;
        }

        let frameWidth = this.img.width/8;
        let frameHeight = this.img.height/4;

        // ctx.save();
        ctx.drawImage(this.img,
            frameWidth * col, frameHeight * row,
            64,64,
            this.x,this.y,
            30,30
            );
        // ctx.restore();
    }
}

// EMITTERS ////////////////////////////
function Emitter(points) {
    this.x = 0;
    this.y = 0;
    this.points = points;

    this.draw = function() {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.rect(this.x, this.y, 2,2);
        ctx.fill();
        ctx.closePath();
    };
    this.update = function() {
        let c = Math.cos(player.turnSpeed);
        let s = Math.sin(player.turnSpeed);

        let x = this.points[0];
        let y = this.points[1];

        this.points[0] = x*c - s*y;
        this.points[1] = x*s + y*c;
    
        // x,y
        this.x = (player.x + player.width/2) + this.points[0];
        this.y = (player.y + player.height/2) + this.points[1];

        // this.draw();
    }
};

const emitLeft = new Emitter([-10, -7]);
const emitRight = new Emitter([-10, 7]);

// DUST ////////////////////////////////////////////////////////////
var dusts = [];

function Dust(x,y,radian) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.size = 2;
    this.radian = radian;
    this.opacity = 1.0;

    this.update = function() {
        this.dx = Math.cos(this.radian);
        this.dy = Math.sin(this.radian);
        this.x += this.dx;
        this.y += this.dy;
        this.opacity -= 0.05;
        this.size -= 0.05;
        
        if (this.opacity > 0)
            this.draw();
    };

    this.draw = function() {
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = 'black';
        ctx.rect(this.x, this.y, this.size, this.size);
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }
}

function createDustLeft() {
    let x = emitLeft.x;
    let y = emitLeft.y;
    let ran = Math.random() * 1.5; // between 0 and 1.5
    let radian = ran + player.radian - Math.PI - .75;
    dusts.push(new Dust(x,y,radian));
}
function createDustRight() {
    let x = emitRight.x;
    let y = emitRight.y;
    let ran = Math.random() * 2;
    let radian = ran + player.radian - Math.PI - 1;

    dusts.push(new Dust(x,y,radian));
}

// TREADS ///////////////////////////////////////////////////////////
var treadRow = 0;
var treadCol = 0;
var treadHistory = [];
const TREADLIMIT = 100;

function Tread(x, y, angle) {
    this.width = 30;
    this.height = 30;
    this.x = x - this.width/2;
    this.y = y - this.height/2;
    this.angle = angle;
    this.opacity = 1.0;
    this.img = Img.tread;

    this.update = function() {
        
        this.opacity -= 0.002; // this determines how long treads last
        if (this.opacity > 0)
            this.draw();
        else {
            treadHistory.shift(this);
        }
    }

    this.draw = function() {
        let a = Math.round(this.angle/11.25);
        let row = 0;
        let col = a % 8;

        if (a >= 0 && a <= 7)
            row = 2; 
        if (a >= 8 && a <= 15)
            row = 3; 
        if (a >= 16 && a <= 23) 
            row = 0;
        if (a >= 24 && a <= 31)
            row = 1;
        if (a == 32) {
            row = 2; col = 0;
        }

        let frameWidth = this.img.width/8;
        let frameHeight = this.img.height/4;

        // ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.img,
            frameWidth * col, frameHeight * row,
            64, 64,
            this.x, this.y,
            this.width, this.height
            );
        ctx.globalAlpha = 1.0;
    };
}

var createTread = (actor) => {
        let x = actor.x + actor.width/2;
        let y = actor.y + actor.height/2;
        let angle = actor.angle;
        treadHistory.push(new Tread(x, y, angle));
}

//////////////////////////////////////////////////////////////////////////
// LOOP //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
var frameCount = 0;

function loop() {
    frameCount++;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    // drawGrid();
    drawBlocks();    
    showScore();

    for (part of parts) {
        part.update();
        part.draw();
    }

    // draw tank treads
    for (tread of treadHistory)
        tread.update();

    // update emitter locations
    emitLeft.update();
    emitRight.update();

    // draw dust when accelerates
    for (let i = 0; i < dusts.length; i++) {
        dusts[i].update();
        if (dusts[i].opacity < 0)
            dusts.splice(i,1);
    }

    let lastX = player.x;
    let lastY = player.y;

    player.update();

    var playerCollisionSquare = {
        x: player.x + 5,
        y: player.y + 5,
        width: player.width - 10,
        height: player.height - 10,
    };

    if (mainGun) {
        flash.update();
        flash.draw();
    }

    // UPGRADES
    if (frameCount % 400 == 0 && powerups.length < POWERLIMIT) {
        var createOne = Math.floor(Math.random() * 4);
        switch (createOne) {
            case 0: createSpeed();
            break;
            case 1: createHealth();
            break;
            case 2: createArmor();
            break;
            case 3: createAmmo();
            break;
        }
    }

    for (var i = 0; i < powerups.length; i++) {
        powerups[i].update();
        powerups[i].draw();

        var isColliding = checkCollision(playerCollisionSquare, powerups[i]);
        if (isColliding) {
            if (powerups[i].type == 'health')
                player.hp++;
            if (powerups[i].type == 'speed') {
                player.turbo ++;
            }
            if (powerups[i].type == 'ammo')
                player.ammo += 3;
            if (powerups[i].type == 'armor')
                player.armor++;
            powerups.splice(i,1);
        }
    }

    // draw laser from player to all tanks
    // for (enemy of enemies)
    //     player.drawLaser(enemy);

    // space tanks from each other
    if (enemies.length > 1) {
        for (let i = 0; i < enemies.length-1; i++) {
            let checkTanks = checkCollision(enemies[i], enemies[i+1]);
            if (checkTanks) {
                enemies[i].speed = 0;
            } else {
                enemies[i].speed = 0.5;
            }
        }
    }

    // draw all enemies positions
    for (enemy of enemies) {
        // lay down tracks
        if (frameCount % (TREADSPD * 2) == 0)
            createTread(enemy);

        // enemies fire randomly
        enemy.attackCounter++;
        if (enemy.attackCounter % 300 == 0) {
            enemy.fire();
            enemy.attackCounter = 0;
        }

        // setup collision
        let enemyLastX = enemy.x;
        let enemyLastY = enemy.y;

        // move all enemies
        enemy.update();
        var enemyCollisionSquare = {
            x: enemy.x + 5,
            y: enemy.y + 5,
            width: enemy.width - 10,
            height: enemy.height - 10,
        };
                
        // no overlapping with player tank
        let isColliding = checkCollision(playerCollisionSquare, enemyCollisionSquare);
        if (isColliding) {
            enemy.x = enemyLastX;
            enemy.y = enemyLastY; 
            player.x = lastX;
            player.y = lastY;
        }

        // enemy contact with blocks
        for (block of blocks) {
            let isColliding = checkCollision(enemyCollisionSquare, block);
            if (isColliding) {
                enemy.stuck = 1;
                enemy.x = enemyLastX;
                enemy.y = enemyLastY;
            }
        }
    }

    for (block of blocks) {
        let isColliding = checkCollision(playerCollisionSquare, block);
        if (isColliding) {
            player.x = lastX;
            player.y = lastY;
        }
    }

    turret.update();

    // move all shots
    for (shot of shots) {
        shot.update();

        // collision detection: shots vs player
        var isColliding = checkCollision(shot, playerCollisionSquare);
        if (isColliding && shot.age > 5) {
            // lgExplode(player.x + player.width/2, player.y + player.height/2);
            smExplode(player.x + player.width/2, player.y + player.height/2);
            player.hp = player.hp - 1/player.armor;
            player.armor--;
            shots.splice(shot);
        }
        
        // collision detection: shots vs enemies
        for (var i = 0; i < enemies.length; i++) {
            var isColliding = checkCollision(shot, enemies[i]);
            if (isColliding && shot.age > 5) {
                // explosion here
                // lgExplode(enemies[i].x + enemies[i].width/2, enemies[i].y + enemies[i].height/2);
                smExplode(enemies[i].x + enemies[i].width/2, enemies[i].y + enemies[i].height/2);
                enemies.splice(i,1);
                shots.splice(shot);
            } 
        }
    }

    for (block of blocks) {
        // collision detection: bullets and shots VS walls      
        for (var i = 0; i < shots.length; i++) 
            shotCollision(shots[i], block, i); 
    }

    if (enemies.length == 0) {
        NUMENEMIES ++;
        for (var i = 0; i < NUMENEMIES; i++)
            plotTankCleanly(28, isAvailable());
    }
        
    fb();
    window.requestAnimationFrame(loop);
}
// END LOOP ///////////////////////////////////////////////////////////////////

// COLLISION DETECTION //////////////////////////////////////////////////////////////
var shotCollision = (shot, block, idx) => {
    let blockLeft = block.x;
    let blockRight = block.x + block.width;
    let blockTop = block.y;
    let blockBottom = block.y + block.height;

    if (shot.x >= blockLeft && shot.x <= blockRight &&
        shot.y >= blockTop && shot.y <= blockBottom) {
            smExplode(shot.x, shot.y);
            shots.splice(idx, 1);
        }
}

var checkCollision = (obj1, obj2) => {
    var rect1 = {
        x: obj1.x,
        y: obj1.y,
        width: obj1.width,
        height: obj1.height
    };
    var rect2 = {
        x: obj2.x,
        y: obj2.y,
        width: obj2.width,
        height: obj2.height
    };

    return testRectRectCollision(rect1, rect2);
}

var testRectRectCollision = (rec1, rec2) => {
    return rec1.x <= rec2.x + rec2.width
    && rec2.x <= rec1.x + rec1.width
    && rec1.y <= rec2.y + rec2.height
    && rec2.y <= rec1.y + rec1.height;
}

// MAP ////////////////////////////////////////////////////////////////////////////////
var blocks = [];

function Block(x,y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

const CELL = 30;
const cols = WIDTH / CELL; // 30
const rows = HEIGHT / CELL; // 20

var grid = createArray(cols);

function createArray(cols) {
    var arr = [];
    for (let i = 0; i < cols; i++) 
        arr[i] = [];
    
    return arr;
}

function plotBlock(col, row) {
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.rect(col * CELL, row * CELL, CELL, CELL);
    ctx.fill();
    ctx.closePath();
}

// fill grid with random 0s and 1s
function fillZeros() {
    for (var i = 0; i < cols; i++)
        for (var j = 0; j < rows; j++) 
            grid[i][j] = 0;
}

function addOnes() {
    for (var i = 1; i < cols - 3; i++)
        for (var j = 1; j < rows - 1; j++) {
            let random = Math.floor(Math.random() * 50); // 1 out of 50 chance
            if (random === 1) {
                grid[i][j] = 1;
                blocks.push(new Block(i * CELL, j * CELL, CELL, CELL));
            }
        }
}
    
function addExtras() {
    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows-1; j++) {
            if (grid[i][j] == 1) {
                grid[i][j+1] = 1;
                break;
            }
        }
    }
}
    
    // scan the array
    // if a 1 is found, draw a square there
    function drawBlocks() {
        for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] === 1) {
                blocks.push(new Block(i * CELL, j * CELL, CELL, CELL));
                plotBlock(i,j);
            }
        }
}

// spawn a new block cleanly
function plotTankCleanly(col, row) {
    if (grid[col][row] === 0) {
        createEnemy(col * CELL, row * CELL);
    } else {
        console.log(`X: ${col}, Y: ${row} square occupied`);
        if (row < 10)
            plotTankCleanly(col, row + 1);
        else
            plotTankCleanly(col, row - 1);
    } 
}

var isAvailable = () => {
    let row = Math.round(Math.random() * 18);
    if (grid[1][row] === 0)
        return row;
    else
        isAvailable();
}

////////////////////////////////////////

var startGame = () => {
    blocks = [];
    fillZeros();
    addOnes();
    addExtras();
    NUMENEMIES = 3;
    player.x = CELL;
    player.y = isAvailable() * CELL;
    player.hp = 10;
    player.armor = 1;
    player.turbo = 1;
    player.ammo = 10;
    frameCount = 0;
    shots = [];
    bullets = [];
    enemies = [];
    parts = [];
    treadHistory = [];
    powerups = [];
    plotTankCleanly(28, isAvailable());
    plotTankCleanly(28, isAvailable());
};

startGame();
loop();

function showScore() {
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillText(Math.round(player.hp) + " HP", 10, 10);
    ctx.fillText("Score: " + Math.floor(frameCount/100), 100, 10);
    ctx.fillText("Ammo: " + player.ammo, 200, 10);
    ctx.fillText("Armor: " + player.armor, 300, 10);
    ctx.fillText("Turbo: " + player.turbo, 400, 10);
    ctx.closePath();
}

function getRandom(min, max, incr) {
    min = min || 0;
    incr = incr || 1;
    return Math.floor(Math.random() * (max - min) / incr) * incr + min;
}

function fb() {
    fb1.textContent = 'player.rad: ' + player.radian.toFixed(3);
    fb2.textContent = 'dusts.length: ' + dusts.length;
    fb3.textContent = 'forward: ' + forward;
}