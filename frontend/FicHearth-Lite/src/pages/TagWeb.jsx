import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "./parts/Navbar";

export default function Instance({handleLogout, user}) {

    const navigate = useNavigate();

    const [noCanonical, setNoCanonical] = useState(false);
    const [searchTag, setSearchTag] = useState("");
    const [canonical, setCanonical] = useState("");
    const [temptag, setTemptag] = useState("");
    const [subtags, setSubtags] = useState([]);
    const [parents, setParents] = useState([]);
    const [children, setChildren] = useState([]);
    const [notifs, setNotifs] = useState(""); // Handles notifications
    const [unread, setUnread] = useState(""); // Handles unread notifications
    const [loading, setLoading] = useState(true); // Handles page loading

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

    const fetchTagInfo = async (tag) => {
        try {
            const tagInfo = await api.get(`/api/taginfo?tag=${tag}`);
            if (tagInfo.data.canonical) {
              setCanonical(tagInfo.data.canonical.name);
              setSubtags(tagInfo.data.tagInfo.rows);
              //setParents(tagInfo.parents);
              //setChildren(tagInfo.children);
            } else {
              // let the user choose if they want to make it a canonical tag
              setTemptag(tag);
              setNoCanonical(true);
            }
        } catch (err) {
            console.error("Couldn't fetch tag info!", err);
        }
    }

    const updateTagInfo = async () => {
        try {

        } catch (err) {
            
        }
    }

	const back = () => {
        navigate("/instance");
    }

    const handleKeyDownMain = (event) => {
      if (event.key === "," || event.key === "Enter") {
        event.preventDefault();
        const tag = searchTag.trim();
        if (tag) {
          fetchTagInfo(tag);
        }
        setSearchTag(""); // Clear input field
      }
    };

    const handleKeyDownSub = (event) => {
      if (event.key === "," || event.key === "Enter") {
        event.preventDefault();
        const newTag = tagInput.trim();
        if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
        }
        setTagInput(""); // Clear input field
      }
    };

    const yes = async () => {
      const newcanonical = api.post("/api/newcanonical", {tag: temptag});
      if (newcanonical.name) {
        setCanonical(newcanonical.name);
        setTemptag("");
        setNoCanonical(false);
      }
    }

    const no = () => {
      setTemptag("");
      setNoCanonical(false);
    }

    useEffect(() => {
      console.log("Loading page");
    }, [canonical]);

    useEffect(() => {
      console.log("Loading page... canonical dialog");
    }, [noCanonical]);


    return (
        <div>

            <div id="wrapper">
    
				      <div id="collect">
				
					      <div id="main">
      	        
                    {noCanonical ? 
                      <div className="editbox">
                        <p>No canonical for "{temptag}". Create one?</p>
                        <button onClick={yes}>Yes</button>
                        <button onClick={no}>No</button>
                      </div> 
                      : <div className="editbox">
                        {canonical ? <p>{canonical}</p>
                        :  <textarea
                          placeholder="Type subtag here (will correct to canonical)"
                          value={searchTag}
                          rows={1}
                          onKeyDown={handleKeyDownMain}
                          onChange={(e) => setSearchTag(e.target.value)}
                          id="taginput"
                          />
                        }
                      </div>
                    }
      
      				  </div>
      
					  <Navbar user={user} logout={logout} notifs={notifs} unread={unread} setUnread={setUnread} />

						<div id="sidebar-outline">
		
							<div id="sidebar">
		
								<div id="announcements" className="sb-box">
									<h1 style={{color:"white"}}>-= Announcements =-</h1>
									<p>{user?.username}</p>
								</div>
			
								<div id="rules" className="sb-box">
									<h1 style={{color:"white"}}>-= Rules =-</h1>
								</div>
			
							</div>
						</div>
			
					
					<div id="menu">
					</div>
		
				</div>
			</div>
		
			<div id="footer">
			</div>        
		
		</div>
    );
}
