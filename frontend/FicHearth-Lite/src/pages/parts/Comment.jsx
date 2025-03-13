import React from "react";
import { Link } from "react-router-dom";

export default function Comment({user, comment, deleteComment, editComment}) {

    return (
          <div className="comment">
	    <div className="cuserbox">
		<Link to={`/auth/profile/${comment.username}`}><img src={comment.avatar} /></Link>
	        <h2>{comment.username}</h2>	    
	    </div>
            <div className="commentcontent">
		<p dangerouslySetInnerHTML={{ __html: comment.content.replace(/\n/g, "<br>") }}></p>
	      <h6>{comment.created_at}</h6>
	    </div>
		{user.username === comment.username ? <div className="deledit"><button className="widgetbutton" onClick={() => deleteComment(comment.id, comment.username)}><i className="fa-solid fa-trash"></i></button><br/><button className="widgetbutton" onClick={() => editComment(comment.id)}><i className="fa-solid fa-pen"></i></button></div> : <div></div>}
          </div>
    );
}
