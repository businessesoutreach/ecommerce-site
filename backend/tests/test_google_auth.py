"""Backend tests for Google OAuth session endpoint (iteration 4)."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://streetwear-shop-133.preview.emergentagent.com").rstrip("/")


def test_google_session_missing_session_id():
    r = requests.post(f"{BASE_URL}/api/auth/google/session", json={})
    assert r.status_code == 400
    body = r.json()
    assert "session_id" in body.get("detail", "").lower() or "missing" in body.get("detail", "").lower()


def test_google_session_empty_session_id():
    r = requests.post(f"{BASE_URL}/api/auth/google/session", json={"session_id": ""})
    assert r.status_code == 400


def test_google_session_invalid_session_id_returns_401():
    r = requests.post(
        f"{BASE_URL}/api/auth/google/session",
        json={"session_id": "invalid-fake-session-xyz-12345"},
    )
    assert r.status_code == 401
    body = r.json()
    assert "google" in body.get("detail", "").lower() or "failed" in body.get("detail", "").lower()


def test_google_session_invalid_does_not_create_user():
    # Use a unique bogus id; ensure no user is created (endpoint just returns 401).
    r = requests.post(
        f"{BASE_URL}/api/auth/google/session",
        json={"session_id": "definitely-not-a-real-session-abcdef"},
    )
    assert r.status_code == 401
    # Nothing to assert on DB directly via public API, but the response must not include a token.
    assert "token" not in r.text
