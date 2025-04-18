import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import api from "../../api";

export default function Post({user, post, like, deletePost, editPost, limited}) {

	// I still need to move things like like, deletePost, editPost to this instead of having them in individual files.

	const limit = 300; // Character limit if limited = true
	let posttext = "";
	let cut = false;

	const navigate = useNavigate();
	let postTime = "not doing it";

	// Called when the user clicks a tag. This brings them to the search page for the tag.
	const tagsearch = (name) => {
		navigate(`/search/tagged/${name}`);
	}

	// Handles the follow button on posts, alternates follow/unfollow like likes do.
	const pfollow = async (user_id) => {
        try {
            const result = await api.post("/api/follow", { user_id });
            navigate(0);
        } catch (err) {
            console.error("Failed to follow/unfollow ", err);
        }
    }

	const getPreview = () => {
        if (post.content.length <= limit) return post.content;
		const imgIndex = post.content.indexOf("<img");
		const limitIndex = limit;

		if (imgIndex !== -1) {
			const imgClose = post.content.indexOf(">", imgIndex);
			if (imgClose !== -1) {
				const postImgSlicePoint = Math.max(limitIndex, imgClose + 1);
				console.log("CLOSING INDEX IS " + postImgSlicePoint);
				let trimmedText = post.content.slice(0, postImgSlicePoint);
				cut = true;
				return trimmedText + "...";
			}
		}

        let trimmedText = post.content.slice(0, limit);
        let lastSpace = trimmedText.lastIndexOf(" ");
		cut = true;
        return (lastSpace > 0 ? trimmedText.slice(0, lastSpace) : trimmedText) + "...";
    };

	const toPost = () => {
		navigate("/post/" + post.id);
	};

	// Placeholder.
	const repost = async () => {
		alert("Not yet implemented");
	}

	const formatTimestamp = (isoString) => {
		const date = new Date(isoString);
		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		}).format(date);
	};

	postTime = formatTimestamp(post.created_at);

	if (limited) {
		posttext = getPreview();
	} else {
		posttext = post.content;
	}

    return (
        <div className="post">
	    	<div className="userbox">
				{post.is_owner ? <div className="admin"><p>Admin</p></div> : post.is_staff ? <div className="staff"><p>Staff</p></div> : <i></i>}
				<Link to={`/profile/${post.username}`}><img src={post.avatar ? post.avatar : "/default.webp"} /></Link>
	        	<h2>{post.username}</h2>	    
				{post.username === user.username ? <i></i> : (!post.is_following) ? <button class="followbutt pfolladjust" onClick={() => pfollow(post.author_id)}><b>Follow</b></button> : <button class="ufollowbutt pfolladjust" onClick={() => pfollow(post.author_id)}><b>Unfollow</b></button>}
			</div>
            <div className={limited ? "postcontent limited" : "postcontent unlimited"}>
				{post.title ? <h2 class="posttitle">{post.title}</h2> : ""}
				<p class="posttext" dangerouslySetInnerHTML={{ __html: posttext.replace(/\n/g, "<br>") }}></p>
				{cut ? <button className={"readmore"} onClick={toPost}>Read more</button> : <i></i>}
	      		<div className="time"><h6>{postTime}</h6></div>
	    	</div>
	    	<div className="tagbox">
				{post.tags.map((tag) => (
          			<button class="tagmain" onClick={() => tagsearch(tag.name)}>
            		{tag.name}
          			</button>
        		))}
	    	</div>
	    	{post.username === user.username ? <div className="mywidgets">
				<Link to={`/post/${post.id}`}><button type="button" className="widgetbutton"><i className="fa-solid fa-comment"></i></button></Link>
				<button type="button" className="widgetbutton" onClick={repost}><i className="fa-solid fa-repeat"></i></button>
				<div className="widgettext"><div><p>{post.comment_count}</p></div><div className="second"><p>0</p></div></div>
	    	</div> : <div className="widgets">
				<Link to={`/post/${post.id}`}><button type="button" className="widgetbutton"><i className="fa-solid fa-comment"></i></button></Link>
				<button type="button" className="widgetbutton" onClick={repost}><i className="fa-solid fa-repeat"></i></button>
				<button type="button" className="widgetbutton" onClick={() => like(post.id, post.author_id)}><i className={post.has_liked ? "fa-solid fa-heart liked" : "fa-solid fa-heart unliked"}></i></button>
				<div className="widgettext"><div><p>{post.comment_count}</p></div><div className="second"><p>0</p></div><div className="third"><p>{post.like_count}</p></div></div>
			</div>}
			{user.username === post.username || user.roles.can_delete_posts ? <div className="deledit"><button className="widgetbutton" onClick={() => deletePost(post.id, post.username)}><i className="fa-solid fa-trash"></i></button><br/><button className="widgetbutton" onClick={() => editPost(post.id)}><i className="fa-solid fa-pen"></i></button></div> : <div></div>}
        </div>
    );
}
