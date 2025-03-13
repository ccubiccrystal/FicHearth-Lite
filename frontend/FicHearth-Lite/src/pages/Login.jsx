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
	navigate("/auth/register");
    }

    return (
        <div>
            <h1>Login Page</h1>
	    <form onSubmit={handleSubmit}>
		<input
		    type="text"
		    placeholder="Username"
		    value={username}
		    onChange={(e) => setUsername(e.target.value)}
		/>
		<input
		    type="password"
		    placeholder="Password"
		    value={password}
		    onChange={(e) => setPassword(e.target.value)}
		/>
                <button type="submit">Login</button>
	    </form>
	    <button onClick={goRegister}>Sign Up</button>
        </div>
    );
}
