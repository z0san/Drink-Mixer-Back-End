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
const app = express();
app.use(express.json());
const port = 3000;

const serial_handler = (data: string) => {
	let nice_string = "";
	for (let char = 0; char < data.length; char++) {
		if (data.charCodeAt(char) !== 65533) nice_string += data[char];
	}
	// console.log("handling: " + nice_string);
	local_serial_port.write(nice_string);
};

usb_serial_port.pipe(usb_parser);
usb_parser.on("data", serial_handler);

local_serial_port.pipe(local_parser);
// local_parser.on("data", console.log);

 app.post("/", (req: Request, res: Response) => {
 	let body = req.body;

 	if (body.type == "motor") {
 		console.log("got motor request");
 		let motor = body.motor;
 		let time = body.time;
 		let start_string = "pmotor " + String(motor) + " " + "on\n";
 		let end_string = "pmotor " + String(motor) + " " + "off\n";
 		local_serial_port.write(start_string);
 		setTimeout(() => local_serial_port.write(end_string), time);
 	}
 	res.send("Hello World!");
 });

 app.listen(port, () =>
 	console.log(`Example app listening at http://localhost:${port}`)
);

console.log("ready");