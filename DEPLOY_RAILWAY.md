# 🚀 Deploying to Railway

This guide explains how to deploy your app to [Railway](https://railway.app).

## ⚠️ Important: Database & Storage

Your app currently uses **SQLite** (a local file database) and **Local File Storage** (for images).
Railway deployments are **ephemeral**, meaning files created at runtime (like `dev.db` or uploaded images) **WILL BE LOST** every time you redeploy.

### Recommended Production Setup:
1.  **Database**: Use a **PostgreSQL** service on Railway.
2.  **Storage**: For production images, you should switch to an external service (like AWS S3, Cloudinary, or UploadThing). *This guide covers the Database part.*

---

## Step 1: Push to GitHub
Ensure all your latest changes (including `package.json` with the build fix) are pushed to GitHub.

## Step 2: Create Railway Project
1.  Log in to [Railway Dashboard](https://railway.app/dashboard).
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select your repository (`uv-market-school`).
4.  Click **"Deploy Now"**.

## Step 3: Add a PostgreSQL Database (Recommended)
1.  In your Railway project view, click **"New"** -> **"Database"** -> **"PostgreSQL"**.
2.  This will create a Postgres service.

## Step 4: Configure Environment Variables
Go to your **App Service** (the core app) -> **Variables** tab. Add the following:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-links to your new Postgres DB. |
| `NEXTAUTH_SECRET` | (Generate a random string) | Run `openssl rand -base64 32` to get one. |
| `NEXTAUTH_URL` | `https://<your-service-url>.up.railway.app` | The public URL Railway assigns you. |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Create a free account at [cloudinary.com](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | `your_api_key` | Found in Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Found in Cloudinary Dashboard |

## Step 5: Update Schema (for Postgres)
Since you are switching from SQLite to Postgres, you need to:
1.  Edit `prisma/schema.prisma`:
    ```prisma
    datasource db {
      provider = "postgresql" // Change from "sqlite"
      url      = env("DATABASE_URL")
    }
    ```
2.  Commit and push this change to GitHub.
3.  Railway will detect the change and redeploy.

## Step 6: Verify Build
Your `package.json` is already configured with `"build": "prisma generate && next build"`, so Railway will automatically generate the Prisma client.

---

## 🛑 Using SQLite (Not Recommended)
If you *must* use SQLite:
1.  Add a **Volume** in Railway settings.
2.  Mount it to `/app`. (Note: This might overwrite your code, creating issues).
3.  It is strictly better to use PostgreSQL.
