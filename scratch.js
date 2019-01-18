// create the canvas
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// GLOBALS
const WIDTH = 900;
const HEIGHT = 600;
const OBSTACLECOUNT = 2;
const SHOTSPD = 9;
var NUMENEMIES = 2;

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
Img.player.src = 'images/base_tiles8.png';
Img.flash = new Image();
Img.flash.src = 'images/flash.png';
Img.shot = new Image();
Img.shot.src = 'images/shot.png';
Img.tread = new Image();
Img.tread.src = 'images/treads.png';
Img.enemy = new Image();
Img.enemy.src = 'images/enemy_tiles.png';
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
        case 37: player.pressLeft = true;
        break;
        case 39: player.pressRight = true;
        break;
        case 38: player.pressUp = true;
        break;
        case 40: player.pressDown = true;
        break;
        case 32: player.speedBonus++;
                 setTimeout(() => {
                     player.speedBonus = 1;
                 }, 1500);;
        break;
        case 17: mg = true;
        break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.keyCode) {
        case 37: player.pressLeft = false;
        break;
        case 39: player.pressRight = false;
        break;
        case 38: player.pressUp = false;
        break;
        case 40: player.pressDown = false;
        break;
        case 17: mg = false;
        break;
    }
});

// POWERUPS ///////////////////////////////////////////////////
var powerups = [];
const POWERLIMIT = 4;

function Powerup(type, x, y, numFrames, img) {
    this.type = type;
    this.width = 30;
    this.height = 30;
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
        ctx.save();        
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
    this.width = 44;
    this.height = 44;
    this.age = 0;
    this.attackCounter = attackCounter;
    this.img = Img.enemy;
    this.aimAngle = 0;
    this.armor = 1;
    this.fp = 1;
    this.hp = 10;
    this.speed = 0.5;

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
        let mouseX = (player.x + player.width/2) - canvas.getBoundingClientRect().left;
        let mouseY  = (player.y + player.height/2) - canvas.getBoundingClientRect().top;
    
        mouseX = mouseX - this.x - this.width/2;
        mouseY = mouseY - this.y - this.height/2;

        this.aimAngle = Math.atan2(mouseY, mouseX) / Math.PI * 180;
  
        diffX = Math.round((player.x + player.width/2) - (this.x + this.width/2));
        diffY = Math.round((player.y + player.height/2) - (this.y + this.height/2));

        // fbDiffX.textContent = diffX;
        // fbDiffY.textContent = diffY;

        if (diffX > 0)
            this.dx = this.speed;
        else
            this.dx = -this.speed;

        if (diffY > 0)
            this.dy = this.speed;
        else
            this.dy = -this.speed;

        this.x += this.dx;
        this.y += this.dy;
        
        this.edge();
        // this.space();
        this.draw(diffX, diffY);
    }
    
    this.edge = function() {
        if (this.x < 0)
        this.x = 0;
        if (this.x > WIDTH - this.width)
        this.x = WIDTH - this.width;
        if (this.y < 0)
        this.y = 0;
        if (this.y > HEIGHT - this.height)
        this.y = HEIGHT - this.height;
    }
            
    this.draw = function(diffX, diffY) {
        ctx.save();

        if (diffX > 2 && diffY < 2) {
            dirCol = 0;
            dirRow = 0;
        }
        if (diffX < 2 && diffY < 2) {
            dirCol = 0;
            dirRow = 2;
        }
        if (diffY > 2 && diffX < 2) {
            dirCol = 0;
            dirRow = 1;
        }
        if (diffY < -2 && diffX < 2) {
            dirCol = 0;
            dirRow = 3;
        }
        if (diffX > 2.1 && diffY > 2.1) {
            dirCol = 1;
            dirRow = 0;
        }
        if (diffX > 2.1 && diffY < -2.1) {
            dirCol = 1;
            dirRow = 3;
        }
        if (diffX < 2.1 && diffY > 2.1) {
            dirCol = 1;
            dirRow = 1;
        }
        if (diffX < 2.1 && diffY < -2.1) {
            dirCol = 1;
            dirRow = 2;
        }

        let frameWidth = this.img.width/2;
        let frameHeight = this.img.height/4;

        ctx.drawImage(this.img,
            frameWidth * dirCol, frameHeight * dirRow,
            frameWidth, frameHeight,
            this.x, this.y, 
            this.width, this.height);
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

        let xMod = 0;
        let yMod = 0;
        let halfX = player.width/4;
        let halfY = player.height/4;

        if (player.pressRight) {
            xMod = halfX * 2.5;
            yMod = -halfY;
            row = 0;
        }
        if (player.pressLeft) {
            xMod = -halfX * 4.75;
            yMod = -halfY;
            row = 4;
        }
        if (player.pressUp) {
            xMod = -halfX;
            yMod = -halfY * 4.75;
            row = 2;
        }
        if (player.pressDown) {
            xMod = -halfX;
            yMod = halfY * 2.5;
            row = 6;
        }
        if (player.pressDown && player.pressLeft) {
            xMod = -halfX * 4;
            row = 5;
            
        }
        if (player.pressDown && player.pressRight) {
            xMod = halfX * 1.5;
            row = 7;
            
        }
        if (player.pressUp && player.pressRight) {
            xMod = halfX * 1.5;
            row = 1;
            
        }
        if (player.pressUp && player.pressLeft) {
            xMod = -halfX * 4;
            row = 3;
            
        }

        ctx.save();
        ctx.drawImage(this.img, 
            frameMod * frameWidth, row * frameHeight,
            frameWidth, frameHeight,
            this.x + xMod, this.y + yMod,
            this.width, this.height
            );

        setTimeout(() => {
            mainGun = false;
           this.spriteAnimCount = 0;
        }, 240);
    }
};

var createFlash = () => {
    flash.x = player.x + player.width/4;
    flash.y = player.y + player.height/4;
    flash.angle = player.aimAngle/180 * Math.PI;
};

// BULLETS ////////////////////////
var bullets = [];
var BULLETS_LEFT = 8;
const BULLET_SPD = 8;
var mgEmpty = false;

function Bullet(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.prevX = 0;
    this.prevY = 0;
    this.dx = dx;
    this.dy = dy;
    this.width = 3;
    this.height = 3;
    this.age = 0;
    this.type = 'bullet';

    this.update = function() {
        if (this.age > 30)
            bullets.shift(this);
        else {
            this.age ++;
            this.prevX = this.x;
            this.prevY = this.y;
            this.x += this.dx;
            this.y += this.dy;
            this.edge();
            this.draw();
        }    
    }

    this.draw = function() {
        ctx.beginPath();
        ctx.rect(this.prevX, this.prevY, 1, 1);
        ctx.rect(this.x, this.y - 1, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }

    this.edge = function() {
        if (this.x > WIDTH || this.x < 0 || this.y > HEIGHT || this.y < 0) {
            bullets.shift(this);
        }
    }
}

var createBullet = () => {
    BULLETS_LEFT -= 1;
    let x = y = dx = dy = 0;
    if (bullets.length < BULLETS_LEFT && !mgEmpty) {
        x = player.x + player.width/2;
        y = player.y + player.height/2;
        if (lastRow == 2 && lastCol == 0) { // facing left
            dx = -BULLET_SPD;
        }
        if (lastRow == 0 && lastCol == 0) { // facing right
            dx = BULLET_SPD;
        }
        if (lastRow == 3 && lastCol == 0) { // facing up
            dy = -BULLET_SPD;
        }
        if (lastRow == 1 && lastCol == 0) { // facing down
            dy = BULLET_SPD;
        }
        if (lastRow == 2 && lastCol == 1) { // facing left-up
            dx = -BULLET_SPD + 1;
            dy = -BULLET_SPD + 1;
        }
        if (lastRow == 1 && lastCol == 1) { // facing left-down
            dx = -BULLET_SPD + 1;
            dy = BULLET_SPD + 1;
        }
        if (lastRow == 3 && lastCol == 1) { // facing right-up
            dx = BULLET_SPD - 1;
            dy = -BULLET_SPD + 1;
        }
        if (lastRow == 0 && lastCol == 1) { // facing right-down
            dx = BULLET_SPD - 1;
            dy = BULLET_SPD - 1;
        }
        age = 0;
        bullets.push(new Bullet(x, y, dx, dy, age));
    } else {
        mgEmpty = true;
        mg = false;
        setTimeout(() => {
            mgEmpty = false;
            BULLETS_LEFT = 8;
        }, 300);
    }
}

// SHOTS ////////////////////////////
var shots = [];

function Shot(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = 8;
    this.height = 8;
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
        ctx.save();
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
var lastRow = 0;
var lastCol = 0;

var player = {
    type: 'player',
    x: 50,
    y: HEIGHT/2,
    width: 44,
    height: 44,
    speed: 1,
    speedBonus: 1,
    turbo: 0,
    ammo: 10,
    hp: 10,
    armor: 1,
    aimAngle: 0,
    pressLeft: false,
    pressRight: false,
    pressUp: false,
    pressDown: false,
    img: Img.player,
    // methods
    draw: function() {
        ctx.save();
        if (this.pressLeft) {
            dirRow = lastRow = 2;
            dirCol = lastCol = 0;
        }
        if (this.pressRight) {
            dirRow = lastRow = 0;
            dirCol = lastCol = 0;
        }
        if (this.pressUp) {
            dirRow = lastRow = 3;
            dirCol = lastCol = 0;
        }
        if (this.pressDown) {
            dirRow = lastRow = 1;
            dirCol = lastCol = 0;
        }
        if (this.pressDown && this.pressLeft) {
            dirRow = lastRow = 1;
            dirCol = lastCol = 1;
        }
        if (this.pressDown && this.pressRight) {
            dirRow = lastRow = 0;
            dirCol = lastCol = 1;
        }
        if (this.pressUp && this.pressRight) {
            dirRow = lastRow = 3;
            dirCol = lastCol = 1;
        }
        if (this.pressUp && this.pressLeft) {
            dirRow = lastRow = 2;
            dirCol = lastCol = 1;
        }
        else {
            dirRow = lastRow;
            dirCol = lastCol;
        }

        let frameWidth = this.img.width/4;
        let frameHeight = this.img.height/4;

        if (mg) {
            var fireOrNot = Math.floor(Math.random() * 2);
            if (fireOrNot)
                dirCol = dirCol + 2;
        }
        // if (!mg)
        //     dirCol = lastCol;

        ctx.drawImage(this.img,
            frameWidth * dirCol, frameHeight * dirRow,
            frameWidth, frameHeight,
            this.x, this.y, 
            this.width, this.height);
        // box around the tank
        // ctx.beginPath();
        // ctx.strokeStyle = 'red';
        // ctx.rect(this.x, this.y, this.width, this.height);
        // ctx.stroke();
        // ctx.closePath();
    },
    update: function() {
        if (this.pressLeft) 
            this.x -= this.speed;
        if (this.pressRight) 
            this.x += this.speed;            
        if (this.pressUp) 
            this.y -= this.speed;
        if (this.pressDown) 
            this.y += this.speed;

        // travelling diagonally, a little slower
        if ((this.pressUp && this.pressLeft) || (this.pressUp && this.pressRight) || 
            (this.pressDown && this.pressLeft) || (this.pressDown && this.pressRight))
            this.speed = .9 * this.speedBonus;
        else
            this.speed = 1 * this.speedBonus;

        if (this.hp <= 0) {
            console.log('game over');
            delete player;
            setTimeout(() => {
                startGame();
            }, 1000);
        }

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
    }
}

// EXPLOSION /////////////////////////
let parts = [];
const PARTLIMIT = 100;

function Part(x,y,speed,angle, life){
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.angle = angle;
    this.life = life;
    this.width = Math.random() * 4;
    this.height = Math.random() * 4;
} 

function lgExplode(x, y) {
    for (var i = 0; i < PARTLIMIT; i++){
        // vary angle
        let ranAngle = Math.round(Math.random() * 360);
        // vary speed
        let ranSpeed = Math.random() * 4;
        parts.push(new Part(x, y, ranSpeed, ranAngle, Math.random() * 30 ));
    }
}

function smExplode(x, y) {
    for (var i = 0; i < PARTLIMIT / 2; i++){
        // vary angle
        let ranAngle = Math.round(Math.random() * 360);
        // vary speed
        let ranSpeed = Math.random() * 3;
        parts.push(new Part(x, y, ranSpeed, ranAngle, Math.random() * 10 ));
    }
}

function moveExplosion(){
    for (var i = 0; i < parts.length; i++){
        // move out in random directions at random speeds
        parts[i].x += Math.cos(parts[i].angle) * parts[i].speed;
        parts[i].y += Math.sin(parts[i].angle) * parts[i].speed;
        //edge
        if (parts[i].x > WIDTH || parts[i].x < 0 || parts[i].y > HEIGHT || parts[i].y < 0)
            parts.shift(parts[i]);
    }
}

function drawExplosion(){
    for (var i = 0; i < parts.length; i++){
        if (parts[i].life < 0)
            ;
        else {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.fillRect(parts[i].x, parts[i].y, parts[i].width, parts[i].height);
            ctx.fill();
            ctx.closePath();
            parts[i].life -= 1;
        }
    }
}

// TURRET ////////////////////////////
var turret = {
    x: player.x + player.width/2,
    y: player.y + player.height/2,
    angle: 0,
    img: Img.turret,

    update : function() {
        this.x = player.x;
        this.y = player.y;
        this.draw();
        this.angle = Math.round((player.aimAngle/180 * Math.PI) * (180/Math.PI)) + 180;
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

        ctx.save();
        ctx.drawImage(this.img,
            frameWidth * col, frameHeight * row,
            64,64,
            this.x,this.y,
            44,44
            );
    }
}

// TREADS /////////////////////////
var treadRow = 0;
var treadCol = 0;
var treadHistory = [];
const TREADLIMIT = 20;

function Tread(x, y, direction) {
    this.width = 16;
    this.height = 16;
    this.x = x - this.width/2;
    this.y = y - this.height/2;
    this.direction = direction;

    this.draw = function() {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'brown';
        ctx.fill();
        
    };
}

var createTread = () => {
    if (treadHistory.length < TREADLIMIT) {
        x = player.x + player.width/2;
        y = player.y + player.height/2;
        direction = 0;
        treadHistory.push(new Tread(x, y, direction));
    }
    if (treadHistory.length > TREADLIMIT)
        treadHistory.pop();
}

// var tread = {
//     x: player.x,
//     y: player.y,
//     width: 22,
//     height: 22,
//     img: treadImg,
//     // methods
//     update: function() {
//         this.x = player.x;
//         this.y = player.y;
//     },
//     draw: function() {
//         ctx.save();

//         ctx.drawImage(this.img, 
//             this.x, this.y, 
//             this.width, this.height);
//     }
// }

// LOOP ////////////////////////////////////////////////////////////////////////////
var frameCount = 0;

function loop() {
    frameCount++;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    drawGrid();
    drawBlocks();    
    showScore();

    moveExplosion();
    drawExplosion();

    let lastX = player.x;
    let lastY = player.y;

    player.update();

    var playerCollisionSquare = {
        x: player.x + 5,
        y: player.y + 5,
        width: player.width - 10,
        height: player.height - 10,
    };

    if (bullets.length > 0) 
        for (let i = 0; i < bullets.length; i++) 
            bullets[i].update();


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

    // draw all enemies positions
    for (enemy of enemies) {
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
                enemy.x = enemyLastX;
                enemy.y = enemyLastY;
            }
        }
        // enemy contact with bullets
        for (let i = 0; i < bullets.length; i++) {
                let isColliding = checkCollision(bullets[i], enemyCollisionSquare);
                if (isColliding) {
                    bullets.shift(i,1);
                }
        }
    }

    // draw tank treads
    for (tread of treadHistory) {
        tread.draw();
    }

    if (mg && !mgEmpty) {
        if (frameCount % 5 == 0) {
            createBullet();
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
            lgExplode(player.x + player.width/2, player.y + player.height/2);
            player.hp = player.hp - 1/player.armor;
            player.armor--;
        }
        
        // collision detection: shots vs enemies
        for (var i = 0; i < enemies.length; i++) {
            var isColliding = checkCollision(shot, enemies[i]);
            if (isColliding && shot.age > 10) {
                // explosion here
                lgExplode(enemies[i].x + enemies[i].width/2, enemies[i].y + enemies[i].height/2);
                enemies.splice(i,1);
                shots.splice(shot);
            } 
        }
    }

    for (block of blocks) {
        // collision detection: bullets and shots VS walls
        for (bullet of bullets) 
            shotCollision(bullet, block);
        
        for (var i = 0; i < shots.length; i++) 
            shotCollision(shots[i], block, i); 
    }

    if (enemies.length == 0) {
        NUMENEMIES ++;
        for (var i = 0; i < NUMENEMIES; i++)
            plotTankCleanly(27, isAvailable());
    }
        
    fb();
    window.requestAnimationFrame(loop);
}
// END LOOP ///////////////////////////////////////////////////////////////////

// COLLISION DETECTION //////////////////////////////////////////////////////////////
var shotCollision = (projectile, block, idx) => {
    let blockLeft = block.x;
    let blockRight = block.x + block.width;
    let blockTop = block.y;
    let blockBottom = block.y + block.height;

    if (projectile.x >= blockLeft && projectile.x <= blockRight &&
        projectile.y >= blockTop && projectile.y <= blockBottom) {
            if (projectile.type == 'bullet')
                bullets.shift(projectile);
            if (projectile.type == 'shot') {
                smExplode(projectile.x, projectile.y);
                shots.shift(idx, 1);
            }
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

function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = '#835C3B';
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            ctx.rect(i * CELL,j * CELL, CELL, CELL);
        }
    }
    ctx.stroke();
    ctx.closePath();
}

function plotBlock(col, row) {
    ctx.beginPath();
    ctx.fillStyle = 'green';
    ctx.rect(col * CELL, row * CELL, CELL, CELL);
    ctx.fill();
    ctx.closePath();
}

// fill grid with random 0s and 1s
function fillGrid() {
    for (var i = 0; i < cols; i++)
        for (var j = 0; j < rows; j++) {
            let random = Math.floor(Math.random() * 25); // 1 out of 25 chance
            if (random === 1) {
                grid[i][j] = 1;
                blocks.push(new Block(i * CELL, j * CELL, CELL, CELL));
            } else {
                grid[i][j] = 0;
            };
        }
}

// scan the array
// if a 1 is found, draw a square there
function drawBlocks() {
    for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] === 1)
                plotBlock(i,j);
        }
}

// spawn a new block cleanly
function plotTankCleanly(col, row) {
    if (grid[col][row] === 0 && grid[col+1][row] === 0 &&
        grid[col][row+1] === 0 && grid[col+1][row+1] === 0) {
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
    let row = getRandom(0, 18);
    console.log(row);
    if (grid[1][row] === 0)
        return row;
    else
        isAvailable();
}

////////////////////////////////////////

var startGame = () => {
    blocks = [];
    fillGrid();
    NUMENEMIES = 3;
    player.x = CELL;
    player.y = isAvailable() * CELL;
    player.hp = 10;
    player.armor = 1;
    player.turbo = 0;
    player.ammo = 10;
    frameCount = 0;
    shots = [];
    bullets = [];
    enemies = [];
    parts = [];
    powerups = [];
    plotTankCleanly(27, isAvailable());
    // plotRandomTankCleanly(Math.floor(Math.random() * rows), 28);
    // plotRandomTankCleanly(Math.floor(Math.random() * rows), 28);
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
    fb1.textContent = 'player.aimAngle: ' + Math.round(player.aimAngle);
    fb2.textContent = 'player.x: ' + Math.round(player.x) + ' player.y: ' + Math.round(player.y);
}