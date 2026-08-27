--
-- PostgreSQL database dump
--

\restrict PfrJ1HueVL64FCSLhEaz85uwc76ogRlWmzFmcQponhfWOaKXptiKkf4hl3VyYaZ

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

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

ALTER TABLE IF EXISTS ONLY public."Wishlist" DROP CONSTRAINT IF EXISTS "Wishlist_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_wishlist_id_fkey";
ALTER TABLE IF EXISTS ONLY public."WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."StoreCredit" DROP CONSTRAINT IF EXISTS "StoreCredit_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."StoreCreditLedger" DROP CONSTRAINT IF EXISTS "StoreCreditLedger_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."ReturnRequest" DROP CONSTRAINT IF EXISTS "ReturnRequest_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Refund" DROP CONSTRAINT IF EXISTS "Refund_return_request_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Refund" DROP CONSTRAINT IF EXISTS "Refund_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductSize" DROP CONSTRAINT IF EXISTS "ProductSize_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."PaymentTransaction" DROP CONSTRAINT IF EXISTS "PaymentTransaction_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderStatusHistory" DROP CONSTRAINT IF EXISTS "OrderStatusHistory_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_order_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parent_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Cart" DROP CONSTRAINT IF EXISTS "Cart_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cart_id_fkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_bundle_id_fkey";
ALTER TABLE IF EXISTS ONLY public."AdminActionLog" DROP CONSTRAINT IF EXISTS "AdminActionLog_admin_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_user_id_fkey";
DROP INDEX IF EXISTS public."Wishlist_guest_id_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."StoreCredit_user_id_key";
DROP INDEX IF EXISTS public."StaticPage_slug_key";
DROP INDEX IF EXISTS public."ShippingZone_country_code_key";
DROP INDEX IF EXISTS public."Product_slug_key";
DROP INDEX IF EXISTS public."ProductSize_product_id_size_key";
DROP INDEX IF EXISTS public."ProductBundle_slug_key";
DROP INDEX IF EXISTS public."Order_order_number_key";
DROP INDEX IF EXISTS public."OTP_email_purpose_idx";
DROP INDEX IF EXISTS public."HomepageSection_type_key";
DROP INDEX IF EXISTS public."Coupon_code_key";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Cart_guest_id_key";
DROP INDEX IF EXISTS public."Brand_slug_key";
ALTER TABLE IF EXISTS ONLY public."Wishlist" DROP CONSTRAINT IF EXISTS "Wishlist_pkey";
ALTER TABLE IF EXISTS ONLY public."WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Testimonial" DROP CONSTRAINT IF EXISTS "Testimonial_pkey";
ALTER TABLE IF EXISTS ONLY public."StoreCredit" DROP CONSTRAINT IF EXISTS "StoreCredit_pkey";
ALTER TABLE IF EXISTS ONLY public."StoreCreditLedger" DROP CONSTRAINT IF EXISTS "StoreCreditLedger_pkey";
ALTER TABLE IF EXISTS ONLY public."StaticPage" DROP CONSTRAINT IF EXISTS "StaticPage_pkey";
ALTER TABLE IF EXISTS ONLY public."ShippingZone" DROP CONSTRAINT IF EXISTS "ShippingZone_pkey";
ALTER TABLE IF EXISTS ONLY public."Settings" DROP CONSTRAINT IF EXISTS "Settings_pkey";
ALTER TABLE IF EXISTS ONLY public."SeoConfig" DROP CONSTRAINT IF EXISTS "SeoConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_pkey";
ALTER TABLE IF EXISTS ONLY public."ReturnRequest" DROP CONSTRAINT IF EXISTS "ReturnRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."Refund" DROP CONSTRAINT IF EXISTS "Refund_pkey";
ALTER TABLE IF EXISTS ONLY public."PromoBanner" DROP CONSTRAINT IF EXISTS "PromoBanner_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductSize" DROP CONSTRAINT IF EXISTS "ProductSize_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductBundle" DROP CONSTRAINT IF EXISTS "ProductBundle_pkey";
ALTER TABLE IF EXISTS ONLY public."PaymentTransaction" DROP CONSTRAINT IF EXISTS "PaymentTransaction_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderStatusHistory" DROP CONSTRAINT IF EXISTS "OrderStatusHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."OTP" DROP CONSTRAINT IF EXISTS "OTP_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."Newsletter" DROP CONSTRAINT IF EXISTS "Newsletter_pkey";
ALTER TABLE IF EXISTS ONLY public."HomepageSection" DROP CONSTRAINT IF EXISTS "HomepageSection_pkey";
ALTER TABLE IF EXISTS ONLY public."HeroSlide" DROP CONSTRAINT IF EXISTS "HeroSlide_pkey";
ALTER TABLE IF EXISTS ONLY public."Coupon" DROP CONSTRAINT IF EXISTS "Coupon_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."Cart" DROP CONSTRAINT IF EXISTS "Cart_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."BundleItem" DROP CONSTRAINT IF EXISTS "BundleItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Brand" DROP CONSTRAINT IF EXISTS "Brand_pkey";
ALTER TABLE IF EXISTS ONLY public."AdminActionLog" DROP CONSTRAINT IF EXISTS "AdminActionLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
DROP TABLE IF EXISTS public."WishlistItem";
DROP TABLE IF EXISTS public."Wishlist";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Testimonial";
DROP TABLE IF EXISTS public."StoreCreditLedger";
DROP TABLE IF EXISTS public."StoreCredit";
DROP TABLE IF EXISTS public."StaticPage";
DROP TABLE IF EXISTS public."ShippingZone";
DROP TABLE IF EXISTS public."Settings";
DROP TABLE IF EXISTS public."SeoConfig";
DROP TABLE IF EXISTS public."Review";
DROP TABLE IF EXISTS public."ReturnRequest";
DROP TABLE IF EXISTS public."Refund";
DROP TABLE IF EXISTS public."PromoBanner";
DROP TABLE IF EXISTS public."ProductSize";
DROP TABLE IF EXISTS public."ProductBundle";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."PaymentTransaction";
DROP TABLE IF EXISTS public."OrderStatusHistory";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."OTP";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."Newsletter";
DROP TABLE IF EXISTS public."HomepageSection";
DROP TABLE IF EXISTS public."HeroSlide";
DROP TABLE IF EXISTS public."Coupon";
DROP TABLE IF EXISTS public."Category";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."Cart";
DROP TABLE IF EXISTS public."BundleItem";
DROP TABLE IF EXISTS public."Brand";
DROP TABLE IF EXISTS public."AdminActionLog";
DROP TABLE IF EXISTS public."Address";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    user_id text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_l1 text NOT NULL,
    address_l2 text,
    city text NOT NULL,
    province text,
    postal_code text,
    country_code text DEFAULT 'PK'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AdminActionLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AdminActionLog" (
    id text NOT NULL,
    admin_id text NOT NULL,
    admin_name text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    image_url text
);


--
-- Name: BundleItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BundleItem" (
    id text NOT NULL,
    bundle_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL
);


--
-- Name: Cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    user_id text,
    guest_id text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    cart_id text NOT NULL,
    product_id text NOT NULL,
    size text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    hero_banner_url text,
    hero_video_url text,
    description text,
    parent_id text,
    seo_description text,
    seo_title text
);


--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Coupon" (
    id text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    value double precision NOT NULL,
    min_order_value double precision,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HeroSlide; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HeroSlide" (
    id text NOT NULL,
    title text,
    subtitle text,
    image_url text,
    mobile_image_url text,
    link text,
    button_text text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    end_date timestamp(3) without time zone,
    start_date timestamp(3) without time zone
);


--
-- Name: HomepageSection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HomepageSection" (
    id text NOT NULL,
    type text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    settings jsonb
);


--
-- Name: Newsletter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Newsletter" (
    email text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    order_id text,
    order_number text,
    phone text,
    channel text NOT NULL,
    event text NOT NULL,
    message text NOT NULL,
    status text NOT NULL,
    error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OTP; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OTP" (
    id text NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    purpose text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    order_number text NOT NULL,
    user_id text,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    shipping_address jsonb NOT NULL,
    subtotal double precision NOT NULL,
    shipping_fee double precision NOT NULL,
    discount_amount double precision DEFAULT 0 NOT NULL,
    coupon_code text,
    store_credit_used double precision DEFAULT 0 NOT NULL,
    advance_required boolean DEFAULT false NOT NULL,
    advance_amount double precision DEFAULT 0 NOT NULL,
    advance_paid double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    status text DEFAULT 'placed'::text NOT NULL,
    customer_note text,
    tracking_number text,
    courier_name text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cod_remittance_status text DEFAULT 'pending'::text NOT NULL,
    cod_remitted_amount double precision DEFAULT 0,
    courier_awb text,
    courier_status text,
    risk_flags text[],
    risk_score double precision DEFAULT 0.0 NOT NULL
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text NOT NULL,
    product_name text NOT NULL,
    variant_label text NOT NULL,
    size text NOT NULL,
    image_url text NOT NULL,
    unit_price double precision NOT NULL,
    quantity integer NOT NULL
);


--
-- Name: OrderStatusHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderStatusHistory" (
    id text NOT NULL,
    order_id text NOT NULL,
    status text NOT NULL,
    note text,
    at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PaymentTransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentTransaction" (
    session_id text NOT NULL,
    order_id text NOT NULL,
    amount double precision NOT NULL,
    currency text NOT NULL,
    status text NOT NULL,
    payment_status text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    base_price double precision NOT NULL,
    compare_at_price double precision,
    description text,
    category_slug text NOT NULL,
    brand_slug text,
    images text[],
    hover_image text,
    is_new_arrival boolean DEFAULT false NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL,
    is_flash_sale boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avg_rating double precision DEFAULT 5.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 999 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    flash_sale_price double precision,
    cost_price double precision DEFAULT 0
);


--
-- Name: ProductBundle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductBundle" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    bundle_price double precision NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProductSize; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductSize" (
    id text NOT NULL,
    size text NOT NULL,
    stock integer NOT NULL,
    product_id text NOT NULL
);


--
-- Name: PromoBanner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PromoBanner" (
    id text NOT NULL,
    title text,
    subtitle text,
    image_url text NOT NULL,
    link text,
    button_text text,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone
);


--
-- Name: Refund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Refund" (
    id text NOT NULL,
    order_id text NOT NULL,
    order_number text NOT NULL,
    return_request_id text,
    amount double precision NOT NULL,
    reason text NOT NULL,
    method text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    external_ref text,
    processed_by text,
    failure_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone
);


--
-- Name: ReturnRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReturnRequest" (
    id text NOT NULL,
    order_id text NOT NULL,
    order_number text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    product_id text,
    product_name text,
    quantity integer DEFAULT 1 NOT NULL,
    refund_amount double precision DEFAULT 0 NOT NULL
);


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    product_id text NOT NULL,
    user_id text,
    customer_name text NOT NULL,
    rating integer NOT NULL,
    comment text,
    image_urls text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    admin_reply text,
    order_id text,
    report_reason text,
    status text DEFAULT 'pending'::text NOT NULL
);


--
-- Name: SeoConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SeoConfig" (
    id text DEFAULT 'singleton'::text NOT NULL,
    default_meta_title text,
    default_meta_desc text,
    default_og_image text
);


--
-- Name: Settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Settings" (
    id text DEFAULT 'singleton'::text NOT NULL,
    announcement_text text,
    announcement_active boolean DEFAULT false NOT NULL,
    free_shipping_min_amt double precision,
    flat_shipping_fee double precision,
    advance_payment_threshold double precision,
    advance_payment_percent double precision,
    cod_enabled boolean DEFAULT true NOT NULL,
    card_enabled boolean DEFAULT true NOT NULL,
    wallet_enabled boolean DEFAULT true NOT NULL,
    whatsapp_number text,
    supported_countries text[],
    flash_sale_active boolean DEFAULT false NOT NULL,
    flash_sale_end_time timestamp(3) without time zone
);


--
-- Name: ShippingZone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShippingZone" (
    id text NOT NULL,
    country_code text NOT NULL,
    flat_fee double precision NOT NULL,
    free_shipping_min double precision,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: StaticPage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StaticPage" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content_html text NOT NULL,
    seo_title text,
    seo_description text,
    is_published boolean DEFAULT true NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: StoreCredit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StoreCredit" (
    id text NOT NULL,
    user_id text NOT NULL,
    balance double precision DEFAULT 0.0 NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: StoreCreditLedger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StoreCreditLedger" (
    id text NOT NULL,
    user_id text NOT NULL,
    amount double precision NOT NULL,
    reason text NOT NULL,
    order_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Testimonial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Testimonial" (
    id text NOT NULL,
    author_name text NOT NULL,
    author_meta text,
    content text NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    review_id text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    password_hash text,
    role text DEFAULT 'customer'::text NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    picture text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wishlist" (
    id text NOT NULL,
    user_id text,
    guest_id text
);


--
-- Name: WishlistItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WishlistItem" (
    id text NOT NULL,
    wishlist_id text NOT NULL,
    product_id text NOT NULL,
    size text
);


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Address" (id, user_id, full_name, phone, address_l1, address_l2, city, province, postal_code, country_code, is_default, created_at) FROM stdin;
5680912b-88ad-4584-b06a-9281c862262b	a7b13d66-6a84-42a8-8e66-b3678e40be0b	Sami Ullah	+923146180920	jhang	\N	Karachi	\N	35200	PK	t	2026-08-25 01:57:41.283
53f9a637-902d-46cc-a1d9-5919c6dc52f9	4a1186ff-fb37-4d11-9be2-ec0dd1985365	Sami Ullah	+923146180920	Jhang	\N	Jhang	\N	35200	PK	t	2026-08-25 07:43:16.843
\.


--
-- Data for Name: AdminActionLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AdminActionLog" (id, admin_id, admin_name, action, entity_type, entity_id, details, created_at) FROM stdin;
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Brand" (id, name, slug, image_url) FROM stdin;
2144f5ff-5733-4ea2-8fce-d6298668bdb0	AirVault	airvault	\N
df3352fa-1e4d-4b0b-943f-84536a7be215	Terrace Co	terrace-co	\N
92328e44-3643-41fc-9446-0af9499de377	CloudStride	cloudstride	\N
3913d5f0-9e94-43e5-9560-816c7266bda4	Oasis	oasis	\N
\.


--
-- Data for Name: BundleItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BundleItem" (id, bundle_id, product_id, quantity) FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Cart" (id, user_id, guest_id, updated_at) FROM stdin;
b4fa9102-d2d2-453e-9772-540326737c9c	afc84a1b-be3a-4518-a2e2-e272e1e81b9b	\N	2026-08-25 01:09:48.667
54f09b43-5e1c-4149-a400-af00948e2ba9	a7b13d66-6a84-42a8-8e66-b3678e40be0b	\N	2026-08-25 01:56:54.325
fc38d3e4-575e-460c-aa76-ec6b653a4aa6	\N	a6a3de1b-9832-42dd-99f6-5079f4e7bfa5	2026-08-25 02:43:47.857
139cd298-a972-438e-8c63-b2dc4f504e69	47abd5d6-fc35-411d-9814-1d76acb4111b	\N	2026-08-25 03:07:01.451
1e970850-810b-498e-b394-653d4c1e893b	4a1186ff-fb37-4d11-9be2-ec0dd1985365	\N	2026-08-25 07:39:32.06
f4c80167-ede8-4ec5-af91-3ae1c3c34fd5	\N	64c026e5-1ed7-4744-b4c5-58a4d34b54f8	2026-08-26 12:04:39.128
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CartItem" (id, cart_id, product_id, size, quantity) FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" (id, name, slug, image_url, sort_order, is_active, hero_banner_url, hero_video_url, description, parent_id, seo_description, seo_title) FROM stdin;
84be3e44-2cc0-4150-8ec5-8419a5fd3ca9	Retro & High Tops	retro	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734431/solekicks/categories/category_retro.png	0	t	\N	\N	\N	\N	\N	\N
a399fbec-7e1c-4fb5-a400-02b882ac3641	Everyday Streetwear	streetwear	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734495/solekicks/categories/category_streetwear.png	1	t	\N	\N	\N	\N	\N	\N
18e4df1f-7aa4-409c-b1ed-8beb884c78c4	Performance Runners	runners	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734563/solekicks/categories/category_runners.png	2	t	\N	\N	\N	\N	\N	\N
e6cfacd6-d372-434d-8a01-0e101a3915b8	Recovery Slides & Foam	slides	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734640/solekicks/categories/category_slides.png	3	t	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Coupon" (id, code, type, value, min_order_value, max_uses, used_count, expires_at, is_active, created_at) FROM stdin;
8127aadc-ccb9-47b5-8af5-a4c65f52ae01	STREET15	percentage	15	9999	\N	0	\N	t	2026-08-19 08:55:47.551
bcae6286-09ce-420e-9185-5cd87d3d2fab	JUTAY10	percentage	10	0	\N	0	\N	t	2026-08-19 08:55:47.556
1375c873-28b0-48d9-9aaa-29a9fef31e4e	FLAT500	flat	500	5000	\N	2	\N	t	2026-08-19 08:55:47.559
\.


--
-- Data for Name: HeroSlide; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HeroSlide" (id, title, subtitle, image_url, mobile_image_url, link, button_text, is_active, sort_order, end_date, start_date) FROM stdin;
b2e10601-a7bd-4360-9908-c8b847145b37	STREET REVOLUTION	High-heat streetwear silhouettes & retro re-issues engineered for urban dominance across Pakistan.	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734227/solekicks/banners/hero_1_street_revolution.png	\N	/new-arrivals	SHOP NEW RELEASES	t	0	\N	\N
a3dabbcf-86e3-4928-94c1-906ae2730a53	RETRO LOWS & COURT MASTERS	Timeless terrace vibes, chunkier midsoles, and everyday luxury crafted for maximum comfort.	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734295/solekicks/banners/hero_2_retro_lows.png	\N	/collections/retro	EXPLORE RETRO KICKS	t	1	\N	\N
72cae4b4-2fe5-42ec-960c-970f03f3711f	MAX SPEED CLOUD RUNNERS	Engineered propulsion foam and hyper-breathable knit. Designed for the track, styled for the street.	https://res.cloudinary.com/p1w5xus9/image/upload/v1787734370/solekicks/banners/hero_3_cloud_runners.png	\N	/collections/runners	DISCOVER RUNNERS	t	2	\N	\N
\.


--
-- Data for Name: HomepageSection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HomepageSection" (id, type, is_active, sort_order, settings) FROM stdin;
6dbdf2b3-8bd0-4df6-a537-5797486132d3	new_arrivals	t	3	\N
1b81fa6b-9470-40bf-9313-99ff4273e147	testimonials	t	8	\N
dd5165f1-0652-42b2-a366-d3f45f70ecbc	hero	t	1	\N
7fb5fd43-cc92-4e98-8db6-6a31a821ed94	categories	t	2	\N
74a5966d-5c9e-4eb6-b0f1-b7cf5f81fefe	flash_sale	t	4	\N
95441a36-8fc0-46d0-afae-d0ef5514885a	best_sellers	t	5	\N
2147392e-636f-4beb-b377-570a4fd3e821	promotional_banner	t	6	\N
528a9111-5c6d-4283-a922-741cd1aaac4d	trending	t	7	\N
\.


--
-- Data for Name: Newsletter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Newsletter" (email, created_at) FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, order_id, order_number, phone, channel, event, message, status, error, created_at) FROM stdin;
76771e33-b8e7-4d23-8e55-44d315ac78d6	1e722171-ed92-4d23-bebd-4a75ec88264c	PK-SNK-78113	+92 314 6180920	whatsapp	ORDER_PLACED	Order PK-SNK-78113 confirmed! Total Rs. 16500 via COD. We'll update you as it ships.	logged	\N	2026-08-25 01:22:28.01
cfe2d8ba-33d0-474a-818e-07c424deb270	07711a40-fec9-4121-9720-1334f0650dfd	PK-SNK-57092	+923146180920	whatsapp	ORDER_PLACED	Order PK-SNK-57092 confirmed! Total Rs. 7899 via COD. We'll update you as it ships.	logged	\N	2026-08-25 07:28:03.329
b1094c5b-69fe-47b7-92c0-db31e4bfaa3f	d177b3e8-00b0-4d04-bff3-6ca059352152	PK-SNK-10264	+923146180920	whatsapp	ORDER_PLACED	Order PK-SNK-10264 confirmed! Total Rs. 8250 via COD. We'll update you as it ships.	logged	\N	2026-08-25 07:51:11.377
979e5b25-88d2-4778-85a9-c8b24fe1ec4b	d177b3e8-00b0-4d04-bff3-6ca059352152	PK-SNK-10264	+923146180920	whatsapp	STATUS_UPDATE	Order PK-SNK-10264 is now verified ✅.	logged	\N	2026-08-25 09:30:40.854
bf74be7c-20d0-4894-93ec-c36a35d2e837	d177b3e8-00b0-4d04-bff3-6ca059352152	PK-SNK-10264	+923146180920	whatsapp	STATUS_UPDATE	Order PK-SNK-10264 is now packed 📦.	logged	\N	2026-08-25 09:46:59.121
8438996c-a013-4c1e-80ea-81f54eb2d834	d19dc1c2-f745-475f-b88d-d36494bf73c1	PK-SNK-51324	+923146180920	whatsapp	ORDER_PLACED	Order PK-SNK-51324 confirmed! Total Rs. 10000 via CARD. We'll update you as it ships.	logged	\N	2026-08-26 12:03:23.045
109b4aaf-0af4-4c27-b01d-259ff1d46c9e	f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	PK-SNK-22839	+923146180920	whatsapp	ORDER_PLACED	Order PK-SNK-22839 confirmed! Total Rs. 8499 via COD. We'll update you as it ships.	logged	\N	2026-08-26 12:05:20.785
abac9243-ffb7-4ac2-b1c6-2ec88a5b14ef	f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	PK-SNK-22839	+923146180920	whatsapp	STATUS_UPDATE	Order PK-SNK-22839 is now verified ✅.	logged	\N	2026-08-27 02:39:18.763
\.


--
-- Data for Name: OTP; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OTP" (id, email, code, purpose, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, order_number, user_id, customer_name, customer_phone, customer_email, shipping_address, subtotal, shipping_fee, discount_amount, coupon_code, store_credit_used, advance_required, advance_amount, advance_paid, total, payment_method, payment_status, status, customer_note, tracking_number, courier_name, created_at, updated_at, cod_remittance_status, cod_remitted_amount, courier_awb, courier_status, risk_flags, risk_score) FROM stdin;
1e722171-ed92-4d23-bebd-4a75ec88264c	PK-SNK-78113	afc84a1b-be3a-4518-a2e2-e272e1e81b9b	Store Owner	+92 314 6180920	sahilwaheed48@gmail.com	{"city": "Karachi", "address_l1": "Jhang", "postal_code": "35200", "country_code": "PK"}	16500	0	0	\N	0	f	0	0	16500	COD	pending	processing	\N	\N	\N	2026-08-25 01:22:27.934	2026-08-25 09:48:07.013	pending	0	\N	\N	\N	0
07711a40-fec9-4121-9720-1334f0650dfd	PK-SNK-57092	4a1186ff-fb37-4d11-9be2-ec0dd1985365	Sami Ullah	+923146180920	samisial1555@gmail.com	{"city": "Jhang", "province": "Punjab", "address_l1": "Jhang", "postal_code": "35200", "country_code": "PK"}	7899	0	0	\N	0	f	0	0	7899	COD	pending	processing	\N	\N	\N	2026-08-25 07:28:03.275	2026-08-25 09:48:07.013	pending	0	\N	\N	\N	0
d177b3e8-00b0-4d04-bff3-6ca059352152	PK-SNK-10264	4a1186ff-fb37-4d11-9be2-ec0dd1985365	Sami Ullah	+923146180920	samisial1555@gmail.com	{"city": "Jhang", "province": "Sindh", "address_l1": "Jhang", "postal_code": "35200", "country_code": "PK"}	8250	0	0	\N	0	f	0	0	8250	COD	pending	processing	\N	\N	\N	2026-08-25 07:51:11.256	2026-08-25 09:48:07.013	pending	0	\N	\N	\N	0
d19dc1c2-f745-475f-b88d-d36494bf73c1	PK-SNK-51324	\N	Sami Ullah	+923146180920	samisial1555@gmail.com	{"city": "Jhang", "province": "Punjab", "address_l1": "Jhang", "postal_code": "35200", "country_code": "PK"}	10500	0	500	FLAT500	0	f	0	0	10000	CARD	pending	placed	\N	\N	\N	2026-08-26 12:03:22.994	2026-08-26 12:03:22.994	pending	0	\N	\N	\N	0
f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	PK-SNK-22839	\N	Sami Ullah	+923146180920	samisial1555@gmail.com	{"city": "Jhang", "province": "Punjab", "address_l1": "Jhang", "postal_code": "", "country_code": "PK"}	8999	0	500	FLAT500	0	f	0	0	8499	COD	pending	confirmed	\N	\N	\N	2026-08-26 12:05:20.701	2026-08-27 02:39:18.715	pending	0	\N	\N	\N	0
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, order_id, product_id, product_name, variant_label, size, image_url, unit_price, quantity) FROM stdin;
d8febcf4-20b4-49b3-9835-2594ef2cf67b	1e722171-ed92-4d23-bebd-4a75ec88264c	f2d71e99-adac-4a72-81f2-3c477327f734	Court Master Black Panther	EU 39	39	https://images.unsplash.com/photo-1786379582186-83ef57a1c420?crop=entropy&cs=srgb&fm=jpg&q=85&w=900	8250	2
8e0b181f-2cb6-4f7d-b76b-0abad5659874	07711a40-fec9-4121-9720-1334f0650dfd	6e9dc20b-8ca1-4ece-8444-3f17f37edf31	EQT Street Support ADV	EU 39	39	https://images.unsplash.com/photo-1597892657493-6847b9640bac?crop=entropy&cs=srgb&fm=jpg&q=85&w=900	7899	1
e239009d-2ec7-4979-96a5-a4e781c270e4	d177b3e8-00b0-4d04-bff3-6ca059352152	f2d71e99-adac-4a72-81f2-3c477327f734	Court Master Black Panther	EU 40	40	https://images.unsplash.com/photo-1786379582186-83ef57a1c420?crop=entropy&cs=srgb&fm=jpg&q=85&w=900	8250	1
d76e4b90-54cd-489a-a52d-d593181d88a3	d19dc1c2-f745-475f-b88d-d36494bf73c1	8410b4d6-d123-4e2c-bfac-ecd8235710f0	AJ-1 Retro High 'Ember'	EU 39	39	https://res.cloudinary.com/p1w5xus9/image/upload/v1787736215/solekicks/products/aj1-retro-high-ember/1-side.png	10500	1
6a03fad0-fec9-4b32-bcb5-47b375ef24f7	f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	32e73be6-fc4e-49be-b8bc-5bd80769d345	AJ-4 Retro 'White Oreo' Premium	EU 39	39	https://res.cloudinary.com/p1w5xus9/image/upload/v1787735848/solekicks/products/court-master-black-panther/1-side.png	8999	1
\.


--
-- Data for Name: OrderStatusHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderStatusHistory" (id, order_id, status, note, at) FROM stdin;
84fac64d-6416-4219-98c3-0571c9f73965	1e722171-ed92-4d23-bebd-4a75ec88264c	placed	Order placed	2026-08-25 01:22:27.934
1ae5dea0-a937-4d8a-bfc9-098d07d9026b	07711a40-fec9-4121-9720-1334f0650dfd	placed	Order placed	2026-08-25 07:28:03.275
a8d03596-44b7-40ac-bef2-d832557906b3	d177b3e8-00b0-4d04-bff3-6ca059352152	placed	Order placed	2026-08-25 07:51:11.256
1fdc6e1f-a4b7-4f22-8d24-bebc239b2faf	d177b3e8-00b0-4d04-bff3-6ca059352152	confirmed		2026-08-25 09:30:40.821
0fcc7d41-8d59-42ab-b35f-ed70e0508eaa	d177b3e8-00b0-4d04-bff3-6ca059352152	packed		2026-08-25 09:46:59.081
cb51c51c-6a7a-45fc-b800-92ba22d28867	d177b3e8-00b0-4d04-bff3-6ca059352152	processing	Bulk status update	2026-08-25 09:48:07.028
f3402def-7e2b-42b2-8375-bdf7616bc1a7	07711a40-fec9-4121-9720-1334f0650dfd	processing	Bulk status update	2026-08-25 09:48:07.028
8e42a4f2-d4ad-40fd-9af0-9253358d586e	1e722171-ed92-4d23-bebd-4a75ec88264c	processing	Bulk status update	2026-08-25 09:48:07.028
0591b49c-3f2c-4212-a5f0-90554e85da73	d19dc1c2-f745-475f-b88d-d36494bf73c1	placed	Order placed	2026-08-26 12:03:22.994
56ab47fe-f63b-42c1-86da-0e692956fc87	f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	placed	Order placed	2026-08-26 12:05:20.701
126f7449-04ad-4c00-8d8b-4cdafa0003df	f491c26c-1ae8-44d9-86dd-9fcc9c6810d1	confirmed		2026-08-27 02:39:18.715
\.


--
-- Data for Name: PaymentTransaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentTransaction" (session_id, order_id, amount, currency, status, payment_status, created_at) FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, slug, name, base_price, compare_at_price, description, category_slug, brand_slug, images, hover_image, is_new_arrival, is_best_seller, is_flash_sale, is_featured, status, avg_rating, review_count, sort_order, created_at, flash_sale_price, cost_price) FROM stdin;
f2d71e99-adac-4a72-81f2-3c477327f734	court-master-black-panther	Court Master Black Panther	8250	12500	The Court Master Black Panther blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	retro	airvault	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816372/solekicks/products/product_f2d71e99.jpg}	\N	t	t	f	f	active	4.92	68	4	2026-08-19 08:55:47.461	\N	0
d41d4636-afeb-43d4-b59e-3bff83dac04b	dunk-low-coastline-blue	Dunk Low 'Coastline Blue'	7499	11999	The Dunk Low 'Coastline Blue' blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	streetwear	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816372/solekicks/products/product_d41d4636.jpg}	\N	f	t	f	t	active	4.68	47	1	2026-08-19 08:55:47.442	\N	0
8410b4d6-d123-4e2c-bfac-ecd8235710f0	aj1-retro-high-ember	AJ-1 Retro High 'Ember'	10500	16500	The AJ-1 Retro High 'Ember' blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	retro	airvault	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816374/solekicks/products/product_8410b4d6.jpg}	\N	f	t	f	t	active	4.84	96	8	2026-08-19 08:55:47.489	\N	0
9e939ebd-aaad-466b-ac3b-05372981bc0b	oasis-cloud-slide-mono	Oasis Cloud Slide Mono	3499	4999	The Oasis Cloud Slide Mono blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	slides	oasis	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816376/solekicks/products/product_9e939ebd.jpg}	\N	f	f	f	f	active	4.76	124	12	2026-08-19 08:55:47.521	\N	0
21831171-c6ee-43b2-aa57-ec97dd4cfda1	aj4-shadow-grail	AJ-4 Shadow Grail	11250	17000	The AJ-4 Shadow Grail blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	retro	airvault	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816377/solekicks/products/product_21831171.jpg}	\N	f	t	t	t	active	4.84	131	13	2026-08-19 08:55:47.527	7874	0
f34cdaa3-d7dc-484a-8194-04a402096fd7	cloudstride-marathon-elite	CloudStride Marathon Elite	10999	16000	The CloudStride Marathon Elite blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	runners	cloudstride	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816378/solekicks/products/product_f34cdaa3.jpg}	\N	f	f	f	t	active	4.6	145	15	2026-08-19 08:55:47.54	\N	0
2b8f4197-1344-408a-8d22-f30c08554fca	boost-knit-cloud-runner	Boost Knit Cloud Runner	9899	14999	The Boost Knit Cloud Runner blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	runners	cloudstride	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816379/solekicks/products/product_2b8f4197.jpg}	\N	t	f	f	f	active	4.92	103	9	2026-08-19 08:55:47.501	\N	0
226c4d97-a6dc-44ae-b419-9815d44950dd	dunk-high-blue-terrace	Dunk High 'Blue Terrace'	8799	12999	The Dunk High 'Blue Terrace' blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	retro	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787735128/solekicks/products/dunk-high-blue-terrace/1-side.png,https://res.cloudinary.com/p1w5xus9/image/upload/v1787735193/solekicks/products/dunk-high-blue-terrace/2-front.png,https://res.cloudinary.com/p1w5xus9/image/upload/v1787735254/solekicks/products/dunk-high-blue-terrace/3-3d.png,https://res.cloudinary.com/p1w5xus9/image/upload/v1787735323/solekicks/products/dunk-high-blue-terrace/4-sole.png}	https://res.cloudinary.com/p1w5xus9/image/upload/v1787735193/solekicks/products/dunk-high-blue-terrace/2-front.png	t	t	t	f	active	4.92	138	14	2026-08-19 08:55:47.533	6159	0
bb763f5b-6b03-4701-aff3-f46c3a0204c7	velocity-gray-road-runner	Velocity Gray Road Runner	8499	13000	The Velocity Gray Road Runner blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	runners	cloudstride	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816380/solekicks/products/product_bb763f5b.jpg}	\N	t	t	f	f	active	4.76	89	7	2026-08-19 08:55:47.482	\N	0
6e9dc20b-8ca1-4ece-8444-3f17f37edf31	eqt-street-support-adv	EQT Street Support ADV	7899	10999	The EQT Street Support ADV blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	streetwear	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816382/solekicks/products/product_6e9dc20b.jpg}	\N	f	f	f	f	active	4.68	82	6	2026-08-19 08:55:47.477	\N	0
32e73be6-fc4e-49be-b8bc-5bd80769d345	aj4-retro-white-oreo	AJ-4 Retro 'White Oreo' Premium	8999	14500	The AJ-4 Retro 'White Oreo' Premium blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	retro	airvault	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816384/solekicks/products/product_32e73be6.jpg}	\N	t	t	f	t	active	4.6	40	0	2026-08-19 08:55:47.427	\N	0
3b10c7a8-9f3f-41fa-be19-d1204c4eb159	studio-athletic-trainer	Studio Athletic Trainer	6499	8999	The Studio Athletic Trainer blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	streetwear	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816385/solekicks/products/product_3b10c7a8.jpg}	\N	f	t	f	f	active	4.6	110	10	2026-08-19 08:55:47.508	\N	0
03a6adb6-43b1-4e6d-ac2d-cbbd25225e56	terrace-classic-white-low	Terrace Classic White Low	6999	9999	The Terrace Classic White Low blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	streetwear	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816386/solekicks/products/product_03a6adb6.jpg}	\N	t	f	t	t	active	4.6	75	5	2026-08-19 08:55:47.471	4899	0
79b0c955-ebb3-4af8-ba1b-084a0bc8f20b	adi-mono-panel-low	Adi Mono Panel Low	7299	10500	The Adi Mono Panel Low blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	streetwear	terrace-co	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816388/solekicks/products/product_79b0c955.jpg}	\N	t	f	f	f	active	4.68	117	11	2026-08-19 08:55:47.515	\N	0
2a765049-f077-4219-a35f-8dc5a7041d18	oasis-foam-slides	Oasis Foam Recovery Slides	3899	5500	The Oasis Foam Recovery Slides blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.	slides	oasis	{https://res.cloudinary.com/p1w5xus9/image/upload/v1787816389/solekicks/products/product_2a765049.jpg}	\N	f	t	t	f	active	4.84	61	3	2026-08-19 08:55:47.453	2729	0
\.


--
-- Data for Name: ProductBundle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductBundle" (id, name, slug, description, image_url, bundle_price, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: ProductSize; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductSize" (id, size, stock, product_id) FROM stdin;
1f99379f-d7e6-4cb1-890a-74ed3bbc59eb	40	8	32e73be6-fc4e-49be-b8bc-5bd80769d345
5acadbd9-0d61-47fd-9ada-bbeaa76bc020	41	8	32e73be6-fc4e-49be-b8bc-5bd80769d345
a209a868-ffd2-4dd9-a6ad-08fd9f61fdd0	42	3	32e73be6-fc4e-49be-b8bc-5bd80769d345
0abbc537-50b2-4efd-a75f-a700ae0c78fc	43	2	32e73be6-fc4e-49be-b8bc-5bd80769d345
3b7db16e-720f-473a-8fcf-c1246cff48b7	44	8	32e73be6-fc4e-49be-b8bc-5bd80769d345
a3449c4e-4f97-4154-83a0-cfd01a5868c9	45	8	32e73be6-fc4e-49be-b8bc-5bd80769d345
be07f56d-73fc-461d-9453-9bbf142445a1	46	8	32e73be6-fc4e-49be-b8bc-5bd80769d345
4e911fc3-86ed-4ba1-980e-063a41937e10	39	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
a146899d-431d-48d6-9d38-fc5a68f12702	40	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
5aaf1303-31cb-49fc-aca4-31ba290432bd	41	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
c65d124f-ccea-405c-ad6a-db80e2a18106	42	3	d41d4636-afeb-43d4-b59e-3bff83dac04b
fee2825d-ab64-45ca-9eec-a37b9863d335	43	2	d41d4636-afeb-43d4-b59e-3bff83dac04b
c261d401-3675-44f5-8db7-c35d6f9fc04d	44	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
bacdbe31-1781-4001-814a-1e407e558ac4	45	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
a88235d9-7808-4bab-b60d-35fcb18c2cea	46	8	d41d4636-afeb-43d4-b59e-3bff83dac04b
f257ea39-6874-4fa8-8f63-33b2606ba267	39	8	2a765049-f077-4219-a35f-8dc5a7041d18
3d5bfe0e-dce5-4860-8717-677b15762ba2	40	8	2a765049-f077-4219-a35f-8dc5a7041d18
1f56397c-a998-482b-8df5-5ee0cf9c9abe	41	8	2a765049-f077-4219-a35f-8dc5a7041d18
3683172f-29a0-44e1-bf8a-e66ca0ddd910	42	3	2a765049-f077-4219-a35f-8dc5a7041d18
bd9544b3-15ed-499f-a00a-aa1364b97349	43	2	2a765049-f077-4219-a35f-8dc5a7041d18
d44f0e3c-9759-4459-b8a8-74ee886c06d2	44	8	2a765049-f077-4219-a35f-8dc5a7041d18
8a55084d-eeb6-472c-9ac9-5488e6fc340a	45	8	2a765049-f077-4219-a35f-8dc5a7041d18
f2da5713-17d5-434a-8da7-329720429bb8	46	8	2a765049-f077-4219-a35f-8dc5a7041d18
791504fc-fdaf-47c3-9fe4-fc4383d0ae4b	41	8	f2d71e99-adac-4a72-81f2-3c477327f734
914ed5a5-4bff-4b22-aa1c-44abdb419d8c	42	3	f2d71e99-adac-4a72-81f2-3c477327f734
a914e4b2-1eef-427f-863b-c6ae4294711d	43	2	f2d71e99-adac-4a72-81f2-3c477327f734
639025f6-91a2-4407-bb45-c083ac8ddd03	44	8	f2d71e99-adac-4a72-81f2-3c477327f734
bfab99df-bd93-446a-8d04-0dd5bcf49c07	45	8	f2d71e99-adac-4a72-81f2-3c477327f734
610a2caa-16e2-48a1-b482-47aaef64454c	46	8	f2d71e99-adac-4a72-81f2-3c477327f734
8afa944e-d0d9-40d8-bc41-58fb89d349e9	39	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
ece8bd10-392c-4e74-810a-4e3ee2089e86	40	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
1bf51f57-6773-48ca-8406-5d63af86c28f	41	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
8d6dceb1-42e0-46fd-b274-f89ac7c52202	42	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
c0a3d182-a59c-4933-b869-30c916de8d6a	43	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
aeab567d-2f21-4256-bb60-c33ac3970998	44	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
db1cdc3e-728d-46eb-848e-2876154ec03a	45	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
66b19875-84f5-4c33-9de3-40fba97a2b1b	46	8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56
7e9ce21a-5f28-422b-a0cc-3e416cadd97f	40	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
320519d7-53e2-4a39-bca7-94e308b19306	41	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
814c92ce-c119-47d8-ba2f-634eea52ddd4	42	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
f9026730-fec3-426d-bef8-ccabf8c09ff9	43	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
ad5c6fde-e912-4af2-a745-e0920362c94b	44	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
d8c39d85-2482-4029-88ea-7b3c582ba8f5	45	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
e5159b47-589c-4fc8-8a90-ca8b4267b28a	46	8	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
1f53ba57-ce7f-4516-aa28-544ff61b7305	39	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
4c928eae-1ffd-4e1d-a2a5-85e09876442d	40	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
0e1c834c-d8fe-4eee-8381-5f53e02a2306	41	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
120cdd4e-7cd0-4e5a-94df-eddcd0138d77	42	3	bb763f5b-6b03-4701-aff3-f46c3a0204c7
b5b6d6c2-eb75-439c-a94e-6cc633eb3479	43	2	bb763f5b-6b03-4701-aff3-f46c3a0204c7
b15b0ea8-103e-4a59-ab54-64e874199c75	44	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
17b9400b-8fba-45e1-abed-4d84ed494dec	45	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
75543003-cc08-4be6-99e2-ed77aa1a7e46	46	8	bb763f5b-6b03-4701-aff3-f46c3a0204c7
f605a0ad-55ea-4a7f-9222-46e50c4d5aa8	40	8	8410b4d6-d123-4e2c-bfac-ecd8235710f0
a37261c5-bda9-4264-8de2-3b6f1ea7fc08	41	8	8410b4d6-d123-4e2c-bfac-ecd8235710f0
1a4250bf-ae6c-472b-8963-5315a02e509f	42	3	8410b4d6-d123-4e2c-bfac-ecd8235710f0
54b648d4-b954-4534-aea9-fde97fef64d4	43	2	8410b4d6-d123-4e2c-bfac-ecd8235710f0
6c2d35b2-c322-488a-a0fb-3020ee1eeb06	44	8	8410b4d6-d123-4e2c-bfac-ecd8235710f0
98bd789c-eada-4f65-b435-fce9c7991396	39	6	f2d71e99-adac-4a72-81f2-3c477327f734
84c463c7-6eaa-45bf-a1a9-d1123c7c837a	39	7	6e9dc20b-8ca1-4ece-8444-3f17f37edf31
521ee714-cbd0-4fb2-bffb-86721f43d2e9	40	7	f2d71e99-adac-4a72-81f2-3c477327f734
df94c45c-3fed-4f38-8313-629e7584f734	39	7	8410b4d6-d123-4e2c-bfac-ecd8235710f0
96454fa4-826e-4ed3-9790-f3ac655dafe8	39	7	32e73be6-fc4e-49be-b8bc-5bd80769d345
fb6d216f-1529-49d4-8172-f8efbc9d7052	45	8	8410b4d6-d123-4e2c-bfac-ecd8235710f0
b83a1d7b-39e5-4332-a9fa-45e7d3e05a8e	46	8	8410b4d6-d123-4e2c-bfac-ecd8235710f0
0c0c6447-17a4-47df-9205-8a5f2bacbad7	39	8	2b8f4197-1344-408a-8d22-f30c08554fca
d30e0e8c-44d9-41a9-b165-aa6f214e8881	40	8	2b8f4197-1344-408a-8d22-f30c08554fca
ce26c608-8c40-4fc4-97dd-26f77f29dd4d	41	8	2b8f4197-1344-408a-8d22-f30c08554fca
7bbbf2f6-35fc-412e-83ec-d15aec6de750	42	8	2b8f4197-1344-408a-8d22-f30c08554fca
ed7329a6-d3d6-4e62-916b-0c4839d60f83	43	8	2b8f4197-1344-408a-8d22-f30c08554fca
767c1003-c1e0-4377-9b5f-369ca2f9ebdd	44	8	2b8f4197-1344-408a-8d22-f30c08554fca
733b8d2f-0d03-48cb-9e82-0245d317fb9d	45	8	2b8f4197-1344-408a-8d22-f30c08554fca
a49d9324-98fa-410d-b943-379bc041ac2d	46	8	2b8f4197-1344-408a-8d22-f30c08554fca
6aaeef40-4d1d-42bd-9acd-5d629e55471c	39	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
d04c52a1-e6c3-4deb-8d8a-af54e304e386	40	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
42220736-6153-4be0-bad7-5a1190c655f1	41	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
fe8560d1-78da-4868-93fd-0ed5bfebaa14	42	3	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
dd3d6bdb-a05e-4011-9cfe-1c6665953efc	43	2	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
3eb6cdf1-4ee5-447c-880c-f4119048e200	44	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
23b3317f-8527-449c-a334-e5ef238e1ced	45	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
cf086f00-2112-4b5b-94f3-a4c03f9e40f1	46	8	3b10c7a8-9f3f-41fa-be19-d1204c4eb159
b709e13f-beaa-4547-9ea0-3e28d0213ad7	39	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
3c331d2f-0514-44bb-a2c0-205c5021f2c4	40	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
7f4f0afb-41e2-4dc9-90ca-f5f1cc64466a	41	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
91e9a57e-37ab-4e8c-a75d-e4de1e9120dd	42	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
335b51f1-0525-4213-8174-276e39116c71	43	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
9767ef21-9683-4fcd-b701-d9df53e4edc7	44	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
81ca910c-0984-4ba6-b7e1-261d1ba7de05	45	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
14dbab77-96c8-48fe-bd6f-5ba17e805406	46	8	79b0c955-ebb3-4af8-ba1b-084a0bc8f20b
5b74408b-8b40-4071-be90-5154f72f1957	39	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
3281b2c6-acbc-455b-9349-21ef69bb755d	40	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
86fd8907-6f08-413d-b179-ea9e39563fe5	41	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
719e0f5d-d77f-4ca8-8cd4-cb4c6b18aca3	42	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
2fac3d12-9191-414b-9176-8463b30eb348	43	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
098a399f-87c7-4bb6-816d-1587ed09e268	44	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
ae62048c-86e2-479e-8c85-e5d32ad4ea75	45	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
874eee73-23b2-405c-a447-894f3d3a28a7	46	8	9e939ebd-aaad-466b-ac3b-05372981bc0b
e446d341-2614-4cc3-a9ea-400574b4787e	39	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
30222ce0-46d5-47c1-8efc-32e25f791811	40	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
ee66ce5d-8cb5-4296-a703-daa27491adb2	41	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
c122ab41-2882-4955-9a30-af808e0dff1c	42	3	21831171-c6ee-43b2-aa57-ec97dd4cfda1
f4ba8968-7418-4f75-a1b7-22ce8139ba73	43	2	21831171-c6ee-43b2-aa57-ec97dd4cfda1
d321c667-46a6-4777-bc19-b31e1aa2ae8a	44	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
747e2f79-8b1f-4136-add3-23297b24f54e	45	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
7bd7248e-8193-477d-ad55-6dd29349d34c	46	8	21831171-c6ee-43b2-aa57-ec97dd4cfda1
ca4d03f8-9d59-4f5e-84e2-b3733e092469	39	8	226c4d97-a6dc-44ae-b419-9815d44950dd
dacfd0a7-b016-40f0-9a93-5ea12f62c8d6	40	8	226c4d97-a6dc-44ae-b419-9815d44950dd
c37fded2-da0d-4919-93bb-5cda705804a2	41	8	226c4d97-a6dc-44ae-b419-9815d44950dd
9104554b-70f4-4776-8e0a-946fa7d16bd5	42	3	226c4d97-a6dc-44ae-b419-9815d44950dd
04bf7b58-0e74-4ef7-b367-004b0da72d44	43	2	226c4d97-a6dc-44ae-b419-9815d44950dd
5df392c8-5e65-4934-bbdf-a02294caf90a	44	8	226c4d97-a6dc-44ae-b419-9815d44950dd
798c38a6-5ce5-4f78-bd95-bbcaa87ed05d	45	8	226c4d97-a6dc-44ae-b419-9815d44950dd
5577ff02-d2e5-4841-b8b2-dc4e66d43211	46	8	226c4d97-a6dc-44ae-b419-9815d44950dd
4cd2e4c9-ed41-495e-9d1a-dfb154e10915	39	8	f34cdaa3-d7dc-484a-8194-04a402096fd7
b8e0e3f5-3b8d-4392-8fb1-2435d6f4de89	40	8	f34cdaa3-d7dc-484a-8194-04a402096fd7
e87ebc83-d6e8-4f25-9afc-6d0194dc6ab6	41	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
deb24c35-98f5-44de-8091-98cf1756f021	42	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
1075d0fa-1fea-4129-9673-1cf6f024e749	43	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
80fcf032-d94c-4b2f-9685-1d2d24c1f457	44	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
f564b6b4-a803-465b-92d4-ce4d30db72a6	45	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
4f54ce8d-2af4-4171-84a5-5aeb9ac72017	46	0	f34cdaa3-d7dc-484a-8194-04a402096fd7
\.


--
-- Data for Name: PromoBanner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PromoBanner" (id, title, subtitle, image_url, link, button_text, is_active, start_date, end_date) FROM stdin;
\.


--
-- Data for Name: Refund; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Refund" (id, order_id, order_number, return_request_id, amount, reason, method, status, external_ref, processed_by, failure_reason, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: ReturnRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReturnRequest" (id, order_id, order_number, customer_name, customer_phone, reason, status, created_at, product_id, product_name, quantity, refund_amount) FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Review" (id, product_id, user_id, customer_name, rating, comment, image_urls, created_at, admin_reply, order_id, report_reason, status) FROM stdin;
83e52a45-ac53-483c-b1be-0d7facf44306	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56	\N	Hamza Tariq	5	Delivered in 2 days to DHA Lahore via COD! The cushioning is insane.	{}	2026-08-19 08:55:47.57	\N	\N	\N	pending
be5d7202-3568-4f0c-8946-4a106b8d7f50	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56	\N	Zeeshan Malik	5	Size 43 fit true to chart. Exchange policy gave me full confidence.	{}	2026-08-19 08:55:47.575	\N	\N	\N	pending
36a751ea-c3a5-4620-b03d-9e80de940ef8	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56	\N	Ali Raza	5	Hands down best sneaker cop in Pakistan. Packaging was top tier.	{}	2026-08-19 08:55:47.578	\N	\N	\N	pending
ada286cb-29e7-4fe9-a9c9-cee0d6d3465e	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Hamza Tariq	5	Delivered in 2 days to DHA Lahore via COD! The cushioning is insane.	{}	2026-08-19 08:55:47.581	\N	\N	\N	pending
20dc9ec1-a8b2-4f0a-a870-bdeadd141972	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Zeeshan Malik	5	Size 43 fit true to chart. Exchange policy gave me full confidence.	{}	2026-08-19 08:55:47.584	\N	\N	\N	pending
fbcbbf8f-e4d1-4cd2-a42a-245d590fb8e8	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Ali Raza	5	Hands down best sneaker cop in Pakistan. Packaging was top tier.	{}	2026-08-19 08:55:47.588	\N	\N	\N	pending
2b55353b-45af-409d-9375-6fbe999e9395	226c4d97-a6dc-44ae-b419-9815d44950dd	\N	Hamza Tariq	5	Delivered in 2 days to DHA Lahore via COD! The cushioning is insane.	{}	2026-08-19 08:55:47.591	\N	\N	\N	pending
181796e8-2091-49e9-a42b-1062e6ed1d71	226c4d97-a6dc-44ae-b419-9815d44950dd	\N	Zeeshan Malik	5	Size 43 fit true to chart. Exchange policy gave me full confidence.	{}	2026-08-19 08:55:47.593	\N	\N	\N	pending
ede8d58e-70a8-40b1-b51e-c7f82653463b	226c4d97-a6dc-44ae-b419-9815d44950dd	\N	Ali Raza	5	Hands down best sneaker cop in Pakistan. Packaging was top tier.	{}	2026-08-19 08:55:47.596	\N	\N	\N	pending
67c477d6-7570-4db7-bbb2-5678641c7bcf	2a765049-f077-4219-a35f-8dc5a7041d18	\N	Hamza Tariq	5	Delivered in 2 days to DHA Lahore via COD! The cushioning is insane.	{}	2026-08-19 08:55:47.598	\N	\N	\N	pending
83310600-23aa-481e-ae21-e684c8439b62	2a765049-f077-4219-a35f-8dc5a7041d18	\N	Zeeshan Malik	5	Size 43 fit true to chart. Exchange policy gave me full confidence.	{}	2026-08-19 08:55:47.6	\N	\N	\N	pending
b5d07384-44ff-4f69-a337-084480c7d32e	2a765049-f077-4219-a35f-8dc5a7041d18	\N	Ali Raza	5	Hands down best sneaker cop in Pakistan. Packaging was top tier.	{}	2026-08-19 08:55:47.603	\N	\N	\N	pending
69a88ad2-2aa9-40c5-8cb6-f814f35d57ff	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Customer 1	5	Great shoes!	\N	2026-08-21 13:49:24.081	\N	\N	\N	approved
8f2c763a-e83e-4d08-891d-d167e1eeb8f5	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Customer 2	3	Okay but size is small	\N	2026-08-25 13:49:24.117	\N	\N	\N	pending
749ac99d-2c34-4e01-97ee-cc38214d8508	226c4d97-a6dc-44ae-b419-9815d44950dd	\N	Customer 3	1	Worst quality ever	\N	2026-08-25 13:49:24.124	\N	\N	\N	reported
2d27c2bf-618f-46f5-9e23-ea73b2c6dbd6	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Customer 4	5	Love it, highly recommend	\N	2026-08-19 13:49:24.129	\N	\N	\N	approved
41349fa6-b91a-4da5-9cb0-fa0fb131c1a1	2b8f4197-1344-408a-8d22-f30c08554fca	\N	Customer 5	4	Fast delivery	\N	2026-08-21 13:49:24.138	\N	\N	\N	approved
08ede4b9-b411-4002-aa25-ad0429a8f3ea	03a6adb6-43b1-4e6d-ac2d-cbbd25225e56	\N	Customer 6	2	The color faded after one wash	\N	2026-08-19 13:49:24.148	\N	\N	\N	pending
39770856-45f3-42f3-9360-fde0ea5c6323	21831171-c6ee-43b2-aa57-ec97dd4cfda1	\N	Sami Ullah	4	awesome great fitting.	{}	2026-08-27 03:55:50.602	\N	\N	\N	pending
\.


--
-- Data for Name: SeoConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SeoConfig" (id, default_meta_title, default_meta_desc, default_og_image) FROM stdin;
singleton	\N	\N	\N
\.


--
-- Data for Name: Settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Settings" (id, announcement_text, announcement_active, free_shipping_min_amt, flat_shipping_fee, advance_payment_threshold, advance_payment_percent, cod_enabled, card_enabled, wallet_enabled, whatsapp_number, supported_countries, flash_sale_active, flash_sale_end_time) FROM stdin;
singleton	⚡ FLASH DROP: 15% OFF ORDERS OVER RS. 9,999 · FREE SHIPPING ON ORDERS OVER RS. 5,000 · 7-DAY EXCHANGE	t	5000	250	20000	10	t	t	t	923001234567	{PK}	t	2026-09-06 01:43:54.729
\.


--
-- Data for Name: ShippingZone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShippingZone" (id, country_code, flat_fee, free_shipping_min, is_active) FROM stdin;
b7ba703f-d833-4a86-8ee7-3b789fe54e38	PK	250	5000	t
\.


--
-- Data for Name: StaticPage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StaticPage" (id, title, slug, content_html, seo_title, seo_description, is_published, updated_at) FROM stdin;
\.


--
-- Data for Name: StoreCredit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StoreCredit" (id, user_id, balance, updated_at) FROM stdin;
\.


--
-- Data for Name: StoreCreditLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StoreCreditLedger" (id, user_id, amount, reason, order_id, created_at) FROM stdin;
\.


--
-- Data for Name: Testimonial; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Testimonial" (id, author_name, author_meta, content, rating, is_published, review_id) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, phone, password_hash, role, is_blocked, picture, created_at) FROM stdin;
afc84a1b-be3a-4518-a2e2-e272e1e81b9b	Store Owner	sahilwaheed48@gmail.com	\N	$2b$10$VaV9rFnROfLUqHzHMCgXcOdh9OQA99AtM9NPrzeQeP/ytC76gRw/e	admin	f	\N	2026-08-19 08:55:47.155
4e741245-3c62-4c46-920e-64630f2b069b	Test Customer	customer@test.com	\N	$2b$10$SjcbFBZLo//ldCTg8aZctuTFoj41KX0GWwDCsbtCcKZlQJ2tj7rbu	customer	f	\N	2026-08-19 08:55:47.337
4a1186ff-fb37-4d11-9be2-ec0dd1985365	Sami Ullah	samisial1555@gmail.com	\N	\N	customer	f	https://lh3.googleusercontent.com/a/ACg8ocKbWWjcamVPTJzwNubSIpsK8QYQMZyj-1EqsKF_G2U08v-y9Q=s96-c	2026-08-19 11:33:38.939
a7b13d66-6a84-42a8-8e66-b3678e40be0b	Sami Ullah	sialsami333@gmail.com	+923146180920	$2b$10$zAEMOBVDMwlfWWfFiIlH7uET0KMuFgxjVzf.H6YKQTfNjNNzmtoIq	customer	f	\N	2026-08-25 01:56:54.26
47abd5d6-fc35-411d-9814-1d76acb4111b	SAMI SIAL	sami.assignments@gmail.com	+923146180920	$2b$10$IamS1axUdalhpDXoxa9aJ.wKcmvyf1.WeVjmfdl2pkaNEBG.R/HtC	customer	f	\N	2026-08-25 03:07:01.371
\.


--
-- Data for Name: Wishlist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wishlist" (id, user_id, guest_id) FROM stdin;
7f3866af-b1a9-4eef-b48f-ab565b540477	4a1186ff-fb37-4d11-9be2-ec0dd1985365	\N
e9f8409c-3a06-4119-acf2-785fbf446d4a	\N	64c026e5-1ed7-4744-b4c5-58a4d34b54f8
d26c2346-df26-4bc2-ba1c-75e96d9b8a9c	afc84a1b-be3a-4518-a2e2-e272e1e81b9b	\N
232434ec-10ee-4a2f-ba71-9894bf6bfd96	\N	a6a3de1b-9832-42dd-99f6-5079f4e7bfa5
e0c86f56-7115-437b-9588-3f1a7f89a281	a7b13d66-6a84-42a8-8e66-b3678e40be0b	\N
\.


--
-- Data for Name: WishlistItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WishlistItem" (id, wishlist_id, product_id, size) FROM stdin;
34f240f3-1af3-461e-a44b-0e798b3297d1	d26c2346-df26-4bc2-ba1c-75e96d9b8a9c	32e73be6-fc4e-49be-b8bc-5bd80769d345	\N
8705eeea-df11-47a5-83c2-450fabadbaaf	e0c86f56-7115-437b-9588-3f1a7f89a281	f2d71e99-adac-4a72-81f2-3c477327f734	\N
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AdminActionLog AdminActionLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminActionLog"
    ADD CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: BundleItem BundleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY (id);


--
-- Name: HeroSlide HeroSlide_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HeroSlide"
    ADD CONSTRAINT "HeroSlide_pkey" PRIMARY KEY (id);


--
-- Name: HomepageSection HomepageSection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HomepageSection"
    ADD CONSTRAINT "HomepageSection_pkey" PRIMARY KEY (id);


--
-- Name: Newsletter Newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Newsletter"
    ADD CONSTRAINT "Newsletter_pkey" PRIMARY KEY (email);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OTP OTP_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OTP"
    ADD CONSTRAINT "OTP_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderStatusHistory OrderStatusHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PaymentTransaction PaymentTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY (session_id);


--
-- Name: ProductBundle ProductBundle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductBundle"
    ADD CONSTRAINT "ProductBundle_pkey" PRIMARY KEY (id);


--
-- Name: ProductSize ProductSize_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductSize"
    ADD CONSTRAINT "ProductSize_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PromoBanner PromoBanner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PromoBanner"
    ADD CONSTRAINT "PromoBanner_pkey" PRIMARY KEY (id);


--
-- Name: Refund Refund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_pkey" PRIMARY KEY (id);


--
-- Name: ReturnRequest ReturnRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReturnRequest"
    ADD CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: SeoConfig SeoConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeoConfig"
    ADD CONSTRAINT "SeoConfig_pkey" PRIMARY KEY (id);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: ShippingZone ShippingZone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShippingZone"
    ADD CONSTRAINT "ShippingZone_pkey" PRIMARY KEY (id);


--
-- Name: StaticPage StaticPage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaticPage"
    ADD CONSTRAINT "StaticPage_pkey" PRIMARY KEY (id);


--
-- Name: StoreCreditLedger StoreCreditLedger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreCreditLedger"
    ADD CONSTRAINT "StoreCreditLedger_pkey" PRIMARY KEY (id);


--
-- Name: StoreCredit StoreCredit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreCredit"
    ADD CONSTRAINT "StoreCredit_pkey" PRIMARY KEY (id);


--
-- Name: Testimonial Testimonial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Testimonial"
    ADD CONSTRAINT "Testimonial_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WishlistItem WishlistItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_pkey" PRIMARY KEY (id);


--
-- Name: Wishlist Wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_pkey" PRIMARY KEY (id);


--
-- Name: Brand_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_slug_key" ON public."Brand" USING btree (slug);


--
-- Name: Cart_guest_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cart_guest_id_key" ON public."Cart" USING btree (guest_id);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Coupon_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Coupon_code_key" ON public."Coupon" USING btree (code);


--
-- Name: HomepageSection_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "HomepageSection_type_key" ON public."HomepageSection" USING btree (type);


--
-- Name: OTP_email_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OTP_email_purpose_idx" ON public."OTP" USING btree (email, purpose);


--
-- Name: Order_order_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_order_number_key" ON public."Order" USING btree (order_number);


--
-- Name: ProductBundle_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProductBundle_slug_key" ON public."ProductBundle" USING btree (slug);


--
-- Name: ProductSize_product_id_size_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProductSize_product_id_size_key" ON public."ProductSize" USING btree (product_id, size);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: ShippingZone_country_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShippingZone_country_code_key" ON public."ShippingZone" USING btree (country_code);


--
-- Name: StaticPage_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "StaticPage_slug_key" ON public."StaticPage" USING btree (slug);


--
-- Name: StoreCredit_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "StoreCredit_user_id_key" ON public."StoreCredit" USING btree (user_id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Wishlist_guest_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Wishlist_guest_id_key" ON public."Wishlist" USING btree (guest_id);


--
-- Name: Address Address_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdminActionLog AdminActionLog_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdminActionLog"
    ADD CONSTRAINT "AdminActionLog_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BundleItem BundleItem_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_bundle_id_fkey" FOREIGN KEY (bundle_id) REFERENCES public."ProductBundle"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BundleItem BundleItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BundleItem"
    ADD CONSTRAINT "BundleItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderStatusHistory OrderStatusHistory_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PaymentTransaction PaymentTransaction_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductSize ProductSize_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductSize"
    ADD CONSTRAINT "ProductSize_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Refund Refund_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Refund Refund_return_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_return_request_id_fkey" FOREIGN KEY (return_request_id) REFERENCES public."ReturnRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReturnRequest ReturnRequest_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReturnRequest"
    ADD CONSTRAINT "ReturnRequest_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Review Review_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StoreCreditLedger StoreCreditLedger_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreCreditLedger"
    ADD CONSTRAINT "StoreCreditLedger_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StoreCredit StoreCredit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreCredit"
    ADD CONSTRAINT "StoreCredit_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WishlistItem WishlistItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WishlistItem WishlistItem_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_wishlist_id_fkey" FOREIGN KEY (wishlist_id) REFERENCES public."Wishlist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wishlist Wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PfrJ1HueVL64FCSLhEaz85uwc76ogRlWmzFmcQponhfWOaKXptiKkf4hl3VyYaZ

