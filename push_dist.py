#!/usr/bin/env python3
"""Upload dist/ directory to GitHub using REST API (bypasses git CLI proxy issues)"""
import os, sys, json, base64, hashlib, requests
from pathlib import Path

BASE = "https://api.github.com/repos/memory713/classics-reader"
BRANCH = "main"

def get_repo_info():
    resp = requests.get(f"{BASE}", timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["sha"], data["owner"]["login"]

def upload_dir(base_path, prefix=""):
    """Recursively upload files to a git tree"""
    items = sorted(os.listdir(base_path))
    tree_items = []
    
    for name in items:
        full_path = os.path.join(base_path, name)
        path = f"{prefix}{name}" if prefix else name
        
        if os.path.isdir(full_path):
            # Recurse into subdirectory
            if name == ".nojekyll":
                continue  # skip hidden/nojekyll marker dirs
            sub_tree = upload_dir(full_path, f"{path}/")
            tree_items.append({
                "type": "tree",
                "path": path,
                "sha": sub_tree["sha"]
            })
        elif name not in (".gitkeep",):
            content = open(full_path, "rb").read()
            blob_sha = create_blob(content)
            tree_items.append({
                "type": "blob",
                "path": path,
                "sha": blob_sha,
                "content": content.decode("utf-8", errors="replace"),
                "encoding": "base64"
            })
    
    return create_tree(tree_items)

def create_blob(content_bytes):
    url = f"{BASE}/git/blobs"
    headers = {
        "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        "Accept": "application/vnd.github.v3+json"
    }
    resp = requests.post(url, json={
        "content": base64.b64encode(content_bytes).decode(),
        "encoding": "base64"
    }, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()["sha"]

def create_tree(tree_items, parent_tree=None):
    url = f"{BASE}/git/trees"
    headers = {
        "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {"tree": tree_items}
    if parent_tree:
        payload["base_tree"] = parent_tree
    
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

def update_ref(ref, sha):
    url = f"{BASE}/git/refs/{ref}"
    headers = {
        "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        "Accept": "application/vnd.github.v3+json"
    }
    resp = requests.put(url, json={"sha": sha}, headers=headers, timeout=30)
    print(f"Update ref: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)

if __name__ == "__main__":
    token = os.environ.get("GH_TOKEN", "")
    if not token:
        print("Error: GH_TOKEN not set")
        sys.exit(1)
    
    dist_dir = "/config/.openclaw/workspace/reading-app/dist"
    print(f"Uploading dist/ contents from: {dist_dir}")
    
    if not os.path.exists(dist_dir):
        print("Error: dist/ directory not found")
        sys.exit(1)
    
    # Build the full tree starting from root
    all_items = []
    # Process each top-level item
    for name in sorted(os.listdir(dist_dir)):
        full_path = os.path.join(dist_dir, name)
        if name.endswith(".DS_Store") or name.startswith("."):
            continue
        if os.path.isfile(full_path):
            with open(full_path, "rb") as f:
                content = f.read()
            # Create blob first
            url = f"{BASE}/git/blobs"
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json"
            }
            resp = requests.post(url, json={
                "content": base64.b64encode(content).decode(),
                "encoding": "base64"
            }, headers=headers, timeout=30)
            resp.raise_for_status()
            blob_sha = resp.json()["sha"]
            all_items.append({
                "type": "blob",
                "path": name,
                "sha": blob_sha,
                "content": content.decode("utf-8", errors="replace"),
                "encoding": "base64"
            })
            print(f"  {name}: uploaded blob ({len(content)} bytes)")
        elif os.path.isdir(full_path) and name != "node_modules":
            # Handle subdirectories (assets/)
            sub_items = []
            for sub_name in sorted(os.listdir(full_path)):
                sub_path = os.path.join(full_path, sub_name)
                if os.path.isfile(sub_path):
                    with open(sub_path, "rb") as f:
                        content = f.read()
                    url = f"{BASE}/git/blobs"
                    headers = {
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                    resp = requests.post(url, json={
                        "content": base64.b64encode(content).decode(),
                        "encoding": "base64"
                    }, headers=headers, timeout=30)
                    resp.raise_for_status()
                    blob_sha = resp.json()["sha"]
                    sub_items.append({
                        "type": "blob",
                        "path": f"{name}/{sub_name}",
                        "sha": blob_sha,
                        "content": content.decode("utf-8", errors="replace"),
                        "encoding": "base64"
                    })
                    print(f"  {name}/{sub_name}: uploaded blob ({len(content)} bytes)")
            
            # Create tree for assets/
            if sub_items:
                url = f"{BASE}/git/trees"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                resp = requests.post(url, json={"tree": sub_items}, headers=headers, timeout=30)
                resp.raise_for_status()
                all_items.append({
                    "type": "tree",
                    "path": name,
                    "sha": resp.json()["sha"]
                })
                print(f"  {name}/: created tree")
    
    # Create root tree
    url = f"{BASE}/git/trees"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    resp = requests.post(url, json={"tree": all_items}, headers=headers, timeout=30)
    resp.raise_for_status()
    tree_sha = resp.json()["sha"]
    print(f"Root tree created: {tree_sha}")
    
    # Update main branch to point to this tree
    url = f"{BASE}/git/refs/heads/main"
    resp = requests.get(f"{BASE}/branches/main", headers=headers, timeout=30)
    current_sha = resp.json()["commit"]["sha"]
    print(f"Current commit: {current_sha}")
    
    resp = requests.put(url, json={"sha": tree_sha}, headers=headers, timeout=30)
    print(f"Branch updated: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
    
    print("\nDone! Refresh your browser (Ctrl+Shift+R) to see changes.")
