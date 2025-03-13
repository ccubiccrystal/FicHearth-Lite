import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Register({ setIsAuthenticated }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [passCheck, setPassCheck] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
	    if (password === passCheck) {
            	const response = await api.post("/auth/register", { email, username, password });
	    	if (response.status === 200) {
		    setIsAuthenticated(true);
		    navigate("/");
		}
	    } else {
	    	throw new Error("Password does not match");
	    }
	} catch (error) {
	    console.error("Registration failed", error);
	    alert("Username or email already in use");
	}
    };

    const goLogin = async () => {
	navigate("/auth/login");
    }


    return (
        <div>
            <h1>Register Page</h1>
	    <form onSubmit={handleRegister}>
		<input
		    type="text"
		    placeholder="Username"
		    value={username}
		    onChange={(e) => setUsername(e.target.value)}
		/>
		<input
		    type="email"
		    placeholder="Email"
		    value={email}
		    onChange={(e) => setEmail(e.target.value)}
		/>
		<input
		    type="password"
		    placeholder="Password"
		    value={password}
		    onChange={(e) => setPassword(e.target.value)}
		/>
		<input
		    type="password"
		    placeholder="Confirm password"
		    value={passCheck}
		    onChange={(e) => setPassCheck(e.target.value)}
		/>
                <button type="submit">Register</button>
	    </form>
	    <button onClick={goLogin}>Already have an account?</button>

        </div>
    );
}
