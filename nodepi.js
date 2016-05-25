/*jshint esversion: 6 */

const fs = require('fs');

//Drivers
const DRIVERS = {
    'tcp': require('rainfall-tcp'),
    'udp': require('rainfall-udp'),
    'xbee-s1': require('rainfall-xbee-s1'),
};

const Leaf = require('rainfall-leaf');

const wpi = require('wiring-pi');

const DEFAULT_CONFIG_FILE = '~/.rainfall-node.json';

/*The CONFIG file should be a JSON file in the format:
{
    "dataType": [
        {
            "id": <UNIQUE_NUMBER>,
            "type": "int" | "bool" | "real" | "string",
            "range": [<START_RANGE>, <END_RANGE>],
            "measureStrategy" : "event" | "periodic",
            "unit": "<UNIT_STRING>",
            "dataCategory": "temperature" | "luminance" | "presence"
                | "humidity" | "pressure" | "windspeed" | "smoke",
            "input": {
                "gpio": <GPIO_NUMBER>,
                "invert": 0 | 1
            }
        },
        ...
    ],
    "commandType": [
        {
            "id": <UNIQUE_NUMBER>,
            "type": "int" | "bool" | "real" | "string",
            "range": [<START_RANGE>, <END_RANGE>],
            "unit": "<UNIT_STRING>",
            "commandCategory": "toggle" | temperature" | "fan" | "lightswitch"
                | "acmode" | "lightintensity" | "lightcolor",
            "output": {
                "gpio": <GPIO_NUMBER>,
                "invert": 0 | 1,
                "initial": 0 | 1
            }
        },
        ...
    ],
    "networkInterface": {
        "type": "udp" | "tcp" | "xbee-s1",
        "params": {
            "key": "value",
            ...
        }
    }

}
*/

wpi.setup('gpio');

var filename = process.argv[2] || DEFAULT_CONFIG_FILE;

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) throw err;
    var config = JSON.parse(data);
    if (!config.networkInterface)
        throw new Error("Missing networkInterface in config file: " + filename);
    if (!DRIVERS[config.networkInterface.type])
        throw new Error("Missing network interface " + config.networkInterface.type +
            " defined in config file: " + filename);
    if (!config.commandType && !config.dataType)
        throw new Error("Missing commandType/dataType in config file: " + filename);
    var mapTypesFunction = (val) => {
        var ret = {};
        for (var key in val) {
            if (key !== 'output' && key !== 'input') {
                ret[key] = val[key];
            }
        }
        return ret;
    };
    var reduceToObjFunction = (previous, current) => {
        previous[current.id] = current;
        return previous;
    };
    DRIVERS[config.networkInterface.type].createDriver(config.networkInterface.params, 
        (err, driver) => {
            if (err) throw err;
            Leaf.createLeaf(driver, {
                dataType: config.dataType && config.dataType.map(mapTypesFunction),
                commandType: config.commandType && config.commandType.map(mapTypesFunction),
                path: false
            }, (err, leaf) => {
                if (err) {
                    driver.close();
                    throw err;
                }
                onStart(leaf, { 
                    dataType: config.dataType && 
                        config.dataType.reduce(reduceToObjFunction, {}),
                    commandType: config.commandType &&
                        config.commandType.reduce(reduceToObjFunction, {})
                });
            });
    });
});

function onStart(leaf, dataCommand) {
    console.log("STARTED!");
    if (dataCommand.dataType) {
    }
    if (dataCommand.commandType) {
        //TODO: Maybe do all this in sequence (not parallel)
        var initialState = [];
        for (var command of dataCommand.commandType) {
            if (command.output) {
                wpi.pinMode(command.output.gpio, wpi.OUTPUT);
                initialState.push({id: command.id, value: command.output.initial });
            }
        }
        leaf.sendExternalCommand(initialState);
        leaf.listenCommand((obj) => {
            for (var cmd of obj.command) {
                if (dataCommand.commandType[cmd.id]) {
                    wpi.digitalWrite(dataCommand.commandType[cmd.id].output.gpio, 
                        cmd.value == invert);
                }
            }
        }, (err) => { if (err) throw err; });
    }
}


/*
Driver.createDriver({rport: 4567}, function (err, driver) {
	if (err) {
		console.log(err);
	} else {
		Leaf.createLeaf(
			driver,
			{
                //This leaf receives one command
				dataType: [],
				commandType: [{
					id: 0,
					type: "bool",
					commandCategory: "lightswitch",
                    range: [0, 1],
                    unit: ""
				}],
                path: false
			},
			function (err, leaf) {
				if (err)
                    console.log(err);
				else {
					leaf.listenCommand(
						function (obj) {
                            onCommand(obj.command[0]);
						},
						function() {
							if (err)
                                console.log(err);
							else {
                                //Node is running
								console.log("[initialized] Light switch initialized");
							}
						}
					);
				}
			}
		);
	}
});

//Command callback
function onCommand(cmd) {
    console.log("[command received] " + (!cmd.value ? "Turn off" : "Turn On"));
}
*/