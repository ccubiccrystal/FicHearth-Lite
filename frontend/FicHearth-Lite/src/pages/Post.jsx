import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "./parts/Navbar";

export default function Home({handleLogout, user}) {

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [notifs, setNotifs] = useState("");
    const [unread, setUnread] = useState("");

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

    const handlePost = async () => {
	try {
	    const result = await api.post("/api/post", { title, content, tags });
	    console.log("Post ID: " + result.data.id);
	    navigate("/");
	} catch (err) {
	    console.error("Failed to create post ", error);
	}
    }

    const handleKeyDown = (event) => {
      if (event.key === "," || event.key === "Enter") {
        event.preventDefault();
        const newTag = tagInput.trim();
        if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
        }
        setTagInput(""); // Clear input field
      }
    };

    const handleRemoveTag = (tagRemoved) => {
      setTags(tags.filter((tag) => tag !== tagRemoved));
    };


    return (

        <div>
            <div id="wrapper">
    
            <div id="collect"><div id="main">
      	        <div className="newpost">
                  
      
	
	    <textarea
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        id="titleinput"
	    /><br/>
	    <textarea
        placeholder="Compose a post!"
        value={content}
        rows={10}
        onChange={(e) => setContent(e.target.value)}
        id="contentinput"
	    />
      <div>
        {tags.map((tag, index) => (
          <span key={index} class="tag">
            {tag} <button class="tagx" onClick={() => handleRemoveTag(tag)}>x</button>
          </span>
        ))}
      </div>
	    <textarea
        placeholder="Add tags (comma or enter between each tag)"
        value={tagInput}
        rows={1}
        onKeyDown={handleKeyDown}
        onChange={(e) => setTagInput(e.target.value)}
        id="taginput"
	    /><br/>
	    <button id="postbutton" type="button" onClick={handlePost}>Post</button>
		
        
        </div>
      
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
      

      
    </div>
      
    <div id="footer">
    </div>        </div>
    );
}
