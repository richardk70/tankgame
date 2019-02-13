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
let accelerating = false;
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

// ENEMY TANKS ///////////////////////////////////////////////////////////////
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

    this.checkLeft = function() {
        let pixel = ctx.getImageData(this.x, this.y + this.height/2, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            this.x += 1;
        }
    };
    this.checkRight = function() {
        let pixel = ctx.getImageData(this.x + this.width, this.y + this.height/2, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            this.x -= 1;
        }
    };
    this.checkUp = function() {
        let pixel = ctx.getImageData(this.x + this.width/2, this.y, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            this.y += 1;
        }
    };
    this.checkDown = function() {
        let pixel = ctx.getImageData(this.x + this.width/2, this.y + this.height, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            this.y -= 1;
        }
    };

    this.fire = function() {
        this.rad = this.aimAngle/180 * Math.PI;
        x = this.x + this.width/2 + (15 * Math.cos(this.rad));
        y = this.y + this.height/2 + (15 * Math.sin(this.rad));
        dx = Math.cos(this.rad) * SHOTSPD;
        dy = Math.sin(this.rad) * SHOTSPD;
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

// PLAYER ///////////////////////////////////////////////////////////////////
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
        var c = Math.cos(this.radian);
        var s = Math.sin(this.radian);

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
        let spawnDust = Math.round(Math.random() * 3);
        if (spawnDust < 3) {
            createDustLeft();
            createDustRight();
        }
        
        this.dx = c;
        this.dx *= 1.1;
        this.dy = s;
        this.dy *= 1.1;
    }
    
    if (reverse){
        let spawnDust = Math.round(Math.random() * 3);
        if (spawnDust < 3) {
            backupDustL();
            backupDustR();
        }
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
    checkLeft: function() {
        let pixel = ctx.getImageData(player.x, player.y + player.height/2, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            player.x += 1;
        }
    },
    checkRight: function() {
        let pixel = ctx.getImageData(player.x + player.width, player.y + player.height/2, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            player.x -= 1;
        }
    },
    checkUp: function() {
        let pixel = ctx.getImageData(player.x + player.width/2, player.y, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            player.y += 1;
        }
    },
    checkDown: function() {
        let pixel = ctx.getImageData(player.x + player.width/2, player.y + player.height, 1, 1).data;
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            player.y -= 1;
        }
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

// TURRET ///////////////////////////////////////////////////////////
var turret = {
    x: player.x + player.width/2,
    y: player.y + player.height/2,
    angle: 0,
    radian: 0,
    img: Img.turret,

    update : function() {
        this.x = player.x;
        this.y = player.y;
        this.angle = Math.round(player.aimAngle + 180); // 360
        this.radian = (this.angle - 180) * (Math.PI / 180);
        this.draw();
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

//////////////////////////////////////////////////////////////////////////
// LOOP //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
var frameCount = 0;

function loop() {
    frameCount++;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.beginPath();
    ctx.fillStyle = '#493d26';
    ctx.rect(0,0,WIDTH, HEIGHT);
    ctx.fill();
    ctx.closePath();

    drawBlocks();    

    // draw the existing blasts
    for (blast of blasts)
        blast.draw();

    // draw particle explosions
    if (parts.length > 0){
        for (particle of parts) {
            // opacity, size, life, and ground check
            particle.opacity -= FADE;
            particle.width -= SHRINK;
            particle.height -= SHRINK;
            particle.life--;

            if (particle.opacity < 0)
                delete particle;
            else if (particle.width < 0)
                delete particle;
            else if (particle.life < 0)
                delete particle;
            else if (particle.y > particle.startY + 2)
                delete particle;
            else
                particle.update();
        }
    }

    // draw tank treads
    for (tread of treadHistory)
        tread.update();

    // update emitter locations
    emitLeftF.update();
    emitRightF.update();
    emitLeftR.update();
    emitRightR.update();

    // draw dust when accelerates
    for (let i = 0; i < dusts.length; i++) {
        dusts[i].update();
        if (dusts[i].opacity < 0)
            dusts.splice(i,1);
    }

    let lastX = player.x;
    let lastY = player.y;

    player.update();
    player.checkLeft();
    player.checkRight();
    player.checkUp();
    player.checkDown();

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

    for (var i = powerups.length; i--;) {
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

        enemy.checkLeft();
        enemy.checkRight();
        enemy.checkUp();
        enemy.checkDown();

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
    }

    turret.update();

    // move all shots
    for (var i = shots.length; i--;) {
        let shot = shots[i];
        shot.update();  
        // collision detection: shots vs blocks
        let hit = shot.checkPixel();
        if (hit) {
            smExplode(shot.x + shot.width/2, shot.y + shot.height/2, 2);
            shots.splice(i,1);
        }   

        // collision detection: shots vs player
        var isColliding = checkCollision(shot, playerCollisionSquare);
        if (isColliding && shot.age > 5) {
            // lgExplode(player.x + player.width/2, player.y + player.height/2);
            smExplode(player.x + player.width/2, player.y + player.height/2, 4);
            player.hp = player.hp - 1/player.armor;
            player.armor--;
            shots.splice(i,1);
        }

        // collision detection: shots vs enemies
        for (var j = enemies.length; j--;) {
            var isColliding = checkCollision(shot, enemies[j]);
            if (isColliding && shot.age > 5) {
                // explosion here
                // lgExplode(enemies[i].x + enemies[i].width/2, enemies[i].y + enemies[i].height/2);
                smExplode(enemies[j].x + enemies[j].width/2, enemies[j].y + enemies[j].height/2, 4);
                enemies.splice(j,1);
                shots.splice(i,1);
            } 
        }   
        shot.draw();
    }

    if (enemies.length == 0) {
        NUMENEMIES ++;
        for (var i = 0; i < NUMENEMIES; i++)
            plotTankCleanly(28, isAvailable());
    }
        
    // fb();
    showScore();

    window.requestAnimationFrame(loop);
}
// END LOOP ///////////////////////////////////////////////////////////////////

// COLLISION DETECTION //////////////////////////////////////////////////////////////

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
            let random = Math.floor(Math.random() * 20); // 1 out of 50 chance
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
        plotTankCleanly(col, isAvailable());
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

function drawPixel(vector) {
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.rect(vector.x, vector.y, 1, 1);
    ctx.fill();
    ctx.closePath();
}

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
    blasts = [];
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

function fb(pixel) {
    fb1.textContent = `pixel[0]: ${pixel[0]}`;
    fb2.textContent = `pixel[1]: ${pixel[1]}`;
    fb3.textContent = `pixel[2]: ${pixel[2]}`;
}