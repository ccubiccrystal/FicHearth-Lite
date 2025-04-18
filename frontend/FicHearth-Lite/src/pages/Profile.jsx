import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Post from "./parts/Post";
import Navbar from "./parts/Navbar";

export default function Profile({handleLogout, user}) {

    const { username } = useParams();

    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const { page } = useParams();
    const [usePage, setUsePage] = useState(1);
    const [posts, setPosts] = useState("");
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingUser, setLoadingUser] = useState(true);
        const [notifs, setNotifs] = useState("");
        const [unread, setUnread] = useState("");
    
    const fetchPosts = async (currentPage) => {
    	const response = await api.get(`/api/user/posts?page=${currentPage}&limit=10&username=${username}`);
    	setPosts(response.data.posts);
        console.log(response.data.posts);
        if (response.data.posts.length === 0 && currentPage > 1) {
            setUsePage(currentPage-1);
            navigate(`/profile/${username}/${usePage}`);
        }
        console.log(user?.avatar);
        setLoadingPosts(false);
    };


    useEffect(() => {
        let ignore = false;

        async function loadUserData(setUsePage) {
            try {
                const loadUser = await api.get(`/auth/profile/${username}`);
                console.log("FOLLOWERS: " + !loadUser.data.user.followers);
                if (!ignore) {
                    setProfileUser(loadUser.data.user);
                    console.log("has gone here");
                    setUsePage(1);
                    setLoadingUser(false);
                }
            } catch (err) {
                console.error("Error fetching user data: ", err);
            }
        }

        loadUserData(setUsePage);

        return () => {
            ignore = true;
        }
    }, [username]);

    useEffect(() => {
	    fetchPosts(usePage);
    }, [usePage]);


    const goToPage = (newPage) => {
        if (newPage != usePage) {
            setUsePage(newPage);
            navigate(`/profile/${username}/${newPage}`);
        }
    };


	// Handles logout. Should probably be moved to App.
    const logout = async () => {
    	try {
	    await handleLogout();
	    localStorage.setItem("accessToken", null);
	    navigate("/auth/login");	
	} catch (err) {
	    console.error("Logout failed", err);
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

    const follow = async () => {
        try {
            const user_id = profileUser.id;
            const result = await api.post("/api/follow", { user_id });
            navigate(0);
        } catch (err) {
            console.error("Failed to follow/unfollow ", err);
        }
    }

	// Handles page loading so that things don't try to load before they've arrived from the backend.
    if (loadingPosts || loadingUser) {
	    return <div>loading...</div>
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
          <h1>-= {username} =-</h1>
	  <img src={profileUser.avatar ? profileUser.avatar : "/default.webp"} className="sb-avatar" />
      {username === user.username ? <i></i> : (!profileUser.is_following) ? <button class="followbutt" onClick={follow}><b>Follow</b></button> : <button class="ufollowbutt" onClick={follow}><b>Unfollow</b></button>}
      <h2>=- Followers: {profileUser.followers.length} =-</h2>
	  <p></p>
        </div>
        
        <div id="rules" className="sb-box">
          <h1>-= About =-</h1>
    {profileUser.bio ? <div><h2>Bio:</h2><p dangerouslySetInnerHTML={{ __html: profileUser.bio.replace(/\n/g, "<br>") }}></p></div> : <i></i>}
	  {profileUser.aliases ? <div><h2>Aliases:</h2><p dangerouslySetInnerHTML={{ __html: profileUser.aliases.replace(/\n/g, "<br>") }}></p></div> : <i></i>}
	  {profileUser.field1 ? <div><h2>-----</h2><p dangerouslySetInnerHTML={{ __html: profileUser.field1.replace(/\n/g, "<br>") }}></p></div> : <i></i>}
	  {profileUser.field2 ? <div><h2>-----</h2><p dangerouslySetInnerHTML={{ __html: profileUser.field2.replace(/\n/g, "<br>") }}></p></div> : <i></i>}
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
