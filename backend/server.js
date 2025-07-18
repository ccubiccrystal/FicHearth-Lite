// backend start
const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const { Pool} = require("pg");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./authRoutes");
const generalRoutes = require("./generalRoutes");
const url = "http://142.93.180.129";
const port = 5004;

console.log("Starting FicHearth server...");

const formatTimestamp = (isoString) => {
	const date = new Date(isoString);
	return new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	}).format(date);
};

// const limiter = rateLimit({
// 	windowMs: 1 * 60 * 1000, // 1 minute
// 	max: 30, // limit each IP to 30 requests per window
// 	message: {
// 	  	error: 'Too many requests. Please wait a moment and try again.',
// 	  	code: '4-999 RATE_LIMITED',
// 	},
// 	handler: (req, res, next, options) => {
// 		console.warn(formatTimestamp(Date.now()) + ": \x1b[33mWARN:\x1b[0m Rate limited!");
// 	}
// });

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true, // Allow credentials (cookies, etc.)
}));
//app.use(limiter);

const router = express.Router();


app.use("/auth", authRoutes);
app.use("/api", generalRoutes);

// Start the server
app.listen(port, () => {
	console.log('Server running... port = ' + port);
});
