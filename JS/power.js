// POWERUPS ////////////////////////////////////////////////////////////////
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