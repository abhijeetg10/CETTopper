# Deployment Guide - MHT CET Topper

This guide will help you publish your website to the internet using **Render** (a free and easy-to-use hosting platform).

## Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **MongoDB Atlas Account**: You need a cloud-hosted MongoDB database (the local one won't work on the cloud).

---

## Step 1: Push to GitHub (Securely)
1.  Create a new repository on GitHub. **IMPORTANT: Select "Private"** to keep your code hidden from the public.
2.  I have created a `.gitignore` file for you. This ensures your **passwords** and **database data** (in `.env`) are NEVER uploaded to GitHub.
3.  Open your terminal in the project folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/cet-topper.git
    git push -u origin main
    ```
    *Note: If asked for a password, you may need to use a GitHub Personal Access Token.*

## Step 2: Set up MongoDB Atlas
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **free cluster**.
3.  Create a database user (username/password).
4.  Allow access from anywhere (`0.0.0.0/0`) in Network Access.
5.  Get your **Connection String** (it looks like `mongodb+srv://<user>:<password>@cluster0.mongodb.net/...`).

## Step 3: improved Deploy on Render
1.  Sign up at [render.com](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    *   **Name**: `cet-topper-app`
    *   **Region**: Singapore (closest to India) or Default.
    *   **Branch**: `main`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
5.  **Environment Variables** (Advanced):
    *   Add `MONGODB_URI`: Paste your MongoDB Atlas connection string.
    *   Add `JWT_SECRET`: Enter a random secret key (e.g., `my-super-secret-key-123`).
6.  Click **Deploy Web Service**.

## Step 4: Final Setup
1.  Once deployed, Render will give you a URL (e.g., `https://cet-topper-app.onrender.com`).
2.  Open that URL in your browser.
3.  The database will be empty. You need to create an admin user again on the live site:
    *   **Option A (Console)**: Render has a "Shell" tab. Open it and run:
        ```bash
        node setup_admin.js
        ```
    *   **Option B (Local connection)**: Connect to your remote MongoDB from your local machine using Compass and manually insert the admin user if needed, but the shell script is easier.

## 🎉 Done!
Your website is now live! Share the URL with your students.
