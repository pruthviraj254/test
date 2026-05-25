# Admin API contract for the desktop auto-updater

The Electron app never talks to GitHub directly. It calls **your Admin API**, which decides whether an update is allowed and returns a direct download URL (typically a GitHub Release asset URL that you store in your DB).

---

## Endpoint

```
GET /update/check
```

### Query parameters (sent by the desktop app on every check)

| Param            | Type   | Example        | Description                                      |
|------------------|--------|----------------|--------------------------------------------------|
| `userId`         | string | UUID           | Persistent ID from `electron-store` on the client |
| `currentVersion` | string | `1.0.0`        | From `app.getVersion()` (package.json at build)  |
| `platform`       | string | `win32`        | Node `process.platform`                          |
| `channel`        | string | `stable`/`beta`| Update channel stored locally                    |

### Example request

```
GET https://your-admin-api.com/update/check?userId=abc-123&currentVersion=1.0.0&platform=win32&channel=stable
```

---

## Response shape

```json
{
  "hasUpdate": true,
  "version": "1.0.1",
  "url": "https://github.com/your-org/betauser-test/releases/download/v1.0.1/betauser-test-Setup-1.0.1-x64.exe",
  "releaseNotes": "- Bug fixes\n- Performance improvements",
  "mandatory": false,
  "action": "update"
}
```

| Field          | Type    | Description |
|----------------|---------|-------------|
| `hasUpdate`    | boolean | `true` if the user should be offered/downloaded an update |
| `version`      | string  | Target semver |
| `url`          | string  | **Direct download URL** to the NSIS `.exe` (GitHub Release asset URL is fine) |
| `releaseNotes` | string  | Shown in the update UI (supports `\n`) |
| `mandatory`    | boolean | If `true`, the app shows a blocking full-screen overlay |
| `action`       | enum    | `"update"` \| `"downgrade"` \| `"none"` |

---

## Backend decision logic (recommended)

```
1. Load user by userId
2. If user.pinnedVersion == currentVersion → return action:"none", hasUpdate:false
3. Resolve target version from channel:
     - stable → latest stable release in DB
     - beta   → latest beta release in DB
4. Compare semver(currentVersion, targetVersion):
     - equal        → action:"none", hasUpdate:false
     - current lower → action:"update", hasUpdate:true
     - current higher → action:"downgrade", hasUpdate:true  (force older build)
5. Set mandatory from user/channel/global policy
6. Set url to the NSIS installer URL for targetVersion (GitHub Releases asset URL)
7. Set releaseNotes from your release metadata
```

### Version pinning (suppress prompts)

Return this when the user is on their assigned version:

```json
{
  "hasUpdate": false,
  "version": "1.0.0",
  "url": "",
  "releaseNotes": "",
  "mandatory": false,
  "action": "none"
}
```

### Mandatory update

```json
{
  "hasUpdate": true,
  "version": "1.0.1",
  "url": "https://github.com/.../betauser-test-Setup-1.0.1-x64.exe",
  "releaseNotes": "Security patch — required for all users.",
  "mandatory": true,
  "action": "update"
}
```

### Downgrade (user on too-new build)

```json
{
  "hasUpdate": true,
  "version": "1.0.0",
  "url": "https://github.com/.../betauser-test-Setup-1.0.0-x64.exe",
  "releaseNotes": "Your account is pinned to v1.0.0.",
  "mandatory": true,
  "action": "downgrade"
}
```

---

## Database / admin panel fields (minimum)

| Entity / field        | Purpose |
|-----------------------|---------|
| `users.userId`        | Matches client `electron-store` UUID |
| `users.channel`       | Override channel: `stable` or `beta` (optional) |
| `users.pinnedVersion` | If set, suppress updates while on this version |
| `users.mandatory`     | Force mandatory flag for this user (optional) |
| `releases.version`    | Semver string |
| `releases.channel`    | `stable` or `beta` |
| `releases.platform`   | `win32` |
| `releases.downloadUrl`| Direct `.exe` URL (GitHub Release asset URL) |
| `releases.releaseNotes` | Markdown/plain text |
| `releases.isMandatory`| Channel-wide mandatory flag |

---

## GitHub Releases integration

CI uploads these files on each `v*` tag:

| File | Purpose |
|------|---------|
| `*.exe` | NSIS installer — put this URL in `response.url` |
| `stable.yml` | electron-updater metadata (optional; we use built-in `autoUpdater` + Admin API) |

After CI runs for tag `v1.0.1`, copy the `.exe` asset URL into your admin DB:

```
https://github.com/YOUR_ORG/betauser-test/releases/download/v1.0.1/betauser-test Setup 1.0.1 x64.exe
```

(GitHub URL-encodes spaces as `%20` — store the canonical browser download URL.)

---

## Environment variables

### Desktop app (build-time, baked into the installer)

| Variable | Example | Where |
|----------|---------|-------|
| `NEXT_PUBLIC_UPDATE_SERVER_URL` | `https://your-admin-api.com/update/check` | GitHub repo variable `UPDATE_SERVER_URL` in CI |

### CI / Forge (optional)

| Variable | Example | Purpose |
|----------|---------|---------|
| `UPDATE_SERVER_URL` | Same as above | Injected at build in GitHub Actions |
| `UPDATE_PUBLISH_URL` | `https://your-admin-api.com/update/feed` | NSIS `app-update.yml` feed (optional) |
| `UPDATE_CHANNEL` | `stable` | NSIS updater channel name |

---

## Local / staging test API (minimal Express example)

```javascript
app.get('/update/check', (req, res) => {
  const { userId, currentVersion, platform, channel } = req.query;

  // Pinned user — no prompts
  if (userId === 'pinned-user-id') {
    return res.json({
      hasUpdate: false,
      version: currentVersion,
      url: '',
      releaseNotes: '',
      mandatory: false,
      action: 'none',
    });
  }

  const latest = channel === 'beta' ? '1.0.2-beta.1' : '1.0.1';
  if (currentVersion === latest) {
    return res.json({
      hasUpdate: false,
      version: latest,
      url: '',
      releaseNotes: '',
      mandatory: false,
      action: 'none',
    });
  }

  res.json({
    hasUpdate: true,
    version: latest,
    url: 'https://github.com/YOUR_ORG/betauser-test/releases/download/v1.0.1/betauser-test-Setup-1.0.1-x64.exe',
    releaseNotes: 'Test release from staging API',
    mandatory: req.query.userId === 'mandatory-user-id',
    action: semver.lt(currentVersion, latest) ? 'update' : 'downgrade',
  });
});
```

---

## Error handling

The desktop app **never crashes** on update failures. If your API is down or returns invalid JSON, the check is logged and skipped silently. Return `4xx/5xx` only when you intentionally want the client to skip (it treats errors as "no update").
