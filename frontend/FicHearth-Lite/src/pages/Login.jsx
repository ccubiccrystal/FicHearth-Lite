import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";


export default function Login({ setIsAuthenticated }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/auth/login", { username, password });
	    if (response.status === 200) {
			setIsAuthenticated(true);
			console.log(response);
			localStorage.setItem("accessToken", response.data.accessToken);
			//localStorage.setItem("user", response.data.id);
			navigate("/");
	    }
	} catch (error) {
	    console.error("Login failed", error);
	    alert("Invalid credentials");
	}
    };

    const goRegister = async () => {
	navigate("/register");
    }

    return (
        <div>
			<div id="navbar">
				<h1 class="title">-= Login =-</h1>
			</div>

			<div id="wrapper" style={{minHeight:"50vw"}}>
			<div class="logreg">
				<div>
					<form onSubmit={handleSubmit}>
						<input
							class="username"
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
						<input
							class="password"
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<button class="subbutt" type="submit">Login</button>
					</form>
					<button id="switchlogreg" onClick={goRegister}>Sign Up</button>
				</div>
			</div>
			</div>

			
			<div id="sidebar-outline">
                    
				<div id="sidebar">
					<div id="info" className="sb-box">
					<h1 style={{color:"white"}}>-= Instance Info =-</h1>
					<p>(will eventually fill with instance info automatically from the database)</p>
				</div>
					
				<div id="rules" className="sb-box">
					<h1 style={{color:"white"}}>-= Rules =-</h1>
					</div>
				</div>

			</div>
        </div>
    );
}
