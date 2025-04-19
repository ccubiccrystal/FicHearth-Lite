import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Register({ setIsAuthenticated }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [passCheck, setPassCheck] = useState("");
	const [key, setKey] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
	    if (password === passCheck) {
            	const response = await api.post("/auth/register", { email, username, password, access_key: key });
				alert("Registered successfully.");
				navigate(0);
	    	if (response.status === 200) {
		    setIsAuthenticated(true);
		}
	    } else {
	    	throw new Error("Password does not match");
	    }
	} catch (error) {
	    console.error("Registration failed", error);
	    alert("Couldn't register. Check your username, password, and access key.");
	}
    };

    const goLogin = async () => {
	navigate("/login");
    }


    return (
        <div>
			<div id="navbar">
				<h1 class="title">-= Register =-</h1>
			</div>

			<div class="logreg">
				<div>
					<form onSubmit={handleRegister}>
						<input
							class="username"
							type="text"
							placeholder="Username"
							maxlength={32}
							value={username}
							onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9-_]/g, ''))}
						/>
						<input
							class="username"
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<input
							class="password"
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<input
							class="password"
							type="password"
							placeholder="Confirm password"
							value={passCheck}
							onChange={(e) => setPassCheck(e.target.value)}
						/>
						<input
							class="key"
							type="password"
							placeholder="Access Key"
							value={key}
							onChange={(e) => setKey(e.target.value)}
						/>
						<button class="subbutt" type="submit">Register</button>
					</form>
					<button id="switchlogreg" onClick={goLogin}>Login</button>

				
				</div>
			</div>
        </div>
    );
}
