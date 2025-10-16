import React from "react";

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Post from "./pages/Post";
import EditProfile from "./pages/EditProfile";
import EditPost from "./pages/EditPost";
import Liked from "./pages/Liked";
import Thread from "./pages/Thread";
import Search from "./pages/Search";
import Instance from "./pages/Instance";
import EditInstance from "./pages/EditInstance";
import TagWeb from "./pages/TagWeb";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // Axios instance


function App() {

    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated") === "true");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    	localStorage.setItem("isAuthenticated", isAuthenticated);
    }, [isAuthenticated]);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await api.get("/auth/me");
                setUser(response.data);
		        console.log("Loaded user data");
		        setLoading(false);
            } catch (error) {
                console.error("Failed to fetch user", error);
		        setLoading(false);
            }
        }
        fetchUser();
    }, []);


    const handleLogout = async () => {
    	try {
            await api.post("/auth/logout");
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    }

    if (loading) {
	return <p>loading...</p>
    }


    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/" element={isAuthenticated ? <Navigate to="/posts/1" /> : <Navigate to="/login" />} />
	            <Route path="/posts" element={isAuthenticated ? <Home handleLogout={handleLogout} user={user}/> : <Navigate to="/login" />} />
                <Route path="/posts/:page" element={isAuthenticated ? <Home handleLogout={handleLogout} user={user}/> : <Navigate to="/login" />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/:username/" element={<Profile handleLogout={handleLogout} user={user}/>} />
                <Route path="/profile/:username/:page" element={<Profile handleLogout={handleLogout} user={user}/>} />
                <Route path="/post" element={<Post handleLogout={handleLogout} user={user}/>} />
                <Route path="/profile/edit" element={<EditProfile handleLogout={handleLogout} user={user}/>} />
                <Route path="/post/edit/:post_id" element={<EditPost handleLogout={handleLogout} user={user}/>} />
                <Route path="/liked/:page" element={<Liked handleLogout={handleLogout} user={user}/>} />
                <Route path="/post/:post_id" element={<Thread handleLogout={handleLogout} user={user}/>} />
                <Route path="/search/:type/:query" element={<Search handleLogout={handleLogout} user={user}/>} />
                <Route path="/search/:type/:query/:page" element={<Search handleLogout={handleLogout} user={user}/>} />
                <Route path="/instance" element={<Instance handleLogout={handleLogout} user={user}/>} />
                <Route path="/instance/edit" element={<EditInstance handleLogout={handleLogout} user={user}/>} />
                <Route path="/instance/tagweb" element={<TagWeb handleLogout={handleLogout} user={user}/>} />
            </Routes>
        </Router>
    );
}


export default App;
