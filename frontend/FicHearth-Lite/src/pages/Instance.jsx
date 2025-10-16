import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "./parts/Navbar";

export default function Instance({handleLogout, user}) {

    const navigate = useNavigate();

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

	const goEdit = () => {
        navigate("/instance/edit");
    }

	const goWeb = () => {
        navigate("/instance/tagweb");
    }


    return (
        <div>

            <div id="wrapper">
    
				<div id="collect">
				
					<div id="main">
      	        
						<div className="adminchoices">
                            <button class="options" onClick={goEdit}>Edit Instance</button>
                            <br/>
                            <button class="options" onClick={goWeb}>Mange Tag Web</button>
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
