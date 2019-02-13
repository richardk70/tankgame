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