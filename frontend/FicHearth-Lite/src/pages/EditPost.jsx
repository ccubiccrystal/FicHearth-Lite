import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function EditPost({handleLogout, user}) {

    const { post_id } = useParams();

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");	
	} catch (error) {
	    console.error("Logout failed", error);
	}
    }

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

    const handleEdit = async (post_id) => {
	try {
	    const result = await api.put("/api/post/edit", { post_id, title, content });
	    console.log("Post ID: " + result.data.id);
	    navigate("/");
	} catch (err) {
	    console.error("Failed to create post ", error);
	}
    }

    if (loading) {
	return <div>loading...</div>
    }


    return (

        <div>
            <div id="wrapper">
    
      <div id="main">
      	        <div className="post">

	
	    <input
		type="text"
		placeholder="Post title"
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
	    <button type="button" onClick={() => handleEdit(post_id)}>Edit</button>
		
        
        </div>
      
      </div>
      
      <div id="navbar">
      
        <button type="button" className="navbutt" onClick={logout}><i className="fa-solid fa-right-to-bracket"></i></button>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-gear"></i></button></a>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-envelope"></i></button></a>
        <Link to={"/post"}><button type="button" className="navbutt"><i className="fa-solid fa-pen"></i></button></Link>
        <button type="button" className="navbutt" id="profbutt"><i className="fa-solid fa-user"></i></button>
        <div className="profdrop">
          <Link to={`/auth/profile/${user?.username}`}>Profile</Link>
          <a href="https://www.tumblr.com/dashboard">Likes</a>
          <a href="https://www.tumblr.com/dashboard">Edit</a>
        </div>
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
        
        
      
      </div>
      
      <div id="menu">
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
