# Windows Docker Desktop Network Access Fix

## The Issue

Docker Desktop on Windows runs containers in a **WSL2 isolated network**. When you bind to `0.0.0.0:80`, it only binds within WSL2, not to your Windows host's 192.168.100.38 IP.

**Result:** Localhost works, but external devices can't reach it.

---

## Solution: Use localhost with Port Forwarding

Colleagues cannot access your machine's IP directly with Docker Desktop on Windows. Instead, use **one of these approaches**:

### Option A: SSH Tunnel (Best for Security)

Your colleague runs on their machine:
```bash
ssh -L 8000:localhost:80 your-username@192.168.100.38
```

Then they access: `http://localhost:8000`

---

### Option B: Use ngrok (Easiest - No Config)

1. **Download ngrok:** https://ngrok.com/download
2. **Unzip and run:**
   ```bash
   ngrok http 80
   ```
3. **Share the ngrok URL with colleagues** (e.g., `https://abc123.ngrok.io`)

---

### Option C: Use a Simple HTTP Server Proxy

Run this Python script to forward requests from your IP to Docker:

```python
# proxy.py
import socket
import threading

def forward_request(client_socket, target_host='127.0.0.1', target_port=80):
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.connect((target_host, target_port))
        
        # Send request to Docker
        request = client_socket.recv(4096)
        server_socket.sendall(request)
        
        # Send response back
        response = server_socket.recv(4096)
        client_socket.sendall(response)
        
        server_socket.close()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()

# Listen on 192.168.100.38:80
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', 80))
server.listen(5)
print("Proxy listening on port 80...")

while True:
    client_socket, addr = server.accept()
    print(f"Connection from {addr}")
    threading.Thread(target=forward_request, args=(client_socket,)).start()
```

Save as `proxy.py`, then run (as Admin):
```bash
python proxy.py
```

---

### Option D: Docker with Host Networking (WSL2 Only)

Edit `docker-compose.yml`:
```yaml
web:
  ...
  network_mode: "host"
```

Then run:
```bash
docker compose up -d
```

Access at: `http://192.168.100.38:80`

⚠️ **Note:** This only works if Docker Desktop uses "WSL 2 with native networking" enabled in Docker settings.

---

## Recommended: ngrok (Simplest)

1. Download: https://ngrok.com/download
2. Run: `ngrok http 80`
3. Share the public URL with colleagues

**Example:**
```
http://a1b2c3d4.ngrok.io
```

They can access from anywhere, including outside your network!

---

## Check Docker Settings

1. Open **Docker Desktop**
2. Go to **Settings** → **Resources** → **WSL 2 backend**
3. Check if "Expose daemon on TCP" is enabled
4. If not → Enable it + restart Docker

Then try accessing from a colleague's machine again.
