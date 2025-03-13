import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Home({handleLogout, user}) {

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");	
	} catch (error) {
	    console.error("Logout failed", error);
	}
    }

    const handlePost = async () => {
	try {
	    const result = await api.post("/api/post", { title, content });
	    console.log("Post ID: " + result.data.id);
	    navigate("/");
	} catch (err) {
	    console.error("Failed to create post ", error);
	}
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
	    <button type="button" onClick={handlePost}>Post</button>
		
        
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
