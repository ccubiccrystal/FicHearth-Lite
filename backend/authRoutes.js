const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

const router = express.Router();
const pool = new Pool({ 
	user: DB_USER,
	host: DB_HOST,
	database: DB_NAME,
	password: DB_PASSWORD,
	port: DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const SITE_URL = process.env.SITE_URL || 'http://localhost:5000';

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

// register user
router.post("/register", async (req, res) => {
	
	const {email, username, password, access_key } = req.body;
	
	if (!username || !email || !password || !access_key) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-001 REGISTER_MISSING_FIELD",
			route: "/auth/register",
			method: req.method,
			message: "Couldn't register user.",
		  });
		return res.status(400).json({message: "Missing one or more required fields. [Code: 0-001 REGISTER_MISSING_FIELD]"});
	}
	
	try {
		
		const userExists = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
		const keyExists = await pool.query("SELECT * FROM keys WHERE key = $1 AND used < uses", [access_key]);

		if (keyExists.rows.length < 1) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "0-003 REGISTER_INVALID_KEY",
				route: "/auth/register",
				method: req.method,
				message: "Couldn't register user.",
			  });
			return res.status(400).json({ message: "Not a valid registration key. [Code: 0-003 REGISTER_INVALID_KEY"});
		} else {
			let used = keyExists.rows[0].used + 1;
			await pool.query("UPDATE keys SET used = $1 WHERE key = $2", [used, access_key]);
		}
		
		if (userExists.rows.length > 0) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "0-002 REGISTER_USER_EXISTS",
				route: "/auth/register",
				method: req.method,
				message: "Couldn't register user.",
			  });
			return res.status(400).json({ message: "Username or email already in use. [Code: 0-002 REGISTER_USER_EXISTS"});
		}
		
		const hashedPassword = await bcrypt.hash(password, 10);
		
		const url = `${SITE_URL}/users/${username}`;
	
		const result = await pool.query(
			"INSERT INTO users (username, email, hashpasswd) VALUES ($1, $2, $3) RETURNING id, username, email",
			[username, email, hashedPassword]
		);
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Registered user.");
		res.status(201).json({ message: "User registered", user: result.rows[0] });
    } catch (error) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "Code 0-099 REGISTER_ERROR",
			route: "/auth/register",
			method: req.method,
			message: "Couldn't register user.",
			stack: error.stack,
		  });
        res.status(500).json({ message: "Error registering user. [Code: 0-099 REGISTER_ERROR] ", error });
    }
});

// login user
router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	
	if (!username || !password) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-101 LOGIN_MISSING_FIELD",
			route: "/auth/login",
			method: req.method,
			message: "Couldn't login.",
		  });
		return res.status(400).json({ message: "Missing one or more required fields. [Code: 0-101 LOGIN_MISSING_FIELD]" });
	}
	
	try {
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

		const roles = await pool.query(
			`SELECT
				ARRAY_AGG(r.rank_name) AS roles,
				BOOL_OR(r.can_ban) AS can_ban,
				BOOL_OR(r.can_restrict) AS can_restrict,
				BOOL_OR(r.can_alter_tags) AS can_alter_tags,
				BOOL_OR(r.can_delete_posts) AS can_delete_posts,
				BOOL_OR(r.can_manage_roles) AS can_manage_roles
			FROM userroles ur
			JOIN roles r ON ur.role_id = r.id
			WHERE ur.user_id = $1`,
			[user.rows[0].id]
		)
	
		if (user.rows.length === 0) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "Code 0-103 LOGIN_INVALID_CREDENTIALS",
				route: "/auth/login",
				method: req.method,
				message: "Couldn't login.",
			  });
			return res.status(400).json({ message: "No account found under that username. [Code: 0-102 LOGIN_NO_USER" });
		}
			
		const isValidPassword = await bcrypt.compare(password, user.rows[0].hashpasswd);
			
		if (!isValidPassword) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "Code 0-103 LOGIN_INVALID_CREDENTIALS",
				route: "/auth/login",
				method: req.method,
				message: "Couldn't login.",
			  });
			return res.status(400).json({ message: "Invalid credentials. [Code: 0-103 LOGIN_INVALID_CREDENTIALS]" });
		}
			
		const accessToken = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, staff: user.rows[0].is_staff, owner: user.rows[0].is_owner, roles: roles.rows[0], role: "authenticated" }, JWT_SECRET, { expiresIn: "1h" });
		
		
		// Create a long-lived refresh token
		let refreshToken = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, staff: user.rows[0].is_staff, owner: user.rows[0].is_owner, roles: roles.rows[0], role: "authenticated" }, process.env.REFRESH_SECRET, { expiresIn: "30d" });

		// Store refresh token in database
		await pool.query(
			"INSERT INTO user_sessions (user_id, refresh_token) VALUES ($1, $2)",
			[user.rows[0].id, refreshToken]
		);

		// Send refresh token in httpOnly cookie
		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "Strict",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Logged in user " + username + ".");
		res.json({ accessToken, user: { id: user.rows[0].id, username: user.rows[0].username, avatar: user.rows[0].avatar, staff: user.rows[0].is_staff, owner: user.rows[0].is_owner, roles: roles.rows[0], role: "authenticated" } });
    } catch (error) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-199 LOGIN_ERROR",
			route: "/auth/login",
			method: req.method,
			message: "Couldn't login user.",
			stack: error.stack,
		});
	    res.status(500).json({ message: "Error logging in. [Code: 0-199 LOGIN_ERROR] ", error });
    }

	
});

// logout user
router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "1-001 TOKEN_MISSING",
			route: "/auth/refresh-token",
			method: req.method,
			message: "Authentication error.",
		  });
		return res.status(401).json({ error: "No refresh token. [Code: 1-001 TOKEN_MISSING" });
	}

    await pool.query("DELETE FROM user_sessions WHERE refresh_token = $1", [refreshToken]);
	
    res.clearCookie("refresh_token", {
		httpOnly: true,
		secure: true,
		sameSite: "Strict",
    });
	console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Logged out successfully.");
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
    if (!refreshToken) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "1-001 TOKEN_MISSING",
			route: "/auth/refresh-token",
			method: req.method,
			message: "Authentication error.",
		  });
		return res.status(401).json({ error: "No refresh token. [Code: 1-001 TOKEN_MISSING" });
	}

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const session = await pool.query(
            "SELECT * FROM user_sessions WHERE user_id = $1 AND refresh_token = $2",
            [decoded.id, refreshToken]
        );

        if (!session.rows.length) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "1-002 INVALID_TOKEN",
				route: "/auth/refresh-token",
				method: req.method,
				message: "Authentication error.",
			  });
			return res.status(403).json({ error: "Invalid refresh token. [Code: 1-002 INVALID_TOKEN" });
		}

        const newAccessToken = jwt.sign({ id: decoded.id, username: decoded.username, avatar: decoded.avatar, staff: decoded.staff, owner: decoded.owner, roles: decoded.roles, role: "authenticated" }, process.env.JWT_SECRET, { expiresIn: "1h" });

		await pool.query(
			"UPDATE user_sessions SET refresh_token = $1 WHERE id = $2",
			[refreshToken, session.rows[0].id]
		);

		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Refreshed access token.");
        res.json({ accessToken: newAccessToken });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "1-002 INVALID_TOKEN",
			route: "/auth/refresh-token",
			method: req.method,
			message: "Problem with token.",
			stack: err.stack,
		  });
        res.status(403).json({ error: "Invalid or expired refresh token. [Code: 1-099 TOKEN_ERROR" });
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
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "1-198 NO_ACCESS",
			route: "/auth/me",
			method: req.method,
			message: "User not logged in.",
		  });
        return res.status(401).json({ message: "User not logged in. [Code: 1-198 NO_ACCESS]" });
    }
	console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched self info.");
    res.json({ id: req.user.id, username: req.user.username, avatar: req.user.avatar, roles: req.user.roles, staff: req.user.staff, owner: req.user.owner });
});


router.get("/profile/:username", authenticateToken, async (req, res) => {
    const username = req.params.username;

    try {
		const user = await pool.query(
			`SELECT 
				users.id, 
				users.username,
				users.avatar,
				users.bio,
				users.field1,
				users.field2,
				users.aliases,
				users.created_at,
				COALESCE(array_agg(follows.follower_id) FILTER (WHERE follows.follower_id IS NOT NULL), '{}') AS followers,
				BOOL_OR(follows.follower_id = $2) AS is_following
			FROM users
			LEFT JOIN follows ON users.id = follows.followed_id
			WHERE username = $1
			GROUP BY users.id`, 
			[username, req.user.id]);

		if (user.rows.length === 0) {
			console.error({
				timestamp: new Date().toISOString(),
				errorCode: "0-301 USER_NOT_FOUND",
				route: "/auth/profile",
				method: req.method,
				message: "User not found.",
			  });
			return res.status(404).json({ error: "User not found. [Code: 0-301 USER_NOT_FOUND]" });
		}
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched profile.");
		res.json({ user: user.rows[0] });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-398 USER_FETCH_ERROR",
			route: "/auth/profile",
			method: req.method,
			message: "Error fetching profile.",
			stack: err.stack,
		  });
		res.status(500).json({ error: "Error fetching profile. [Code: 0-398 USER_FETCH_ERROR]" });
    }
});

router.get("/roles", authenticateToken, async (req, res) => {
	const id = req.params.user_id;
	let user_id = id;z

	if (!id) {
		user_id = req.user.id;
	}

	try {
		const roles = await pool.query(
			`SELECT
				ARRAY_AGG(r.role_name) AS roles,
				BOOL_OR(r.can_ban) AS can_ban,
				BOOL_OR(r.can_restrict) AS can_restrict,
				BOOL_OR(r.can_alter_tags) AS can_alter_tags,
				BOOL_OR(r.can_delete_posts) AS can_delete_posts,
				BOOL_OR(r.can_manage_roles) AS can_manage_roles
			FROM user_roles ur
			JOIN roles r ON ur.role_id = r.id
			WHERE ur.user_id = $1`,
			[user_id]
		)
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched roles.");
		res.json({ roles: roles.rows[0] });
	} catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-399 USER_INFORMATION ERROR",
			route: "/auth/roles",
			method: req.method,
			message: "Couldn't get roles.",
			stack: err.stack,
		  });
		res.status(500).json({ error: "Couldn't get roles. [Code 0-399 USER_INFORMATION_ERROR"});
	}
});


module.exports = router;
