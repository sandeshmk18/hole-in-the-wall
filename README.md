# ☕ The Hole in the Wall Café — Full Stack Website

A complete, production-ready café website with:
- Public-facing website (reservations, menu, gallery)
- Online ordering with **Razorpay** payments
- **Email** (SendGrid) + **WhatsApp + SMS** (Twilio) notifications
- **Admin Dashboard** (bookings, orders, menu management, revenue charts)
- **Node.js + Express + MongoDB** backend

---

## 📁 Project Structure

```
holeinthewall/
├── backend/
│   ├── config/         db.js
│   ├── middleware/      auth.js (JWT)
│   ├── models/          Admin, Reservation, Order, MenuItem
│   ├── routes/          auth, reservations, orders, menu, payments, admin
│   ├── utils/           notifications.js, seedAdmin.js
│   ├── server.js
│   ├── package.json
│   └── .env.example    ← copy to .env and fill in keys
└── frontend/
    ├── index.html       ← main café website
    ├── js/
    │   └── api-connector.js  ← connects frontend to backend
    └── admin/
        └── index.html   ← admin dashboard
```

---

## 🚀 Quick Start (Local)

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your keys (see section below).

### 4. Start the server
```bash
npm run dev       # development (auto-restart)
# or
npm start         # production
```

### 5. Open in browser
- **Café Website:**   http://localhost:5000
- **Admin Dashboard:** http://localhost:5000/admin

**Default admin login:**
- Email: `admin@holeinthewall.in`
- Password: `Admin@123!`
*(Change these in your .env before going live)*

---

## 🔑 Getting Your API Keys

### MongoDB Atlas (Free Database)
1. Go to https://mongodb.com/atlas → Create free account
2. Create a free M0 cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string into `MONGODB_URI`
5. Replace `<password>` with your DB user password

### Razorpay (Payments)
1. Go to https://razorpay.com → Sign up (free)
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Copy `Key ID` → `RAZORPAY_KEY_ID`
4. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`
5. For live payments, complete KYC and switch to Live keys

### SendGrid (Email)
1. Go to https://sendgrid.com → Free account (100 emails/day free)
2. Settings → API Keys → Create API Key (Full Access)
3. Copy key → `SENDGRID_API_KEY`
4. Settings → Sender Authentication → verify your email domain

### Twilio (WhatsApp + SMS)
1. Go to https://twilio.com → Free account ($15 trial credit)
2. Console Dashboard → copy **Account SID** and **Auth Token**
3. Get a phone number (free trial number works)
4. For WhatsApp: join sandbox at https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
5. Copy sandbox number → `TWILIO_WHATSAPP_NUMBER`

> **Note:** In development mode, if you haven't added API keys yet,
> all notifications are logged to the console instead of sending.
> The app works fully without keys — just add them when ready.

---

## 🌐 Deploy to Railway (Recommended — Free Tier)

Railway gives you a live URL in under 5 minutes.

### Step 1: Push to GitHub
```bash
# In the holeinthewall folder:
git init
git add .
git commit -m "Initial commit"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/holeinthewall.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `holeinthewall` repo
4. Set the **Root Directory** to `backend`
5. Railway auto-detects Node.js and runs `npm start`

### Step 3: Add Environment Variables
In Railway dashboard → your service → **Variables** tab:
- Add all variables from your `.env` file
- Set `NODE_ENV=production`
- Set `FRONTEND_URL=https://your-app.railway.app`

### Step 4: Get your live URL
Railway gives you a URL like `https://holeinthewall-production.up.railway.app`

Share this link — your site is live! 🎉

---

## 🌐 Alternative: Deploy to Render (Also Free)

1. Go to https://render.com → New Web Service
2. Connect GitHub repo
3. Set **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables in the dashboard
7. Deploy → get your `https://holeinthewall.onrender.com` URL

---

## 🌍 Custom Domain (e.g. holeinthewall.in)

1. Buy domain at https://namecheap.com or https://godaddy.com (~₹800/year for `.in`)
2. In Railway/Render dashboard → **Custom Domain** → enter your domain
3. Copy the CNAME record shown
4. In your domain registrar's DNS settings → add the CNAME record
5. Wait 10–30 minutes → your site is live on your own domain!

---

## 📋 API Endpoints Reference

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reservations | Create reservation |
| GET | /api/menu | Get all menu items |
| POST | /api/orders | Place an order |
| POST | /api/payments/create-order | Create Razorpay order |
| POST | /api/payments/verify | Verify payment |

### Admin (requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/auth/me | Get current admin |
| GET | /api/reservations | List reservations (filter by date/status) |
| PATCH | /api/reservations/:id | Update reservation status |
| GET | /api/orders | List orders |
| PATCH | /api/orders/:id | Update order status |
| POST | /api/menu | Add menu item |
| PUT | /api/menu/:id | Edit menu item |
| DELETE | /api/menu/:id | Delete menu item |
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/revenue-chart | 7-day revenue chart |
| GET | /api/payments | Payment transactions |

---

## 🔧 Adding Razorpay Script to Frontend

In your `frontend/index.html`, add this before `</body>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="/js/api-connector.js"></script>
```

This enables the shopping cart, order placement, and live payments.

---

## 📱 What Customers Get

### On Reservation:
- ✅ SMS confirmation with date/time/table
- ✅ WhatsApp message with full details
- ✅ Email confirmation (if email provided)
- ✅ Admin gets email alert instantly

### On Order + Payment:
- ✅ Razorpay payment page (UPI, cards, netbanking, wallets)
- ✅ SMS order confirmation with item list
- ✅ WhatsApp message with order summary
- ✅ Email receipt (if email provided)

---

## 🛡️ Security Features
- JWT authentication for admin panel
- Rate limiting (100 req/15min general, 20 req/15min for auth/payments)
- Helmet.js security headers
- Input validation on all endpoints
- Razorpay signature verification
- Password hashing with bcrypt (12 rounds)

---

## 🆙 Next Level Upgrades (Future)
- [ ] Table management with real-time availability
- [ ] Loyalty points system
- [ ] WhatsApp Business API (instead of Twilio sandbox)
- [ ] Kitchen display screen (WebSocket live orders)
- [ ] Zomato/Swiggy menu sync
- [ ] GST invoice PDF generation
- [ ] Multi-branch support

---

Built with ☕ for The Hole in the Wall Café, Bangalore.
