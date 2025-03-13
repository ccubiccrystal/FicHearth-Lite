import React from "react";
import { Link } from "react-router-dom";

export default function Post({user, post, like, deletePost, editPost}) {

    return (
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
		<Link to={`/post/${post.id}`}><button type="button" className="widgetbutton"><i className="fa-solid fa-comment"></i></button></Link>
		<button type="button" className="widgetbutton"><i className="fa-solid fa-repeat"></i></button>
		<button type="button" className="widgetbutton" onClick={() => like(post.id)}><i className="fa-solid fa-heart" style={post.has_liked ? {color:"red"} : {color:"white"}}></i></button>
	    </div>
		{user.username === post.username ? <div className="deledit"><button className="widgetbutton" onClick={() => deletePost(post.id, post.username)}><i className="fa-solid fa-trash"></i></button><br/><button className="widgetbutton" onClick={() => editPost(post.id)}><i className="fa-solid fa-pen"></i></button></div> : <div></div>}
          </div>
    );
}
