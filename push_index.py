#!/usr/bin/env python3
"""Force refresh GitHub Pages by updating root index.html + touching key files"""
import base64, requests, os

BASE = "https://api.github.com/repos/memory713/classics-reader"
TOKEN = os.environ.get("GH_TOKEN", "")
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def get_file(path):
    resp = requests.get(f"{BASE}/contents/{path}", headers=HEADERS, timeout=30)
    return resp.json()

def update_file(path, content_bytes, message="chore: trigger rebuild"):
    current = get_file(path)
    sha = current["sha"]
    
    payload = {
        "message": message,
        "content": base64.b64encode(content_bytes).decode(),
        "sha": sha,
        "branch": "main"
    }
    
    resp = requests.put(
        f"{BASE}/contents/{path}",
        json=payload,
        headers=HEADERS,
        timeout=30
    )
    status = resp.status_code
    if status == 200:
        print(f"✓ Updated {path}")
    else:
        print(f"✗ Failed for {path}: {status}")
        print(resp.text[:500])

# Files to touch/refresh to force CDN cache invalidation
files_to_refresh = [
    ("dist/index.html", open("dist/index.html", "rb").read()),
    (".nojekyll", b"# Force rebuild\n"),
]

for path, content in files_to_refresh:
    try:
        update_file(path, content, f"chore: force CDN cache refresh for {path}")
    except Exception as e:
        print(f"Error updating {path}: {e}")

print("\nDone! Wait ~30s then hard-refresh your browser (Ctrl+Shift+R)")
