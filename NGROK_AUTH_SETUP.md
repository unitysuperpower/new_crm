# NGROK - Complete Setup Guide

## Step 1: Create Free ngrok Account

1. Visit: https://dashboard.ngrok.com/signup
2. Sign up (free account)
3. Verify your email

---

## Step 2: Get Your Auth Token

1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your auth token (looks like: `2U3c5x...`)

---

## Step 3: Install Auth Token

Open Command Prompt and run:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token from Step 2.

Example:
```bash
ngrok config add-authtoken 2U3c5xabc123def456xyz789
```

---

## Step 4: Start CRM Tunnel

Once auth token is added, run:

```bash
cd D:\crm
docker compose up -d
ngrok http 80
```

You'll see:
```
Forwarding  https://abc123xyz.ngrok.io -> http://localhost:80
```

---

## Step 5: Share URL with Colleagues

Copy the HTTPS URL and send to colleagues.

Example to share:
```
https://abc123xyz.ngrok.io
```

---

## Summary

1. Create account at: https://dashboard.ngrok.com/signup
2. Copy token from: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run: `ngrok config add-authtoken YOUR_TOKEN`
4. Run: `ngrok http 80`
5. Share the URL!

---

## Free ngrok Features ✓

- ✓ Create tunnels
- ✓ 2-3 per account
- ✓ Random URL each time
- ✓ Basic analytics
- ✓ Secure (HTTPS)

Perfect for team testing!
