import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../api";

export default function Navbar({user, logout, notifs, unread, setUnread}) {

    const navigate = useNavigate();

    const [notifOpen, setNotifOpen] = useState(false); // Whether or not the user has opened notifications.
    const [query, setQuery] = useState(""); // Query used in the search bar.

    // Called when the user opens the notif box. Toggles whether the box is visible, and then sets notifs unread on closing.
    const toggleNotif = async () => {
        setNotifOpen((prev) => !prev);
        if (unread > 0 && notifOpen) {
            setUnread(0);
            await api.patch("/api/notifs/read");
        }
    };

    // The previews of posts in the notif box. Cuts down post content to a specified character limit.
    const getPreview = (text, limit) => {
        if (text.length <= limit) return text;
        let trimmedText = text.slice(0, limit);
        let lastSpace = trimmedText.lastIndexOf(" ");
        return (lastSpace > 0 ? trimmedText.slice(0, lastSpace) : trimmedText) + "...";
    };

    // For the search bar - calls tag search.
    const search = () => {
        if (query !== "") navigate(`/search/tagged/${query}`);
    }

    // Placeholder.
    const unimplemented = () => {
        alert("Not yet implemented.");
    }

    const editInstance = () => {
        navigate("/instance/edit")
    }
    

    return(
        <div>
            <div id="navbar">
                <button type="button" className="navbutt" onClick={logout}><i className="fa-solid fa-right-to-bracket"></i></button>
                <button type="button" className="navbutt" onClick={unimplemented}><i className="fa-solid fa-gear"></i></button>
                {user.owner ? <button type="button" className="navbutt" onClick={editInstance}><i className="fa-solid fa-server"></i></button> : <i></i>}
                <button type="button" className="navbutt" id="notifbutt" onClick={toggleNotif}><i className="fa-solid fa-envelope"></i></button>
                <div className={`notifdrop ${notifOpen ? "show" : ""}`}>
                    {notifs ? 
                        <div>
                            {notifs.map((notif) => (
                                <a href={`/post/${notif.post_id}`}><div>{notif.source_username} {notif.type === "like" ? "liked" : "commented on"} your post {notif.title ? notif.title :getPreview(notif.content, 50)}</div></a>
                            ))}
                        </div> 
                        : 
                        <div></div>
                    }
                </div>

        
                <Link to={"/post"}><button type="button" className="navbutt"><i className="fa-solid fa-pen"></i></button></Link>
                <img src={user.avatar ? user.avatar : "/default.webp"} className="navicon" id="profbutt"/>
                <div className="profdrop" onclick="this.classList.toggle('active')" id={user.owner ? "owndrop" : "drop"}>
                    <Link to={`/profile/${user?.username}`}>Profile</Link>
                    <Link to="/liked/1">Likes</Link>
                    <Link to="/profile/edit">Edit</Link>
                </div>
        
	            <p className="navtext">{user?.username}</p>
                {unread > 0 ? <div id={user.owner ? "ownnotifalert" : "notifalert"}><b>{unread}</b></div> : <div></div>}
                <div class="search">
                    <textarea id="searchbar" class="searchbar" 
                        placeholder="Search..." 
                        rows={1}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    ></textarea>
                    <button type="button" class="navbutt searchbutt" onClick={search}><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </div>
            
            <div id="icon-outline">
            </div>
      
            <div id="icon">
                <Link to={"/"} style={{display: "inline-block"}}><img id="iconimg" src={window.location.origin + "/icon.png"}/></Link>
            </div>
        </div>
      );
    }
