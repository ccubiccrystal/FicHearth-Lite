import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import Post from "./parts/Post";
import Navbar from "./parts/Navbar";

export default function Home({handleLogout, user}) {

    const navigate = useNavigate();
    const { page } = useParams();
    const [posts, setPosts] = useState("");
    const [newUsers, setNewUsers] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingInstance, setLoadingInstance] = useState(true);
    const [notifs, setNotifs] = useState("");
    const [unread, setUnread] = useState("");
    const [instance, setInstance] = useState("");

    let content;

    const fetchPosts = async (page) => {
    	const response = await api.get(`/api/posts?page=${page}&limit=10&order=new`);
        const response2 = await api.get("/api/notifs");
    	setPosts(response.data.posts);
        setNotifs(response2.data.notifs);
        setUnread(response2.data.unread);
        console.log("notifs " + response2.data.notifs);
	if (response.data.posts.length === 0) {
	    const backPage = page - 1;
        if (backPage > 0) {
            navigate(`/posts/${backPage}`);
        }
	}
	setLoading(false);
    };

    const fetchNewUsers = async () => {
    	const response = await api.get(`/api/newusers`);
    	setNewUsers(response.data.users);
	    setLoadingUsers(false);
    };

    const fetchInstance = async () => {
        const response = await api.get("/api/instanceinfo");
        setInstance(response.data.instance);
        setLoadingInstance(false);
    };


    useEffect(() => {
        console.log("Loading page");
        if (page === undefined) { navigate(`/search/${type}/${query}/1`) };
            fetchPosts(page || 1);  // Default to page 1 if the page number is undefined
            console.log(notifs);
        fetchNewUsers();
        fetchInstance();
    }, [page]);

    const goToPage = (newPage) => {
    	navigate(`/posts/${newPage}`);
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
            const result = await api.put("/api/deletepost", { post_id, post_author, can_delete: user.roles.can_delete_posts });
            fetchPosts(page);
        } catch (err) {
            console.error("Failed to delete post ", err);
        }
    }

    // Redirects to post edit. Should be moved to /parts/Post.
    const editPost = (post_id) => {
	    navigate(`/post/edit/${post_id}`);
    }

	// Handles page loading so that things don't try to load before they've arrived from the backend.
    if (loading || loadingUsers || loadingInstance) {
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
                            <h1>-= Info! =-</h1>
                            <p>- This is a private demo of FicHearth. The service is provided as-is.<br/>- Do not submit personal information to the site, do not post anything you are afraid of losing, do not post anything you are worried about other people seeing. Data may be wiped, corrupted, lost, or otherwise damaged at any time, as a consequence of development and its inherent errors.<br/>- FicHearth's logs are anonymized and your IP is never stored; you are responsible for your own data and privacy.<br/>- Understand that your account and all related data will eventually be wiped once we move into the Demo and the Closed Beta.</p>
                        </div>
                            
                        <div id="rules" className="sb-box">
                            <h1>-= Rules =-</h1>
                            <p dangerouslySetInnerHTML={{ __html: instance.rules.replace(/\n/g, "<br>") }}></p>
                            </div>
                        </div>

                    </div>
    
                    <div id="newusers-outline">

                        <div id="newusers">
                            <div id="userlist" className="sb-box">
                                <h1>-= New Users =-</h1>
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
                <p id="footname">FicHearth [Pre-Beta v0.1]</p>
            </div>        
        </div>
    );
}
