# MongoDB Atlas Setup Guide

Follow these exact steps to create your free cloud database.

## 1. Create an Account
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Sign up (you can use "Sign up with Google" for speed).
3.  Answer the welcome questions (Goal: "Learn MongoDB", Type: "M0 Free").

## 2. Deploy a Free Cluster
1.  You will see a page "Deploy your database".
2.  **Configuration**:
    *   **Cluster Type**: Shared (FREE) - *Make sure this is selected!*
    *   **Cloud Provider**: AWS.
    *   **Region**: `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore). *Choose the one closest to you.*
    *   **Name**: Leave as `Cluster0`.
3.  Click **Create Deployment** (Green Button).

## 3. Security Setup (Crucial!)
You will see a "Security Quickstart" popup.
1.  **Username and Password**:
    *   Username: `admin`
    *   Password: Click **"Autogenerate Secure Password"** and **COPY IT NOW** to Notepad. You will need this later!
    *   Click **Create Database User**.
2.  **IP Access List**:
    *   Click "Add My Current IP Address" (for local testing).
    *   **IMPORTANT**: For your website to work on Render, you also need to allow access from everywhere.
    *   Go to **Network Access** (in the left sidebar) -> **Add IP Address**.
    *   Select **"Allow Access from Anywhere"** (`0.0.0.0/0`).
    *   Click **Confirm**.

## 4. Get Connection String
1.  Go back to **Database** (left sidebar).
2.  Click the **Connect** button on your Cluster card.
3.  Select **"Drivers"** (Node.js, Python, etc.).
4.  copy the **Connection String** shown. It will look like this:
    ```
    mongodb+srv://admin:<db_password>@cluster0.p8xyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
    ```

## 5. Final Step: Prepare the String
1.  Paste the string into Notepad.
2.  Replace `<db_password>` with the password you saved in Step 3.
    *   *Example*: `mongodb+srv://admin:MySecurePass123@cluster0...`
3.  **This is your `MONGODB_URI`.** You will use this in the next step on Render.
