import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./parts/Navbar";
import api from "../api";

export default function EditPost({handleLogout, user}) {

    const navigate = useNavigate();
    const { post_id } = useParams();

    const [title, setTitle] = useState(""); // Title of post.
    const [content, setContent] = useState(""); // Content of post.
    const [loading, setLoading] = useState(true); // Handles page loading. This possibly could be optimized.
	const [notifs, setNotifs] = useState(""); // Handles notifications. Should be moved to Navbar later.
	const [unread, setUnread] = useState(""); // Handles unread notifications. Should be moved to Navbar later.

	// Handles logout. Should probably be moved to App.
    const logout = async () => {
    	try {
			await handleLogout();
			localStorage.setItem("accessToken", null);
			navigate("/auth/login");	
		} catch (error) {
			console.error("Logout failed", error);
		}
    }

	// Loads the post.
    useEffect(() => {
		async function loadPost() {
			try {
				if (post_id != null) {
					console.log("POST ID " + post_id);
					const post = await api.get(`/api/onepost?post_id=${post_id}`);
					if (post.data.posts.username === user.username) {
						setTitle(post.data.posts.title);
						setContent(post.data.posts.content);
						setLoading(false);
					} else {
						console.log("USERNAME?? " + post.data.posts.username + " " + user.username);
						console.log(post);
						navigate("/");
					}
				} else {
					console.log("POST??? " + post_id);
					navigate("/");
				}
			} catch (err) {
				console.error("Failed to load profile info ", error);
			}
		}
		loadPost();
    }, []);

	// Handles edits of post.
    const handleEdit = async (post_id) => {
		try {
			const result = await api.put("/api/post/edit", { post_id, title, content });
			console.log("Post ID: " + result.data.id);
			navigate("/");
		} catch (err) {
			console.error("Failed to create post ", error);
		}
    }

	// Handles page loading so that things don't try to load before they've arrived from the backend.
    if (loading) {
		return <div>loading...</div>
    }


    return (
        <div>
            <div id="wrapper">

    			<div id="collect">

					<div id="main">

						<div className="editbox">
							<textarea
								type="text"
								placeholder="Post title"
								rows={1}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/><br/>
							<textarea
								placeholder="Compose a post!"
								value={content}
								rows={10}
								onChange={(e) => setContent(e.target.value)}
								id="contentinput"
							/><br/>
							<button class="editsubmit" type="button" onClick={() => handleEdit(post_id)}>Edit</button>
						</div>

					</div>

					<Navbar user={user} logout={logout} notifs={notifs} unread={unread} setUnread={setUnread} />

					<div id="sidebar-outline">

						<div id="sidebar">
							<div id="announcements" className="sb-box">
								<h1 style={{color:"white"}}>-= Announcements =-</h1>
								<p>{user?.username}</p>
							</div>

							<div id="rules" className="sb-box">
								<h1 style={{color:"white"}}>-= Rules =-</h1>
							</div> 
						</div>

					</div>
		
					<div id="menu">
					</div>
		
				</div>
			</div>
      
			<div id="footer">
			</div>        
		</div>
    );
}
