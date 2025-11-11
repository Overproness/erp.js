# 🚀 Automated Version Deployment Tracking

## Overview
This system automatically increments the application version on every push to `main` and displays it in the Settings page, allowing you to verify successful deployments.

## How It Works

### 1. **Automatic Version Bumping** (GitHub Actions)
When you push to `main`:
- ✅ The workflow checks out the code
- ✅ Runs `npm version patch` to bump the version (e.g., 4.1.0 → 4.1.1)
- ✅ Syncs the version across both frontend and backend `package.json`
- ✅ Commits and pushes the version bump back to the repo
- ✅ Creates a `version.json` file with build metadata
- ✅ Deploys the application to your VPS

### 2. **Version Metadata**
The `version.json` file contains:
```json
{
  "version": "4.1.1",
  "commit": "abc123def456...",
  "buildDate": "2025-11-11T10:30:45Z",
  "branch": "main"
}
```

### 3. **Backend API Endpoint**
- **Endpoint:** `GET /api/version`
- **Access:** Public (no authentication required)
- **Response:**
```json
{
  "success": true,
  "result": {
    "version": "4.1.1",
    "name": "erp-crm",
    "commit": "abc123def456",
    "buildDate": "2025-11-11T10:30:45Z",
    "branch": "main",
    "environment": "production",
    "nodeVersion": "v20.9.0"
  }
}
```

### 4. **Frontend Display**
- **Location:** Settings → General Settings (top of the page)
- **Shows:** Version number, commit hash, build date, branch, and environment
- **Auto-updates:** Fetches latest version info when you visit the Settings page

## Verification Workflow

### Local Development
1. Check your local version:
   ```bash
   cat frontend/package.json | grep version
   # Output: "version": "4.1.0"
   ```

### After Pushing to GitHub
2. Wait for GitHub Actions to complete (~2-5 minutes)
3. Open https://erp.quickmation.com
4. Navigate to: **Settings → General Settings**
5. Check the version card at the top
6. Version should be incremented (e.g., 4.1.1)

### Quick Verification
Compare versions:
- **Local:** Check `package.json`
- **Deployed:** Visit Settings page or call `https://erp.quickmation.com/api/version`

## Files Modified

### GitHub Actions Workflow
- `.github/workflows/deploy.yml` - Auto-bumps version and creates metadata

### Backend
- `backend/src/routes/versionRoutes.js` - New route handler
- `backend/src/app.js` - Registered version route
- `backend/public/version.json` - Build metadata (created during deployment)

### Frontend
- `frontend/src/components/VersionInfo/VersionInfo.jsx` - Display component
- `frontend/src/components/VersionInfo/index.jsx` - Export
- `frontend/src/pages/Settings/GeneralSettings.jsx` - Integrated version display
- `frontend/dist/version.json` - Build metadata (created during deployment)

## Version Format

Follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (manual)
- **MINOR:** New features (manual)
- **PATCH:** Bug fixes & updates (automatic on each push)

Current: **v4.1.0** → Auto-increments to **v4.1.1**, **v4.1.2**, etc.

## Manual Version Changes

If you need to bump MAJOR or MINOR versions manually:

```bash
# For new features (4.1.0 → 4.2.0)
cd frontend
npm version minor

# For breaking changes (4.1.0 → 5.0.0)
cd frontend
npm version major

# Sync to backend
cd ../backend
npm version <new-version> --no-git-tag-version

# Commit and push
git add .
git commit -m "chore: bump version to <new-version>"
git push
```

## Troubleshooting

### Version not updating?
1. Check GitHub Actions workflow status
2. Ensure the workflow completed successfully
3. Check for `[skip ci]` in commit messages (these skip the workflow)
4. Hard refresh the Settings page (Ctrl+F5)

### Different versions on local vs deployed?
- This is expected! Local is your development version
- Deployed version should always be higher after a successful push

### API endpoint not working?
- Check backend logs: `pm2 logs backend`
- Verify `version.json` exists: `ls -la backend/public/`
- Test endpoint: `curl https://erp.quickmation.com/api/version`

## Benefits

✅ **No manual version updates** - Fully automated
✅ **Deployment verification** - Visual confirmation in UI
✅ **Build traceability** - Git commit SHA for each build
✅ **Environment awareness** - See if you're on production/dev
✅ **Debugging aid** - Know exactly which code is deployed

---

**Next Deploy:** The version will auto-increment from **v4.1.0 → v4.1.1**
