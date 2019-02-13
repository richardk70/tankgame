// FLAME ///////////////////////////////////////////////////////////////////
var flash = new Flash();

function Flash(x,y, radian) {
    this.x = x;
    this.y = y;
    this.radian = radian;
    this.img = Img.flash;
    this.spriteAnimCount = 0;
    this.width = 48;
    this.height = 48;

    this.update = function() {
        this.spriteAnimCount += .5;
    }

    this.draw = function() {
        let c = Math.cos(turret.radian);
        let s = Math.sin(turret.radian);
        let x = turret.x + (30 * c);
        let y = turret.y + (30 * s);
        var frameMod = Math.floor(this.spriteAnimCount % 8);
        let row = 0;
        let frameWidth = this.img.width/8;
        let frameHeight = this.img.height/8;


        // ctx.save();
        ctx.drawImage(this.img, 
            frameMod * frameWidth, row * frameHeight,
            frameWidth, frameHeight,
            x, y,
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
    flash.radian = player.aimAngle/180 * Math.PI;
};