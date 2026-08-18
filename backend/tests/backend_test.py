"""Backend API regression tests for SOLEKICKS PK."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://streetwear-shop-133.preview.emergentagent.com").rstrip("/")
API = BASE_URL + "/api"

ADMIN_EMAIL = "sahilwaheed48@gmail.com"
ADMIN_PASS = "Admin@12345"
CUST_EMAIL = "customer@test.com"
CUST_PASS = "Test@12345"


@pytest.fixture(scope="session")
def s():
    ses = requests.Session()
    ses.headers.update({"Content-Type": "application/json"})
    return ses


@pytest.fixture(scope="session")
def guest_id():
    return str(uuid.uuid4())


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["role"] == "admin"
    return d["token"]


@pytest.fixture(scope="session")
def customer_token(s):
    r = s.post(f"{API}/auth/login", json={"email": CUST_EMAIL, "password": CUST_PASS})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


# ---------------- Catalog ----------------
class TestCatalog:
    def test_settings(self, s):
        r = s.get(f"{API}/settings")
        assert r.status_code == 200
        assert r.json()["data"]["free_shipping_min_amt"] == 5000

    def test_hero_slides(self, s):
        r = s.get(f"{API}/hero-slides")
        assert r.status_code == 200
        assert isinstance(r.json()["data"], list)

    def test_categories(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        assert len(r.json()["data"]) >= 1

    def test_brands(self, s):
        r = s.get(f"{API}/brands")
        assert r.status_code == 200

    def test_products_list(self, s):
        r = s.get(f"{API}/products?limit=24")
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        assert len(d["data"]) >= 1

    def test_products_filters(self, s):
        r = s.get(f"{API}/products?flag=new&sort=price_asc")
        assert r.status_code == 200
        r2 = s.get(f"{API}/products?flag=flash")
        assert r2.status_code == 200
        r3 = s.get(f"{API}/products?flag=best")
        assert r3.status_code == 200

    def test_product_slug(self, s):
        r = s.get(f"{API}/products/streetwear-shop-133")
        # slug may not match; try get first product
        if r.status_code == 404:
            first = s.get(f"{API}/products?limit=1").json()["data"][0]
            r = s.get(f"{API}/products/{first['slug']}")
        assert r.status_code == 200

    def test_related_and_reviews(self, s):
        p = s.get(f"{API}/products?limit=1").json()["data"][0]
        r = s.get(f"{API}/products/{p['id']}/related")
        assert r.status_code == 200
        rv = s.get(f"{API}/products/{p['id']}/reviews")
        assert rv.status_code == 200

    def test_search(self, s):
        r = s.get(f"{API}/search?q=a")
        assert r.status_code == 200


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert admin_token

    def test_customer_login(self, customer_token):
        assert customer_token

    def test_me(self, customer_token):
        # fresh session to avoid cookie leakage from admin login (server sets httpOnly cookie which shadows Bearer)
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200
        assert r.json()["data"]["email"] == CUST_EMAIL

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": CUST_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_new(self, s):
        email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        r = s.post(f"{API}/auth/register", json={"name": "T", "email": email, "password": "Pass@12345"})
        assert r.status_code == 200
        assert r.json()["data"]["token"]


# ---------------- Cart / Wishlist (guest) ----------------
class TestGuestCart:
    def test_cart_add_update_delete(self, s, guest_id):
        h = {"x-guest-id": guest_id, "Content-Type": "application/json"}
        # pick product with stock
        prods = s.get(f"{API}/products?limit=5").json()["data"]
        prod = None
        for p in prods:
            for sz in p["sizes"]:
                if sz["stock"] > 0:
                    prod = p; size = sz["size"]; break
            if prod: break
        assert prod, "no product with stock"

        r = s.post(f"{API}/cart/items", headers=h, json={"product_id": prod["id"], "size": size, "quantity": 1})
        assert r.status_code == 200, r.text
        cart = r.json()["data"]
        assert cart["count"] == 1
        assert cart["subtotal"] > 0
        item_id = cart["items"][0]["id"]

        # patch qty
        r = s.patch(f"{API}/cart/items/{item_id}", headers=h, json={"quantity": 2})
        assert r.status_code == 200
        assert r.json()["data"]["count"] == 2

        # get cart
        r = s.get(f"{API}/cart", headers=h)
        assert r.status_code == 200
        assert r.json()["data"]["count"] == 2

        # delete
        r = s.delete(f"{API}/cart/items/{item_id}", headers=h)
        assert r.status_code == 200
        assert r.json()["data"]["count"] == 0

    def test_cart_bad_stock(self, s, guest_id):
        h = {"x-guest-id": guest_id, "Content-Type": "application/json"}
        prod = s.get(f"{API}/products?limit=1").json()["data"][0]
        size = prod["sizes"][0]["size"]
        r = s.post(f"{API}/cart/items", headers=h, json={"product_id": prod["id"], "size": size, "quantity": 99999})
        assert r.status_code == 400

    def test_wishlist(self, s, guest_id):
        h = {"x-guest-id": guest_id, "Content-Type": "application/json"}
        prod = s.get(f"{API}/products?limit=1").json()["data"][0]
        r = s.post(f"{API}/wishlist/items", headers=h, json={"product_id": prod["id"]})
        assert r.status_code == 200
        assert prod["id"] in r.json()["ids"]
        r = s.get(f"{API}/wishlist", headers=h)
        assert r.status_code == 200
        r = s.delete(f"{API}/wishlist/items/{prod['id']}", headers=h)
        assert r.status_code == 200
        assert prod["id"] not in r.json()["ids"]


# ---------------- Checkout ----------------
class TestCheckout:
    def test_shipping_free(self, s):
        r = s.post(f"{API}/checkout/shipping-estimate", json={"country_code": "PK", "subtotal": 10000})
        assert r.status_code == 200
        assert r.json()["data"]["shipping_fee"] == 0

    def test_shipping_flat(self, s):
        r = s.post(f"{API}/checkout/shipping-estimate", json={"country_code": "PK", "subtotal": 1000})
        assert r.status_code == 200
        assert r.json()["data"]["shipping_fee"] == 250

    def test_coupon_street15(self, s):
        r = s.post(f"{API}/checkout/apply-coupon", json={"code": "STREET15", "subtotal": 10000})
        assert r.status_code == 200
        assert r.json()["data"]["discount"] == 1500.0

    def test_coupon_street15_min(self, s):
        r = s.post(f"{API}/checkout/apply-coupon", json={"code": "STREET15", "subtotal": 5000})
        assert r.status_code == 400

    def test_coupon_jutay10(self, s):
        r = s.post(f"{API}/checkout/apply-coupon", json={"code": "JUTAY10", "subtotal": 1000})
        assert r.status_code == 200
        assert r.json()["data"]["discount"] == 100.0

    def test_coupon_flat500(self, s):
        r = s.post(f"{API}/checkout/apply-coupon", json={"code": "FLAT500", "subtotal": 6000})
        assert r.status_code == 200
        assert r.json()["data"]["discount"] == 500.0

    def test_coupon_invalid(self, s):
        r = s.post(f"{API}/checkout/apply-coupon", json={"code": "NOPE", "subtotal": 6000})
        assert r.status_code == 400


# ---------------- Order flow (guest COD) ----------------
class TestOrderFlow:
    def test_full_cod_order(self, s):
        gid = str(uuid.uuid4())
        h = {"x-guest-id": gid, "Content-Type": "application/json"}
        prods = s.get(f"{API}/products?limit=10").json()["data"]
        prod = None
        for p in prods:
            for sz in p["sizes"]:
                if sz["stock"] > 0:
                    prod = p; size = sz["size"]; stock_before = sz["stock"]; break
            if prod: break
        r = s.post(f"{API}/cart/items", headers=h, json={"product_id": prod["id"], "size": size, "quantity": 1})
        assert r.status_code == 200

        order_body = {
            "customer_name": "TEST Buyer",
            "customer_phone": "03001234567",
            "customer_email": "test@buyer.com",
            "shipping_address": {"line1": "House 1", "city": "Lahore", "country_code": "PK"},
            "payment_method": "COD",
            "coupon_code": "JUTAY10",
        }
        r = s.post(f"{API}/orders", headers=h, json=order_body)
        assert r.status_code == 200, r.text
        order = r.json()["data"]
        assert order["order_number"].startswith("PK-SNK-")
        assert order["payment_status"] == "pending"
        assert order["discount_amount"] > 0

        # cart cleared
        c = s.get(f"{API}/cart", headers=h).json()["data"]
        assert c["count"] == 0

        # track order requires phone
        r = s.get(f"{API}/orders/{order['order_number']}")
        assert r.status_code == 403
        r = s.get(f"{API}/orders/{order['order_number']}?phone=03001234567")
        assert r.status_code == 200

        # stock decremented
        p2 = s.get(f"{API}/products/{prod['slug']}").json()["data"]
        new_stock = next(x for x in p2["sizes"] if x["size"] == size)["stock"]
        assert new_stock == stock_before - 1

    def test_wallet_order_paid(self, s):
        gid = str(uuid.uuid4())
        h = {"x-guest-id": gid, "Content-Type": "application/json"}
        prods = s.get(f"{API}/products?limit=10").json()["data"]
        prod = next((p for p in prods if any(sz["stock"] > 0 for sz in p["sizes"])), None)
        size = next(sz["size"] for sz in prod["sizes"] if sz["stock"] > 0)
        s.post(f"{API}/cart/items", headers=h, json={"product_id": prod["id"], "size": size, "quantity": 1})
        r = s.post(f"{API}/orders", headers=h, json={
            "customer_name": "T", "customer_phone": "03000000000",
            "shipping_address": {"line1": "x", "city": "Lahore", "country_code": "PK"},
            "payment_method": "WALLET"})
        assert r.status_code == 200
        assert r.json()["data"]["payment_status"] == "paid"


# ---------------- Admin ----------------
class TestAdmin:
    def test_admin_forbidden_no_auth(self, s):
        r = s.get(f"{API}/admin/products")
        assert r.status_code == 401

    def test_admin_forbidden_customer(self, s, customer_token):
        r = s.get(f"{API}/admin/products", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_admin_analytics(self, s, admin_token):
        r = s.get(f"{API}/admin/analytics/overview", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()["data"]
        assert "revenue" in d and "chart" in d

    def test_admin_products_crud(self, s, admin_token):
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        r = s.get(f"{API}/admin/products", headers=h)
        assert r.status_code == 200
        # create
        slug = f"test-sneaker-{uuid.uuid4().hex[:8]}"
        r = s.post(f"{API}/admin/products", headers=h, json={
            "name": "TEST Sneaker", "slug": slug, "base_price": 4999,
            "category_slug": "retro", "brand_slug": "nike",
            "images": ["https://example.com/x.jpg"], "description": "t"
        })
        assert r.status_code == 200, r.text
        pid = r.json()["data"]["id"]
        # delete
        r = s.delete(f"{API}/admin/products/{pid}", headers=h)
        assert r.status_code == 200

    def test_admin_orders(self, s, admin_token):
        r = s.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200

    def test_admin_coupons(self, s, admin_token):
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        r = s.get(f"{API}/admin/coupons", headers=h)
        assert r.status_code == 200
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        r = s.post(f"{API}/admin/coupons", headers=h, json={"code": code, "type": "percentage", "value": 10, "min_order_value": 0})
        assert r.status_code == 200
        cid = r.json()["data"]["id"]
        r = s.delete(f"{API}/admin/coupons/{cid}", headers=h)
        assert r.status_code == 200

    def test_admin_reviews(self, s, admin_token):
        r = s.get(f"{API}/admin/reviews", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200

    def test_admin_customers(self, s, admin_token):
        r = s.get(f"{API}/admin/customers", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200


# ---------------- Cart merge ----------------
class TestMerge:
    def test_cart_merge(self, s):
        gid = str(uuid.uuid4())
        h_guest = {"x-guest-id": gid, "Content-Type": "application/json"}
        prod = s.get(f"{API}/products?limit=1").json()["data"][0]
        size = next(sz["size"] for sz in prod["sizes"] if sz["stock"] > 0)
        s.post(f"{API}/cart/items", headers=h_guest, json={"product_id": prod["id"], "size": size, "quantity": 1})
        # login new user
        email = f"merge_{uuid.uuid4().hex[:8]}@t.com"
        tok = s.post(f"{API}/auth/register", json={"name": "M", "email": email, "password": "Pass@12345"}).json()["data"]["token"]
        h = {"Authorization": f"Bearer {tok}", "x-guest-id": gid, "Content-Type": "application/json"}
        r = s.post(f"{API}/cart/merge", headers=h)
        assert r.status_code == 200
        r = s.get(f"{API}/cart", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["data"]["count"] >= 1


# ---------------- Newsletter ----------------
def test_newsletter(s):
    r = s.post(f"{API}/newsletter/subscribe", json={"email": f"n_{uuid.uuid4().hex[:6]}@t.com"})
    assert r.status_code == 200
