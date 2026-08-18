import os, json, urllib.request

base = os.environ["INTEGRATION_PROXY_URL"]
job_id = "04b0cfe3-3f3b-4a11-ba19-1594e2c2a9bd"
key = "sk-emergent-2E59e55A2522dEa108"
req = urllib.request.Request(
    base + "/stripe/sandboxes",
    data=json.dumps({"job_id": job_id}).encode(),
    headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as r:
    sandbox = json.load(r)
print(json.dumps({
    "secret": sandbox["sandbox_secret_key"],
    "pub": sandbox["sandbox_publishable_key"],
    "acct": sandbox["sandbox_account_id"],
    "webhook_secret": sandbox["preview_webhook_secret"],
    "onboarding_url": sandbox.get("onboarding_url"),
}))
