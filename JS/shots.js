// SHOTS //////////////////////////////////////////////////////////////////
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

    this.checkPixel = function() {
        let pixel = ctx.getImageData(this.x + this.width/2, this.y + this.height/2, 1, 1).data;
        // draw red dot on the pixel being sample
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.rect(this.x + this.width/2, this.y + this.height/2, 1, 1);
        ctx.fill();
        ctx.closePath();
        fb(pixel);
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
            return true;
        }
    };

    this.update = function() {
        this.age ++;
        this.x += this.dx;
        this.y += this.dy;
        this.edge();
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
        x = actor.x + actor.width/2 + (15 * Math.cos(turret.radian)) ;
        y = actor.y + actor.height/2 + (15 * Math.sin(turret.radian));
        rad = actor.aimAngle/180 * Math.PI;
        dx = Math.cos(rad) * SHOTSPD;
        dy = Math.sin(rad) * SHOTSPD;
        shots.push(new Shot(x, y, dx, dy));
        setTimeout(() => {
            reloading = false;
        }, 1000);
}