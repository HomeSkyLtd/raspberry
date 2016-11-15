/*jshint esversion: 6 */

const Leaf = require("rainfall-leaf");
const Driver = require("rainfall-tcp");
const DHT_sensor = require('node-dht-sensor');

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
                        range: [0,50],
                        measureStrategy: "periodic",
                        dataCategory: "temperature",
                        unit: "°C"
                    },
                    {
                        id: 2,
                        type: "real",
                        range: [0,100],
                        measureStrategy: "periodic",
                        dataCategory: "humidity",
                        unit: "%"
                    }
                ],
                commandType: [],
                path: false
            },
            (err, leaf) => {
                if (err) console.log(err);
                else {
                    var read = function() {
                        DHT_sensor.read(22, 5, function(err, temperature, humidity) {
                            if (err) console.log(err);
                            else {
                                console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
                                    'humidity: ' + humidity.toFixed(1) + '%');
                                leaf.sendData(
                                    [
                                        {id: 1, value: temperature.toFixed(1)},
                                        {id: 2, value: humidity.toFixed(1)}
                                    ], function (err) {
                                    if (err) console.log(err);
                                    else console.log("[DATA SENT] Sent reading successfuly");
                                    setTimeout(read, 3000);
                                });
                            }
                        });
                        
                    };
                    console.log("[Initialized] light sensor initialized");
                    read();
                }
            }
        );
    }
});
