const { Pool} = require("pg");
const express = require("express");

const router = express.Router();
const pool = new Pool({ 
	connectionString: process.env.DATABASE_URL,
	user: "web_anon",
	host: "localhost",
	database: "fichearth",
	port: 5432,
});


module.exports = router;
