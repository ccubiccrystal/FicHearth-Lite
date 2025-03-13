import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Post from "./parts/Post";
import Comment from "./parts/Comment";

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
    
    const fetchPost = async () => {
	console.log("KILL MEEEEEE " + post_id);
    	const response = await api.get(`/api/onepost?post_id=${post_id}`);
    	setPost(response.data.posts);
	setUsername(response.data.posts.username);
	console.log("THIS SHOULD RUN FIRST: " + post.username);
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

    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");	
	} catch (err) {
	    console.error("Logout failed", err);
	}
    }

    const like = async (post_id) => {
	try {
	    const result = await api.post("/api/like", { post_id });
	    fetchPost(page);
	} catch (err) {
	    console.error("Failed to like post ", err);
	}
    }

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
	    //const result = await api.put("/api/deletepost", { post_id, post_author });
	    //fetchPost(page);
	    //navigate("/");
	    console.log("delete comment");
	} catch (err) {
	    console.error("Failed to delete post ", err);
	}
    }

    const editComment = (comment_id) => {
	//navigate(`/post/edit/${post_id}`);
	console.log("edit comment");
    }

    const addComment = () => {
	console.log(newComment);
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
	<Post user={user} post={post} like={like} deletePost={deletePost} editPost={editPost} />
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
		<button id="commentbutton" type="button" onClick={addComment}>Reply</button>
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
	  <h2>Pronouns:</h2>
	  <p>{profileUser.pronouns}</p>
	  <h2>-----</h2>
	  <p>{profileUser.field1}</p>
	  <h2>-----</h2>
	  <p>{profileUser.field2}</p>
        </div>
        
      </div>
      </div>
	
	

      </div>
      
      <div id="navbar">
      
        <button type="button" className="navbutt" onClick={logout}><i className="fa-solid fa-right-to-bracket"></i></button>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-gear"></i></button></a>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-envelope"></i></button></a>
        <Link to={"/post"}><button type="button" className="navbutt"><i className="fa-solid fa-pen"></i></button></Link>
        <img src={user?.avatar} className="navicon" id="profbutt"/>
        <div className="profdrop">
          <Link to={`/auth/profile/${user?.username}`}>Profile</Link>
          <a href="https://www.tumblr.com/dashboard">Likes</a>
          <a href="https://www.tumblr.com/dashboard">Edit</a>
        </div>
	<p className="navtext">{user?.username}</p>

        
        
      
      </div>
      <div id="icon-outline">
      </div>

      
      <div id="icon">
      <Link to={"/"} style={{display: "inline-block"}}><img src={window.location.origin + "/icon.png"} style={{width:"7vw", marginTop:"2.5vw", marginLeft:"4vw"}}/></Link>
      </div>
      
    </div>
      
    <div id="footer">
    </div>        </div>
    );
}
