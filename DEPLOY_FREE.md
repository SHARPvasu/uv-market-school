# 🚀 Free Deployment Guide (Vercel + Turso)

You requested a **100% Free** way to deploy. This is the industry-standard free stack for Next.js.

## 1. The Stack
- **Web App Host**: [Vercel](https://vercel.com) (Forever Free "Hobby" Tier)
- **Database Host**: [Turso](https://turso.tech) (Forever Free "Starter" Tier)

## 2. Setup Database (Turso)
1. Go to [turso.tech](https://turso.tech) and Sign Up (GitHub login recommended).
2. Create a new Database immediately after signup.
3. Click "Connect" or "Database Settings" to find:
   - **Database URL** (starts with `libsql://...`)
   - **Auth Token** (click "Generate Token")
4. **Copy these two values.**

## 3. Deployment Code (Run automatically!)
I have already configured your code to work with **both** local SQLite (for development) and Turso (for production).

*   `src/lib/prisma.ts`: Updated to detect `TURSO_DATABASE_URL` and switch to the LibSQL adapter automatically.
*   `prisma/schema.prisma`: Configured correctly.
*   `package.json`: Dependencies installed (`@libsql/client`, `@prisma/adapter-libsql`).

**You do NOT need to change any code manually.** Just set the environment variables on Vercel.

## 4. Deploy to Vercel
1. Push your code to **GitHub**.
2. Go to [Vercel](https://vercel.com) -> "Add New..." -> "Project".
3. Import your repository.
4. **Environment Variables**:
   In the deploy screen, add:
   - `TURSO_DATABASE_URL`: (Paste your libsql:// URL)
   - `TURSO_AUTH_TOKEN`: (Paste your token)
   - `NEXTAUTH_SECRET`: (Any random string)
   - `NEXTAUTH_URL`: `https://your-project.vercel.app`
5. Click **Deploy**.

## 5. Push Schema
Run this locally to create tables in your new Turso DB:
```bash
$env:TURSO_DATABASE_URL="libsql://..."
$env:TURSO_AUTH_TOKEN="..."
npx prisma db push
```
