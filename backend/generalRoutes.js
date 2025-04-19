const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const sanitizeHtml = require("sanitize-html");

dotenv.config();

const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT;

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

	const { title, content, tags } = req.body;

	if (!content) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-001 POST_NO_CONTENT",
			route: "/api/post",
			method: req.method,
			message: "No post content.",
		});
	    return res.status(400).json({ error: "Your post needs content! [Code: 2-001 POST_NO_CONTENT]" });
	}

	let useTitle = null;

	if (title) {
	    useTitle = title;
	}

    const clean = sanitizeHtml(content, {
        allowedTags: [
            'b', 'i', 'em', 'strong', 'u',
            'a', 'ul', 'ol', 'li', 'p', 'br',
            'blockquote', 'code', 'pre', 'img'
          ],
          allowedAttributes: {
            a: ['href', 'name', 'target'],
            img: ['src', 'alt', 'title']
          },
          allowedSchemes: ['http', 'https', 'data'],
          allowedSchemesByTag: {
            img: ['http', 'https', 'data']
          },
          transformTags: {
            'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
            'img': sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
          }
    });

	try {
	    const result = await pool.query(
		"INSERT INTO posts (author_id, title, content, nsfw, sensitive) VALUES ($1, $2, $3, false, false) RETURNING id",
		[req.user.id, useTitle, clean]
	    );

        const lastTag = await pool.query(
            `SELECT id FROM tags
            ORDER BY id DESC
            LIMIT 1;`
        );

        await pool.query(
            `SELECT setval('tags_id_seq', $1);`,
            [lastTag.rows[0].id]
        );

        const tagResults = await pool.query(
            `WITH new_tags AS (
                INSERT INTO tags (name)
                SELECT unnest($1::text[])
                ON CONFLICT (name) DO NOTHING
                RETURNING id, name
            )
            SELECT id, name FROM new_tags
            UNION ALL
            SELECT id, name FROM tags WHERE name = ANY($1)`,
            [tags]
        );
        

        const postId = result.rows[0].id;
        const tagIds = tagResults.rows.map(row => row.id);

        await pool.query(
            "INSERT INTO posttags (post_id, tag_id) SELECT $1, unnest($2::int[])",
            [postId, tagIds]
        );

		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Created post.");
	    res.json({ result: result.rows[0].id });
	} catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-099 POST_ERROR",
			route: "/api/post",
			method: req.method,
			message: "Error creating post.",
			stack: err.stack,
		});
	    res.status(500).json({ error: "Error creating post. [Code: 2-099 POST_ERROR]" });
	}

});

router.get("/posts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const offset = (page - 1) * limit; 
    const orderraw = req.query.order;
    let result;

    try {
        switch (orderraw) {
            case ("likes"):
                result = await pool.query(
                    `SELECT 
                        posts.id, 
                        posts.title, 
                        posts.content, 
                        users.id AS author_id, 
                        users.username, 
                        posts.created_at, 
                        users.avatar, 
                        BOOL_OR(likes.user_id = $1) AS has_liked, 
                        COUNT(likes.post_id) AS like_count FROM posts 
                    JOIN users ON posts.author_id = users.id 
                    LEFT JOIN likes ON posts.id = likes.post_id 
                    GROUP BY posts.id, users.id 
                    ORDER BY 
                        like_count DESC, 
                        posts.created_at DESC 
                    LIMIT $2 OFFSET $3`,
                    [req.user.id, limit, offset]
                );
                break;
            default: 
                result = await pool.query(
                    `SELECT 
                        posts.id, 
                        posts.title, 
                        posts.content, 
                        users.id AS author_id, 
                        users.username, 
                        posts.created_at, 
                        users.avatar, 
                        users.is_staff,
                        users.is_owner,
                        BOOL_OR(likes.user_id = $1) AS has_liked, 
                        COUNT(DISTINCT likes.user_id) AS like_count, 
                        COUNT(DISTINCT comments.id) AS comment_count,
                        COALESCE(JSONB_AGG(DISTINCT jsonb_build_object('id', tags.id, 'name', tags.name)) 
                            FILTER (WHERE tags.id IS NOT NULL), '[]') AS tags,
                        BOOL_OR(follows.follower_id = $1) AS is_following
                    FROM posts 
                    JOIN users ON posts.author_id = users.id 
                    LEFT JOIN likes ON posts.id = likes.post_id 
                    LEFT JOIN posttags ON posts.id = posttags.post_id 
                    LEFT JOIN tags ON posttags.tag_id = tags.id 
		            LEFT JOIN follows ON users.id = follows.followed_id
                    LEFT JOIN comments ON posts.id = comments.post_id
                    GROUP BY posts.id, users.id 
                    ORDER BY posts.created_at 
                    DESC LIMIT $2 OFFSET $3`,
                    [req.user.id, limit, offset]
                );
                break;
        }
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched posts.");
        res.json({ posts: result.rows });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-098 POST_FETCH_ERROR",
			route: "/api/posts",
			method: req.method,
			message: "Error fetching posts.",
			stack: err.stack,
		});
        res.status(500).json({ error: "Error fetching posts. [Code: 2-098 POST_FETCH_ERROR]" });
    }
});

router.post("/like", authenticateToken, async (req, res) => {
    
    const { post_id, author_id } = req.body;

    try {
        const liked = await pool.query(
            "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
            [ req.user.id, post_id ]
        );
        if (liked.rows.length === 0) {
            await pool.query(
                "INSERT INTO likes (post_id, user_id) VALUES ($1, $2)",
                [ post_id, req.user.id ]
            );
            await pool.query(
                "INSERT INTO notifs (recipient_id, source_username, post_id, type) VALUES ($1, $2, $3, 'like')",
                [ author_id, req.user.username, post_id ]
            );
        } else {
            await pool.query(
                "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
                [ req.user.id, post_id ]
            );
                const result = await pool.query(
                    "DELETE FROM notifs WHERE post_id = $1 AND source_username = $2",
                [post_id, req.user.username]
            );
        }
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Liked post.");
        res.json({ success: true, message: "Liked successfully" });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-399 LIKE_ERROR",
			route: "/api/like",
			method: req.method,
			message: "Like failed.",
			stack: err.stack,
		});
	    res.status(500).json({ error: "Like failed. [Code: 2-399 LIKE_ERROR]" });
    }
});

router.post("/follow", authenticateToken, async (req, res) => {
    
    const { user_id } = req.body;

    try {
        const liked = await pool.query(
            "SELECT * FROM follows WHERE follower_id = $1 AND followed_id = $2",
            [ req.user.id, user_id ]
        );
        if (liked.rows.length === 0) {
            await pool.query(
                "INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)",
                [ req.user.id, user_id ]
            );
            await pool.query(
                "INSERT INTO notifs (recipient_id, source_username, type) VALUES ($1, $2, 'follow')",
                [ user_id, req.user.username ]
            );
        } else {
            await pool.query(
                "DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2",
                [ req.user.id, user_id ]
            );
            const result = await pool.query(
                "DELETE FROM notifs WHERE recipient_id = $1 AND source_username = $2 AND type = 'follow'",
                [user_id, req.user.username]
            );
        }
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Followed user.");
	    res.json({ success: true, message: "Followed successfully" });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-398 FOLLOW_ERROR",
			route: "/api/follow",
			method: req.method,
			message: "Follow failed.",
			stack: err.stack,
		});
	    res.status(500).json({ error: "Follow failed. [Code: 2-399 FOLLOW_ERROR]" });
    }
});

router.get("/newusers", authenticateToken, async (req, res) => {

    try {
	    const result = await pool.query(
	        "SELECT username, avatar FROM users ORDER BY users.created_at DESC LIMIT 5"
	    );
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched new users.");
	    res.json({ users: result.rows });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "0-398 USER_FETCH_ERROR",
			route: "/api/newusers",
			method: req.method,
			message: "Failed to fetch new users.",
			stack: err.stack,
		});
	    res.status(500).json({ error: "Failed to fetch new users. [Code: 0-398 USER_FETCH_ERROR]" });
    }

});

router.get("/user/posts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const username = req.query.username;
    const offset = (page - 1) * limit; 

    try {
        const result = await pool.query(
            `SELECT 
                posts.id, 
                posts.title,
                posts.content, 
                users.id AS author_id, 
                users.username, 
                posts.created_at, 
                users.avatar, 
                BOOL_OR(likes.user_id = $1) AS has_liked, 
                COUNT(DISTINCT likes.user_id) AS like_count, 
                COALESCE(JSONB_AGG(DISTINCT jsonb_build_object('id', tags.id, 'name', tags.name)) 
                    FILTER (WHERE tags.id IS NOT NULL), '[]') AS tags,
                BOOL_OR(follows.follower_id = $1) AS is_following
            FROM posts 
            JOIN users ON posts.author_id = users.id 
            LEFT JOIN likes ON posts.id = likes.post_id 
            LEFT JOIN posttags ON posts.id = posttags.post_id 
            LEFT JOIN tags ON posttags.tag_id = tags.id 
		    LEFT JOIN follows ON users.id = follows.followed_id
            WHERE users.username = $2 
            GROUP BY posts.id, users.id 
            ORDER BY posts.created_at 
            DESC LIMIT $3 OFFSET $4`,
            [req.user.id, username, limit, offset]
        );
		console.log(formatTimestamp(Date.now()) + ": \x1b[32mSUCCESS:\x1b[0m Fetched posts.");
        res.json({ posts: result.rows });
    } catch (err) {
		console.error({
			timestamp: new Date().toISOString(),
			errorCode: "2-098 POST_FETCH_ERROR",
			route: "/api/post",
			method: req.method,
			message: "Failed to fetch posts.",
			stack: err.stack,
		});
        res.status(500).json({ error: "Failed to fetch posts. [Code: 2-098 POST_FETCH_ERROR]" });
    }
});

router.put("/deletepost", authenticateToken, async (req, res) => {
    const { post_id, post_author, can_delete } = req.body;

    if (req.user.username === post_author || can_delete) {
        try {
            const result = await pool.query(
                "DELETE FROM posts WHERE id = $1",
                [ post_id ]
            );
            res.status(200).json({ success: true, message: "Deleted successfully" });
        } catch (err) {
            console.error({
                timestamp: new Date().toISOString(),
                errorCode: "2-010 POST_COULDNT_DELETE",
                route: "/api/deletepost",
                method: req.method,
                message: "Error deleting post.",
                stack: err.stack,
            });
	        res.status(500).json({ error: "Error deleting post. [Code: 2-010 POST_COULDNT_DELETE"});
	    }
    } else {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "1-199 NOT_AUTHORIZED",
            route: "/api/deletepost",
            method: req.method,
            message: "Unauthorized.",
        });
	    res.status(403).json({ error: "You must own the post to delete it. [Code: 1-199 NOT_AUTHORIZED]" });
    } 
});

router.put("/editprofile", authenticateToken, async (req, res) => {
    const { avatar, bio, aliases, field1, field2 } = req.body;

    try {

        const cleanbio = sanitizeHtml(bio, {
            allowedTags: [
                'b', 'i', 'em', 'strong', 'u',
                'a', 'ul', 'ol', 'li', 'p', 'br',
                'blockquote', 'code', 'pre'
              ],
              allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src', 'alt', 'title']
              },
              allowedSchemes: ['http', 'https', 'data'],
              allowedSchemesByTag: {
                img: ['http', 'https', 'data']
              },
              transformTags: {
                'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
                'img': sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
              }
        });

        const cleanaliases = sanitizeHtml(aliases, {
            allowedTags: [
                'b', 'i', 'em', 'strong', 'u',
                'a', 'ul', 'ol', 'li', 'p', 'br',
                'blockquote', 'code', 'pre'
              ],
              allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src', 'alt', 'title']
              },
              allowedSchemes: ['http', 'https', 'data'],
              allowedSchemesByTag: {
                img: ['http', 'https', 'data']
              },
              transformTags: {
                'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
                'img': sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
              }
        });

        const cleanfield1 = sanitizeHtml(field1, {
            allowedTags: [
                'b', 'i', 'em', 'strong', 'u',
                'a', 'ul', 'ol', 'li', 'p', 'br',
                'blockquote', 'code', 'pre'
              ],
              allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src', 'alt', 'title']
              },
              allowedSchemes: ['http', 'https', 'data'],
              allowedSchemesByTag: {
                img: ['http', 'https', 'data']
              },
              transformTags: {
                'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
                'img': sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
              }
        });

        const cleanfield2 = sanitizeHtml(field2, {
            allowedTags: [
                'b', 'i', 'em', 'strong', 'u',
                'a', 'ul', 'ol', 'li', 'p', 'br',
                'blockquote', 'code', 'pre'
              ],
              allowedAttributes: {
                a: ['href', 'name', 'target'],
                img: ['src', 'alt', 'title']
              },
              allowedSchemes: ['http', 'https', 'data'],
              allowedSchemesByTag: {
                img: ['http', 'https', 'data']
              },
              transformTags: {
                'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
                'img': sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
              }
        });

        await pool.query(
            "UPDATE users SET avatar = $1, bio = $2, aliases = $3, field1 = $4, field2 = $5 WHERE id = $6;",
            [ avatar, cleanbio, cleanaliases, cleanfield1, cleanfield2, req.user.id ]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "0-399 USER_INFORMATION_ERROR",
            route: "/api/deletepost",
            method: req.method,
            message: "Failed to edit profile.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to edit profile. [Code 0-399 USER_INFORMATION_ERROR]" });
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
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-011 POST_COULDNT_EDIT",
            route: "/api/post/edit",
            method: req.method,
            message: "Failed to edit post.",
            stack: err.stack,
        });
	    res.status(500).json({ error: "Failed to edit post. [Code: 2-011 POST_COULDNT_EDIT]" });
    }

});

router.get("/onepost", authenticateToken, async (req, res) => {
    const { post_id } = req.query;

    try {
        const result = await pool.query(
            `SELECT 
                posts.id, 
                posts.title, 
                posts.content, 
                users.id AS author_id, 
                users.username, 
                posts.created_at, 
                users.avatar, 
                BOOL_OR(likes.user_id = $1) AS has_liked, 
                COUNT(DISTINCT likes.user_id) AS like_count, 
                COALESCE(JSONB_AGG(DISTINCT jsonb_build_object('id', tags.id, 'name', tags.name)) 
                    FILTER (WHERE tags.id IS NOT NULL), '[]') AS tags,
                BOOL_OR(follows.follower_id = $1) AS is_following
            FROM posts 
            JOIN users ON posts.author_id = users.id 
            LEFT JOIN likes ON posts.id = likes.post_id 
            LEFT JOIN posttags ON posts.id = posttags.post_id 
            LEFT JOIN tags ON posttags.tag_id = tags.id 
		    LEFT JOIN follows ON users.id = follows.followed_id
            WHERE posts.id = $2 
            GROUP BY posts.id, users.id`,
            [req.user.id, post_id]
        );
        res.json({ posts: result.rows[0] });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-098 POST_FETCH_ERROR",
            route: "/api/onepost",
            method: req.method,
            message: "Failed to fetch single post.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to fetch single post. [Code: 2-098 POST_FETCH_ERROR]" });
    }
});

router.get("/likedposts", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const offset = (page - 1) * limit; 

    try {
        const result = await pool.query(
            `SELECT 
                posts.id, 
                posts.title, 
                posts.content, 
                users.id AS author_id, 
                users.username, 
                posts.created_at, 
                users.avatar, 
                TRUE AS has_liked, 
                COUNT(likes.post_id) AS like_count, 
                likes.created_at AS liked_at,
                COUNT(DISTINCT likes.user_id) AS like_count, 
                COALESCE(JSONB_AGG(DISTINCT jsonb_build_object('id', tags.id, 'name', tags.name)) 
                    FILTER (WHERE tags.id IS NOT NULL), '[]') AS tags,
                BOOL_OR(follows.follower_id = $1) AS is_following
            FROM posts 
            JOIN users ON posts.author_id = users.id 
            JOIN likes ON posts.id = likes.post_id 
            LEFT JOIN posttags ON posts.id = posttags.post_id 
            LEFT JOIN tags ON posttags.tag_id = tags.id 
		    LEFT JOIN follows ON users.id = follows.followed_id
            WHERE likes.user_id = $1 
            GROUP BY posts.id, users.id, likes.created_at 
            ORDER BY likes.created_at 
            DESC LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );
        res.json({ posts: result.rows });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-098 POST_FETCH_ERROR",
            route: "/api/likedposts",
            method: req.method,
            message: "Failed to fetch liked posts.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to fetch liked posts. [Code: 2-098 POST_FETCH_ERROR]" });
    }
});

router.get("/comments", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) - 1 || 0; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const post_id = parseInt(req.query.post_id);
    
    try { 
        const result = await pool.query(
            "SELECT comments.id, comments.content, comments.created_at, users.username, users.avatar FROM comments JOIN users ON comments.author_id = users.id WHERE post_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3",
            [post_id, limit, page]
        );
        res.status(200).json({ comments: result.rows });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-198 COMMENT_FETCH_ERROR",
            route: "/api/comments",
            method: req.method,
            message: "Failed to fetch comments.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to fetch comments. [Code: 2-198 COMMENT_FETCH_ERROR]" });
    }
});

router.post("/comment", authenticateToken, async (req, res) => {
    const { newComment, post_id, post } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO comments (content, post_id, author_id) VALUES ($1, $2, $3)",
            [newComment, post_id, req.user.id]
        );
        await pool.query(
            "INSERT INTO notifs (recipient_id, source_username, post_id, type) VALUES ($1, $2, $3, 'comment')",
            [ post.author_id, req.user.username, post_id ]
        );
        res.status(200).json({ comment: result.rows[0] });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-112 COMMENT_COULDNT_CREATE",
            route: "/api/comment",
            method: req.method,
            message: "Failed to create comment.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to create comment. [Code: 2-112 COMMENT_COULDNT_CREATE]"});
    }
});

router.put("/deletecomment", authenticateToken, async (req, res) => {
    const { comment_id, comment_author, can_delete } = req.body;

    if (req.user.username === comment_author || can_delete) {
        try {
            const result = await pool.query(
                "DELETE FROM comments WHERE id = $1",
                [ comment_id ]
            );
            res.status(200).json({ success: true, message: "Deleted successfully" });
        } catch (err) {
            console.error({
                timestamp: new Date().toISOString(),
                errorCode: "2-110 COMMENT_COULDNT_DELETE",
                route: "/api/deletecomment",
                method: req.method,
                message: "Failed to delete comment.",
                stack: err.stack,
            });
	        res.status(500).json({ error: "Error deleting comment. [Code: 2-110 COMMENT_COULDNT_DELETE]"});
	    }
    } else {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "1-199 NOT_AUTHORIZED",
            route: "/api/deletecomment",
            method: req.method,
            message: "Unathorized to delete comment.",
        });
	    res.status(403).json({ error: "You must own the comment to delete it. [Code: 1-199 NOT_AUTHORIZED]" });
    } 
});

router.get("/notifs", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT notifs.id, notifs.recipient_id, notifs.source_username, notifs.post_id, notifs.type, posts.title, posts.content FROM notifs JOIN posts ON notifs.post_id = posts.id WHERE recipient_id = $1 ORDER BY notifs.created_at DESC LIMIT 20",
            [req.user.id]
        );
        const result2 = await pool.query(
            "SELECT COUNT(*) AS num_unread FROM notifs WHERE recipient_id = $1 AND seen = false",
            [req.user.id]
        );
        res.status(200).json({ notifs: result.rows, unread: result2.rows[0].num_unread });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-299 NOTIFICATIONS_ERROR",
            route: "/api/notifs",
            method: req.method,
            message: "Failed to fetch notifications.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to fetch notifs. [Code: 2-299 NOTIFICATIONS_ERROR]"});
    }
});

router.patch("/notifs/read", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE notifs SET seen = TRUE WHERE recipient_id = $1",
            [req.user.id]
        )
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-299 NOTIFICATIONS_ERROR",
            route: "/api/notifs/read",
            method: req.method,
            message: "Failed to set notifications as read.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to set notifs as read. [Code: 2-299 NOTIFICATIONS_ERROR]"});
    }
});

router.get("/search/tagged", authenticateToken, async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
    const username = req.query.username;
    const offset = (page - 1) * limit;
    const rawtags = req.query.tag;
    var tags = [];

    if (!Array.isArray(rawtags)) {
        tags = [rawtags]; // Convert single tag to array
    } else {
        tags = rawtags;
    }

    try {
        const result = await pool.query(
            `SELECT 
                posts.id, 
                posts.title, 
                posts.content, 
                users.id AS author_id, 
                users.username, 
                posts.created_at, 
                users.avatar, 
                BOOL_OR(likes.user_id = $1) AS has_liked, 
                COUNT(DISTINCT likes.post_id) AS like_count, 
                COALESCE(JSONB_AGG(DISTINCT jsonb_build_object('id', tags.id, 'name', tags.name)) FILTER (WHERE tags.id IS NOT NULL), '[]') AS tags,
                BOOL_OR(follows.follower_id = $1) AS is_following
            FROM posts 
            JOIN users ON posts.author_id = users.id 
            LEFT JOIN likes ON posts.id = likes.post_id 
            LEFT JOIN posttags ON posts.id = posttags.post_id 
            LEFT JOIN tags ON posttags.tag_id = tags.id 
            LEFT JOIN follows ON users.id = follows.followed_id
            WHERE 
                posts.id IN (
                    SELECT post_id
                    FROM posttags
                    JOIN tags ON posttags.tag_id = tags.id
                    WHERE tags.name = ANY($2::TEXT[])
                )
            GROUP BY posts.id, users.id 
            ORDER BY posts.created_at 
            DESC LIMIT $3 OFFSET $4`,
            [req.user.id, tags, limit, offset]
        );
        res.status(200).json({ posts: result.rows });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "2-098 POST_FETCH_ERROR",
            route: "/api/tagged",
            method: req.method,
            message: "Failed to fetch posts by tags.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to fetch posts by tags. [Code: 2-098 POST_FETCH_ERROR]" });
    }
});

router.get("/instanceinfo", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM instanceinfo;
            `
        );
        res.status(200).json({ instance: result.rows[0] });
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "3-001 INSTANCE_INFO_FETCH_ERROR",
            route: "/api/instanceinfo",
            method: req.method,
            message: "Failed to fetch instance info.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to get instance info. [Code: 3-001 INSTANCE_INFO_FETCH_ERROR]" });
    }
});

router.patch("/editinstance", authenticateToken, async (req, res) => {
    try {
        const { name, description, contact, rules } = req.body;
        if (req.user.owner) {
            const result = await pool.query(`
                UPDATE instanceinfo SET name = $1, description = $2, admin_contact = $3, rules = $4
                `,
                [name, description, contact, rules]
            );
            res.status(200).json({ success: true }); 
        } else {
            console.error({
                timestamp: new Date().toISOString(),
                errorCode: "1-199 NOT_AUTHORIZED",
                route: "/api/editinstance",
                method: req.method,
                message: "Unauthorized to edit instance info.",
            });
            res.status(401).json({ error: "You must be administrator to change instance info. [Code: 1-199 NOT_AUTHORIZED]" });
        }
    } catch (err) {
        console.error({
            timestamp: new Date().toISOString(),
            errorCode: "3-002 INSTANCE_EDIT_ERROR",
            route: "/api/editinstance",
            method: req.method,
            message: "Failed to edit instance info.",
            stack: err.stack,
        });
        res.status(500).json({ error: "Failed to edit instance. [Code: 3-002 INSTANCE_EDIT_ERROR]" });
    }
});



module.exports = router;

