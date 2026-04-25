# SprayKart AWS Deployment & DevOps Handover

This document outlines the complete production infrastructure and deployment strategy for the SprayKart platform. It serves as a handover for future developers managing the AWS environment.

## 1. Cloud Infrastructure (AWS Lightsail)
The application was migrated from managed cloud services (Vercel/Supabase) to a self-hosted "lift-and-shift" monolith on **AWS Lightsail**.

* **Instance OS:** Ubuntu 22.04 LTS
* **Instance Size:** Micro (1GB RAM, 2 vCPUs)
* **Region:** Mumbai (`ap-south-1`)
* **Static IP:** \`65.0.239.246\`
* **Custom Domain:** \`spraykart.deepanshulathar.dev\`
* **Firewall Ports (Open):** 
  * \`22\` (SSH)
  * \`80\` (HTTP)
  * \`443\` (HTTPS)

## 2. Server Stack & Dependencies
The following core services run directly on the Ubuntu server:
* **Node.js:** v20.x (Running the Next.js application)
* **Process Manager:** PM2 (Ensures the app restarts on crashes/reboots)
* **Web Server:** Nginx (Acts as a reverse proxy)
* **Database:** PostgreSQL 16 (Running locally on \`127.0.0.1:5432\`)
* **Cache:** Redis Server (Running locally on \`127.0.0.1:6379\`)

## 3. Database Architecture (PostgreSQL 16)
We migrated away from Supabase to a locally hosted PostgreSQL database to eliminate external latency and lower costs.

* **Database Name:** \`spraykart\`
* **Database User:** \`spraykart_admin\`
* **Access Control:** The database does NOT accept external connections. It only accepts connections from \`localhost\`.
* **Important Code Fixes Applied:**
  1. **SSL Validation:** In \`lib/db.js\`, SSL validation is explicitly disabled when connecting to localhost.
  2. **Strict Grouping (Postgres 16):** Next.js API routes (\`api/products\`) and the Homepage (\`page.jsx\`) were refactored to use **Correlated Subqueries** instead of \`LATERAL JOIN / GROUP BY\`. This bypasses strict SQL grouping requirements introduced in PG16.

## 4. Third-Party Integrations
The application relies on several external APIs. The keys for these are stored securely on the server in \`/home/ubuntu/spraykart/frontend/.env.local\`.

* **Cloudinary:** Used for product image hosting. Keys must be present in \`.env.local\` to prevent "api_key missing" errors when saving products in the Admin panel.
* **Razorpay:** Payment gateway for processing live orders.
* **Resend:** Email API for order confirmations.

## 5. Deployment & Maintenance Workflows
All application code lives in \`/home/ubuntu/spraykart\`.

### Deploying Code Updates
Whenever new code is pushed to the \`main\` branch on GitHub, run the following sequence on the server:

```bash
# 1. Enter the correct directory
cd ~/spraykart/frontend

# 2. Pull the latest code
git pull origin main

# 3. Rebuild the Next.js application (REQUIRED for server components/actions)
npm run build

# 4. Restart the live process without downtime
pm2 restart spraykart
```

### Viewing Logs & Debugging
If the application throws a 500 error, PM2 captures all `console.error` outputs.

```bash
# View live application logs
pm2 logs spraykart --lines 50

# View Nginx access/error logs (for 502 Bad Gateway errors)
sudo tail -f /var/log/nginx/error.log
```

### Renewing SSL Certificates
The SSL certificate was issued by Let's Encrypt via Certbot. It is configured to renew automatically. If manual renewal is ever required:
```bash
sudo certbot renew
```

## 6. Nginx Configuration
The Nginx configuration file is located at \`/etc/nginx/sites-available/spraykart\`. It acts as a reverse proxy, forwarding traffic from port 80/443 to the Node.js PM2 process running on port 3000. It handles the `Upgrade` headers necessary for Next.js hot-reloading and WebSockets.
