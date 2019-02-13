// CONTROLS

// MAIN GUN ATTACK /////
document.addEventListener('click', (e) => {
    if (reloading == false && player.ammo > 0) {
        mainGun = true;
        player.fire();
    }
});

// KEYBOARD INPUT /////////////////////////////////////////////////////////
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
                 TOPSPEED = 1.1;
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