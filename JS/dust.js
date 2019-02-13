// EMITTERS //////////////////////////////////////////////////////////
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

const emitLeftF = new Emitter([-10, -7]);
const emitRightF = new Emitter([-10, 7]);
const emitLeftR = new Emitter([10, -7]);
const emitRightR = new Emitter([10, 7]);

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

function backupDustL() {
    let x = emitLeftR.x;
    let y = emitLeftR.y;
    let ran = Math.random() * 1.5; // between 0 and 1.5
    let radian = -ran - player.radian + .75;
    dusts.push(new Dust(x,y,radian));
}
function backupDustR() {
    let x = emitRightR.x;
    let y = emitRightR.y;
    let ran = Math.random() * 1.5; // between 0 and 1.5
    let radian = -ran - player.radian + .75;
    dusts.push(new Dust(x,y,radian));
}

function createDustLeft() {
    let x = emitLeftF.x;
    let y = emitLeftF.y;
    let ran = Math.random() * 1.5; // between 0 and 1.5
    let radian = ran + player.radian - Math.PI - .75;
    dusts.push(new Dust(x,y,radian));
}
function createDustRight() {
    let x = emitRightF.x;
    let y = emitRightF.y;
    let ran = Math.random() * 2;
    let radian = ran + player.radian - Math.PI - 1;

    dusts.push(new Dust(x,y,radian));
}