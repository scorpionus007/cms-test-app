# Setup Guide: MySQL + Google Login

Follow these steps to get the CMS running with MySQL and Google Login.

---

## 1. Install MySQL

### Option A: Already have MySQL
Make sure the MySQL server is running and you know the root password (or a user with CREATE DATABASE rights).

### Option B: Install MySQL on Windows
1. Download [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) (or use MySQL Installer).
2. Run the installer; set a **root password** and remember it.
3. Ensure MySQL is running (e.g. Windows Services → MySQL80, or run `net start MySQL80` in an elevated prompt).


## 2. Create the database

### Option A: Using Node (no MySQL CLI needed)

From the project folder, with `.env` already set (see step 4):

```bash
npm run db:create
```

This uses the project’s `mysql2` package to create the database. You’ll see: `Database 'securedapp_cms' is ready.`

### Option B: Using MySQL command line or Workbench

If `mysql` is in your PATH, run:

```bash
mysql -u root -p -e "CREATE DATABASE securedapp_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Or open **MySQL Workbench**, connect to your server, and run:

```sql
CREATE DATABASE IF NOT EXISTS securedapp_cms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Optional: create a dedicated user instead of root:

```sql
CREATE USER 'cmsuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON securedapp_cms.* TO 'cmsuser'@'localhost';
FLUSH PRIVILEGES;
```
Then in `.env` use `DB_USER=cmsuser` and `DB_PASSWORD=your_password`.

---

## 3. Get Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select one) → **APIs & Services** → **Credentials**.
3. Click **Create Credentials** → **OAuth client ID**.
4. If asked, configure the **OAuth consent screen**:
   - User type: **External** (or Internal for workspace only).
   - App name: e.g. "SecureDApp CMS".
   - Add your email as developer; add test users if in "Testing" mode.
5. Back to **Create OAuth client ID**:
   - Application type: **Web application**.
   - Name: e.g. "CMS Web".
   - **Authorized JavaScript origins** (for browser login):
     - `http://localhost:3000` (or the port where your frontend runs).
     - Add your production origin later.
   - **Authorized redirect URIs**: add e.g. `http://localhost:3000` (or your frontend URL) if you use a redirect flow; for **ID token only** (our API), you can leave this empty.
6. Click **Create** and copy the **Client ID** (looks like `123456789-xxxx.apps.googleusercontent.com`).

Put this in `.env` as `GOOGLE_CLIENT_ID=...`.

---

## 4. Configure `.env`

1. Copy the example file:
   ```bash
   copy .env.example .env
   ```
   (On PowerShell: `Copy-Item .env.example .env`)

2. Edit `.env` and set:

   | Variable | What to set |
   |----------|-------------|
   | `GOOGLE_CLIENT_ID` | The Client ID from step 3 |
   | `JWT_SECRET` | A long random string (min 32 chars). Example: run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
   | `DB_HOST` | `localhost` (or your MySQL host) |
   | `DB_PORT` | `3306` |
   | `DB_NAME` | `securedapp_cms` |
   | `DB_USER` | `root` or your MySQL user |
   | `DB_PASSWORD` | Your MySQL password |

3. Save the file (no quotes needed; no spaces around `=`).

---

## 5. Install dependencies and sync the database

```bash
cd "c:\Users\Skyworth\Desktop\Projects Dev\securedapp_cms"
npm install
npm run db:sync
```

You should see: `Database synced successfully.`

**Note:** After the first setup, `npm run dev` runs the **same sync automatically** before the server starts (so schema stays aligned while you develop). To skip that (faster restarts), set `SKIP_DB_SYNC=true` in `.env`. `npm start` does **not** auto-sync.

If you see a connection error:
- Check MySQL is running.
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env`.
- On Windows, try `127.0.0.1` instead of `localhost` if needed.

---

## 6. Start the server

```bash
npm start
```

Or with auto-reload (**and auto DB sync** on each process start):

```bash
npm run dev
```

You should see: `Database synced successfully.` (if using `dev` and sync not skipped), then `Database synced (npm run dev auto-sync).`, then `Server running on port 3000` (or your `PORT`).

---

## 7. Test Google Login

The API expects a **Google ID token** in the body. You can get one in two ways.

### A. Test with a small HTML page (browser)

Create a file `test-google-login.html` in the project root (or run a simple static server). This page uses Google Sign-In to get an ID token and POST it to your API:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Google Login</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <h1>Test Google Login → CMS</h1>
  <div id="buttonDiv"></div>
  <pre id="result"></pre>

  <script>
    const API_URL = 'http://localhost:3000/auth/google-login';
    const resultEl = document.getElementById('result');

    function handleCredentialResponse(response) {
      const googleToken = response.credential;
      resultEl.textContent = 'Calling API...';

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken })
      })
        .then(r => r.json())
        .then(data => {
          resultEl.textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
          resultEl.textContent = 'Error: ' + err.message;
        });
    }

    window.onload = function () {
      google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: handleCredentialResponse
      });
      google.accounts.id.renderButton(document.getElementById('buttonDiv'), {
        type: 'standard', size: 'large'
      });
    };
  </script>
</body>
</html>
```

**Important:** Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID (same as in `.env`).

**Run it:**
- Add `http://localhost:5500` (or the port you use) to **Authorized JavaScript origins** in Google Cloud Console if you use a local server.
- Serve the file, e.g. with VS Code Live Server, or:  
  `npx serve -l 5500`  
  Then open `http://localhost:5500/test-google-login.html`, click “Sign in with Google”, and check the JSON response (token, tenant_id, client_id).

### B. Test with Postman/curl (using a token from elsewhere)

If you already have a Google ID token (e.g. from another frontend):

```bash
curl -X POST http://localhost:3000/auth/google-login -H "Content-Type: application/json" -d "{\"googleToken\": \"PASTE_ID_TOKEN_HERE\"}"
```

---

## Troubleshooting

### "Access blocked: Authorization Error" / "doesn't comply with OAuth 2.0 policy" / Error 400: invalid_request

This means Google is blocking sign-in for your app. Do **all** of the following:

1. **Add your Google account as a Test user** (app must be in Testing mode for dev):
   - [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **OAuth consent screen**.
   - Under **Test users**, click **+ ADD USERS**.
   - Add the exact Google account you use to sign in (e.g. `aryan.btmtcs1232811@nfsu.ac.in`).
   - Save. Only listed test users can sign in while the app is in **Testing** mode.

2. **Use an HTTP origin, not file://**  
   Do not open `test-google-login.html` by double-clicking (that uses `file://`). Serve it over HTTP:
   - In the project folder run: `npx serve -l 5500`
   - Open **http://localhost:5500/test-google-login.html** in the browser.

3. **Add that origin in Google Cloud**:
   - **APIs & Services** → **Credentials** → open your **OAuth 2.0 Client ID** (Web application).
   - Under **Authorized JavaScript origins** add: `http://localhost:5500` (and `http://localhost:3000` if needed).
   - Save. Wait a minute and try again.

4. **Keep the app in Testing**  
   For development, leave **Publishing status** as **Testing**. Do not set to **In production** until you complete Google’s verification (required for any Google user to sign in).

---

| Problem | What to check |
|--------|----------------|
| `Database sync failed` / `ECONNREFUSED` | MySQL is running; `.env` DB_* values correct; try `127.0.0.1` for `DB_HOST`. |
| **Access blocked / 400 invalid_request** | Add your email as **Test user** on OAuth consent screen; use **http://localhost:5500** (not file://); add that origin to the OAuth client. |
| `Invalid or expired Google token` | Token from correct Google Client ID; token not expired; `GOOGLE_CLIENT_ID` in `.env` matches the one used by the client. |
| `Google Client ID is not configured` | Set `GOOGLE_CLIENT_ID` in `.env` and restart the server. |
| `JWT secret is not configured` | Set `JWT_SECRET` in `.env` (min 32 characters). |
| CORS errors in browser | In production set `CORS_ORIGIN`; for local dev the app allows all origins when `NODE_ENV !== 'production'`. |
| Port already in use | Change `PORT` in `.env` or stop the process using that port. |

---

## Quick checklist

- [ ] MySQL installed and running
- [ ] Database `securedapp_cms` created
- [ ] Google Cloud OAuth Web client created; Client ID copied
- [ ] `.env` filled (GOOGLE_CLIENT_ID, JWT_SECRET, DB_*)
- [ ] `npm install` and `npm run db:sync` run successfully
- [ ] `npm start` shows “Server running on port 3000”
- [ ] Test page or Postman: POST `googleToken` → get `token`, `tenant_id`, `client_id`
