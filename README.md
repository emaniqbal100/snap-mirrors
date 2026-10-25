# Snap's Mirror - E-commerce Platform

Modern e-commerce platform for smart mirrors with admin dashboard, payment integration, and order tracking.

## 🚀 Features

- **Public Website** - Product showcase, shopping cart, checkout
- **Admin Portal** - Product management, order tracking, reviews, settings
- **Payment Integration** - JazzCash, EasyPaisa, Bank Transfer, COD
- **Order Tracking** - Real-time status updates via email & WhatsApp
- **Review Management** - Display & manage customer reviews
- **Dynamic Settings** - Admin can update social media links, emails, themes
- **Email Notifications** - Order confirmations, status updates
- **Responsive Design** - Mobile-friendly UI

## 📁 Project Structure

```
snap-mirror-project/
├── backend/              # Node.js + Express API
├── .env.example          # Environment template
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **Email**: Nodemailer (Hostinger SMTP)
## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon)
- Git

## 🔧 Setup Instructions

### 1. Clone & Install

```bash
# Clone project
git clone <repo-url>
cd snap-mirror-project

# Install backend dependencies
cd backend
npm install

```

### 2. Environment Setup

```bash
# Copy env template to each folder
cp .env.example backend/.env
# Edit and fill in actual values
# - Database URL (Neon)
# - Payment API keys
# - Email credentials
# - API URLs
```

### 3. Database Setup

```bash
# Run migrations (when backend is ready)
cd backend
npm run migrate
npm run seed  # Insert sample data
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Runs on http://localhost:5000
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints (Coming Soon)
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `POST /orders` - Create order
- `GET /orders/:id` - Get order status
- `POST /payments` - Process payment
- `GET /reviews` - Get reviews
- And more...

## 🔐 Environment Variables

See `.env.example` for all required variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `EMAIL_USER`, `EMAIL_PASSWORD` - SMTP credentials
- `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD` - JazzCash credentials
- `EASYPAISA_MERCHANT_ID`, `EASYPAISA_PASSWORD` - EasyPaisa credentials

## 📧 Email Configuration

SMTP Server: `smtp.hostinger.com`
Port: `587`
User: `orders@snapsmirror.com`

## 💳 Payment Methods

1. **JazzCash** - 03244612168
2. **EasyPaisa** - 03141016293
3. **Bank Transfer** - JS Bank, Account: 03244612168
4. **Cash on Delivery** - Pay on delivery

### Backend (Railway
```bash
cd backend
npm run build
# Upload to Hostinger hosting
```


## 📱 Contact

- **Email**: raheel56h@gmail.com
- **WhatsApp**: +92 324 4612168
- **Instagram**: snap_mirrors
- **TikTok**: @aina_zaar1

## 📄 License

All rights reserved © 2024 Snap's Mirror

## 🙏 Support

For issues and support, contact via WhatsApp or email.

---

**Last Updated**: October 2026
**Version**: 1.0.0-dev
