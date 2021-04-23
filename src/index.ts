import SerialPort from "serialport";
const path = "/dev/ttyS0";
const Readline = SerialPort.parsers.Readline;
const serial_port = new SerialPort(path);
const parser = new Readline({ delimiter: "\n" });
import express from "express";
import { Request, Response } from "express";
const app = express();
app.use(express.json());
const port = 3000;

const serial_handler = (data: string) => {
	console.log("handling: " + data);
	// if (data == "test") {
	// 	serial_port.write("test indeed\n");
	// }
};

serial_port.pipe(parser);
parser.on("data", serial_handler);

app.post("/", (req: Request, res: Response) => {
	let body = req.body;
	if (body.type == "motor") {
		console.log("got motor request");
		let motor = body.motor;
		let time = body.time;
		let start_string = "motor " + String(motor) + " " + "on\n";
		let end_string = "motor " + String(motor) + " " + "off\n";
		serial_port.write(start_string);
		setTimeout(() => serial_port.write(end_string), time);
	}
	res.send("Hello World!");
});

app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);
