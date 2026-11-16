# deeplinks module

**Adds:** Universal Links (`apple-app-site-association`) and Android App Links (`assetlinks.json`) templates. Both files are hosted on **your** domain over HTTPS with no redirects.
**Files touched:** host `apple-app-site-association` at `https://<domain>/.well-known/apple-app-site-association` (no extension, `application/json`) and `assetlinks.json` at `https://<domain>/.well-known/assetlinks.json`. iOS: add the Associated Domains capability `applinks:<domain>`. Android: add `<intent-filter android:autoVerify="true">` with `<data android:scheme="https" android:host="<domain>"/>` to the target activity.
**Fill in:** replace `TEAMID.BUNDLEID`, `PACKAGE` and the SHA-256 of the **Play App Signing** certificate (Play Console → App integrity), not only the upload key.
**Verify:**
```bash
curl -sI https://<domain>/.well-known/apple-app-site-association | head -1   # 200, application/json
curl -s  https://<domain>/.well-known/assetlinks.json | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('valid json')"
adb shell pm get-app-links PACKAGE                                           # state: verified
xcrun simctl openurl booted https://<domain>/item/1                          # opens the app
```
Handle a missing link target (open home, show a message) and never trust link parameters.
**Declarations it changes:** none for privacy; the associated domain must be one you control.
**Test:** `check-skill.mjs` parses both templates as JSON and asserts the placeholders are present.
