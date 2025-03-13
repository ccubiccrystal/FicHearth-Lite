import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function Profile({handleLogout, user}) {

    const { username } = useParams();

    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const { page } = useParams();
    const [usePage, setUsePage] = useState(1);
    const [posts, setPosts] = useState("");
    const [loading, setLoading] = useState(true);
    
    const fetchPosts = async (currentPage) => {
    	const response = await api.get(`/api/user/posts?page=${currentPage}&limit=10&username=${username}`);
    	setPosts(response.data.posts);
	console.log(response.data.posts);
	if (response.data.posts.length === 0 && currentPage > 1) {
	    setUsePage(currentPage-1);
	    navigate(`/auth/profile/${username}/${usePage}`);
	}
	console.log(user?.avatar);
	setLoading(false);
    };


    useEffect(() => {
	async function loadUserData(setUsePage) {
	    try {
		const loadUser = await api.get(`/auth/profile/${username}`);
		setProfileUser(loadUser.data.user);
		console.log("has gone here");
		setUsePage(1);
		fetchPosts(1);
	    } catch (err) {
		console.error("Error fetching user data: ", err);
	    }
	}
	loadUserData(setUsePage);
    }, [username]);

    useEffect(() => {
	fetchPosts(usePage);
    }, [usePage]);


    const goToPage = (newPage) => {
    	navigate(`/auth/profile/${username}/${newPage}`);
	setUsePage(newPage);
    };


    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");	
	} catch (err) {
	    console.error("Logout failed", err);
	}
    }

    if (loading) {
	return <div>loading...</div>
    }

    console.log("... and stops loading");

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
	      <div className="content"><p>{post.content}</p></div>
	      <h6>{post.like_count} likes --- {post.created_at}</h6>
	    </div>
	    <div className="widgets">
		<button type="button" className="widgetbutton"><i className="fa-solid fa-comment"></i></button>
		<button type="button" className="widgetbutton"><i className="fa-solid fa-repeat"></i></button>
		<button type="button" className="widgetbutton" onClick={() => like(post.id)}><i className="fa-solid fa-heart"></i></button>
	    </div>
          </div>
        ))}
      </div>
      <button id="prev" onClick={() => goToPage(Number(usePage) - 1)} disabled={usePage <= 1}>
        <i className="fa-solid fa-arrow-left"></i>
      </button>
      <button id="next" onClick={() => goToPage(Number(usePage) + 1)}>
        <i className="fa-solid fa-arrow-right"></i>
      </button>
      
      </div>
      <div id="sidebar-outline">
      
      <div id="sidebar">
      
        <div id="announcements" className="sb-box">
          <h1 style={{color:"white"}}>-= {username} =-</h1>
	  <img src={profileUser.avatar} className="sb-avatar" />
	  <p></p>
        </div>
        
        <div id="rules" className="sb-box">
          <h1 style={{color:"white"}}>-= About =-</h1>
	  <h2>Bio:</h2>
	  <p>{profileUser.bio}</p>
	  <h2>Pronouns:</h2>
	  <p>{profileUser.pronouns}</p>
	  <h2>-----</h2>
	  <p>{profileUser.field1}</p>
	  <h2>-----</h2>
	  <p>{profileUser.field2}</p>
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
          <a href="https://www.tumblr.com/dashboard">Edit</a>
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
