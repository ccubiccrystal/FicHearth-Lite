import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import Post from "./parts/Post";
import Navbar from "./parts/Navbar";

export default function Search({handleLogout, user}) {

    const navigate = useNavigate();
    const { type, query, page } = useParams();
    const [posts, setPosts] = useState("");
    const [newUsers, setNewUsers] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [notifs, setNotifs] = useState("");
    const [unread, setUnread] = useState("");
    const [notifOpen, setNotifOpen] = useState(false);

    let content;

    const fetchPosts = async (page) => {
    	const response = await api.get(`/api/search/tagged?page=${page}&limit=10&order=new&tag=${query}`);
        const response2 = await api.get("/api/notifs");
    	setPosts(response.data.posts);
        setNotifs(response2.data.notifs);
        setUnread(response2.data.unread);
        console.log("notifs " + response2.data.notifs);
	if (response.data.posts.length === 0) {
	    const backPage = page - 1;
	    navigate(`/search/${type}/${query}/${backPage}`);
	}
	setLoading(false);
    };

    const fetchNewUsers = async () => {
    	const response = await api.get(`/api/newusers`);
    	setNewUsers(response.data.users);
	setLoadingUsers(false);
    };


    useEffect(() => {
	console.log("Loading page");
	if (page === undefined) { navigate(`/search/${type}/${query}/1`) };
    	fetchPosts(page || 1);  // Default to page 1 if the page number is undefined
        console.log(notifs);
	fetchNewUsers();
    }, [page]);

    const goToPage = (newPage) => {
    	navigate(`/search/${type}/${query}/${newPage}`);
    };

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

    // Handles post like. Should be moved to /parts/Post.
    const like = async (post_id, author_id) => {
        try {
            const result = await api.post("/api/like", { post_id, author_id });
            fetchPosts(page);
        } catch (err) {
            console.error("Failed to like post ", err);
        }
    }

    // Handles post delete. Should be moved to /parts/Post.
    const deletePost = async (post_id, post_author) => {
        try {
            const result = await api.put("/api/deletepost", { post_id, post_author });
            fetchPosts(page);
        } catch (err) {
            console.error("Failed to delete post ", err);
        }
    }

    const editPost = (post_id) => {
	    navigate(`/post/edit/${post_id}`);
    }

    const toggleNotif = async () => {
        setNotifOpen((prev) => !prev);
        if (unread > 0 && notifOpen) {
            setUnread(0);
            await api.patch("/api/notifs/read");
        }
    };

    const getPreview = (text, limit) => {
        if (text.length <= limit) return text;
        let trimmedText = text.slice(0, limit);
        let lastSpace = trimmedText.lastIndexOf(" ");
        return (lastSpace > 0 ? trimmedText.slice(0, lastSpace) : trimmedText) + "...";
    };

	// Handles page loading so that things don't try to load before they've arrived from the backend.
    if (loading || loadingUsers) {
	    return (<div>loading...</div>);
        navigate(0);
    }

    if (!user && !loading) {
	    navigate(0);
    }

    return (

        <div>
            <div id="wrapper">
      
      <div id="collect">      

      <div id="menu">
      </div>


      <div id="main">
      
      <div>
        {posts.map((post) => (
          <Post user={user} post={post} like={like} deletePost={deletePost} editPost={editPost} limited={true} />
        ))}
      </div>
      <button id="prev" onClick={() => goToPage(Number(page) - 1)} disabled={page <= 1}>
        <i className="fa-solid fa-arrow-left"></i>
      </button>
      <button id="next" onClick={() => goToPage(Number(page) + 1)}>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
      
      </div>
      <div id="sidebar-outline">
      
      <div id="sidebar">
      
        <div id="announcements" className="sb-box">
          <h1 style={{color:"white"}}>-= Announcements =-</h1>
	  <p>gamer</p>
        </div>
        
        <div id="rules" className="sb-box">
          <h1 style={{color:"white"}}>-= Rules =-</h1>
        </div>
        
      </div>
      </div>
	
	<div id="newusers-outline">

	<div id="newusers">
	    <div id="userlist" className="sb-box">
		<h1 style={{color:"white"}}>-= New Users =-</h1>
		{newUsers.map((user) => (
		    <div className="sb-user-mini">
			<Link to={`/profile/${user.username}`}><img src={user.avatar ? user.avatar : "/default.webp"} className="sb-ava-mini"/></Link>
			<a className="sb-un-mini">{user.username}</a>
		    </div>
		))}

	    </div>
	</div>

	</div>


      </div>
      
      <Navbar user={user} logout={logout} notifs={notifs} unread={unread} setUnread={setUnread} />
      
    </div>
      
    <div id="footer">
    </div>        </div>
    );
}
