# Push to GitHub (private repo)

The project is committed locally. To push to a **private** repo named `securedapp_cms`:

## 1. Create the repo on GitHub

1. Go to [https://github.com/new](https://github.com/new).
2. **Repository name:** `securedapp_cms`
3. Set visibility to **Private**.
4. Do **not** add a README, .gitignore, or license (we already have them).
5. Click **Create repository**.

## 2. Add remote and push

From the project root (`securedapp_cms`), run (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/securedapp_cms.git
git branch -M main
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/securedapp_cms.git
git push -u origin main
```

## 3. Verify

- `.env` is **not** in the repo (it’s in `.gitignore`).
- Only `.env.example` (placeholders) is committed.
- No secrets or random files are pushed.

You can delete this file after a successful push if you like.
