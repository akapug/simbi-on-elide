SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track execution statistics of all SQL statements executed';


--
-- Name: category_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.category_kind AS ENUM (
    'service',
    'product'
);


--
-- Name: email_template_editor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.email_template_editor AS ENUM (
    'html',
    'slim',
    'sendgrid'
);


--
-- Name: organization_member_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.organization_member_role AS ENUM (
    'admin',
    'member',
    'moderator'
);


--
-- Name: transfer_currency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_currency AS ENUM (
    'simbi',
    'simbi_services',
    'usd'
);


--
-- Name: transfer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_type AS ENUM (
    'deal_accepted',
    'deal_completed',
    'deal_cancelled',
    'credited',
    'deposited'
);


--
-- Name: user_category_expert_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_category_expert_status AS ENUM (
    'active',
    'rejected',
    'expert',
    'top_expert'
);


SET default_tablespace = '';

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    accountable_type character varying NOT NULL,
    accountable_id integer NOT NULL,
    available_balance integer DEFAULT 0 NOT NULL,
    total_balance integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id integer NOT NULL,
    user_id integer,
    kind integer,
    read_at timestamp without time zone,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    level integer
);


--
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- Name: bots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bots (
    id integer NOT NULL,
    name character varying NOT NULL,
    notes text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: bots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bots_id_seq OWNED BY public.bots.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255),
    category_id integer,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    description character varying(255),
    index integer DEFAULT 0,
    category_tags integer[] DEFAULT '{}'::integer[],
    slug character varying,
    kind public.category_kind DEFAULT 'service'::public.category_kind NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: category_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_tags (
    id integer NOT NULL,
    title character varying(255),
    description character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    image_file_name character varying(255),
    image_content_type character varying(255),
    image_file_size integer,
    image_updated_at timestamp without time zone,
    slug character varying(255),
    hero_image_file_name character varying(255),
    hero_image_content_type character varying(255),
    hero_image_file_size integer,
    hero_image_updated_at timestamp without time zone,
    first_caption character varying(255),
    second_caption character varying(255),
    "position" integer DEFAULT 0,
    image_fingerprint character varying
);


--
-- Name: category_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.category_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: category_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.category_tags_id_seq OWNED BY public.category_tags.id;


--
-- Name: cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cohorts (
    id integer NOT NULL,
    location character varying,
    radius integer,
    latitude double precision,
    longitude double precision,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: cohorts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cohorts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cohorts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cohorts_id_seq OWNED BY public.cohorts.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer,
    commentable_id integer,
    commentable_type character varying,
    content text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    hidden_at timestamp without time zone,
    mentioned_user_ids integer[] DEFAULT '{}'::integer[],
    replied_to_comment_id integer
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    id integer NOT NULL,
    name character varying NOT NULL,
    subdomain character varying NOT NULL,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    description character varying,
    private boolean DEFAULT false,
    location character varying,
    latitude double precision,
    longitude double precision,
    featured boolean DEFAULT true NOT NULL,
    promoted boolean DEFAULT false NOT NULL,
    guidelines_title character varying DEFAULT 'Guidelines'::character varying,
    guidelines text,
    status character varying
);


--
-- Name: communities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.communities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: communities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.communities_id_seq OWNED BY public.communities.id;


--
-- Name: community_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_services (
    id bigint NOT NULL,
    community_id bigint NOT NULL,
    service_id bigint NOT NULL,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: community_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_services_id_seq OWNED BY public.community_services.id;


--
-- Name: community_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_users (
    id bigint NOT NULL,
    community_id bigint NOT NULL,
    user_id bigint NOT NULL,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    joined boolean DEFAULT false,
    role integer DEFAULT 0 NOT NULL,
    last_visited_at timestamp without time zone,
    metadata json DEFAULT '{}'::json
);


--
-- Name: community_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_users_id_seq OWNED BY public.community_users.id;


--
-- Name: compliments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliments (
    id integer NOT NULL,
    service_id integer,
    author_id integer,
    kind integer,
    read_at timestamp without time zone,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: compliments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliments_id_seq OWNED BY public.compliments.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    user_id integer,
    stripe_id character varying,
    shipping_address json DEFAULT '{}'::json,
    billing_address_same boolean,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    subscription json DEFAULT '{}'::json,
    requested_trial_at timestamp without time zone
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    user_id integer,
    token character varying,
    platform character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: email_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_events (
    id integer NOT NULL,
    email character varying,
    message_id character varying,
    user_id integer,
    categories character varying[] DEFAULT '{}'::character varying[],
    delivered_at timestamp without time zone,
    bounced_at timestamp without time zone,
    spam_reported_at timestamp without time zone,
    opened_at timestamp without time zone,
    clicked_at timestamp without time zone,
    url character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    dropped_at timestamp without time zone,
    drop_reason character varying,
    bounce_reason character varying
);


--
-- Name: email_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_events_id_seq OWNED BY public.email_events.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    name character varying(255),
    subject character varying(255),
    template text,
    users_query text,
    services_query text,
    schedule character varying(255),
    is_active boolean DEFAULT false,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    scheduled_at timestamp without time zone,
    "interval" integer,
    repeat boolean DEFAULT false,
    sender character varying,
    notification_kind character varying,
    title character varying,
    preview_text character varying,
    deleted_at timestamp without time zone,
    sendgrid_id character varying,
    editor public.email_template_editor DEFAULT 'sendgrid'::public.email_template_editor NOT NULL
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer,
    service_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favorites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flags (
    id integer NOT NULL,
    flaggable_id integer,
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    flaggable_type character varying,
    kind integer DEFAULT 0,
    reason text,
    deleted_at timestamp without time zone,
    metadata json DEFAULT '{}'::json,
    owner_id integer
);


--
-- Name: flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flags_id_seq OWNED BY public.flags.id;


--
-- Name: friendly_id_slugs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendly_id_slugs (
    id integer NOT NULL,
    slug character varying NOT NULL,
    sluggable_id integer NOT NULL,
    sluggable_type character varying(50),
    scope character varying,
    created_at timestamp without time zone
);


--
-- Name: friendly_id_slugs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendly_id_slugs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendly_id_slugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendly_id_slugs_id_seq OWNED BY public.friendly_id_slugs.id;


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    user_id integer,
    friend_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone,
    status character varying DEFAULT 'accepted'::character varying
);


--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identities (
    id integer NOT NULL,
    user_id integer,
    provider character varying(255),
    uid character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    auth_data text,
    deleted_at timestamp without time zone
);


--
-- Name: identities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.identities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: identities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.identities_id_seq OWNED BY public.identities.id;


--
-- Name: image_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_uploads (
    id integer NOT NULL,
    user_id integer,
    image_file_name character varying(255),
    image_content_type character varying(255),
    image_file_size integer,
    image_updated_at timestamp without time zone,
    image_fingerprint character varying(255)
);


--
-- Name: image_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.image_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: image_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.image_uploads_id_seq OWNED BY public.image_uploads.id;


--
-- Name: images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.images (
    id integer NOT NULL,
    imageable_type character varying(255),
    imageable_id integer,
    image_file_name character varying(255),
    image_content_type character varying(255),
    image_file_size integer,
    image_updated_at timestamp without time zone,
    is_main boolean DEFAULT false,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    caption character varying(255),
    image_fingerprint character varying(255),
    "position" integer DEFAULT 0,
    deleted_at timestamp without time zone,
    image_processing boolean
);


--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    name character varying(255),
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: leaderboard_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_histories (
    id integer NOT NULL,
    user_id integer,
    score integer,
    read_at timestamp without time zone,
    category character varying,
    created_at date,
    deleted_at timestamp without time zone
);


--
-- Name: leaderboard_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leaderboard_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leaderboard_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leaderboard_histories_id_seq OWNED BY public.leaderboard_histories.id;


--
-- Name: leaderboard_prizes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_prizes (
    id integer NOT NULL,
    name character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    month date,
    link character varying,
    image_url character varying
);


--
-- Name: leaderboard_prizes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leaderboard_prizes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leaderboard_prizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leaderboard_prizes_id_seq OWNED BY public.leaderboard_prizes.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id bigint NOT NULL,
    email character varying NOT NULL,
    sent_at timestamp without time zone,
    accepted_at timestamp without time zone,
    user_id bigint,
    invited_by_id bigint,
    community_id bigint,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    user_id integer,
    service_id integer NOT NULL,
    kind integer,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    read_at timestamp without time zone
);


--
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.likes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_attachments (
    id integer NOT NULL,
    message_id integer,
    attachment_file_name character varying(255),
    attachment_content_type character varying(255),
    attachment_file_size integer,
    attachment_updated_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: message_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_attachments_id_seq OWNED BY public.message_attachments.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    content text,
    author_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    client_id character varying
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: offer_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_events (
    id integer NOT NULL,
    user_id integer,
    offer_id integer,
    accepted_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    declined_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    done_at timestamp without time zone,
    autoconfirmed boolean
);


--
-- Name: offer_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offer_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offer_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offer_events_id_seq OWNED BY public.offer_events.id;


--
-- Name: offer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_items (
    id integer NOT NULL,
    offer_id integer,
    simbucks double precision,
    unit_count double precision,
    owner_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    service_id integer,
    term character varying(255),
    deleted_at timestamp without time zone,
    kind integer
);


--
-- Name: offer_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offer_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offer_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offer_items_id_seq OWNED BY public.offer_items.id;


--
-- Name: offereds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offereds (
    id integer NOT NULL,
    user_id integer,
    category_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: offereds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offereds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offereds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offereds_id_seq OWNED BY public.offereds.id;


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id integer NOT NULL,
    status character varying(255) DEFAULT 'open'::character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    due_date timestamp without time zone,
    owner_id integer,
    cancel_reason text,
    deleted_at timestamp without time zone,
    within integer,
    cancel_kind integer,
    charge_id character varying
);


--
-- Name: offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    owner_id integer,
    service_id integer,
    count double precision,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    status character varying DEFAULT 'open'::character varying,
    author_id integer,
    processing_time integer,
    shipping_costs double precision,
    shipping_costs_received_at timestamp without time zone,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    cancel_reason text,
    charge_id character varying
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    id bigint NOT NULL,
    role public.organization_member_role DEFAULT 'member'::public.organization_member_role,
    user_id bigint,
    organization_id bigint,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: organization_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organization_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organization_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organization_members_id_seq OWNED BY public.organization_members.id;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;


--
-- Name: qualifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qualifications (
    id integer NOT NULL,
    name character varying(255),
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: qualifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qualifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qualifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qualifications_id_seq OWNED BY public.qualifications.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    user_id integer,
    author_id integer,
    talk_id integer,
    kind integer DEFAULT 0,
    value integer,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    talk_item_id integer
);


--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."references" (
    id integer NOT NULL,
    sender_id integer,
    user_id integer,
    message text,
    token character varying(255),
    filled_at timestamp without time zone,
    approved_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    email character varying(255),
    deleted_at timestamp without time zone,
    notified_at timestamp without time zone
);


--
-- Name: references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.references_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.references_id_seq OWNED BY public."references".id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    message text,
    author_id integer,
    user_id integer,
    talk_id integer,
    rating integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    talk_item_id integer
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    author_id integer,
    amount integer,
    title character varying(255),
    message character varying(255),
    notified_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rewards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;


--
-- Name: rpush_apps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpush_apps (
    id bigint NOT NULL,
    name character varying NOT NULL,
    environment character varying,
    certificate text,
    password character varying,
    connections integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    type character varying NOT NULL,
    auth_key character varying,
    client_id character varying,
    client_secret character varying,
    access_token character varying,
    access_token_expiration timestamp without time zone
);


--
-- Name: rpush_apps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rpush_apps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rpush_apps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rpush_apps_id_seq OWNED BY public.rpush_apps.id;


--
-- Name: rpush_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpush_feedback (
    id bigint NOT NULL,
    device_token character varying(64) NOT NULL,
    failed_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    app_id integer
);


--
-- Name: rpush_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rpush_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rpush_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rpush_feedback_id_seq OWNED BY public.rpush_feedback.id;


--
-- Name: rpush_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rpush_notifications (
    id bigint NOT NULL,
    badge integer,
    device_token character varying(64),
    sound character varying DEFAULT 'default'::character varying,
    alert text,
    data text,
    expiry integer DEFAULT 86400,
    delivered boolean DEFAULT false NOT NULL,
    delivered_at timestamp without time zone,
    failed boolean DEFAULT false NOT NULL,
    failed_at timestamp without time zone,
    error_code integer,
    error_description text,
    deliver_after timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    alert_is_json boolean DEFAULT false,
    type character varying NOT NULL,
    collapse_key character varying,
    delay_while_idle boolean DEFAULT false NOT NULL,
    registration_ids text,
    app_id integer NOT NULL,
    retries integer DEFAULT 0,
    uri character varying,
    fail_after timestamp without time zone,
    processing boolean DEFAULT false NOT NULL,
    priority integer,
    url_args text,
    category character varying,
    content_available boolean DEFAULT false,
    notification text
);


--
-- Name: rpush_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rpush_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rpush_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rpush_notifications_id_seq OWNED BY public.rpush_notifications.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: score_formulas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.score_formulas (
    id integer NOT NULL,
    title character varying,
    formula text,
    query text,
    kind integer DEFAULT 0,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: score_formulas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.score_formulas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: score_formulas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.score_formulas_id_seq OWNED BY public.score_formulas.id;


--
-- Name: scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scores (
    id integer NOT NULL,
    value double precision,
    scorable_id integer,
    scorable_type character varying,
    score_formula_id integer,
    metadata json DEFAULT '{}'::json,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scores_id_seq OWNED BY public.scores.id;


--
-- Name: sent_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sent_emails (
    id integer NOT NULL,
    email_template_id integer,
    user_id integer,
    service_id integer,
    sent_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    template_kind integer
);


--
-- Name: sent_emails_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sent_emails_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sent_emails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sent_emails_id_seq OWNED BY public.sent_emails.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    user_id integer,
    category_id integer,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price double precision,
    unit_id integer,
    qualification text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    kind integer DEFAULT 0,
    secondary_category_id integer,
    slug character varying(255),
    virtual boolean,
    homepage_order integer,
    featured boolean DEFAULT true,
    preferences text,
    tags character varying(255)[] DEFAULT '{}'::character varying[],
    no_image boolean DEFAULT false,
    promoted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    first_published_at timestamp without time zone,
    uniquely_simbi boolean DEFAULT false,
    trading_type integer,
    quota integer,
    quota_used integer DEFAULT 0,
    medium integer,
    processing_time integer,
    shipping_costs double precision,
    in_probation_at timestamp without time zone,
    invisible_for integer,
    strength integer,
    shipping_type integer,
    notified_status character varying DEFAULT 'not_notified'::character varying,
    searchable boolean DEFAULT true NOT NULL,
    index_on_main_site boolean DEFAULT true NOT NULL,
    service_id bigint,
    services_count integer,
    original_service_id bigint,
    usd_price double precision
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    name character varying(255),
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: state_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.state_histories (
    id integer NOT NULL,
    state_machine_name character varying,
    state character varying,
    previous_state character varying,
    stateable_id integer,
    stateable_type character varying,
    transition_reason character varying,
    created_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: state_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.state_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: state_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.state_histories_id_seq OWNED BY public.state_histories.id;


--
-- Name: stripe_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_accounts (
    id integer NOT NULL,
    user_id integer,
    stripe_id character varying,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: stripe_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stripe_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stripe_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stripe_accounts_id_seq OWNED BY public.stripe_accounts.id;


--
-- Name: talk_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talk_histories (
    id integer NOT NULL,
    talk_id integer,
    talk_item_id integer,
    user_id integer,
    kind character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    metadata json DEFAULT '{}'::json,
    deleted_at timestamp without time zone
);


--
-- Name: talk_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.talk_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talk_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.talk_histories_id_seq OWNED BY public.talk_histories.id;


--
-- Name: talk_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talk_items (
    id integer NOT NULL,
    talk_id integer,
    talk_itemable_id integer,
    talk_itemable_type character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    replied_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: talk_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.talk_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talk_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.talk_items_id_seq OWNED BY public.talk_items.id;


--
-- Name: talk_items_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talk_items_reads (
    id integer NOT NULL,
    talk_item_id integer,
    user_id integer,
    status character varying(255) DEFAULT ''::character varying,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: talk_items_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.talk_items_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talk_items_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.talk_items_reads_id_seq OWNED BY public.talk_items_reads.id;


--
-- Name: talk_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talk_users (
    id integer NOT NULL,
    talk_id integer,
    user_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    review_id integer,
    read_at timestamp without time zone,
    deleted_at timestamp without time zone,
    assumed_service_id integer,
    assumed_unit_count double precision,
    archived_at timestamp without time zone,
    seen_at timestamp without time zone
);


--
-- Name: talk_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.talk_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talk_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.talk_users_id_seq OWNED BY public.talk_users.id;


--
-- Name: talks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talks (
    id integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    last_talked_user_id integer,
    status integer DEFAULT 0,
    closed_at timestamp without time zone,
    initial_service_id integer,
    deleted_at timestamp without time zone,
    assumed_status integer,
    assumed_status_at timestamp without time zone
);


--
-- Name: talks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.talks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.talks_id_seq OWNED BY public.talks.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer,
    amount integer,
    balance integer,
    completed_at timestamp without time zone,
    accountable_id integer,
    accountable_type character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    rollback_at timestamp without time zone,
    deleted_at timestamp without time zone,
    read_at timestamp without time zone,
    transfer_id bigint
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    transfer_type public.transfer_type NOT NULL,
    sender_account_id integer NOT NULL,
    recipient_account_id integer NOT NULL,
    amount integer NOT NULL,
    currency public.transfer_currency NOT NULL,
    deal_itemable_type character varying,
    deal_itemable_id integer,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads (
    id integer NOT NULL,
    user_id integer,
    kind character varying(255),
    upload_file_name character varying(255),
    upload_content_type character varying(255),
    upload_file_size integer,
    upload_updated_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uploads_id_seq OWNED BY public.uploads.id;


--
-- Name: user_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_events (
    id integer NOT NULL,
    user_id integer,
    trackable_type character varying,
    trackable_id integer,
    name character varying,
    properties json,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: user_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_events_id_seq OWNED BY public.user_events.id;


--
-- Name: user_expert_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_expert_categories (
    id bigint NOT NULL,
    user_id bigint,
    category_id bigint,
    expert_status public.user_category_expert_status DEFAULT 'expert'::public.user_category_expert_status,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: user_expert_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_expert_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_expert_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_expert_categories_id_seq OWNED BY public.user_expert_categories.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying,
    encrypted_password character varying(255) DEFAULT ''::character varying,
    reset_password_token character varying(255),
    reset_password_sent_at timestamp without time zone,
    remember_created_at timestamp without time zone,
    sign_in_count integer DEFAULT 0 NOT NULL,
    current_sign_in_at timestamp without time zone,
    last_sign_in_at timestamp without time zone,
    current_sign_in_ip character varying(255),
    last_sign_in_ip character varying(255),
    confirmation_token character varying(255),
    confirmed_at timestamp without time zone,
    confirmation_sent_at timestamp without time zone,
    unconfirmed_email character varying(255),
    failed_attempts integer DEFAULT 0 NOT NULL,
    unlock_token character varying(255),
    locked_at timestamp without time zone,
    role character varying(255) DEFAULT 'user'::character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    first_name character varying(255),
    last_name character varying(255),
    about text,
    address text,
    latitude double precision,
    longitude double precision,
    avatar_file_name character varying(255),
    avatar_content_type character varying(255),
    avatar_file_size integer,
    avatar_updated_at timestamp without time zone,
    signup_reason text,
    location json,
    response_time integer,
    slug character varying(255),
    avatar_fingerprint character varying(255),
    invited_by_id integer,
    invited_by_type character varying(255),
    invitation_skill character varying(255),
    website character varying(255),
    phone_number character varying(255),
    applied_at timestamp without time zone,
    disabled_notifications character varying(255)[] DEFAULT '{}'::character varying[],
    disabled_text_notifications character varying(255)[] DEFAULT '{}'::character varying[],
    featured boolean DEFAULT false,
    qualifications text,
    deleted_at timestamp without time zone,
    zipcode character varying(255),
    country_code character varying(255),
    response_rate double precision,
    subscription_token character varying(255),
    cancel_reason character varying,
    cancel_explanation text,
    avatar_crop_x integer,
    avatar_crop_y integer,
    avatar_crop_w integer,
    avatar_crop_h integer,
    remember_token character varying,
    disabled_push_notifications character varying[] DEFAULT '{}'::character varying[],
    probation_unanswered integer,
    onboard_locked_at timestamp without time zone,
    transacted_at timestamp without time zone,
    avatar_processing boolean,
    display_rating smallint DEFAULT 0,
    rating double precision,
    deals_count integer DEFAULT 0,
    enabled_features character varying[] DEFAULT '{}'::character varying[],
    noindex boolean DEFAULT false,
    strength integer,
    avatar_face boolean,
    deactivated_at timestamp without time zone,
    deactivated_for integer,
    deactivation_reason character varying,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    onboarding_finished_at timestamp without time zone,
    onboarding_state character varying DEFAULT 'not_started'::character varying,
    nonprofit boolean DEFAULT false NOT NULL,
    organization_status character varying,
    registration_number character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.versions (
    id integer NOT NULL,
    item_type character varying NOT NULL,
    item_id integer NOT NULL,
    event character varying NOT NULL,
    whodunnit character varying,
    object json,
    object_changes json,
    created_at timestamp without time zone
);


--
-- Name: versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.versions_id_seq OWNED BY public.versions.id;


--
-- Name: wanteds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wanteds (
    id integer NOT NULL,
    user_id integer,
    category_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


--
-- Name: wanteds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wanteds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wanteds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wanteds_id_seq OWNED BY public.wanteds.id;


--
-- Name: websites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.websites (
    id integer NOT NULL,
    kind character varying(255),
    name character varying(255),
    linkable_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    linkable_type character varying DEFAULT 'User'::character varying NOT NULL
);


--
-- Name: websites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.websites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: websites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.websites_id_seq OWNED BY public.websites.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots ALTER COLUMN id SET DEFAULT nextval('public.bots_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_tags ALTER COLUMN id SET DEFAULT nextval('public.category_tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts ALTER COLUMN id SET DEFAULT nextval('public.cohorts_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities ALTER COLUMN id SET DEFAULT nextval('public.communities_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_services ALTER COLUMN id SET DEFAULT nextval('public.community_services_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_users ALTER COLUMN id SET DEFAULT nextval('public.community_users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliments ALTER COLUMN id SET DEFAULT nextval('public.compliments_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events ALTER COLUMN id SET DEFAULT nextval('public.email_events_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags ALTER COLUMN id SET DEFAULT nextval('public.flags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendly_id_slugs ALTER COLUMN id SET DEFAULT nextval('public.friendly_id_slugs_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identities ALTER COLUMN id SET DEFAULT nextval('public.identities_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_uploads ALTER COLUMN id SET DEFAULT nextval('public.image_uploads_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_histories ALTER COLUMN id SET DEFAULT nextval('public.leaderboard_histories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_prizes ALTER COLUMN id SET DEFAULT nextval('public.leaderboard_prizes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments ALTER COLUMN id SET DEFAULT nextval('public.message_attachments_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_events ALTER COLUMN id SET DEFAULT nextval('public.offer_events_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_items ALTER COLUMN id SET DEFAULT nextval('public.offer_items_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offereds ALTER COLUMN id SET DEFAULT nextval('public.offereds_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members ALTER COLUMN id SET DEFAULT nextval('public.organization_members_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications ALTER COLUMN id SET DEFAULT nextval('public.qualifications_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."references" ALTER COLUMN id SET DEFAULT nextval('public.references_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards ALTER COLUMN id SET DEFAULT nextval('public.rewards_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_apps ALTER COLUMN id SET DEFAULT nextval('public.rpush_apps_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_feedback ALTER COLUMN id SET DEFAULT nextval('public.rpush_feedback_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_notifications ALTER COLUMN id SET DEFAULT nextval('public.rpush_notifications_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.score_formulas ALTER COLUMN id SET DEFAULT nextval('public.score_formulas_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores ALTER COLUMN id SET DEFAULT nextval('public.scores_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_emails ALTER COLUMN id SET DEFAULT nextval('public.sent_emails_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_histories ALTER COLUMN id SET DEFAULT nextval('public.state_histories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_accounts ALTER COLUMN id SET DEFAULT nextval('public.stripe_accounts_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_histories ALTER COLUMN id SET DEFAULT nextval('public.talk_histories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_items ALTER COLUMN id SET DEFAULT nextval('public.talk_items_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_items_reads ALTER COLUMN id SET DEFAULT nextval('public.talk_items_reads_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_users ALTER COLUMN id SET DEFAULT nextval('public.talk_users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talks ALTER COLUMN id SET DEFAULT nextval('public.talks_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads ALTER COLUMN id SET DEFAULT nextval('public.uploads_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events ALTER COLUMN id SET DEFAULT nextval('public.user_events_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expert_categories ALTER COLUMN id SET DEFAULT nextval('public.user_expert_categories_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions ALTER COLUMN id SET DEFAULT nextval('public.versions_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wanteds ALTER COLUMN id SET DEFAULT nextval('public.wanteds_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.websites ALTER COLUMN id SET DEFAULT nextval('public.websites_id_seq'::regclass);


--
-- Name: accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: bots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (id);


--
-- Name: categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_tags
    ADD CONSTRAINT category_tags_pkey PRIMARY KEY (id);


--
-- Name: cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--
-- Name: comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: community_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_services
    ADD CONSTRAINT community_services_pkey PRIMARY KEY (id);


--
-- Name: community_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_users
    ADD CONSTRAINT community_users_pkey PRIMARY KEY (id);


--
-- Name: compliments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliments
    ADD CONSTRAINT compliments_pkey PRIMARY KEY (id);


--
-- Name: customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: email_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);


--
-- Name: email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_pkey PRIMARY KEY (id);


--
-- Name: friendly_id_slugs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendly_id_slugs
    ADD CONSTRAINT friendly_id_slugs_pkey PRIMARY KEY (id);


--
-- Name: friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: identities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: image_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_uploads
    ADD CONSTRAINT image_uploads_pkey PRIMARY KEY (id);


--
-- Name: images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: leaderboard_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_histories
    ADD CONSTRAINT leaderboard_histories_pkey PRIMARY KEY (id);


--
-- Name: leaderboard_prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_prizes
    ADD CONSTRAINT leaderboard_prizes_pkey PRIMARY KEY (id);


--
-- Name: leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: offer_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_events
    ADD CONSTRAINT offer_events_pkey PRIMARY KEY (id);


--
-- Name: offer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_items
    ADD CONSTRAINT offer_items_pkey PRIMARY KEY (id);


--
-- Name: offereds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offereds
    ADD CONSTRAINT offereds_pkey PRIMARY KEY (id);


--
-- Name: offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_pkey PRIMARY KEY (id);


--
-- Name: ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."references"
    ADD CONSTRAINT references_pkey PRIMARY KEY (id);


--
-- Name: reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: rpush_apps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_apps
    ADD CONSTRAINT rpush_apps_pkey PRIMARY KEY (id);


--
-- Name: rpush_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_feedback
    ADD CONSTRAINT rpush_feedback_pkey PRIMARY KEY (id);


--
-- Name: rpush_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rpush_notifications
    ADD CONSTRAINT rpush_notifications_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: score_formulas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.score_formulas
    ADD CONSTRAINT score_formulas_pkey PRIMARY KEY (id);


--
-- Name: scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_pkey PRIMARY KEY (id);


--
-- Name: sent_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_emails
    ADD CONSTRAINT sent_emails_pkey PRIMARY KEY (id);


--
-- Name: services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: state_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.state_histories
    ADD CONSTRAINT state_histories_pkey PRIMARY KEY (id);


--
-- Name: stripe_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_accounts
    ADD CONSTRAINT stripe_accounts_pkey PRIMARY KEY (id);


--
-- Name: talk_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_histories
    ADD CONSTRAINT talk_histories_pkey PRIMARY KEY (id);


--
-- Name: talk_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_items
    ADD CONSTRAINT talk_items_pkey PRIMARY KEY (id);


--
-- Name: talk_items_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_items_reads
    ADD CONSTRAINT talk_items_reads_pkey PRIMARY KEY (id);


--
-- Name: talk_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talk_users
    ADD CONSTRAINT talk_users_pkey PRIMARY KEY (id);


--
-- Name: talks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talks
    ADD CONSTRAINT talks_pkey PRIMARY KEY (id);


--
-- Name: transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: user_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_pkey PRIMARY KEY (id);


--
-- Name: user_expert_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expert_categories
    ADD CONSTRAINT user_expert_categories_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: wanteds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wanteds
    ADD CONSTRAINT wanteds_pkey PRIMARY KEY (id);


--
-- Name: websites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.websites
    ADD CONSTRAINT websites_pkey PRIMARY KEY (id);


--
-- Name: index_accounts_on_accountable_id_and_accountable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_accounts_on_accountable_id_and_accountable_type ON public.accounts USING btree (accountable_id, accountable_type);


--
-- Name: index_accounts_on_accountable_type_and_accountable_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_accounts_on_accountable_type_and_accountable_id ON public.accounts USING btree (accountable_type, accountable_id);


--
-- Name: index_badges_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_badges_on_user_id ON public.badges USING btree (user_id);


--
-- Name: index_bots_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_bots_on_name ON public.bots USING btree (name);


--
-- Name: index_categories_on_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_categories_on_category_id ON public.categories USING btree (category_id);


--
-- Name: index_categories_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_categories_on_slug ON public.categories USING btree (slug);


--
-- Name: index_category_tags_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_category_tags_on_slug ON public.category_tags USING btree (slug);


--
-- Name: index_comments_on_commentable_id_and_commentable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_comments_on_commentable_id_and_commentable_type ON public.comments USING btree (commentable_id, commentable_type);


--
-- Name: index_comments_on_hidden_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_comments_on_hidden_at ON public.comments USING btree (hidden_at);


--
-- Name: index_comments_on_replied_to_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_comments_on_replied_to_comment_id ON public.comments USING btree (replied_to_comment_id);


--
-- Name: index_comments_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_comments_on_user_id ON public.comments USING btree (user_id);


--
-- Name: index_communities_on_subdomain; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_communities_on_subdomain ON public.communities USING btree (subdomain) WHERE (deleted_at IS NULL);


--
-- Name: index_community_services_on_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_community_services_on_community_id ON public.community_services USING btree (community_id);


--
-- Name: index_community_services_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_community_services_on_service_id ON public.community_services USING btree (service_id);


--
-- Name: index_community_services_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_community_services_unique ON public.community_services USING btree (community_id, service_id) WHERE (deleted_at IS NULL);


--
-- Name: index_community_users_on_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_community_users_on_community_id ON public.community_users USING btree (community_id);


--
-- Name: index_community_users_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_community_users_on_user_id ON public.community_users USING btree (user_id);


--
-- Name: index_community_users_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_community_users_unique ON public.community_users USING btree (community_id, user_id) WHERE (deleted_at IS NULL);


--
-- Name: index_compliments_on_service_id_and_author_id_and_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_compliments_on_service_id_and_author_id_and_kind ON public.compliments USING btree (service_id, author_id, kind);


--
-- Name: index_customers_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_customers_on_user_id ON public.customers USING btree (user_id);


--
-- Name: index_devices_on_user_id_and_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_devices_on_user_id_and_token ON public.devices USING btree (user_id, token);


--
-- Name: index_email_events_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_email_events_on_message_id ON public.email_events USING btree (message_id);


--
-- Name: index_favorites_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_favorites_on_service_id ON public.favorites USING btree (service_id);


--
-- Name: index_favorites_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_favorites_on_user_id ON public.favorites USING btree (user_id);


--
-- Name: index_flags_on_flaggable_id_and_flaggable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_flags_on_flaggable_id_and_flaggable_type ON public.flags USING btree (flaggable_id, flaggable_type);


--
-- Name: index_flags_on_flaggable_id_and_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_flags_on_flaggable_id_and_user_id ON public.flags USING btree (flaggable_id, user_id);


--
-- Name: index_flags_on_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_flags_on_owner_id ON public.flags USING btree (owner_id);


--
-- Name: index_friendly_id_slugs_on_slug_and_sluggable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_friendly_id_slugs_on_slug_and_sluggable_type ON public.friendly_id_slugs USING btree (slug, sluggable_type);


--
-- Name: index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope ON public.friendly_id_slugs USING btree (slug, sluggable_type, scope);


--
-- Name: index_friendly_id_slugs_on_sluggable_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_friendly_id_slugs_on_sluggable_id ON public.friendly_id_slugs USING btree (sluggable_id);


--
-- Name: index_friendly_id_slugs_on_sluggable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_friendly_id_slugs_on_sluggable_type ON public.friendly_id_slugs USING btree (sluggable_type);


--
-- Name: index_friendships_on_user_id_and_friend_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_friendships_on_user_id_and_friend_id ON public.friendships USING btree (user_id, friend_id);


--
-- Name: index_identities_on_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_identities_on_uid ON public.identities USING btree (uid);


--
-- Name: index_identities_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_identities_on_user_id ON public.identities USING btree (user_id);


--
-- Name: index_images_on_imageable_id_and_imageable_type_and_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_images_on_imageable_id_and_imageable_type_and_deleted_at ON public.images USING btree (imageable_id, imageable_type, deleted_at);


--
-- Name: index_jobs_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_jobs_on_user_id ON public.jobs USING btree (user_id);


--
-- Name: index_leaderboard_histories_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_leaderboard_histories_on_user_id ON public.leaderboard_histories USING btree (user_id);


--
-- Name: index_leads_on_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_leads_on_community_id ON public.leads USING btree (community_id);


--
-- Name: index_leads_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_leads_on_email ON public.leads USING btree (lower((email)::text) varchar_pattern_ops);


--
-- Name: index_leads_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_leads_on_user_id ON public.leads USING btree (user_id);


--
-- Name: index_likes_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_likes_on_service_id ON public.likes USING btree (service_id);


--
-- Name: index_likes_on_user_id_and_service_id_and_kind_and_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_likes_on_user_id_and_service_id_and_kind_and_deleted_at ON public.likes USING btree (user_id, service_id, kind, deleted_at);


--
-- Name: index_message_attachments_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_message_attachments_on_message_id ON public.message_attachments USING btree (message_id);


--
-- Name: index_messages_on_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_author_id ON public.messages USING btree (author_id);


--
-- Name: index_offer_events_on_offer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offer_events_on_offer_id ON public.offer_events USING btree (offer_id);


--
-- Name: index_offer_events_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offer_events_on_user_id ON public.offer_events USING btree (user_id);


--
-- Name: index_offer_items_on_offer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offer_items_on_offer_id ON public.offer_items USING btree (offer_id);


--
-- Name: index_offer_items_on_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offer_items_on_owner_id ON public.offer_items USING btree (owner_id);


--
-- Name: index_offer_items_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offer_items_on_service_id ON public.offer_items USING btree (service_id);


--
-- Name: index_offers_on_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_offers_on_owner_id ON public.offers USING btree (owner_id);


--
-- Name: index_order_items_on_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_order_items_on_order_id ON public.order_items USING btree (order_id);


--
-- Name: index_order_items_on_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_order_items_on_owner_id ON public.order_items USING btree (owner_id);


--
-- Name: index_order_items_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_order_items_on_service_id ON public.order_items USING btree (service_id);


--
-- Name: index_orders_on_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_author_id ON public.orders USING btree (author_id);


--
-- Name: index_orders_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_status ON public.orders USING btree (status);


--
-- Name: index_organization_members_on_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_organization_members_on_organization_id ON public.organization_members USING btree (organization_id);


--
-- Name: index_organization_members_on_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_organization_members_on_role ON public.organization_members USING btree (role);


--
-- Name: index_organization_members_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_organization_members_on_user_id ON public.organization_members USING btree (user_id);


--
-- Name: index_qualifications_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_qualifications_on_user_id ON public.qualifications USING btree (user_id);


--
-- Name: index_ratings_on_talk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_ratings_on_talk_id ON public.ratings USING btree (talk_id);


--
-- Name: index_ratings_on_talk_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_ratings_on_talk_item_id ON public.ratings USING btree (talk_item_id);


--
-- Name: index_ratings_on_user_id_and_author_id_and_talk_id_and_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_ratings_on_user_id_and_author_id_and_talk_id_and_kind ON public.ratings USING btree (user_id, author_id, talk_id, kind);


--
-- Name: index_references_on_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_references_on_sender_id ON public."references" USING btree (sender_id);


--
-- Name: index_references_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_references_on_user_id ON public."references" USING btree (user_id);


--
-- Name: index_reviews_on_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reviews_on_author_id ON public.reviews USING btree (author_id);


--
-- Name: index_reviews_on_talk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reviews_on_talk_id ON public.reviews USING btree (talk_id);


--
-- Name: index_reviews_on_talk_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reviews_on_talk_item_id ON public.reviews USING btree (talk_item_id);


--
-- Name: index_reviews_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reviews_on_user_id ON public.reviews USING btree (user_id);


--
-- Name: index_rpush_feedback_on_device_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_rpush_feedback_on_device_token ON public.rpush_feedback USING btree (device_token);


--
-- Name: index_rpush_notifications_multi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_rpush_notifications_multi ON public.rpush_notifications USING btree (delivered, failed) WHERE ((NOT delivered) AND (NOT failed));


--
-- Name: index_scores_on_scorable_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_scores_on_scorable_id ON public.scores USING btree (scorable_id);


--
-- Name: index_sent_emails_on_email_template_id_and_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sent_emails_on_email_template_id_and_user_id ON public.sent_emails USING btree (email_template_id, user_id);


--
-- Name: index_sent_emails_on_template_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sent_emails_on_template_kind ON public.sent_emails USING btree (template_kind);


--
-- Name: index_sent_emails_on_user_id_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sent_emails_on_user_id_service_id ON public.sent_emails USING btree (user_id, service_id);


--
-- Name: index_services_on_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_category_id ON public.services USING btree (category_id);


--
-- Name: index_services_on_original_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_original_service_id ON public.services USING btree (original_service_id);


--
-- Name: index_services_on_secondary_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_secondary_category_id ON public.services USING btree (secondary_category_id);


--
-- Name: index_services_on_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_service_id ON public.services USING btree (service_id);


--
-- Name: index_services_on_unit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_unit_id ON public.services USING btree (unit_id);


--
-- Name: index_services_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_services_on_user_id ON public.services USING btree (user_id);


--
-- Name: index_services_on_user_id_and_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_services_on_user_id_and_slug ON public.services USING btree (user_id, slug);


--
-- Name: index_skills_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_skills_on_user_id ON public.skills USING btree (user_id);


--
-- Name: index_stripe_accounts_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_stripe_accounts_on_user_id ON public.stripe_accounts USING btree (user_id);


--
-- Name: index_talk_histories_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_created_at ON public.talk_histories USING btree (created_at);


--
-- Name: index_talk_histories_on_talk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_talk_id ON public.talk_histories USING btree (talk_id);


--
-- Name: index_talk_histories_on_talk_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_talk_item_id ON public.talk_histories USING btree (talk_item_id);


--
-- Name: index_talk_histories_on_talk_item_id_accepted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_talk_item_id_accepted ON public.talk_histories USING btree (talk_item_id) WHERE ((kind)::text = 'accepted'::text);


--
-- Name: index_talk_histories_on_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_updated_at ON public.talk_histories USING btree (updated_at);


--
-- Name: index_talk_histories_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_histories_on_user_id ON public.talk_histories USING btree (user_id);


--
-- Name: index_talk_items_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_items_on_created_at ON public.talk_items USING btree (created_at);


--
-- Name: index_talk_items_on_talk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_items_on_talk_id ON public.talk_items USING btree (talk_id);


--
-- Name: index_talk_items_on_type_and_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_items_on_type_and_id ON public.talk_items USING btree (talk_itemable_type, talk_itemable_id);


--
-- Name: index_talk_items_reads_on_talk_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_items_reads_on_talk_item_id ON public.talk_items_reads USING btree (talk_item_id);


--
-- Name: index_talk_items_reads_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_items_reads_on_user_id ON public.talk_items_reads USING btree (user_id);


--
-- Name: index_talk_users_on_assumed_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_users_on_assumed_service_id ON public.talk_users USING btree (assumed_service_id);


--
-- Name: index_talk_users_on_review_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_users_on_review_id ON public.talk_users USING btree (review_id);


--
-- Name: index_talk_users_on_talk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_users_on_talk_id ON public.talk_users USING btree (talk_id);


--
-- Name: index_talk_users_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talk_users_on_user_id ON public.talk_users USING btree (user_id);


--
-- Name: index_talks_on_assumed_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talks_on_assumed_status ON public.talks USING btree (assumed_status);


--
-- Name: index_talks_on_initial_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talks_on_initial_service_id ON public.talks USING btree (initial_service_id);


--
-- Name: index_talks_on_last_talked_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_talks_on_last_talked_user_id ON public.talks USING btree (last_talked_user_id);


--
-- Name: index_transactions_on_accountable_id_and_accountable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_accountable_id_and_accountable_type ON public.transactions USING btree (accountable_id, accountable_type);


--
-- Name: index_transactions_on_transfer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_transfer_id ON public.transactions USING btree (transfer_id);


--
-- Name: index_transactions_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_user_id ON public.transactions USING btree (user_id);


--
-- Name: index_transfers_on_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transfers_on_currency ON public.transfers USING btree (currency);


--
-- Name: index_transfers_on_deal_itemable_type_and_deal_itemable_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transfers_on_deal_itemable_type_and_deal_itemable_id ON public.transfers USING btree (deal_itemable_type, deal_itemable_id);


--
-- Name: index_transfers_on_recipient_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transfers_on_recipient_account_id ON public.transfers USING btree (recipient_account_id);


--
-- Name: index_transfers_on_sender_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transfers_on_sender_account_id ON public.transfers USING btree (sender_account_id);


--
-- Name: index_transfers_on_transfer_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transfers_on_transfer_type ON public.transfers USING btree (transfer_type);


--
-- Name: index_uploads_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_uploads_on_user_id ON public.uploads USING btree (user_id);


--
-- Name: index_user_events_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_events_on_user_id ON public.user_events USING btree (user_id);


--
-- Name: index_user_expert_categories_on_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_expert_categories_on_category_id ON public.user_expert_categories USING btree (category_id);


--
-- Name: index_user_expert_categories_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_expert_categories_on_user_id ON public.user_expert_categories USING btree (user_id);


--
-- Name: index_users_current_sign_in_at_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_current_sign_in_at_active ON public.users USING btree (current_sign_in_at) WHERE ((deleted_at IS NULL) AND (deactivated_at IS NULL) AND (current_sign_in_at IS NOT NULL));


--
-- Name: index_users_on_current_sign_in_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_current_sign_in_at ON public.users USING btree (current_sign_in_at);


--
-- Name: index_users_on_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_invited_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_invited_by_id ON public.users USING btree (invited_by_id);


--
-- Name: index_users_on_onboarding_finished_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_onboarding_finished_at ON public.users USING btree (onboarding_finished_at);


--
-- Name: index_users_on_remember_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_remember_token ON public.users USING btree (remember_token);


--
-- Name: index_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_reset_password_token ON public.users USING btree (reset_password_token);


--
-- Name: index_users_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_slug ON public.users USING btree (slug);


--
-- Name: index_users_on_subscription_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_subscription_token ON public.users USING btree (subscription_token);


--
-- Name: index_versions_on_item_type_and_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_versions_on_item_type_and_item_id ON public.versions USING btree (item_type, item_id);


--
-- Name: index_wanteds_on_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_wanteds_on_category_id ON public.wanteds USING btree (category_id);


--
-- Name: index_wanteds_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_wanteds_on_user_id ON public.wanteds USING btree (user_id);


--
-- Name: index_websites_on_linkable_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_websites_on_linkable_id ON public.websites USING btree (linkable_id);


--
-- Name: index_websites_on_linkable_id_and_linkable_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_websites_on_linkable_id_and_linkable_type ON public.websites USING btree (linkable_id, linkable_type);


--
-- Name: fk_likes_services; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT fk_likes_services FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: fk_rails_03de2dc08c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_rails_03de2dc08c FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: fk_rails_0c678653a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expert_categories
    ADD CONSTRAINT fk_rails_0c678653a1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: fk_rails_16f5be1c4c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_rails_16f5be1c4c FOREIGN KEY (replied_to_comment_id) REFERENCES public.comments(id);


--
-- Name: fk_rails_1b57a37d70; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT fk_rails_1b57a37d70 FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: fk_rails_6fa9b0f15b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expert_categories
    ADD CONSTRAINT fk_rails_6fa9b0f15b FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: fk_rails_86d9416874; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_rails_86d9416874 FOREIGN KEY (transfer_id) REFERENCES public.transfers(id);


--
-- Name: fk_rails_a0a760b9b4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT fk_rails_a0a760b9b4 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: fk_rails_c7f710cf27; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT fk_rails_c7f710cf27 FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: fk_rails_c8aafd9586; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_rails_c8aafd9586 FOREIGN KEY (talk_item_id) REFERENCES public.talk_items(id);


--
-- Name: fk_rails_cf0c38855f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT fk_rails_cf0c38855f FOREIGN KEY (original_service_id) REFERENCES public.services(id);


--
-- Name: fk_rails_f163b58f03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT fk_rails_f163b58f03 FOREIGN KEY (talk_item_id) REFERENCES public.talk_items(id);


--
-- Name: fk_rails_ff629e24d8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT fk_rails_ff629e24d8 FOREIGN KEY (organization_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20140813132521'),
('20140818092533'),
('20140821132758'),
('20140821133035'),
('20140821133132'),
('20140822164903'),
('20140825152300'),
('20140827112323'),
('20140827112336'),
('20140827112351'),
('20140827112404'),
('20140904115517'),
('20140908112940'),
('20140908131550'),
('20140909122315'),
('20140912013204'),
('20140912084023'),
('20140912091233'),
('20140916133145'),
('20140917103912'),
('20140918075952'),
('20140918144200'),
('20140918153140'),
('20140918225820'),
('20140919003715'),
('20140919060343'),
('20140919074415'),
('20140919095843'),
('20140919141252'),
('20140919143514'),
('20140919144518'),
('20140920124053'),
('20140920143618'),
('20140920172207'),
('20140924052541'),
('20140924105125'),
('20141002082700'),
('20141006021352'),
('20141007025131'),
('20141007210009'),
('20141007210808'),
('20141008001210'),
('20141014124548'),
('20141014132826'),
('20141015110041'),
('20141021131306'),
('20141027143305'),
('20141028212421'),
('20141031143512'),
('20141031160340'),
('20141111072803'),
('20141120092512'),
('20141126110252'),
('20141126164039'),
('20141205110543'),
('20141209152915'),
('20141211125350'),
('20141223121950'),
('20150115093240'),
('20150115120351'),
('20150120111953'),
('20150122103743'),
('20150127091206'),
('20150127100703'),
('20150210115751'),
('20150217084534'),
('20150217150324'),
('20150224112649'),
('20150305114653'),
('20150319113926'),
('20150323093839'),
('20150402115434'),
('20150512083926'),
('20150512094049'),
('20150515100938'),
('20150518085458'),
('20150520143115'),
('20150521145051'),
('20150603142528'),
('20150608123502'),
('20150616141013'),
('20150616205817'),
('20150618111809'),
('20150618221351'),
('20150623151159'),
('20150623165803'),
('20150702131009'),
('20150702141020'),
('20150702142621'),
('20150702144658'),
('20150714095246'),
('20150714122755'),
('20150714142945'),
('20150720131921'),
('20150724134716'),
('20150730125241'),
('20150804111109'),
('20150805104259'),
('20150807093217'),
('20150810131818'),
('20150811124414'),
('20150819095334'),
('20150820114210'),
('20150820114745'),
('20150820114832'),
('20150820114837'),
('20150820115236'),
('20150820115649'),
('20150820123809'),
('20150826143035'),
('20150828103722'),
('20150903152344'),
('20150903152458'),
('20150903153716'),
('20150903162557'),
('20150904081027'),
('20150907183646'),
('20150908083223'),
('20150908102106'),
('20150916162410'),
('20150924133538'),
('20150930080343'),
('20151006135820'),
('20151006152908'),
('20151014125139'),
('20151016130759'),
('20151019130723'),
('20151021125803'),
('20151022122124'),
('20151029153346'),
('20151109183822'),
('20151110133702'),
('20151112151336'),
('20151119225636'),
('20151120230856'),
('20151130103630'),
('20151130131759'),
('20160107140708'),
('20160108111334'),
('20160202081607'),
('20160202223101'),
('20160203061349'),
('20160208132531'),
('20160210131203'),
('20160211184048'),
('20160215093612'),
('20160216125446'),
('20160218214726'),
('20160220122257'),
('20160220130733'),
('20160225142957'),
('20160226122455'),
('20160301130732'),
('20160302072221'),
('20160304110732'),
('20160314131649'),
('20160314182432'),
('20160317141417'),
('20160317141418'),
('20160317141419'),
('20160317141420'),
('20160317141421'),
('20160317181616'),
('20160318091712'),
('20160322101906'),
('20160323093416'),
('20160323094704'),
('20160323121936'),
('20160324085620'),
('20160324100708'),
('20160324124017'),
('20160324125504'),
('20160328081513'),
('20160329132553'),
('20160330102522'),
('20160330234512'),
('20160331201324'),
('20160401192912'),
('20160405094755'),
('20160406093848'),
('20160407155421'),
('20160408231641'),
('20160413100723'),
('20160414160405'),
('20160419142337'),
('20160419142808'),
('20160419145251'),
('20160425111646'),
('20160511133716'),
('20160513105408'),
('20160516143515'),
('20160517115307'),
('20160518100134'),
('20160518101058'),
('20160623101822'),
('20160628110012'),
('20160629133040'),
('20160630100719'),
('20160706165513'),
('20160707123031'),
('20160708142208'),
('20160712125658'),
('20160718100933'),
('20160725101104'),
('20160725104059'),
('20160725114448'),
('20160728015823'),
('20160728131258'),
('20160801105032'),
('20160805110319'),
('20160809142130'),
('20160809164802'),
('20160811150228'),
('20160811162028'),
('20160812091248'),
('20160812111158'),
('20160815111635'),
('20160815164448'),
('20160818153352'),
('20160819131456'),
('20160826084850'),
('20160830072339'),
('20160908125309'),
('20160909133815'),
('20160912125849'),
('20160921132528'),
('20160922132855'),
('20160927113603'),
('20160927143813'),
('20160929124446'),
('20160929154632'),
('20160930100013'),
('20161003143611'),
('20161006135907'),
('20161011100314'),
('20161011144709'),
('20161011163640'),
('20161011185403'),
('20161020132010'),
('20161021130925'),
('20161024102316'),
('20161024102747'),
('20161025094817'),
('20161025095002'),
('20161025102132'),
('20161026142243'),
('20161031115248'),
('20161102102338'),
('20161107092021'),
('20161115153235'),
('20161115153423'),
('20161124113112'),
('20161201151355'),
('20161205145427'),
('20161212160216'),
('20161219121353'),
('20161227131111'),
('20170109101004'),
('20170113123858'),
('20170124172421'),
('20170207103135'),
('20170207103408'),
('20170228111557'),
('20170322162118'),
('20170324231124'),
('20170405132026'),
('20170406113052'),
('20170413224105'),
('20170418183059'),
('20170419180633'),
('20170428172622'),
('20170504181630'),
('20170511134615'),
('20170511153811'),
('20170515110712'),
('20170515111830'),
('20170515191246'),
('20170515202310'),
('20170516100108'),
('20170517062522'),
('20170517190452'),
('20170519231439'),
('20170602160534'),
('20170606145639'),
('20170608101800'),
('20170608133509'),
('20170613142141'),
('20170615093201'),
('20170620110336'),
('20170622135038'),
('20170622200349'),
('20170627130900'),
('20170630181630'),
('20170703174244'),
('20170705221354'),
('20170727122050'),
('20170727135242'),
('20170728072210'),
('20170803104432'),
('20170803151617'),
('20170810100453'),
('20170811122048'),
('20170813180738'),
('20170813181911'),
('20170818041042'),
('20170823182524'),
('20170824001344'),
('20170824131214'),
('20170824152622'),
('20170824181501'),
('20170824190632'),
('20170904111818'),
('20170906231717'),
('20170911233705'),
('20170911235237'),
('20170911235745'),
('20170912000233'),
('20170912111428'),
('20170915134445'),
('20170919204104'),
('20170920132254'),
('20170920190454'),
('20170926131502'),
('20170926132027'),
('20170926141846'),
('20170926230502'),
('20171004090955'),
('20171004142824'),
('20171012110625'),
('20171017102734'),
('20171026130902'),
('20171115113729'),
('20190704122531'),
('20191118120339'),
('20191205133012'),
('20191213114217'),
('20191217102342'),
('20191220130101'),
('20200319095456'),
('20200319112845'),
('20200922090407'),
('20200922125430'),
('20201108114639'),
('20201118110216'),
('20201123082625'),
('20201203075427'),
('20201207101342'),
('20201208111210'),
('20201208134922'),
('20201221100938'),
('20201221112006'),
('20201221151707'),
('20210120135713'),
('20210910195615'),
('20210913105836'),
('20220321085600'),
('20220326123738');


