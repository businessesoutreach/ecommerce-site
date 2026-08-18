from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import random
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Header, UploadFile, File, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

import seed_data

# ---------------- Setup ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="SOLEKICKS PK API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("solekicks")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"

# ---------------- Object storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "solekicks"
storage_key = None


def init_storage(force=False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path, data, content_type):
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- Auth helpers ----------------
def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h):
    try: return bcrypt.checkpw(p.encode(), h.encode())
    except Exception: return False


def create_access_token(uid, email, role):
    payload = {"sub": uid, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


async def get_token_from_request(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    return token


async def get_current_user(request: Request):
    token = await get_token_from_request(request)
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(token)
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def get_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") not in ("admin", "staff"):
        raise HTTPException(403, "Admin access required")
    return user


def owner_filter(user, guest_id):
    if user:
        return {"user_id": user["id"]}
    if guest_id:
        return {"guest_id": guest_id}
    raise HTTPException(400, "Missing guest id")


# ---------------- Models ----------------
class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class CartItemReq(BaseModel):
    product_id: str
    size: str
    quantity: int = 1


class WishlistItemReq(BaseModel):
    product_id: str
    size: Optional[str] = None


class ShippingReq(BaseModel):
    country_code: str = "PK"
    subtotal: float


class CouponReq(BaseModel):
    code: str
    subtotal: float


class OrderReq(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    shipping_address: dict
    payment_method: str  # COD, CARD, WALLET
    coupon_code: Optional[str] = None
    customer_note: Optional[str] = None
    store_credit_amount: float = 0


class ReturnReq(BaseModel):
    reason: str
    phone: Optional[str] = None


class RefundReq(BaseModel):
    amount: float
    reason: str
    method: str  # PAYFAST_ORIGINAL, BANK_TRANSFER, STORE_CREDIT
    external_ref: Optional[str] = None
    return_request_id: Optional[str] = None


class ReviewReq(BaseModel):
    customer_name: str
    rating: int
    comment: Optional[str] = None
    image_urls: List[str] = []


class NewsletterReq(BaseModel):
    email: EmailStr


# ---------------- Helpers ----------------
def clean(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


async def get_settings():
    s = await db.settings.find_one({"id": "singleton"}, {"_id": 0})
    return s or {}


def price_of(product, size=None):
    return float(product["base_price"])


async def enrich_cart(cart):
    items = []
    subtotal = 0
    for it in cart.get("items", []):
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if not p:
            continue
        price = price_of(p, it["size"])
        line = price * it["quantity"]
        subtotal += line
        items.append({
            "id": it["id"], "product_id": p["id"], "slug": p["slug"], "name": p["name"],
            "size": it["size"], "quantity": it["quantity"], "price": price,
            "compare_at_price": p.get("compare_at_price"), "image": p["images"][0],
            "brand": p.get("brand_slug"), "line_total": line,
        })
    return {"items": items, "subtotal": subtotal, "count": sum(i["quantity"] for i in items)}


# ==================== AUTH ====================
def set_auth_cookie(resp, token):
    resp.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


@api.post("/auth/register")
async def register(body: RegisterReq, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "name": body.name, "email": email, "phone": body.phone,
           "password_hash": hash_password(body.password), "role": "customer",
           "is_blocked": False, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(doc)
    token = create_access_token(uid, email, "customer")
    set_auth_cookie(response, token)
    return {"success": True, "data": {"id": uid, "name": body.name, "email": email, "role": "customer", "token": token}}


@api.post("/auth/login")
async def login(body: LoginReq, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    if user.get("is_blocked"):
        raise HTTPException(403, "Account is blocked")
    token = create_access_token(user["id"], email, user["role"])
    set_auth_cookie(response, token)
    return {"success": True, "data": {"id": user["id"], "name": user["name"], "email": email, "role": user["role"], "token": token}}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"success": True, "data": user}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


# ==================== CATALOG ====================
@api.get("/products")
async def list_products(category: Optional[str] = None, brand: Optional[str] = None,
                        size: Optional[str] = None, search: Optional[str] = None,
                        flag: Optional[str] = None, min_price: Optional[float] = None,
                        max_price: Optional[float] = None, sort: str = "featured",
                        page: int = 1, limit: int = 24):
    q = {"status": "active"}
    if category: q["category_slug"] = category
    if brand: q["brand_slug"] = brand
    if search: q["name"] = {"$regex": search, "$options": "i"}
    if flag == "new": q["is_new_arrival"] = True
    if flag == "flash": q["is_flash_sale"] = True
    if flag == "best": q["is_best_seller"] = True
    if flag == "featured": q["is_featured"] = True
    if size: q["sizes"] = {"$elemMatch": {"size": size, "stock": {"$gt": 0}}}
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None: pr["$gte"] = min_price
        if max_price is not None: pr["$lte"] = max_price
        q["base_price"] = pr
    sort_map = {"price_asc": [("base_price", 1)], "price_desc": [("base_price", -1)],
                "newest": [("created_at", -1)], "rating": [("avg_rating", -1)],
                "featured": [("sort_order", 1)]}
    cursor = db.products.find(q, {"_id": 0}).sort(sort_map.get(sort, [("sort_order", 1)]))
    total = await db.products.count_documents(q)
    items = await cursor.skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"success": True, "data": items, "total": total, "page": page}


@api.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return {"success": True, "data": p}


@api.get("/products/{product_id}/related")
async def related(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    items = await db.products.find({"category_slug": p["category_slug"], "id": {"$ne": product_id}, "status": "active"}, {"_id": 0}).limit(8).to_list(8)
    return {"success": True, "data": items}


@api.get("/products/{product_id}/reviews")
async def product_reviews(product_id: str):
    items = await db.reviews.find({"product_id": product_id, "is_approved": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"success": True, "data": items}


@api.post("/products/{product_id}/reviews")
async def add_review(product_id: str, body: ReviewReq, user=Depends(get_optional_user)):
    doc = {"id": str(uuid.uuid4()), "product_id": product_id, "user_id": user["id"] if user else None,
           "customer_name": body.customer_name, "rating": max(1, min(5, body.rating)),
           "comment": body.comment, "image_urls": body.image_urls, "is_approved": False,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.insert_one(doc)
    return {"success": True, "data": clean(doc)}


@api.get("/categories")
async def categories():
    items = await db.categories.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    for c in items:
        c["product_count"] = await db.products.count_documents({"category_slug": c["slug"], "status": "active"})
    return {"success": True, "data": items}


@api.get("/categories/{slug}")
async def category(slug: str):
    c = await db.categories.find_one({"slug": slug}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": c}


@api.get("/brands")
async def brands():
    items = await db.brands.find({}, {"_id": 0}).to_list(100)
    return {"success": True, "data": items}


@api.get("/search")
async def search(q: str = ""):
    if not q:
        return {"success": True, "data": []}
    items = await db.products.find({"name": {"$regex": q, "$options": "i"}, "status": "active"}, {"_id": 0}).limit(8).to_list(8)
    return {"success": True, "data": items}


# ==================== CART ====================
async def get_or_create_cart(user, guest_id):
    f = owner_filter(user, guest_id)
    cart = await db.carts.find_one(f)
    if not cart:
        cart = {"id": str(uuid.uuid4()), "user_id": user["id"] if user else None,
                "guest_id": None if user else guest_id, "items": [],
                "updated_at": datetime.now(timezone.utc).isoformat()}
        await db.carts.insert_one(dict(cart))
    return cart


@api.get("/cart")
async def get_cart(request: Request, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    cart = await get_or_create_cart(user, x_guest_id)
    return {"success": True, "data": await enrich_cart(cart)}


@api.post("/cart/items")
async def add_cart_item(body: CartItemReq, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    cart = await get_or_create_cart(user, x_guest_id)
    p = await db.products.find_one({"id": body.product_id})
    if not p:
        raise HTTPException(404, "Product not found")
    variant = next((s for s in p["sizes"] if s["size"] == body.size), None)
    if not variant or variant["stock"] < body.quantity:
        raise HTTPException(400, "Insufficient stock for selected size")
    items = cart.get("items", [])
    existing = next((i for i in items if i["product_id"] == body.product_id and i["size"] == body.size), None)
    if existing:
        existing["quantity"] += body.quantity
    else:
        items.append({"id": str(uuid.uuid4()), "product_id": body.product_id, "size": body.size, "quantity": body.quantity})
    await db.carts.update_one({"id": cart["id"]}, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    cart["items"] = items
    return {"success": True, "data": await enrich_cart(cart)}


@api.patch("/cart/items/{item_id}")
async def update_cart_item(item_id: str, body: dict, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    cart = await get_or_create_cart(user, x_guest_id)
    qty = int(body.get("quantity", 1))
    items = cart.get("items", [])
    for i in items:
        if i["id"] == item_id:
            if qty <= 0:
                items = [x for x in items if x["id"] != item_id]
            else:
                i["quantity"] = qty
            break
    await db.carts.update_one({"id": cart["id"]}, {"$set": {"items": items}})
    cart["items"] = items
    return {"success": True, "data": await enrich_cart(cart)}


@api.delete("/cart/items/{item_id}")
async def delete_cart_item(item_id: str, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    cart = await get_or_create_cart(user, x_guest_id)
    items = [x for x in cart.get("items", []) if x["id"] != item_id]
    await db.carts.update_one({"id": cart["id"]}, {"$set": {"items": items}})
    cart["items"] = items
    return {"success": True, "data": await enrich_cart(cart)}


@api.post("/cart/merge")
async def merge_cart(user=Depends(get_current_user), x_guest_id: Optional[str] = Header(None)):
    if not x_guest_id:
        return {"success": True}
    guest = await db.carts.find_one({"guest_id": x_guest_id})
    if not guest:
        return {"success": True}
    user_cart = await get_or_create_cart(user, None)
    items = user_cart.get("items", [])
    for gi in guest.get("items", []):
        existing = next((i for i in items if i["product_id"] == gi["product_id"] and i["size"] == gi["size"]), None)
        if existing:
            existing["quantity"] += gi["quantity"]
        else:
            items.append(gi)
    await db.carts.update_one({"id": user_cart["id"]}, {"$set": {"items": items}})
    await db.carts.delete_one({"guest_id": x_guest_id})
    return {"success": True}


# ==================== WISHLIST ====================
async def get_or_create_wishlist(user, guest_id):
    f = owner_filter(user, guest_id)
    w = await db.wishlists.find_one(f)
    if not w:
        w = {"id": str(uuid.uuid4()), "user_id": user["id"] if user else None,
             "guest_id": None if user else guest_id, "items": []}
        await db.wishlists.insert_one(dict(w))
    return w


@api.get("/wishlist")
async def get_wishlist(user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    w = await get_or_create_wishlist(user, x_guest_id)
    out = []
    for it in w.get("items", []):
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            out.append(p)
    return {"success": True, "data": out, "ids": [i["product_id"] for i in w.get("items", [])]}


@api.post("/wishlist/items")
async def add_wishlist(body: WishlistItemReq, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    w = await get_or_create_wishlist(user, x_guest_id)
    items = w.get("items", [])
    if not any(i["product_id"] == body.product_id for i in items):
        items.append({"product_id": body.product_id, "size": body.size})
    await db.wishlists.update_one({"id": w["id"]}, {"$set": {"items": items}})
    return {"success": True, "ids": [i["product_id"] for i in items]}


@api.delete("/wishlist/items/{product_id}")
async def del_wishlist(product_id: str, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    w = await get_or_create_wishlist(user, x_guest_id)
    items = [i for i in w.get("items", []) if i["product_id"] != product_id]
    await db.wishlists.update_one({"id": w["id"]}, {"$set": {"items": items}})
    return {"success": True, "ids": [i["product_id"] for i in items]}


@api.post("/wishlist/merge")
async def merge_wishlist(user=Depends(get_current_user), x_guest_id: Optional[str] = Header(None)):
    if not x_guest_id:
        return {"success": True}
    guest = await db.wishlists.find_one({"guest_id": x_guest_id})
    if not guest:
        return {"success": True}
    uw = await get_or_create_wishlist(user, None)
    items = uw.get("items", [])
    for gi in guest.get("items", []):
        if not any(i["product_id"] == gi["product_id"] for i in items):
            items.append(gi)
    await db.wishlists.update_one({"id": uw["id"]}, {"$set": {"items": items}})
    await db.wishlists.delete_one({"guest_id": x_guest_id})
    return {"success": True}


# ==================== CHECKOUT ====================
@api.post("/checkout/shipping-estimate")
async def shipping_estimate(body: ShippingReq):
    settings = await get_settings()
    zone = await db.shipping_zones.find_one({"country_code": body.country_code, "is_active": True}, {"_id": 0})
    if zone:
        flat = float(zone["flat_fee"])
        free_min = zone.get("free_shipping_min")
    else:
        flat = float(settings.get("flat_shipping_fee", 250))
        free_min = settings.get("free_shipping_min_amt", 5000)
    fee = 0 if (free_min and body.subtotal >= float(free_min)) else flat
    return {"success": True, "data": {"shipping_fee": fee, "free_shipping_min": free_min}}


async def validate_coupon(code, subtotal):
    c = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not c:
        raise HTTPException(400, "Invalid coupon code")
    if c.get("expires_at") and datetime.fromisoformat(c["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Coupon expired")
    if c.get("max_uses") and c.get("used_count", 0) >= c["max_uses"]:
        raise HTTPException(400, "Coupon usage limit reached")
    if c.get("min_order_value") and subtotal < float(c["min_order_value"]):
        raise HTTPException(400, f"Minimum order Rs. {int(c['min_order_value'])} required")
    if c["type"] == "percentage":
        discount = subtotal * float(c["value"]) / 100
    else:
        discount = float(c["value"])
    return c, round(min(discount, subtotal), 2)


@api.post("/checkout/apply-coupon")
async def apply_coupon(body: CouponReq):
    c, discount = await validate_coupon(body.code, body.subtotal)
    return {"success": True, "data": {"code": c["code"], "discount": discount, "type": c["type"], "value": float(c["value"])}}


# ==================== ORDERS ====================
async def gen_order_number():
    for _ in range(6):
        num = "PK-SNK-" + str(random.randint(10000, 99999))
        if not await db.orders.find_one({"order_number": num}):
            return num
    return "PK-SNK-" + uuid.uuid4().hex[:8].upper()


@api.post("/orders")
async def create_order(body: OrderReq, request: Request, user=Depends(get_optional_user), x_guest_id: Optional[str] = Header(None)):
    cart = await get_or_create_cart(user, x_guest_id)
    if not cart.get("items"):
        raise HTTPException(400, "Cart is empty")
    # Validate stock + build snapshot
    subtotal = 0
    order_items = []
    for it in cart["items"]:
        p = await db.products.find_one({"id": it["product_id"]})
        if not p:
            raise HTTPException(400, "A product is no longer available")
        variant = next((s for s in p["sizes"] if s["size"] == it["size"]), None)
        if not variant or variant["stock"] < it["quantity"]:
            raise HTTPException(400, f"Insufficient stock for {p['name']} size {it['size']}")
        price = price_of(p, it["size"])
        subtotal += price * it["quantity"]
        order_items.append({"product_id": p["id"], "product_name": p["name"], "variant_label": f"EU {it['size']}",
                            "size": it["size"], "image_url": p["images"][0], "unit_price": price, "quantity": it["quantity"]})
    # discount
    discount = 0
    coupon_code = None
    if body.coupon_code:
        c, discount = await validate_coupon(body.coupon_code, subtotal)
        coupon_code = c["code"]
        await db.coupons.update_one({"code": c["code"]}, {"$inc": {"used_count": 1}})
    # shipping
    est = await shipping_estimate(ShippingReq(country_code=body.shipping_address.get("country_code", "PK"), subtotal=subtotal))
    shipping_fee = est["data"]["shipping_fee"]
    # advance payment rule
    settings = await get_settings()
    thr = settings.get("advance_payment_threshold")
    pct = settings.get("advance_payment_percent")
    advance_required = bool(body.payment_method == "COD" and thr and pct and subtotal >= float(thr))
    advance_amount = round(subtotal * float(pct) / 100, 2) if advance_required else 0.0
    # store credit (logged-in only)
    store_credit_used = 0.0
    if user and body.store_credit_amount and body.store_credit_amount > 0:
        bal = await get_credit_balance(user["id"])
        store_credit_used = round(min(float(body.store_credit_amount), bal, subtotal - discount + shipping_fee), 2)
    total = round(subtotal - discount + shipping_fee - store_credit_used, 2)
    # decrement stock atomically (guarded) to prevent overselling; rollback on failure
    decremented = []
    for it in cart["items"]:
        res = await db.products.update_one(
            {"id": it["product_id"], "sizes": {"$elemMatch": {"size": it["size"], "stock": {"$gte": it["quantity"]}}}},
            {"$inc": {"sizes.$.stock": -it["quantity"]}},
        )
        if res.modified_count == 1:
            decremented.append(it)
        else:
            for done in decremented:
                await db.products.update_one({"id": done["product_id"], "sizes.size": done["size"]}, {"$inc": {"sizes.$.stock": done["quantity"]}})
            raise HTTPException(400, "Sorry, one of your items just sold out. Please review your bag.")
    payment_status = "pending"
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "id": str(uuid.uuid4()), "order_number": await gen_order_number(),
        "user_id": user["id"] if user else None,
        "customer_name": body.customer_name, "customer_phone": body.customer_phone,
        "customer_email": body.customer_email, "shipping_address": body.shipping_address,
        "items": order_items, "subtotal": subtotal, "shipping_fee": shipping_fee,
        "discount_amount": discount, "coupon_code": coupon_code,
        "store_credit_used": store_credit_used, "advance_required": advance_required,
        "advance_amount": advance_amount, "advance_paid": 0.0, "total": total,
        "payment_method": body.payment_method, "payment_status": payment_status,
        "status": "placed", "customer_note": body.customer_note,
        "tracking_number": None, "courier_name": None,
        "status_history": [{"status": "placed", "note": "Order placed", "at": now}],
        "created_at": now, "updated_at": now,
    }
    if body.payment_method == "WALLET":
        order["payment_status"] = "paid"
    elif advance_required:
        # advance collected upfront (mocked as paid for demo); remainder on delivery
        order["payment_status"] = "partially_paid"
        order["advance_paid"] = advance_amount
    await db.orders.insert_one(dict(order))
    # deduct store credit within order flow
    if store_credit_used > 0 and user:
        await add_store_credit(user["id"], -store_credit_used, "REDEEMED_ON_ORDER", order["id"])
    # clear cart
    await db.carts.update_one({"id": cart["id"]}, {"$set": {"items": []}})
    await notify(order, "ORDER_PLACED", f"Order {order['order_number']} confirmed! Total Rs. {int(total)} via {body.payment_method}. We'll update you as it ships.")
    return {"success": True, "data": clean(order)}


@api.get("/orders")
async def my_orders(user=Depends(get_current_user)):
    items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"success": True, "data": items}


@api.get("/orders/{order_number}")
async def track_order(order_number: str, phone: Optional[str] = None, user=Depends(get_optional_user)):
    o = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    if user and o.get("user_id") == user["id"]:
        return {"success": True, "data": o}
    if phone and o["customer_phone"].replace(" ", "") == phone.replace(" ", ""):
        return {"success": True, "data": o}
    raise HTTPException(403, "Provide the phone number used at checkout")


@api.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["status"] in ("shipped", "delivered", "cancelled"):
        raise HTTPException(400, "Order can no longer be cancelled")
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled", "updated_at": now}, "$push": {"status_history": {"status": "cancelled", "note": "Cancelled by customer", "at": now}}})
    return {"success": True}


# ==================== PAYMENTS (Stripe) ====================
@api.post("/payments/stripe/checkout")
async def stripe_checkout(body: dict, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    order_id = body.get("order_id")
    origin = body.get("origin_url")
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    req = CheckoutSessionRequest(
        amount=float(o["total"]), currency="usd",
        success_url=f"{origin}/order-confirmation/{o['order_number']}?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/checkout",
        metadata={"order_id": order_id, "order_number": o["order_number"]},
    )
    session = await sc.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "order_id": order_id, "amount": float(o["total"]),
        "currency": "usd", "status": "initiated", "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "data": {"checkout_url": session.url, "session_id": session.session_id}}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec.get("payment_status") != "paid":
        host_url = str(request.base_url)
        sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=f"{host_url}api/webhook/stripe")
        try:
            status = await sc.get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await db.payment_transactions.update_one({"session_id": session_id, "payment_status": {"$ne": "paid"}}, {"$set": {"status": "completed", "payment_status": "paid"}})
                await db.orders.update_one({"id": rec["order_id"]}, {"$set": {"payment_status": "paid", "status": "confirmed"}})
                rec["payment_status"] = "paid"
        except Exception as e:
            logger.error(f"stripe status error: {e}")
    return {"success": True, "data": {"session_id": session_id, "payment_status": rec["payment_status"]}}


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    host_url = str(request.base_url)
    sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=f"{host_url}api/webhook/stripe")
    try:
        resp = await sc.handle_webhook(body, sig)
        if resp.payment_status == "paid":
            rec = await db.payment_transactions.find_one({"session_id": resp.session_id})
            if rec:
                await db.payment_transactions.update_one({"session_id": resp.session_id, "payment_status": {"$ne": "paid"}}, {"$set": {"payment_status": "paid", "status": "completed"}})
                await db.orders.update_one({"id": rec["order_id"]}, {"$set": {"payment_status": "paid", "status": "confirmed"}})
    except Exception as e:
        logger.error(f"webhook error: {e}")
    return {"success": True}


# ==================== NEWSLETTER + CMS ====================
@api.post("/newsletter/subscribe")
async def newsletter(body: NewsletterReq):
    await db.newsletter.update_one({"email": body.email.lower()}, {"$setOnInsert": {"email": body.email.lower(), "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"success": True}


@api.get("/settings")
async def settings_public():
    return {"success": True, "data": await get_settings()}


@api.get("/hero-slides")
async def hero_slides():
    items = await db.hero_slides.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(20)
    return {"success": True, "data": items}


# ==================== UPLOAD ====================
@api.post("/admin/upload")
async def upload(file: UploadFile = File(...), admin=Depends(get_admin)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    return {"success": True, "data": {"path": result["path"], "url": f"/api/files/{result['path']}"}}


@api.get("/files/{path:path}")
async def serve_file(path: str):
    data, ct = get_object(path)
    return Response(content=data, media_type=ct)


# ==================== ADMIN ====================
@api.get("/admin/analytics/overview")
async def analytics(admin=Depends(get_admin)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(2000)
    revenue = sum(float(o["total"]) for o in orders if o["status"] != "cancelled")
    total_orders = len(orders)
    aov = revenue / total_orders if total_orders else 0
    pending = len([o for o in orders if o["status"] in ("placed", "confirmed")])
    # sales by day (last 7)
    by_day = {}
    for o in orders:
        d = o["created_at"][:10]
        by_day[d] = by_day.get(d, 0) + float(o["total"])
    chart = [{"date": k, "revenue": v} for k, v in sorted(by_day.items())][-7:]
    low_stock = []
    async for p in db.products.find({}, {"_id": 0}):
        for s in p["sizes"]:
            if s["stock"] <= 3:
                low_stock.append({"product": p["name"], "size": s["size"], "stock": s["stock"]})
    top = {}
    for o in orders:
        for it in o["items"]:
            top[it["product_name"]] = top.get(it["product_name"], 0) + it["quantity"]
    top_products = sorted([{"name": k, "sold": v} for k, v in top.items()], key=lambda x: -x["sold"])[:5]
    return {"success": True, "data": {"revenue": revenue, "total_orders": total_orders, "aov": aov,
            "pending_orders": pending, "chart": chart, "low_stock": low_stock[:10], "top_products": top_products}}


@api.get("/admin/products")
async def admin_products(admin=Depends(get_admin)):
    items = await db.products.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return {"success": True, "data": items}


@api.post("/admin/products")
async def create_product(body: dict, admin=Depends(get_admin)):
    body["id"] = str(uuid.uuid4())
    body.setdefault("status", "active")
    body.setdefault("images", [])
    body.setdefault("sizes", [{"size": s, "stock": 5} for s in seed_data.EU_SIZES])
    body.setdefault("avg_rating", 5.0)
    body.setdefault("review_count", 0)
    body.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    body.setdefault("sort_order", 999)
    # ensure unique slug
    base_slug = body.get("slug") or body.get("name", "product").lower().replace(" ", "-")
    slug = base_slug
    while await db.products.find_one({"slug": slug}):
        slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
    body["slug"] = slug
    # hover image: respect client-supplied value, else use 2nd image (hover-swap) else cover
    imgs = body.get("images") or []
    if not body.get("hover_image") and imgs:
        body["hover_image"] = imgs[1] if len(imgs) > 1 else imgs[0]
    await db.products.insert_one(dict(body))
    return {"success": True, "data": clean(body)}


@api.patch("/admin/products/{product_id}")
async def update_product(product_id: str, body: dict, admin=Depends(get_admin)):
    body.pop("id", None)
    body.pop("_id", None)
    await db.products.update_one({"id": product_id}, {"$set": body})
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    return {"success": True, "data": p}


@api.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_admin)):
    await db.products.delete_one({"id": product_id})
    return {"success": True}


@api.get("/admin/orders")
async def admin_orders(status: Optional[str] = None, admin=Depends(get_admin)):
    q = {} if not status else {"status": status}
    items = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "data": items}


@api.patch("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, body: dict, admin=Depends(get_admin)):
    now = datetime.now(timezone.utc).isoformat()
    status = body.get("status")
    update = {"status": status, "updated_at": now}
    if body.get("tracking_number"): update["tracking_number"] = body["tracking_number"]
    if body.get("courier_name"): update["courier_name"] = body["courier_name"]
    await db.orders.update_one({"id": order_id}, {"$set": update, "$push": {"status_history": {"status": status, "note": body.get("note", ""), "at": now}}})
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    labels = {"confirmed": "verified ✅", "packed": "packed 📦", "shipped": "dispatched 🚚", "out_for_delivery": "out for delivery 🛵", "delivered": "delivered 🎉", "cancelled": "cancelled"}
    if o and status in labels:
        extra = f" Tracking: {o.get('courier_name') or ''} {o.get('tracking_number') or ''}".rstrip() if status == "shipped" and o.get("tracking_number") else ""
        await notify(o, "STATUS_UPDATE", f"Order {o['order_number']} is now {labels[status]}.{extra}")
    return {"success": True, "data": o}


@api.get("/admin/notifications")
async def admin_notifications(admin=Depends(get_admin)):
    items = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"success": True, "data": items}


@api.get("/admin/coupons")
async def admin_coupons(admin=Depends(get_admin)):
    items = await db.coupons.find({}, {"_id": 0}).to_list(200)
    return {"success": True, "data": items}


@api.post("/admin/coupons")
async def create_coupon(body: dict, admin=Depends(get_admin)):
    body["id"] = str(uuid.uuid4())
    body["code"] = body["code"].upper()
    body.setdefault("used_count", 0)
    body.setdefault("is_active", True)
    body.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    await db.coupons.insert_one(dict(body))
    return {"success": True, "data": clean(body)}


@api.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin=Depends(get_admin)):
    await db.coupons.delete_one({"id": coupon_id})
    return {"success": True}


@api.get("/admin/reviews")
async def admin_reviews(admin=Depends(get_admin)):
    items = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "data": items}


@api.patch("/admin/reviews/{review_id}")
async def moderate_review(review_id: str, body: dict, admin=Depends(get_admin)):
    await db.reviews.update_one({"id": review_id}, {"$set": {"is_approved": body.get("is_approved", True)}})
    return {"success": True}


@api.get("/admin/customers")
async def admin_customers(admin=Depends(get_admin)):
    items = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return {"success": True, "data": items}


@api.patch("/admin/customers/{user_id}/block")
async def block_customer(user_id: str, body: dict, admin=Depends(get_admin)):
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": body.get("is_blocked", True)}})
    return {"success": True}


@api.get("/admin/hero-slides")
async def admin_hero(admin=Depends(get_admin)):
    items = await db.hero_slides.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return {"success": True, "data": items}


@api.post("/admin/hero-slides")
async def create_hero(body: dict, admin=Depends(get_admin)):
    body["id"] = str(uuid.uuid4())
    body.setdefault("is_active", True)
    body.setdefault("sort_order", 0)
    await db.hero_slides.insert_one(dict(body))
    return {"success": True, "data": clean(body)}


@api.delete("/admin/hero-slides/{slide_id}")
async def delete_hero(slide_id: str, admin=Depends(get_admin)):
    await db.hero_slides.delete_one({"id": slide_id})
    return {"success": True}


@api.patch("/admin/settings")
async def update_settings(body: dict, admin=Depends(get_admin)):
    body.pop("id", None)
    await db.settings.update_one({"id": "singleton"}, {"$set": body}, upsert=True)
    return {"success": True, "data": await get_settings()}


# ==================== NOTIFICATIONS (WhatsApp-ready) ====================
async def notify(order, event, message):
    """Structured notification stub. Logs + persists; swap in Twilio WhatsApp later."""
    rec = {"id": str(uuid.uuid4()), "order_id": order.get("id"), "order_number": order.get("order_number"),
           "phone": order.get("customer_phone"), "channel": "whatsapp", "event": event,
           "message": message, "status": "logged", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.notifications.insert_one(dict(rec))
    logger.info(f"[WHATSAPP:{event}] -> {order.get('customer_phone')}: {message}")
    return rec


# ==================== STORE CREDIT ====================
async def get_credit_balance(user_id):
    sc = await db.store_credit.find_one({"user_id": user_id})
    return float(sc["balance"]) if sc else 0.0


async def add_store_credit(user_id, amount, reason, order_id=None):
    now = datetime.now(timezone.utc).isoformat()
    sc = await db.store_credit.find_one({"user_id": user_id})
    cur = float(sc["balance"]) if sc else 0.0
    new_bal = round(cur + float(amount), 2)
    if sc:
        await db.store_credit.update_one({"user_id": user_id}, {"$set": {"balance": new_bal, "updated_at": now}})
    else:
        await db.store_credit.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "balance": new_bal, "updated_at": now})
    await db.store_credit_ledger.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "amount": float(amount),
        "reason": reason, "order_id": order_id, "created_at": now})
    return new_bal


@api.get("/me/store-credit")
async def my_store_credit(user=Depends(get_current_user)):
    bal = await get_credit_balance(user["id"])
    ledger = await db.store_credit_ledger.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"success": True, "data": {"balance": bal, "ledger": ledger}}


@api.post("/checkout/apply-store-credit")
async def apply_store_credit(body: dict, user=Depends(get_current_user)):
    subtotal = float(body.get("subtotal", 0))
    bal = await get_credit_balance(user["id"])
    usable = round(min(bal, subtotal), 2)
    return {"success": True, "data": {"available": bal, "applicable": usable}}


# ==================== RETURNS ====================
@api.post("/orders/{order_id}/return-request")
async def return_request(order_id: str, body: ReturnReq, user=Depends(get_optional_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    authorized = (user and o.get("user_id") == user["id"]) or (body.phone and o["customer_phone"].replace(" ", "") == body.phone.replace(" ", ""))
    if not authorized:
        raise HTTPException(403, "Not authorized for this order")
    if o["status"] in ("cancelled", "returned", "return_requested"):
        raise HTTPException(400, "A return is not available for this order")
    now = datetime.now(timezone.utc).isoformat()
    rr = {"id": str(uuid.uuid4()), "order_id": order_id, "order_number": o["order_number"],
          "customer_name": o["customer_name"], "customer_phone": o["customer_phone"],
          "reason": body.reason, "status": "pending", "created_at": now}
    await db.return_requests.insert_one(dict(rr))
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "return_requested", "updated_at": now},
        "$push": {"status_history": {"status": "return_requested", "note": body.reason, "at": now}}})
    await notify(o, "RETURN_REQUESTED", f"Return request received for {o['order_number']}. Our team will review it shortly.")
    return {"success": True, "data": clean(rr)}


@api.get("/admin/returns")
async def admin_returns(admin=Depends(get_admin)):
    items = await db.return_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "data": items}


@api.patch("/admin/returns/{rid}")
async def moderate_return(rid: str, body: dict, admin=Depends(get_admin)):
    status = body.get("status")  # approved | rejected
    if status not in ("approved", "rejected"):
        raise HTTPException(400, "Invalid status")
    rr = await db.return_requests.find_one({"id": rid})
    if not rr:
        raise HTTPException(404, "Return request not found")
    if rr["status"] != "pending":
        raise HTTPException(400, f"Return already {rr['status']}")
    await db.return_requests.update_one({"id": rid}, {"$set": {"status": status}})
    rr = await db.return_requests.find_one({"id": rid}, {"_id": 0})
    o = await db.orders.find_one({"id": rr["order_id"]}, {"_id": 0})
    if o:
        await notify(o, "RETURN_UPDATE", f"Your return for {o['order_number']} was {status}.")
    return {"success": True, "data": rr}


# ==================== REFUNDS ====================
async def refunded_total(order_id):
    rows = await db.refunds.find({"order_id": order_id, "status": "completed"}, {"_id": 0}).to_list(200)
    return round(sum(float(r["amount"]) for r in rows), 2)


@api.get("/admin/refunds")
async def admin_refunds(admin=Depends(get_admin)):
    items = await db.refunds.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "data": items}


@api.post("/admin/orders/{order_id}/refund")
async def create_refund(order_id: str, body: RefundReq, admin=Depends(get_admin)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    # amount already paid: full total if paid, advance if partially_paid, else 0
    if o["payment_status"] == "paid":
        paid = float(o["total"])
    elif o["payment_status"] == "partially_paid":
        paid = float(o.get("advance_paid", 0))
    else:
        paid = 0.0
    already = await refunded_total(order_id)
    refundable = round(paid - already, 2)
    if body.amount <= 0:
        raise HTTPException(400, "Refund amount must be positive")
    if body.amount > refundable + 0.01:
        raise HTTPException(400, f"Amount exceeds refundable balance (Rs. {refundable})")
    if body.method not in ("PAYFAST_ORIGINAL", "BANK_TRANSFER", "STORE_CREDIT"):
        raise HTTPException(400, "Invalid refund method")
    now = datetime.now(timezone.utc).isoformat()
    refund = {"id": str(uuid.uuid4()), "order_id": order_id, "order_number": o["order_number"],
              "return_request_id": body.return_request_id, "amount": round(body.amount, 2),
              "reason": body.reason, "method": body.method, "status": "pending",
              "external_ref": body.external_ref, "processed_by": admin["id"],
              "failure_reason": None, "created_at": now, "processed_at": None}
    if body.method == "STORE_CREDIT":
        if not o.get("user_id"):
            raise HTTPException(400, "Store credit requires a registered customer account")
        await add_store_credit(o["user_id"], round(body.amount, 2), "REFUND", order_id)
        refund["status"] = "completed"; refund["processed_at"] = now
    elif body.method == "BANK_TRANSFER":
        if not body.external_ref:
            raise HTTPException(400, "Bank transfer requires a transfer reference (external_ref)")
        refund["status"] = "completed"; refund["processed_at"] = now
    else:  # PAYFAST_ORIGINAL (gateway) — mocked instant success in test env
        if o.get("payment_method") not in ("CARD", "WALLET"):
            raise HTTPException(400, "Original-method refund only valid for online payments")
        refund["status"] = "completed"; refund["processed_at"] = now
        refund["external_ref"] = refund["external_ref"] or f"RF-{uuid.uuid4().hex[:10].upper()}"
    await db.refunds.insert_one(dict(refund))
    # cascade order payment/status
    total_refunded = await refunded_total(order_id)
    updates = {"updated_at": now}
    if paid > 0 and total_refunded >= paid - 0.01:
        updates["payment_status"] = "refunded"
    if body.return_request_id:
        await db.return_requests.update_one({"id": body.return_request_id}, {"$set": {"status": "refunded"}})
        if paid > 0 and total_refunded >= paid - 0.01:
            updates["status"] = "returned"
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    o2 = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await notify(o2, "REFUND", f"Refund of Rs. {int(body.amount)} for {o['order_number']} processed via {body.method.replace('_', ' ').title()}.")
    return {"success": True, "data": {"refund": clean(refund), "order": o2, "total_refunded": total_refunded}}


# ==================== SEED ====================
async def seed():
    # admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pass = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Store Owner", "email": admin_email,
            "password_hash": hash_password(admin_pass), "role": "admin", "is_blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_pass, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pass), "role": "admin"}})
    # demo customer
    if not await db.users.find_one({"email": "customer@test.com"}):
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Test Customer", "email": "customer@test.com",
            "password_hash": hash_password("Test@12345"), "role": "customer", "is_blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat()})
    # settings
    if not await db.settings.find_one({"id": "singleton"}):
        await db.settings.insert_one({"id": "singleton",
            "announcement_text": "⚡ FLASH DROP: 15% OFF ORDERS OVER RS. 9,999 · FREE SHIPPING ON ORDERS OVER RS. 5,000 · 7-DAY EXCHANGE",
            "announcement_active": True, "free_shipping_min_amt": 5000, "flat_shipping_fee": 250,
            "advance_payment_threshold": 20000, "advance_payment_percent": 10,
            "cod_enabled": True, "card_enabled": True, "wallet_enabled": True,
            "whatsapp_number": "923001234567",
            "supported_countries": ["PK"]})
    # shipping zone
    if not await db.shipping_zones.find_one({"country_code": "PK"}):
        await db.shipping_zones.insert_one({"id": str(uuid.uuid4()), "country_code": "PK", "flat_fee": 250, "free_shipping_min": 5000, "is_active": True})
    # categories
    if await db.categories.count_documents({}) == 0:
        for c in seed_data.CATEGORIES:
            await db.categories.insert_one({"id": str(uuid.uuid4()), "is_active": True, **c})
    # brands
    if await db.brands.count_documents({}) == 0:
        for b in seed_data.BRANDS:
            await db.brands.insert_one({"id": str(uuid.uuid4()), **b})
    # hero
    if await db.hero_slides.count_documents({}) == 0:
        for h in seed_data.HERO_SLIDES:
            await db.hero_slides.insert_one({"id": str(uuid.uuid4()), "is_active": True, **h})
    # products
    if await db.products.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        for p in seed_data.build_products():
            await db.products.insert_one({"id": str(uuid.uuid4()), "created_at": now, **p})
    # coupons
    if await db.coupons.count_documents({}) == 0:
        for code, typ, val, mn in [("STREET15", "percentage", 15, 9999), ("JUTAY10", "percentage", 10, 0), ("FLAT500", "flat", 500, 5000)]:
            await db.coupons.insert_one({"id": str(uuid.uuid4()), "code": code, "type": typ, "value": val,
                "min_order_value": mn, "max_uses": None, "used_count": 0, "expires_at": None,
                "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()})
    # reviews (approved samples for first products)
    if await db.reviews.count_documents({}) == 0:
        prods = await db.products.find({}, {"_id": 0}).limit(4).to_list(4)
        samples = [
            ("Hamza Tariq", 5, "Delivered in 2 days to DHA Lahore via COD! The cushioning is insane."),
            ("Zeeshan Malik", 5, "Size 43 fit true to chart. Exchange policy gave me full confidence."),
            ("Ali Raza", 5, "Hands down best sneaker cop in Pakistan. Packaging was top tier."),
        ]
        for p in prods:
            for name, r, txt in samples:
                await db.reviews.insert_one({"id": str(uuid.uuid4()), "product_id": p["id"], "user_id": None,
                    "customer_name": name, "rating": r, "comment": txt, "image_urls": [],
                    "is_approved": True, "created_at": datetime.now(timezone.utc).isoformat()})
    logger.info("Seed complete")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    try:
        init_storage()
    except Exception as e:
        logger.error(f"storage init failed: {e}")
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
