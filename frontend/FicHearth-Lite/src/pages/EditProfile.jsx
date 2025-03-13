import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function EditProfile({handleLogout, user}) {

    const navigate = useNavigate();
    const [bio, setBio] = useState("");
    const [pronouns, setPronouns] = useState ("");
    const [field1, setField1] = useState("");
    const [field2, setField2] = useState("");

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
	async function loadProfile() {
	try {
	    const profile = await api.get(`/auth/profile/${user.username}`);
	    setBio(profile.data.user.bio);
	    setPronouns(profile.data.user.pronouns);
	    setField1(profile.data.user.field1);
	    setField2(profile.data.user.field2);
	    setLoading(false);
	} catch (err) {
	    console.error("Failed to load profile info ", error);
	}
	}
	loadProfile();
    }, []);

    const handleEdit = async () => {
	try {
	    const result = await api.put("/api/editprofile", { bio, pronouns, field1, field2 });
	    console.log("Post ID: " + result.data.id);
	    navigate(`/auth/profile/${user.username}`);
	} catch (err) {
	    console.error("Failed to create post ", error);
	}
    }

    if (loading) {
	return <div>loading...</div>;
    }


    return (

        <div>
            <div id="wrapper">
    
      <div id="main">
      	        <div className="post">

	    <textarea
		value={bio}
		rows={10}
		onChange={(e) => setBio(e.target.value)}
		id="bioinput"
	    >{bio}</textarea><br/>
	    <textarea
		value={pronouns}
		rows={10}
		maxlength={32}
		onChange={(e) => setPronouns(e.target.value)}
		id="pronouninput"
	    >{pronouns}</textarea><br/>
	    <textarea
		value={field1}
		rows={10}
		maxlength={32}
		onChange={(e) => setField1(e.target.value)}
		id="field1input"
	    >{field1}</textarea><br/>
	    <textarea
		value={field2}
		rows={10}
		maxlength={32}
		onChange={(e) => setField2(e.target.value)}
		id="field2input"
	    >{field2}</textarea><br/>

	    <button type="button" onClick={handleEdit}>Edit</button>
		
        
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
