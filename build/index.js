"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var serialport_1 = __importDefault(require("serialport"));
var local_path = "/dev/ttyACM0";
var usb_path = "/dev/ttyUSB0";
var Readline = serialport_1.default.parsers.Readline;
var usb_serial_port = new serialport_1.default(usb_path);
var local_serial_port = new serialport_1.default(local_path);
var usb_parser = new Readline({ delimiter: "!" });
var local_parser = new Readline({ delimiter: "\n" });
var express_1 = __importDefault(require("express"));
var Drinks_json_1 = __importDefault(require("./Drinks.json"));
var cors_1 = __importDefault(require("cors"));
var app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
var port = 3000;
var bigTime = 300000;
var smallTime = 180000;
// const bigTime = 30000;
// const smallTime = 18000;
var local_handler = function (data) {
    console.log("from arduino: " + data);
};
local_serial_port.pipe(local_parser);
local_parser.on("data", local_handler);
var pourDrink = function (drinkNum, size) {
    var totalTime = 0;
    if (size == "bid")
        totalTime = bigTime;
    else
        totalTime = smallTime;
    var drink = Drinks_json_1.default.custom.filter(function (drink) { return drink.id === drinkNum; })[0];
    var _loop_1 = function (motor) {
        if (drink.ratios[motor] != 0) {
            console.log("pouring motor " + String(motor) + " for " + String(totalTime * drink.ratios[motor] / 100) + "millies");
            var start_string_1 = "pmotor " + String(motor) + " " + "on\n";
            var end_string_1 = "pmotor " + String(motor) + " " + "off\n";
            setTimeout(function () { return local_serial_port.write(start_string_1); }, motor * 200);
            setTimeout(function () {
                local_serial_port.write(end_string_1);
                console.log("turnning off motor " + String(motor));
            }, (totalTime * drink.ratios[motor] / 100) + motor * 200);
        }
    };
    for (var motor = 0; motor < 6; motor++) {
        _loop_1(motor);
    }
};
var serial_handler = function (data) {
    var nice_string = "";
    for (var char = 0; char < data.length; char++) {
        if (data.charCodeAt(char) !== 65533)
            nice_string += data[char];
    }
    console.log("handling: " + nice_string);
    var tokens = nice_string.split(" ");
    if (tokens[0] == "pcustom") {
        pourDrink(+tokens[1], tokens[2]);
    }
    else {
        local_serial_port.write(nice_string);
    }
};
usb_serial_port.pipe(usb_parser);
usb_parser.on("data", serial_handler);
app.post("/", function (req, res) {
    var body = req.body;
    if (body.type == "motor") {
        console.log("got motor request");
        console.debug(body);
        var motor = body.motor;
        if (body.time) {
            var time = body.time;
            var start_string = "pmotor " + String(motor) + " " + "on\n";
            var end_string_2 = "pmotor " + String(motor) + " " + "off\n";
            local_serial_port.write(start_string);
            setTimeout(function () { return local_serial_port.write(end_string_2); }, time);
        }
        else if (body.action) {
            var action = body.action;
            var command_string = "pmotor " + String(motor) + " " + action + "\n";
            local_serial_port.write(command_string);
        }
    }
    else if (body.type == "custom") {
        console.log("got custom request");
        console.debug(body);
        pourDrink(body.drink, body.size);
    }
    res.send("Success!");
});
app.get("/custom", function (req, res) {
    console.log("got get request");
    res.send(Drinks_json_1.default);
});
app.listen(port, function () {
    return console.log("Example app listening at http://localhost:" + port);
});
console.log("ready");
