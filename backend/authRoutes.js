const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();
const pool = new Pool({ 
	connectionString: process.env.DATABASE_URL,
	user: "web_anon",
	host: "localhost",
	database: "fichearth",
	port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const SITE_URL = process.env.SITE_URL || 'http://localhost:5000';

// register user
router.post("/register", async (req, res) => {
	
	const {email, username, password } = req.body;
	
	if (!username || !email || !password) {
		return res.status(400).json({message: "Missing one or more required fields."});
	}
	
	try {
		
		const userExists = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
		
		if (userExists.rows.length > 0) {
			return res.status(400).json({ message: "Username or email already in use." });
		}
		
		const hashedPassword = await bcrypt.hash(password, 10);
		
		const url = `${SITE_URL}/users/${username}`;
	
		const result = await pool.query(
			"INSERT INTO users (username, email, hashpasswd) VALUES ($1, $2, $3) RETURNING id, username, email",
			[username, email, hashedPassword]
		);
		res.status(201).json({ message: "User registered", user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

// login user
router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	
	if (!username || !password) {
		return res.status(400).json({ message: "Missing one or more required fields." });
	}
	
	try {
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
	
	if (user.rows.length === 0) {
            return res.status(400).json({ message: "No account found under that username." });
        }
		
	const isValidPassword = await bcrypt.compare(password, user.rows[0].hashpasswd);
		
	if (!isValidPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
		
	const accessToken = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, role: "authenticated" }, JWT_SECRET, { expiresIn: "1h" });
		
		
		// Create a long-lived refresh token
		let refreshToken = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, role: "authenticated" }, process.env.REFRESH_SECRET, { expiresIn: "30d" });

		// Store refresh token in database
		await pool.query(
			"INSERT INTO user_sessions (user_id, refresh_token) VALUES ($1, $2)",
			[user.rows[0].id, refreshToken]
		);

		// Send refresh token in httpOnly cookie
		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", // Only send over HTTPS
			sameSite: "Strict",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	res.json({ accessToken, user: { id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, role: "authenticated" } });
    	} catch (error) {
	    res.status(500).json({ message: "Error logging in", error });
    }

	
});

// logout user
router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

    await pool.query("DELETE FROM user_sessions WHERE refresh_token = $1", [refreshToken]);
	
    res.clearCookie("refresh_token", {
	httpOnly: true,
	secure: true,
	sameSite: "Strict",
    });

    res.json({ message: "Logged out successfully" });
});

//logout all
router.post("/logout-all", async (req, res) => {
    const userId = req.user.id; // Assuming user is authenticated

    await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);

    res.clearCookie("refresh_token");
    res.json({ message: "Logged out from all devices" });
});

//refresh token
router.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    console.log("Got refresh token request");
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const session = await pool.query(
            "SELECT * FROM user_sessions WHERE user_id = $1 AND refresh_token = $2",
            [decoded.id, refreshToken]
        );

        if (!session.rows.length) return res.status(403).json({ error: "Invalid refresh token" });

        const newAccessToken = jwt.sign({ id: decoded.id, username: decoded.username, avatar: decoded.avatar, role: "authenticated" }, process.env.JWT_SECRET, { expiresIn: "1h" });

	await pool.query(
	    "UPDATE user_sessions SET refresh_token = $1 WHERE id = $2",
	    [refreshToken, session.rows[0].id]
	);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}

router.get("/me", authenticateToken, async (req, res) => {
    if (!req.user) {
	console.log("whar");
        return res.status(401).json({ message: "Not authenticated" });
    }
    console.log(req.user.username);
    res.json({ id: req.user.id, username: req.user.username, avatar: req.user.avatar });
});


router.get("/profile/:username", async (req, res) => {
    const username = req.params.username;

    try {
	const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

	if (user.rows.length === 0) {
	    return res.status(404).json({ error: "User not found" });
	}
	
	console.log(user.rows[0].bio);
	res.json({ user: { id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, bio: user.rows[0].bio, field1: user.rows[0].field1, field2: user.rows[0].field2, pronouns: user.rows[0].pronouns, created_at: user.rows[0].created_at } });
    } catch (err) {
	console.error("Error fetching user: ", err);
	res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;
