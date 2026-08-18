"""Phase 2 tests: advance payment, returns, refunds, store credit, WhatsApp notifications, image upload."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = BASE_URL + "/api"

ADMIN_EMAIL = "sahilwaheed48@gmail.com"
ADMIN_PASS = "Admin@12345"
CUST_EMAIL = "customer@test.com"
CUST_PASS = "Test@12345"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


@pytest.fixture(scope="module")
def customer():
    r = requests.post(f"{API}/auth/login", json={"email": CUST_EMAIL, "password": CUST_PASS})
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    return {"token": d["token"], "id": d["id"], "email": d["email"]}


@pytest.fixture(scope="module")
def settings():
    r = requests.get(f"{API}/settings")
    return r.json()["data"]


def _headers_auth(tok):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {tok}"}


def _headers_guest(gid):
    return {"Content-Type": "application/json", "x-guest-id": gid}


def _find_featured_product():
    r = requests.get(f"{API}/products", params={"flag": "featured"})
    products = r.json()["data"]
    for p in products:
        # pick a size with stock >=3
        for sz in p.get("sizes", []):
            if sz["stock"] >= 3:
                return p, sz["size"]
    # fallback: any product
    for p in requests.get(f"{API}/products").json()["data"]:
        for sz in p.get("sizes", []):
            if sz["stock"] >= 3:
                return p, sz["size"]
    return None, None


def _add_to_cart(headers, product_id, size, qty):
    r = requests.post(f"{API}/cart/items", headers=headers,
                      json={"product_id": product_id, "size": size, "quantity": qty})
    assert r.status_code == 200, r.text
    return r.json()["data"]


def _place_order(headers, method="COD", store_credit_amount=0, coupon_code=None):
    payload = {
        "customer_name": "Advance Tester",
        "customer_phone": "923001234567",
        "customer_email": "advtest@example.com",
        "shipping_address": {"country_code": "PK", "line1": "Test", "city": "Karachi"},
        "payment_method": method,
        "store_credit_amount": store_credit_amount,
    }
    if coupon_code:
        payload["coupon_code"] = coupon_code
    r = requests.post(f"{API}/orders", headers=headers, json=payload)
    return r


# ============ ADVANCE PAYMENT ============
class TestAdvancePayment:
    def test_advance_required_high_value_cod(self, settings):
        thr = settings.get("advance_payment_threshold")
        pct = settings.get("advance_payment_percent")
        assert thr == 20000 and pct == 10

        gid = str(uuid.uuid4())
        headers = _headers_guest(gid)
        p, size = _find_featured_product()
        assert p, "no product found"
        # Need subtotal >= 20000 -> qty s.t. price*qty >= 20000
        price = float(p["base_price"])
        qty = max(3, int(20000 // price) + 1)
        # Ensure size has enough stock; else pick another
        variant = next(s for s in p["sizes"] if s["size"] == size)
        if variant["stock"] < qty:
            # find product with high enough price
            all_p = requests.get(f"{API}/products").json()["data"]
            all_p.sort(key=lambda x: -float(x["base_price"]))
            for cand in all_p:
                for sz in cand["sizes"]:
                    need = max(3, int(20000 // float(cand["base_price"])) + 1)
                    if sz["stock"] >= need:
                        p, size, qty = cand, sz["size"], need
                        break
                else:
                    continue
                break
        _add_to_cart(headers, p["id"], size, qty)
        r = _place_order(headers, method="COD")
        assert r.status_code == 200, r.text
        o = r.json()["data"]
        assert o["advance_required"] is True
        expected = round(o["subtotal"] * 10 / 100, 2)
        assert abs(o["advance_amount"] - expected) < 0.02
        assert o["payment_status"] == "partially_paid"
        assert abs(o["advance_paid"] - expected) < 0.02
        assert o["subtotal"] >= 20000

    def test_low_value_cod_no_advance(self):
        gid = str(uuid.uuid4())
        headers = _headers_guest(gid)
        # pick cheapest product
        prods = requests.get(f"{API}/products").json()["data"]
        prods.sort(key=lambda x: float(x["base_price"]))
        cheap = next(p for p in prods if float(p["base_price"]) < 10000 and any(s["stock"] > 0 for s in p["sizes"]))
        size = next(s["size"] for s in cheap["sizes"] if s["stock"] > 0)
        _add_to_cart(headers, cheap["id"], size, 1)
        r = _place_order(headers, method="COD")
        assert r.status_code == 200, r.text
        o = r.json()["data"]
        assert o["advance_required"] is False
        assert o["advance_amount"] == 0
        assert o["payment_status"] == "pending"


# ============ RETURNS ============
class TestReturns:
    def test_return_request_flow_and_admin_approve(self, admin_token, customer):
        # customer places WALLET order (paid) so we can also refund later
        prods = requests.get(f"{API}/products").json()["data"]
        p = next(pr for pr in prods if any(s["stock"] > 0 for s in pr["sizes"]))
        size = next(s["size"] for s in p["sizes"] if s["stock"] > 0)
        hdr = _headers_auth(customer["token"])
        _add_to_cart(hdr, p["id"], size, 1)
        r = _place_order(hdr, method="WALLET")
        assert r.status_code == 200, r.text
        order = r.json()["data"]
        assert order["payment_status"] == "paid"
        assert order["user_id"] == customer["id"]

        # Admin marks as delivered
        ra = requests.patch(f"{API}/admin/orders/{order['id']}/status",
                            headers=_headers_auth(admin_token),
                            json={"status": "delivered", "note": "delivered"})
        assert ra.status_code == 200

        # Customer requests return
        rr = requests.post(f"{API}/orders/{order['id']}/return-request",
                           headers=hdr, json={"reason": "Size too big"})
        assert rr.status_code == 200, rr.text
        ret = rr.json()["data"]
        assert ret["status"] == "pending"

        # Duplicate rejected
        rr2 = requests.post(f"{API}/orders/{order['id']}/return-request",
                            headers=hdr, json={"reason": "again"})
        assert rr2.status_code == 400

        # Verify order status is return_requested
        rk = requests.get(f"{API}/orders/{order['order_number']}", headers=hdr)
        assert rk.json()["data"]["status"] == "return_requested"

        # Admin lists returns
        al = requests.get(f"{API}/admin/returns", headers=_headers_auth(admin_token))
        assert al.status_code == 200
        assert any(x["id"] == ret["id"] for x in al.json()["data"])

        # Admin approve
        ap = requests.patch(f"{API}/admin/returns/{ret['id']}",
                            headers=_headers_auth(admin_token), json={"status": "approved"})
        assert ap.status_code == 200
        assert ap.json()["data"]["status"] == "approved"

        # save order for refund tests
        pytest.wallet_order = order
        pytest.return_id = ret["id"]

    def test_return_request_unauthorized(self):
        # try random order id
        r = requests.post(f"{API}/orders/{uuid.uuid4()}/return-request",
                          json={"reason": "x"}, headers={"Content-Type": "application/json"})
        assert r.status_code == 404


# ============ REFUNDS + STORE CREDIT ============
class TestRefundsAndCredit:
    def test_refund_to_store_credit_increases_balance(self, admin_token, customer):
        order = getattr(pytest, "wallet_order", None)
        assert order, "wallet order not created"
        # Get balance before
        rb = requests.get(f"{API}/me/store-credit", headers=_headers_auth(customer["token"]))
        bal_before = rb.json()["data"]["balance"]
        amount = min(500.0, float(order["total"]))
        rr = requests.post(f"{API}/admin/orders/{order['id']}/refund",
                           headers=_headers_auth(admin_token),
                           json={"amount": amount, "reason": "goodwill",
                                 "method": "STORE_CREDIT",
                                 "return_request_id": pytest.return_id})
        assert rr.status_code == 200, rr.text
        data = rr.json()["data"]
        assert data["refund"]["status"] == "completed"
        # Balance after
        ra = requests.get(f"{API}/me/store-credit", headers=_headers_auth(customer["token"]))
        bal_after = ra.json()["data"]["balance"]
        assert round(bal_after - bal_before, 2) == round(amount, 2)
        pytest.store_credit_balance = bal_after

    def test_refund_bank_transfer_requires_ref(self, admin_token, customer):
        # place WALLET order to have refundable amount
        prods = requests.get(f"{API}/products").json()["data"]
        p = next(pr for pr in prods if any(s["stock"] > 0 for s in pr["sizes"]))
        size = next(s["size"] for s in p["sizes"] if s["stock"] > 0)
        hdr = _headers_auth(customer["token"])
        _add_to_cart(hdr, p["id"], size, 1)
        r = _place_order(hdr, method="WALLET")
        order = r.json()["data"]
        # bank transfer without ref rejected
        r1 = requests.post(f"{API}/admin/orders/{order['id']}/refund",
                           headers=_headers_auth(admin_token),
                           json={"amount": 100, "reason": "x", "method": "BANK_TRANSFER"})
        assert r1.status_code == 400
        # with ref accepted
        r2 = requests.post(f"{API}/admin/orders/{order['id']}/refund",
                           headers=_headers_auth(admin_token),
                           json={"amount": 100, "reason": "x", "method": "BANK_TRANSFER",
                                 "external_ref": "TXN-123"})
        assert r2.status_code == 200
        pytest.bt_order = order

    def test_refund_exceeds_refundable_rejected(self, admin_token):
        order = pytest.bt_order
        # try huge refund
        r = requests.post(f"{API}/admin/orders/{order['id']}/refund",
                          headers=_headers_auth(admin_token),
                          json={"amount": float(order["total"]) * 10, "reason": "x",
                                "method": "BANK_TRANSFER", "external_ref": "T"})
        assert r.status_code == 400

    def test_refund_unpaid_cod_rejected(self, admin_token):
        # create a COD order under 20k -> payment_status pending, paid=0
        gid = str(uuid.uuid4())
        headers = _headers_guest(gid)
        prods = requests.get(f"{API}/products").json()["data"]
        cheap = min([p for p in prods if any(s["stock"] > 0 for s in p["sizes"])],
                    key=lambda x: float(x["base_price"]))
        size = next(s["size"] for s in cheap["sizes"] if s["stock"] > 0)
        _add_to_cart(headers, cheap["id"], size, 1)
        r = _place_order(headers, method="COD")
        order = r.json()["data"]
        assert order["payment_status"] == "pending"
        rr = requests.post(f"{API}/admin/orders/{order['id']}/refund",
                          headers=_headers_auth(admin_token),
                          json={"amount": 100, "reason": "x", "method": "STORE_CREDIT"})
        assert rr.status_code == 400

    def test_admin_refunds_list(self, admin_token):
        r = requests.get(f"{API}/admin/refunds", headers=_headers_auth(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json()["data"], list)
        assert len(r.json()["data"]) >= 1


# ============ STORE CREDIT AT CHECKOUT ============
class TestStoreCreditRedemption:
    def test_apply_store_credit_at_checkout(self, customer):
        # Ensure balance > 0
        rb = requests.get(f"{API}/me/store-credit", headers=_headers_auth(customer["token"]))
        bal = rb.json()["data"]["balance"]
        if bal <= 0:
            pytest.skip("no store credit")
        # Place a low-value COD order and apply store credit
        prods = requests.get(f"{API}/products").json()["data"]
        cheap = min([p for p in prods if any(s["stock"] > 0 for s in p["sizes"])],
                    key=lambda x: float(x["base_price"]))
        size = next(s["size"] for s in cheap["sizes"] if s["stock"] > 0)
        hdr = _headers_auth(customer["token"])
        _add_to_cart(hdr, cheap["id"], size, 1)
        credit_to_use = min(bal, 100.0)
        payload = {
            "customer_name": "SC Test", "customer_phone": "923001234567",
            "shipping_address": {"country_code": "PK", "city": "Lahore"},
            "payment_method": "COD",
            "store_credit_amount": credit_to_use,
        }
        r = requests.post(f"{API}/orders", headers=hdr, json=payload)
        assert r.status_code == 200, r.text
        o = r.json()["data"]
        assert o["store_credit_used"] == round(credit_to_use, 2)
        # New balance decreased
        rb2 = requests.get(f"{API}/me/store-credit", headers=_headers_auth(customer["token"]))
        assert round(bal - rb2.json()["data"]["balance"], 2) == round(credit_to_use, 2)
        # Ledger contains REDEEMED_ON_ORDER
        ledger = rb2.json()["data"]["ledger"]
        assert any(e["reason"] == "REDEEMED_ON_ORDER" for e in ledger)


# ============ WHATSAPP NOTIFICATIONS ============
class TestNotifications:
    def test_notifications_logged_on_events(self, admin_token):
        r = requests.get(f"{API}/admin/notifications", headers=_headers_auth(admin_token))
        assert r.status_code == 200
        events = {n["event"] for n in r.json()["data"]}
        assert "ORDER_PLACED" in events
        assert "STATUS_UPDATE" in events
        assert "REFUND" in events


# ============ IMAGE UPLOAD ============
class TestUpload:
    def test_admin_upload_and_serve(self, admin_token):
        # 1x1 png
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
               b"\xcf\xc0\x00\x00\x00\x03\x00\x01\x8dq\x8b\xa2\x00\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/admin/upload",
                          headers={"Authorization": f"Bearer {admin_token}"},
                          files=files)
        assert r.status_code == 200, r.text
        data = r.json()["data"]
        assert data["url"].startswith("/api/files/")
        # fetch back
        r2 = requests.get(BASE_URL + data["url"])
        assert r2.status_code == 200
        assert r2.content == png

    def test_upload_requires_admin(self):
        files = {"file": ("t.png", io.BytesIO(b"x"), "image/png")}
        r = requests.post(f"{API}/admin/upload", files=files)
        assert r.status_code in (401, 403)
