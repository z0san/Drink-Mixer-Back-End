import SerialPort from "serialport";
const local_path = "/dev/ttyACM0";
const usb_path = "/dev/ttyUSB0";
const Readline = SerialPort.parsers.Readline;
const usb_serial_port = new SerialPort(usb_path);
const local_serial_port = new SerialPort(local_path);
const usb_parser = new Readline({ delimiter: "!" });
const local_parser = new Readline({ delimiter: "\n" });
import express from "express";
import { Request, Response } from "express";

import customDrinks from "./Drinks.json";

import cors from "cors";


const app = express();
app.use(cors());

app.use(express.json());
const port = 3000;

const bigTime = 300000;
const smallTime = 180000;
// const bigTime = 30000;
// const smallTime = 18000;


const local_handler = (data: string ) => {
	console.log("from arduino: " + data);
}


local_serial_port.pipe(local_parser);
local_parser.on("data", local_handler);

const pourDrink = (drinkNum: number, size: string) => {
	let totalTime = 0;
	if (size == "bid") totalTime = bigTime;
	else totalTime = smallTime;

	let drink = customDrinks.custom.filter((drink) => drink.id === drinkNum)[0];

	for (let motor = 0; motor < 6; motor ++) {
		if (drink.ratios[motor] != 0 ) {
			console.log("pouring motor " + String(motor) + " for " + String(totalTime * drink.ratios[motor] / 100) + "millies");
			let start_string = "pmotor " + String(motor) + " " + "on\n";
			let end_string = "pmotor " + String(motor) + " " + "off\n";
			setTimeout(() => local_serial_port.write(start_string), motor * 200);
			setTimeout(() => {
				local_serial_port.write(end_string);
				console.log("turnning off motor " + String(motor));
			}, (totalTime * drink.ratios[motor] / 100) + motor * 200);
		}
	}
}

const serial_handler = (data: string) => {
	let nice_string = "";
	for (let char = 0; char < data.length; char++) {
		if (data.charCodeAt(char) !== 65533) nice_string += data[char];
	}
	console.log("handling: " + nice_string);
	let tokens = nice_string.split(" ");
	if (tokens[0] == "pcustom") {
		pourDrink(+tokens[1], tokens[2]);
	} else {
		local_serial_port.write(nice_string);
	}
};

usb_serial_port.pipe(usb_parser);
usb_parser.on("data", serial_handler);

app.post("/", (req: Request, res: Response) => {
	let body = req.body;

	if (body.type == "motor") {
		console.log("got motor request");
		console.debug(body);
		let motor = body.motor;
		if (body.time) {
			let time = body.time;
			let start_string = "pmotor " + String(motor) + " " + "on\n";
			let end_string = "pmotor " + String(motor) + " " + "off\n";
			local_serial_port.write(start_string);
			setTimeout(() => local_serial_port.write(end_string), time);
		} else if (body.action) {
			let action = body.action;
			let command_string = "pmotor " + String(motor) + " " + action + "\n";
			local_serial_port.write(command_string);
		}
	} else if (body.type == "custom") {
		console.log("got custom request");
		console.debug(body);
		pourDrink(body.drink, body.size);
	}
	res.send("Success!");
});


app.get("/custom", (req: Request, res: Response) => {
	console.log("got get request");
	res.send(customDrinks);
});


app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

console.log("ready");