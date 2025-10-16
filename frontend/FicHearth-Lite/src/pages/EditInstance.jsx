import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "./parts/Navbar";

export default function EditInstance({handleLogout, user}) {

    const navigate = useNavigate();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [contact, setContact] = useState("");
	const [rules, setRules] = useState("");
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
		async function loadInstance() {
			try {
				const profile = await api.get(`/api/instanceinfo`);
				setName(profile.data.instance.name);
				setDescription(profile.data.instance.description);
				setContact(profile.data.instance.admin_contact);
				setRules(profile.data.instance.rules);
				setLoading(false);
			} catch (err) {
				console.error("Failed to load instance info ", err);
			}
		}
		loadInstance();
    }, []);

	// Handles editing of the current user info
    const handleEdit = async () => {
		try {
			const result = await api.patch("/api/editinstance", { name, description, contact, rules });
			navigate(`/`);
		} catch (err) {
			console.error("Failed to edit instance ", err);
		}
    }

	const back = () => {
		navigate("/instance");
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
							<h2>Instance Name:</h2>
							<textarea
								value={name}
								rows={1}
								maxlength={127}
								onChange={(e) => setName(e.target.value)}
								id="nameinput"
							>{name}</textarea><br/>
							<h2>Description:</h2>
							<textarea
								value={description}
								rows={10}
								onChange={(e) => setDescription(e.target.value)}
								id="descinput"
							>{description}</textarea><br/>
							<h2>Admin Contact:</h2>
							<textarea
								value={contact}
								rows={1}
								maxlength={64}
								onChange={(e) => setContact(e.target.value)}
								id="contactinput"
							></textarea><br/>
							<h2>Rules:</h2>
							<textarea
								value={rules}
								rows={10}
								onChange={(e) => setRules(e.target.value)}
								id="rulesinput"
							>{rules}</textarea><br/>

							<button class="back" type="button" onClick={back}>Go back</button>
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
