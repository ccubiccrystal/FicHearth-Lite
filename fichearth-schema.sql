--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: authenticate(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.authenticate(email text, password text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  user_id INT;
  hashed_password TEXT;
  role TEXT;
  token TEXT;
BEGIN
  -- Get user info
  SELECT id, hashpasswd, 'authenticated' INTO user_id, hashed_password, role
  FROM users WHERE users.email = authenticate.email;

  -- Check password
  IF crypt(password, hashed_password) = hashed_password THEN
    -- Create JWT
    SELECT sign(
      row_to_json(r), 'xKXde8lxoUxT9iZbA41ejpPHm7mZ1jTP6PhuYhnuQ6M='
    ) INTO token
    FROM (
      SELECT user_id, role, extract(epoch FROM now())::int + 3600 AS exp
    ) r;

    RETURN token;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;


ALTER FUNCTION public.authenticate(email text, password text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    post_id integer NOT NULL,
    file_path text NOT NULL,
    alt_text text
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: bans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    username text NOT NULL,
    email_hash text NOT NULL,
    reason text NOT NULL,
    banned_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.bans OWNER TO postgres;

--
-- Name: bans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bans_id_seq OWNER TO postgres;

--
-- Name: bans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bans_id_seq OWNED BY public.bans.id;


--
-- Name: canonicaltags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.canonicaltags (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    nsfw boolean NOT NULL,
    sensitive boolean NOT NULL
);


ALTER TABLE public.canonicaltags OWNER TO postgres;

--
-- Name: canonicaltags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.canonicaltags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.canonicaltags_id_seq OWNER TO postgres;

--
-- Name: canonicaltags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.canonicaltags_id_seq OWNED BY public.canonicaltags.id;


--
-- Name: commentlike; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commentlike (
    comment_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.commentlike OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    post_id integer NOT NULL,
    author_id integer NOT NULL,
    parent_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follows (
    follower_id integer NOT NULL,
    followed_id integer NOT NULL
);


ALTER TABLE public.follows OWNER TO postgres;

--
-- Name: instanceinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instanceinfo (
    domain character varying(255) NOT NULL,
    name character varying(127) NOT NULL,
    description text,
    admin_contact text,
    rules text,
    instance_icon bytea,
    federated boolean DEFAULT true,
    flyflow_allowed boolean DEFAULT true,
    software_version character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instanceinfo OWNER TO postgres;

--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: notifs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifs (
    id integer NOT NULL,
    recipient_id integer NOT NULL,
    source_username public.citext NOT NULL,
    post_id integer,
    type text,
    created_at timestamp without time zone DEFAULT now(),
    seen boolean DEFAULT false NOT NULL,
    CONSTRAINT notifs_type_check CHECK ((type = ANY (ARRAY['like'::text, 'comment'::text, 'share'::text, 'follow'::text, 'friend_request'::text])))
);


ALTER TABLE public.notifs OWNER TO postgres;

--
-- Name: notifs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifs_id_seq OWNER TO postgres;

--
-- Name: notifs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifs_id_seq OWNED BY public.notifs.id;


--
-- Name: postflags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.postflags (
    post_id integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    staff_id integer NOT NULL
);


ALTER TABLE public.postflags OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    author_id integer NOT NULL,
    title text,
    content text NOT NULL,
    nsfw boolean NOT NULL,
    sensitive boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: posttags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posttags (
    post_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.posttags OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    rank_name character varying(32) NOT NULL,
    can_ban boolean DEFAULT false NOT NULL,
    can_restrict boolean DEFAULT false NOT NULL,
    can_alter_tags boolean DEFAULT false NOT NULL,
    can_delete_posts boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shares (
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shares OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    canon_id integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer,
    refresh_token text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: userflags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userflags (
    user_id integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    staff_id integer NOT NULL
);


ALTER TABLE public.userflags OWNER TO postgres;

--
-- Name: userroles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userroles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.userroles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username public.citext NOT NULL,
    email public.citext NOT NULL,
    hashpasswd text NOT NULL,
    avatar text,
    bio text,
    field1 text,
    field2 text,
    pronouns character varying(32),
    birthday date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    refresh_token text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bans ALTER COLUMN id SET DEFAULT nextval('public.bans_id_seq'::regclass);


--
-- Name: canonicaltags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonicaltags ALTER COLUMN id SET DEFAULT nextval('public.canonicaltags_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: notifs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifs ALTER COLUMN id SET DEFAULT nextval('public.notifs_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bans bans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bans
    ADD CONSTRAINT bans_pkey PRIMARY KEY (id);


--
-- Name: canonicaltags canonicaltags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonicaltags
    ADD CONSTRAINT canonicaltags_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifs notifs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifs
    ADD CONSTRAINT notifs_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: attachments attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: bans bans_banned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bans
    ADD CONSTRAINT bans_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.users(id);


--
-- Name: bans bans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bans
    ADD CONSTRAINT bans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: commentlike commentlike_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentlike
    ADD CONSTRAINT commentlike_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: commentlike commentlike_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentlike
    ADD CONSTRAINT commentlike_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: follows follows_followed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_followed_id_fkey FOREIGN KEY (followed_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: likes likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifs notifs_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifs
    ADD CONSTRAINT notifs_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: notifs notifs_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifs
    ADD CONSTRAINT notifs_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: postflags postflags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postflags
    ADD CONSTRAINT postflags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: userflags postflags_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userflags
    ADD CONSTRAINT postflags_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: postflags postflags_staff_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postflags
    ADD CONSTRAINT postflags_staff_id_fkey1 FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: userflags postflags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userflags
    ADD CONSTRAINT postflags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posttags posttags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posttags
    ADD CONSTRAINT posttags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posttags posttags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posttags
    ADD CONSTRAINT posttags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: shares shares_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: shares shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tags tags_canon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_canon_id_fkey FOREIGN KEY (canon_id) REFERENCES public.canonicaltags(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: userroles userroles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: userroles userroles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO web_anon;


--
-- Name: FUNCTION authenticate(email text, password text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.authenticate(email text, password text) TO web_anon;


--
-- Name: TABLE attachments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.attachments TO web_anon;


--
-- Name: TABLE bans; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.bans TO web_anon;


--
-- Name: TABLE canonicaltags; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.canonicaltags TO web_anon;


--
-- Name: TABLE commentlike; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.commentlike TO web_anon;


--
-- Name: TABLE comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.comments TO web_anon;


--
-- Name: TABLE follows; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.follows TO web_anon;


--
-- Name: TABLE instanceinfo; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.instanceinfo TO web_anon;


--
-- Name: TABLE likes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.likes TO web_anon;


--
-- Name: TABLE notifs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.notifs TO web_anon;


--
-- Name: TABLE postflags; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.postflags TO web_anon;


--
-- Name: TABLE posts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.posts TO web_anon;


--
-- Name: TABLE posttags; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.posttags TO web_anon;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.roles TO web_anon;


--
-- Name: TABLE shares; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.shares TO web_anon;


--
-- Name: TABLE tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.tags TO web_anon;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.user_sessions TO web_anon;


--
-- Name: TABLE userflags; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.userflags TO web_anon;


--
-- Name: TABLE userroles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.userroles TO web_anon;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO web_anon;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,UPDATE ON SEQUENCE public.users_id_seq TO web_anon;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO web_anon;


--
-- PostgreSQL database dump complete
--

