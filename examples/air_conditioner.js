const LCD = require('lcdi2c');
var Driver = require("rainfall-tcp");
var Leaf = require("rainfall-leaf");

const I2C_BUS = 1;
const I2C_ADDRESS = 0x27;
const LCD_COLUMNS = 20;
const LCD_LINES = 2;

const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 28;
const MIN_SPEED = 1;
const MAX_SPEED = 5;

//state = [toggle, temperature, speed]
var state = [0, MIN_TEMPERATURE, MIN_SPEED];

var initDisplay = function() {
    var lcd = new LCD(I2C_BUS, I2C_ADDRESS, LCD_COLUMNS, LCD_LINES);
    lcd.clear();
    lcd.off();
    return lcd;
}

var updateDisplay = function(lcd, state) {
    lcd.clear();
    if(state[0] === 0) {
        lcd.off();
    }
    else {
        lcd.on();
        lcd.println("Temperature: " + state[1], 1);
        lcd.println("Fan: " + state[2], 2);
    }
}


var lcd = initDisplay();
Driver.createDriver({ }, function(err, driver) {
    if (err) console.log(err);
    else {
        Leaf.createLeaf(
            driver,
            {
                commandType: [
                    {
                        id: 1,
                        type: "bool",
                        range: [0, 1],
                        commandCategory: "toggle",
                        unit: ""
                    },
                    {
                        id: 2,
                        type: "int",
                        range: [MIN_TEMPERATURE, MAX_TEMPERATURE],
                        commandCategory: "temperature",
                        unit: "°C"
                    },
                    {
                        id: 3,
                        type: "int",
                        range: [MIN_SPEED, MAX_SPEED],
                        commandCategory: "fan",
                        unit: ""
                    }
                ],
                dataType: [],
                path: false
            },
            (err, leaf) => {
                if (err) console.log(err);
                else {
                    leaf.listenCommand(
                    function (obj) {
                        var cmd = obj.command[0];
                        state[cmd.id - 1] = cmd.value;
                        updateDisplay(lcd, state);
                    },
                    function() {
                        if (err)
                            console.log(err);
                        else {
                            //Node is running, send initial state
                            leaf.sendExternalCommand([
                                {id: 1, value: 0},
                                {id: 2, value: MIN_TEMPERATURE},
                                {id: 3, value: MIN_SPEED}
                            ], (err) => {
                                if(err) console.log(err);
                                else {
                                    console.log("[initialized] Air-conditioner initialized");
                                }
                            })
                        }
                    });
                }
            }
        );
    }
});
