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

import custom_drinks from "./Drinks.json";

import cors from "cors";


const app = express();
app.use(cors());

app.use(express.json());
const port = 3000;

const serial_handler = (data: string) => {
	let nice_string = "";
	for (let char = 0; char < data.length; char++) {
		if (data.charCodeAt(char) !== 65533) nice_string += data[char];
	}
	console.log("handling: " + nice_string);
	local_serial_port.write(nice_string);
};

usb_serial_port.pipe(usb_parser);
usb_parser.on("data", serial_handler);

local_serial_port.pipe(local_parser);
local_parser.on("data", (data: string) => console.log("fron arduino: " + data));

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
	}
	res.send("Success!");
});


app.get("/custom", (req: Request, res: Response) => {
	res.send(custom_drinks);
}


app.listen(port, () =>
console.log(`Example app listening at http://localhost:${port}`)
);

console.log("ready");