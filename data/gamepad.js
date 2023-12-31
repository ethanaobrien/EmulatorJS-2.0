class GamepadHandler {
    gamepads;
    timeout;
    listeners;
    constructor() {
        this.gamepads = [];
        this.listeners = {};
        this.timeout = null;
        this.loop();
    }
    terminate() {
        window.clearTimeout(this.timeout);
    }
    getGamepads() {
        return navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    }
    loop() {
        this.updateGamepadState();
        this.timeout = setTimeout(this.loop.bind(this), 10);
    }
    updateGamepadState() {
        const gamepads = this.getGamepads();
        gamepads.forEach((gamepad, index) => {
            if (!gamepad) return;
            let hasGamepad = false;
            this.gamepads.forEach((oldGamepad, oldIndex) => {
                if (oldGamepad.index !== gamepad.index) return;
                const gamepadToSave = {
                    axes: [],
                    buttons: {},
                    index: oldGamepad.index
                }
                hasGamepad = true;
                
                oldGamepad.axes.forEach((axis, axisIndex) => {
                    if (gamepad.axes[axisIndex] !== axis) {
                        const axis = ['LEFT_STICK_X', 'LEFT_STICK_Y', 'RIGHT_STICK_X', 'RIGHT_STICK_Y'][axisIndex];
                        if (!axis) return;
                        this.dispatchEvent('axischanged', {axis: axis, value: gamepad.axes[axisIndex], index: gamepad.index, gamepadIndex: gamepad.index});
                    }
                    gamepadToSave.axes[axisIndex] = axis;
                })
                gamepad.buttons.forEach((button, buttonIndex) => {
                    let pressed = oldGamepad.buttons[buttonIndex] === 1.0;
                    if (typeof oldGamepad.buttons[buttonIndex] === "object") {
                        pressed = oldGamepad.buttons[buttonIndex].pressed;
                    }
                    let pressed2 = button === 1.0;
                    if (typeof button === "object") {
                        pressed2 = button.pressed;
                    }
                    gamepadToSave.buttons[buttonIndex] = {pressed:pressed2};
                    if (pressed !== pressed2) {
                        if (pressed2) {
                            this.dispatchEvent('buttondown', {index: buttonIndex, gamepadIndex: gamepad.index});
                        } else {
                            this.dispatchEvent('buttonup', {index: buttonIndex, gamepadIndex: gamepad.index});
                        }
                    }
                    
                })
                this.gamepads[oldIndex] = gamepadToSave;
            })
            if (!hasGamepad) {
                this.gamepads.push(gamepads[index]);
                this.dispatchEvent('connected', {gamepadIndex: gamepad.index});
            }
        });
        
        for (let j=0; j<this.gamepads.length; j++) {
            if (!this.gamepads[j]) continue;
            let has = false;
            for (let i=0; i<gamepads.length; i++) {
                if (!gamepads[i]) continue;
                if (this.gamepads[j].index === gamepads[i].index) {
                    has = true;
                    break;
                }
            }
            if (!has) {
                this.dispatchEvent('disconnected', {gamepadIndex: this.gamepads[j].index});
                this.gamepads.splice(j, 1);
                j--;
            }
        }
    }
    dispatchEvent(name, arg) {
        if (typeof this.listeners[name] !== 'function') return;
        if (!arg) arg={};
        arg.type = name;
        this.listeners[name](arg);
    }
    on(name, cb) {
        this.listeners[name.toLowerCase()] = cb;
    }
}

window.GamepadHandler = GamepadHandler;
