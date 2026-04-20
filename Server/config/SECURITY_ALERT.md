# URGENT: Firebase Credentials Security Issue

## ⚠️ CRITICAL ACTION REQUIRED

The Firebase service account JSON file in this directory has been committed to the repository.

### Immediate Steps:

1. **Delete the JSON file from this directory**
   ```bash
   rm config/gharbazar-te-firebase-adminsdk-fbsvc-6b0272762b.json
   ```

2. **Rotate Firebase credentials immediately**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Delete the compromised service account key
   - Generate a new private key

3. **Set up environment variables instead**
   
   Add to `.env` file:
   ```
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
   ```

4. **Remove from git history**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch config/gharbazar-te-firebase-adminsdk-fbsvc-6b0272762b.json" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

5. **Verify settings.py is already configured**
   The code in `server/settings.py` already supports environment variables.

## Status
- [x] .gitignore created
- [ ] JSON file deleted
- [ ] Firebase credentials rotated
- [ ] Environment variables configured
- [ ] Git history cleaned
