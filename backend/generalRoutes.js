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


router.post("/post", authenticateToken, async (req, res) => {

	const { title, content } = req.body;

	if (!content) {
	    return res.status(400).json({ error: "Your post needs content!" });
	}

	let useTitle = null;

	if (title) {
	    useTitle = title;
	}

	try {
	    const result = await pool.query(
		"INSERT INTO posts (author_id, title, content, nsfw, sensitive) VALUES ($1, $2, $3, false, false) RETURNING id",
		[req.user.id, useTitle, content]
	    );
	    console.log("Post created: " + result.rows[0].id);
	    res.json({ result: result.rows[0].id });
	} catch (err) {
	    res.status(500).json({ error: "Error creating post." });
	}

});

router.get("/posts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const offset = (page - 1) * limit; 

    try {
        const result = await pool.query(
            "SELECT posts.id, posts.title, posts.content, users.username, posts.created_at, users.avatar, BOOL_OR(likes.user_id = $1) AS has_liked, COUNT(likes.post_id) AS like_count FROM posts JOIN users ON posts.author_id = users.id LEFT JOIN likes ON posts.id = likes.post_id GROUP BY posts.id, users.id ORDER BY posts.created_at DESC LIMIT $2 OFFSET $3",
            [req.user.id, limit, offset]
        );
        res.json({ posts: result.rows });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/like", authenticateToken, async (req, res) => {
    
    const { post_id } = req.body;

    try {
	console.log("Like: " + post_id + " " + req.user.id);
	const liked = await pool.query(
	    "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
	    [ req.user.id, post_id ]
	);
	if (liked.rows.length === 0) {
	    await pool.query(
		"INSERT INTO likes (post_id, user_id) VALUES ($1, $2)",
		[ post_id, req.user.id ]
	    );
	} else {
	    await pool.query(
		"DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
		[ req.user.id, post_id ]
	    );
	}
	res.json({ success: true, message: "Liked successfully" });
    } catch (err) {
	res.status(500).json({ error: "Like failed" });
    }
});

router.get("/newusers", authenticateToken, async (req, res) => {

    try {
	const result = await pool.query(
	    "SELECT username, avatar FROM users ORDER BY users.created_at DESC LIMIT 5"
	);
	res.json({ users: result.rows });
    } catch (err) {
	res.status(500).json({ error: "Failed to fetch new users" });
    }

});

router.get("/user/posts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const username = req.query.username;
    const offset = (page - 1) * limit; 

    console.log("test??????");

    try {
        const result = await pool.query(
            "SELECT posts.id, posts.content, users.username, posts.created_at, users.avatar, BOOL_OR(likes.user_id = $1) AS has_liked, COUNT(likes.post_id) AS like_count FROM posts JOIN users ON posts.author_id = users.id LEFT JOIN likes ON posts.id = likes.post_id WHERE users.username = $2 GROUP BY posts.id, users.id ORDER BY posts.created_at DESC LIMIT $3 OFFSET $4",
            [req.user.id, username, limit, offset]
        );
	console.log(result.rows);
        res.json({ posts: result.rows });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/deletepost", authenticateToken, async (req, res) => {
    const { post_id, post_author } = req.body;

    if (req.user.username === post_author) {
        try {
	    const result = await pool.query(
	        "DELETE FROM posts WHERE id = $1",
		[ post_id ]
	    );
	    console.log("Deleted post " + post_id);
	    res.status(200).json({ success: true, message: "Deleted successfully" });
        } catch (err) {
	    res.status(500).json({ error: "Error deleting post"});
	}
    } else {
	res.status(403).json({ error: "You must own the post to delete it" });
    } 
});

router.put("/editprofile", authenticateToken, async (req, res) => {
    const { bio, pronouns, field1, field2 } = req.body;

    try {
	await pool.query(
	    "UPDATE users SET bio = $1, pronouns = $2, field1 = $3, field2 = $4 WHERE id = $5;",
	    [ bio, pronouns, field1, field2, req.user.id ]
	);
	res.status(200).json({ success: true });
    } catch (err) {
	console.log(err);
	res.status(500).json({ error: "Failed to edit profile" });
    }
    
});

router.put("/post/edit", authenticateToken, async (req, res) => {
    const { post_id, title, content } = req.body;

    try {
	await pool.query(
	    "UPDATE posts SET title = $1, content = $2 WHERE id = $3",
	    [ title, content, post_id ]
	);
	res.status(200).json({ success: true });
    } catch (err) {
	res.status(500).json({ error: "Failed to edit post" });
    }

});

router.get("/onepost", authenticateToken, async (req, res) => {
    const { post_id } = req.query;

    try {
        const result = await pool.query(
            "SELECT posts.id, posts.title, posts.content, users.username, posts.created_at, users.avatar, BOOL_OR(likes.user_id = $1) AS has_liked, COUNT(likes.post_id) AS like_count FROM posts JOIN users ON posts.author_id = users.id LEFT JOIN likes ON posts.id = likes.post_id WHERE posts.id = $2 GROUP BY posts.id, users.id",
            [req.user.id, post_id]
        );
	console.log(post_id);
        res.json({ posts: result.rows[0] });
    } catch (err) {
        console.error("Error fetching post:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/likedposts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const offset = (page - 1) * limit; 

    console.log("test??????");

    try {
        const result = await pool.query(
            "SELECT posts.id, posts.title, posts.content, users.username, posts.created_at, users.avatar, TRUE AS has_liked, COUNT(likes.post_id) AS like_count, likes.created_at AS liked_at FROM posts JOIN users ON posts.author_id = users.id JOIN likes ON posts.id = likes.post_id WHERE likes.user_id = $1 GROUP BY posts.id, users.id, likes.created_at ORDER BY likes.created_at DESC LIMIT $2 OFFSET $3",
            [req.user.id, limit, offset]
        );
	console.log(result.rows);
        res.json({ posts: result.rows });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/comments", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) - 1 || 0; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const post_id = parseInt(req.query.post_id);
    
    try { 
	console.log("Post id = " + post_id + ", page = " + page + ", limit = " + limit);
	const result = await pool.query(
	    "SELECT comments.id, comments.content, comments.created_at, users.username, users.avatar FROM comments JOIN users ON comments.author_id = users.id WHERE post_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3",
	    [post_id, limit, page]
	);
	console.log(result.rows);
	res.status(200).json({ comments: result.rows });
    } catch (err) {
	res.status(500).json({ error: "Server error fetching comments" });
    }
});



module.exports = router;
