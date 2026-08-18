"""Phase 3: Multi-image product gallery + edit tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = BASE_URL + "/api"

ADMIN_EMAIL = "sahilwaheed48@gmail.com"
ADMIN_PASS = "Admin@12345"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


@pytest.fixture(scope="module")
def hdr(admin_token):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}


IMG_A = "https://example.com/a.jpg"
IMG_B = "https://example.com/b.jpg"
IMG_C = "https://example.com/c.jpg"
IMG_D = "https://example.com/d.jpg"


class TestCreateWithGallery:
    def test_create_product_with_multiple_images(self, hdr):
        slug = f"test-gallery-{uuid.uuid4().hex[:6]}"
        payload = {
            "name": "TEST Gallery Product",
            "slug": slug,
            "base_price": 5999,
            "category_slug": "retro",
            "brand_slug": "airvault",
            "images": [IMG_A, IMG_B, IMG_C],
            "hover_image": IMG_B,  # frontend sends images[1]
            "description": "gallery test",
        }
        r = requests.post(f"{API}/admin/products", headers=hdr, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d["images"] == [IMG_A, IMG_B, IMG_C]
        pytest.gallery_pid = d["id"]
        pytest.gallery_slug = slug
        # Cover check
        assert d["images"][0] == IMG_A
        # hover_image expected images[1] per spec
        assert d.get("hover_image") == IMG_B, f"expected hover_image = images[1] ({IMG_B}) but got {d.get('hover_image')}"

    def test_admin_products_list_includes_new(self, hdr):
        r = requests.get(f"{API}/admin/products", headers=hdr)
        assert r.status_code == 200
        products = r.json()["data"]
        p = next((x for x in products if x["id"] == pytest.gallery_pid), None)
        assert p is not None
        assert len(p["images"]) == 3

    def test_public_product_reflects_gallery(self):
        r = requests.get(f"{API}/products/{pytest.gallery_slug}")
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["images"] == [IMG_A, IMG_B, IMG_C]


class TestEditGallery:
    def test_patch_append_image(self, hdr):
        new_images = [IMG_A, IMG_B, IMG_C, IMG_D]
        r = requests.patch(f"{API}/admin/products/{pytest.gallery_pid}", headers=hdr,
                           json={"images": new_images, "hover_image": IMG_B})
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d["images"] == new_images
        assert d["hover_image"] == IMG_B

    def test_patch_remove_and_reorder(self, hdr):
        # remove IMG_A (was cover) -> new order [B, C, D]; hover_image = images[1] = C
        new_images = [IMG_B, IMG_C, IMG_D]
        r = requests.patch(f"{API}/admin/products/{pytest.gallery_pid}", headers=hdr,
                           json={"images": new_images, "hover_image": IMG_C})
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["images"] == new_images
        assert d["images"][0] == IMG_B  # cover
        assert d["hover_image"] == IMG_C

    def test_patch_reorder_persists(self, hdr):
        # reverse order
        new_images = [IMG_D, IMG_C, IMG_B]
        r = requests.patch(f"{API}/admin/products/{pytest.gallery_pid}", headers=hdr,
                           json={"images": new_images, "hover_image": IMG_C})
        assert r.status_code == 200
        # verify via public endpoint
        r2 = requests.get(f"{API}/products/{pytest.gallery_slug}")
        assert r2.status_code == 200
        d = r2.json()["data"]
        assert d["images"] == new_images
        assert d["hover_image"] == IMG_C

    def test_patch_single_image_hover_falls_back_to_cover(self, hdr):
        new_images = [IMG_A]
        r = requests.patch(f"{API}/admin/products/{pytest.gallery_pid}", headers=hdr,
                           json={"images": new_images, "hover_image": IMG_A})
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["images"] == [IMG_A]
        assert d["hover_image"] == IMG_A


class TestCleanup:
    def test_delete(self, hdr):
        r = requests.delete(f"{API}/admin/products/{pytest.gallery_pid}", headers=hdr)
        assert r.status_code == 200
        # verify gone
        r2 = requests.get(f"{API}/products/{pytest.gallery_slug}")
        assert r2.status_code == 404
