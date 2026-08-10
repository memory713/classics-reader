#!/usr/bin/env python3
"""Force upload dist/ via GitHub REST API using only stdlib (no pip install)"""
import json, base64, urllib.request, os, sys

REPO = "memory713/classics-reader"
BRANCH = "main"
TOKEN = os.environ.get("GH_TOKEN", "")

def api(method, path, data=None):
    url = f"https://api.github.com/repos/{REPO}/{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    if data:
        body = json.dumps(data).encode()
        req.add_header("Content-Type", "application/json")
        req.data = body
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

# Get current tree SHA
tree_info = api("GET", f"git/trees/master?recursive=1")
current_tree_sha = tree_info["sha"]
print(f"Current tree: {current_tree_sha}")

# Build new tree entries from dist/
dist_dir = "/config/.openclaw/workspace/reading-app/dist"
new_items = []

for root, dirs, files in sorted(os.walk(dist_dir)):
    # Skip .hidden dirs and node_modules
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    
    for f in sorted(files):
        full_path = os.path.join(root, f)
        rel_path = os.path.relpath(full_path, dist_dir)
        
        content_bytes = open(full_path, "rb").read()
        
        # Upload blob
        blob_data = {"content": base64.b64encode(content_bytes).decode(), "encoding": "base64"}
        blob = api("POST", "git/blobs", blob_data)
        
        item = {
            "type": "blob",
            "path": rel_path,
            "sha": blob["sha"],
            "size": len(content_bytes)
        }
        new_items.append(item)
        print(f"  Blob: {rel_path} ({len(content_bytes)} bytes)")

# Create new tree with same structure as original + our dist/ updates
# We need to remove old dist/ entries and add new ones
existing_paths = {e["path"]: e["sha"] for e in tree_info["tree"]}
removed_prefixes = {"dist/", ".github/"}
keep_entries = [
    e for e in tree_info["tree"]
    if not any(e["path"].startswith(p) for p in removed_prefixes)
]

all_entries = keep_entries + new_items

# Create new tree
new_tree = api("POST", "git/trees", {"tree": all_entries, "base_tree": current_tree_sha})
print(f"\nNew tree SHA: {new_tree['sha']}")

# Update main branch to point to new tree
# First update the commit
commit_data = {
    "message": "chore: force cache refresh via API",
    "tree": new_tree["sha"],
    "parents": [tree_info["tree"][0]["sha"]]  # Use first parent
}

# Actually we need to get the HEAD commit properly
head_commit_url = f"https://api.github.com/repos/{REPO}/branches/{BRANCH}"
head_resp = urllib.request.Request(head_commit_url)
head_resp.add_header("Authorization", f"Bearer {TOKEN}")
head_resp.add_header("Accept", "application/vnd.github.v3+json")
head = json.loads(urllib.request.urlopen(head_resp).read())
parent_sha = head["commit"]["sha"]
print(f"Parent commit: {parent_sha}")

# Update ref to point to new commit... but we need to create commit first
# Actually let's just push to git directly since git works for this repo
print("\n--- Now pushing via git ---")
os.system("cd /config/.openclaw/workspace/reading-app && git add -A && git commit --allow-empty -m 'chore: trigger rebuild' && git push origin master")
