/*jshint esversion: 6 */

const Leaf = require("rainfall-leaf");
const Driver = require("rainfall-tcp");
const wpi = require('wiring-pi');

// This driver represents a sensor that listens controller messages.

function toNumber(data) {
    return (data[1] + (256 * data[0])) / 1.2;
}
Driver.createDriver({}, function(err, driver) {
    if (err) console.log(err);
    else {
        Leaf.createLeaf(
            driver,
            {
                dataType: [
                    {
                        id: 1,
                        type: "real",
                        range: [0,0xFFFF],
                        measureStrategy: "periodic",
                        dataCategory: "luminance",
                        unit: ""
                    }
                ],
                commandType: []
            },
            (err, leaf) => {
                if (err) console.log(err);
                else {
                    var state = 0;
                    wpi.setup('gpio');
                    var desc = wpi.wiringPiI2CSetup(0x23);
                    if (desc == -1) {
                        console.log("[ERROR] I2C Device not found");
                        throw new Error("Device not found");
                    }
                    var read = function() {
                        var dt = wpi.wiringPiI2CRead(desc);
                        console.log(dt);
                        readValue = toNumber(dt);
                        leaf.sendData({id: 1, value: readValue}, function (err) {
                            if (err) console.log(err);
                            else console.log("[DATA SENT] Sent value: " + readValue);
                            setTimeout(read, 500);
                        });
                    };
                    console.log("[Initialized] light sensor initialized");
                    read();
                }
            });
    }
});
