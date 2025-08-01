import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "./parts/Navbar";

export default function EditProfile({handleLogout, user}) {

    const navigate = useNavigate();

	const [avatar, setAvatar] = useState(""); // For setting avatar URL
    const [bio, setBio] = useState(""); // For setting bio
    const [aliases, setAliases] = useState (""); // For setting aliases
    const [field1, setField1] = useState(""); // For setting optional field 1
    const [field2, setField2] = useState(""); // For setting optional field 2
	const [notifs, setNotifs] = useState(""); // Handles notifications
	const [unread, setUnread] = useState(""); // Handles unread notifications
    const [loading, setLoading] = useState(true); // Handles page loading

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

	// Loads the current user profile for editing purposes
    useEffect(() => {
		async function loadProfile() {
			try {
				const profile = await api.get(`/auth/profile/${user.username}`);
				setAvatar(profile.data.user.avatar);
				setBio(profile.data.user.bio);
				setAliases(profile.data.user.aliases);
				setField1(profile.data.user.field1);
				setField2(profile.data.user.field2);
				setLoading(false);
			} catch (err) {
				console.error("Failed to load profile info ", error);
			}
		}
		loadProfile();
    }, []);

	// Handles editing of the current user info
    const handleEdit = async () => {
		try {
			console.log("AVATAR: " + avatar);
			const result = await api.put("/api/editprofile", { avatar, bio, aliases, field1, field2 });
			console.log("Post ID: " + result.data.id);
			navigate(`/profile/${user.username}`);
		} catch (err) {
			console.error("Failed to create post ", error);
		}
    }

	// Handles page loading so that things don't try to load before they've arrived from the backend.
    if (loading) {
		return <div>loading...</div>;
    }


    return (
        <div>

            <div id="wrapper">
    
				<div id="collect">
				
					<div id="main">
      	        
						<div className="editbox">
							<textarea
								placeholder="Avatar (link to image)"
								value={avatar}
								rows={1}
								onChange={(e) => setAvatar(e.target.value)}
								id="avainput"
							>{avatar}</textarea><br/>
							<textarea
								placeholder="Bio"
								value={bio}
								rows={10}
								onChange={(e) => setBio(e.target.value)}
								id="bioinput"
							>{bio}</textarea><br/>
							<textarea
								placeholder="Aliases"
								value={aliases}
								rows={3}
								maxlength={256}
								onChange={(e) => setAliases(e.target.value)}
								id="pronouninput"
							>{aliases}</textarea><br/>
							<textarea
								placeholder="Extra 1 (links, favorites, or anything else!)"
								value={field1}
								rows={5}
								onChange={(e) => setField1(e.target.value)}
								id="field1input"
							>{field1}</textarea><br/>
							<textarea
								placeholder="Extra 2 (links, favorites, or anything else!)"
								value={field2}
								rows={5}
								onChange={(e) => setField2(e.target.value)}
								id="field2input"
							>{field2}</textarea><br/>

	    					<button class="editsubmit" type="button" onClick={handleEdit}>Edit</button>
		
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
