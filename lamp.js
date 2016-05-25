/*jshint esversion: 6 */

const Driver = require('rainfall-tcp');
const Leaf = require('rainfall-leaf');

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
