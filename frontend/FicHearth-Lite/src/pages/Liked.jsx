import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

export default function Liked({handleLogout, user}) {

    const navigate = useNavigate();
    const { page } = useParams();
    const [posts, setPosts] = useState("");
    const [newUsers, setNewUsers] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);

    let content;

    const fetchPosts = async (page) => {
    	const response = await api.get(`/api/likedposts?page=${page}&limit=10`);
    	setPosts(response.data.posts);
	if (response.data.posts.length === 0) {
	    const backPage = page - 1;
	    navigate(`/liked/${backPage}`);
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
	if (page === undefined) { page = 1};
    	fetchPosts(page || 1);  // Default to page 1 if the page number is undefined
	fetchNewUsers();
    }, [page]);

    const goToPage = (newPage) => {
    	navigate(`/liked/${newPage}`);
    };

    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");
	} catch (error) {
	    console.error("Logout failed", error);
	}
    }

    const like = async (post_id) => {
	try {
	    const result = await api.post("/api/like", { post_id });
	    fetchPosts(page);
	} catch (err) {
	    console.error("Failed to like post ", err);
	}
    }

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

    if (loading || loadingUsers) {
	return (<div>loading...</div>);
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
          <div className="post">
	    <div className="userbox">
		<Link to={`/auth/profile/${post.username}`}><img src={post.avatar} /></Link>
	        <h2>{post.username}</h2>	    
	    </div>
            <div className="postcontent">
		{post.title ? <h2>{post.title}</h2> : ""}
		<p dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br>") }}></p>
	      <h6>{post.like_count} likes --- {post.created_at}</h6>
	    </div>
	    <div className="tagbox">
	    </div>
	    <div className="widgets">
		<button type="button" className="widgetbutton"><i className="fa-solid fa-comment"></i></button>
		<button type="button" className="widgetbutton"><i className="fa-solid fa-repeat"></i></button>
		<button type="button" className="widgetbutton" onClick={() => like(post.id)}><i className="fa-solid fa-heart" style={post.has_liked ? {color:"red"} : {color:"white"}}></i></button>
	    </div>
		{user.username === post.username ? <div className="deledit"><button className="widgetbutton" onClick={() => deletePost(post.id, user.username)}><i className="fa-solid fa-trash"></i></button><br/><button className="widgetbutton" onClick={() => editPost(post.id)}><i className="fa-solid fa-pen"></i></button></div> : <div></div>}
          </div>
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
			<Link to={`/auth/profile/${user.username}`}><img src={user.avatar} className="sb-ava-mini"/></Link>
			<a className="sb-un-mini">{user.username}</a>
		    </div>
		))}

	    </div>
	</div>

	</div>


      </div>
      
      <div id="navbar">
      
        <button type="button" className="navbutt" onClick={logout}><i className="fa-solid fa-right-to-bracket"></i></button>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-gear"></i></button></a>
        <a  href="https://www.tumblr.com/dashboard"><button type="button" className="navbutt"><i className="fa-solid fa-envelope"></i></button></a>
        <Link to={"/post"}><button type="button" className="navbutt"><i className="fa-solid fa-pen"></i></button></Link>
        <img src={user?.avatar} className="navicon" id="profbutt"/>
        <div className="profdrop">
          <Link to={`/auth/profile/${user?.username}`}>Profile</Link>
          <a href="https://www.tumblr.com/dashboard">Likes</a>
          <Link to="/profile/edit">Edit</Link>
        </div>
	<p className="navtext">{user?.username}</p>

        
        
      
      </div>
      <div id="icon-outline">
      </div>

      
      <div id="icon">
      <Link to={"/"} style={{display: "inline-block"}}><img src={window.location.origin + "/icon.png"} style={{width:"7vw", marginTop:"2.5vw", marginLeft:"4vw"}}/></Link>
      </div>
      
    </div>
      
    <div id="footer">
    </div>        </div>
    );
}
