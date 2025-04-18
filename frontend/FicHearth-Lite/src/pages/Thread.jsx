import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Post from "./parts/Post";
import Comment from "./parts/Comment";
import Navbar from "./parts/Navbar";

export default function Thread({handleLogout, user}) {

    const { post_id } = useParams();

    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const { page } = useParams();
    const [usePage, setUsePage] = useState(1);
    const [post, setPost] = useState("");
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [newComment, setNewComment] = useState("");
    const [notifs, setNotifs] = useState("");
    const [unread, setUnread] = useState("");
    
    const fetchPost = async () => {
    	const response = await api.get(`/api/onepost?post_id=${post_id}`);
    	setPost(response.data.posts);
		setUsername(response.data.posts.username);
		setLoading(false);
    };

    useEffect(() => {
		async function loadPostData() {
			try {
				const response = await api.get(`/api/onepost?post_id=${post_id}`);
				const response2 = await api.get(`/api/comments?post_id=${post_id}&limit=10&offset=1`);
				setPost(response.data.posts);
				setComments(response2.data.comments);
			
				if (response.data.posts.username) {
					const loadUser = await api.get(`/auth/profile/${response.data.posts.username}`);
					setUsername(response.data.posts.username);
					setProfileUser(loadUser.data.user);
				}

				console.log("has gone here");
				setUsePage(1);
				setLoading(false);

			} catch (err) {
				console.error("Error fetching post data: ", err);
			}
		}
		loadPostData();
    }, [post_id]);

	// Handles logout. Should probably be moved to App.
    const logout = async () => {
    	try {
			await handleLogout();
			localStorage.setItem("accessToken", null);
			navigate("/auth/login");	
		} catch (err) {
			console.error("Logout failed", err);
		}
    }

    // Handles post like. Should be moved to /parts/Post.
    const like = async (post_id) => {
		try {
			const result = await api.post("/api/like", { post_id });
			fetchPost(page);
		} catch (err) {
			console.error("Failed to like post ", err);
		}
    }

    // Handles post delete. Should be moved to /parts/Post.
    const deletePost = async (post_id, post_author) => {
		try {
			const result = await api.put("/api/deletepost", { post_id, post_author });
			fetchPost(page);
			navigate("/");
		} catch (err) {
			console.error("Failed to delete post ", err);
		}
    }

    const editPost = (post_id) => {
		navigate(`/post/edit/${post_id}`);
    }

    const deleteComment = async (comment_id, comment_author) => {
		try {
			navigate(0);
			const result = await api.put("/api/deletecomment", { comment_id, comment_author, can_delete: user.roles.can_delete_posts });
			console.log("delete comment");
		} catch (err) {
			console.error("Failed to delete post ", err);
		}
    }

    const editComment = (comment_id) => {
		//navigate(`/post/edit/${post_id}`);
		console.log("edit comment");
    }

    const addComment = async () => {
        try {
            console.log(newComment);
	        const response = await api.post("/api/comment", { newComment, post_id, post });
            navigate(0);
        } catch (err) {
            console.error("Failed to comment: ", err);
        }
    }

    const observer = new MutationObserver(() => {
        const comments = document.querySelectorAll(".comment");
        comments.forEach((comment, index) => {
            comment.style.zIndex = `${comments.length - index}`;
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });



    if (loading) {
		return <div>loading...</div>
    }

    console.log("... and stops loading");

    return (

        <div>
            <div id="wrapper">
      
      			<div id="collect">      

      				<div id="menu">
      				</div>


      				<div id="main">
      
						<div>
							<Post user={user} post={post} like={like} deletePost={deletePost} editPost={editPost} limited={false} />
								{comments.map((comment) => (
								<Comment user={user} comment={comment} deleteComment={deleteComment} editComment={editComment}/>
							))}
		
							<div className="newcomment comment">
								<div className="newcommentcontent">
									<textarea
										placeholder="Write a reply"
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										id="newcomment"
									/><br/>
									<button id="postbutton" type="button" onClick={addComment}>Reply</button>
								</div>
							</div>


						</div>
      
					</div>
					<div id="sidebar-outline">
			
						<div id="sidebar">
			
							<div id="announcements" className="sb-box">
								<h1 style={{color:"white"}}>-= {username} =-</h1>
								<img src={profileUser.avatar} className="sb-avatar" />
								<p></p>
							</div>
				
							<div id="rules" className="sb-box">
								<h1 style={{color:"white"}}>-= About =-</h1>
								<h2>Bio:</h2>
								<p>{profileUser.bio}</p>
								<h2>Aliases:</h2>
								<p>{profileUser.aliases}</p>
								<h2>-----</h2>
								<p>{profileUser.field1}</p>
								<h2>-----</h2>
								<p>{profileUser.field2}</p>
							</div>
				
						</div>
					</div>
		
		

				</div>
			
				<Navbar user={user} logout={logout} notifs={notifs} unread={unread} setUnread={setUnread} />
		
			</div>
		
			<div id="footer">
			</div>        
		</div>
    );
}
