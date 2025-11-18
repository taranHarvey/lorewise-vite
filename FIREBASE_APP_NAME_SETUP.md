# How to Change Firebase App Name in Google Sign-In

The Google sign-in page shows "lorewise-89533.firebaseapp.com" because that's your Firebase project's default domain. To change it to just "Lorewise", you need to update the OAuth consent screen in Firebase Console.

## Steps to Change App Name

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/project/lorewise-89533/authentication/settings

### 2. Navigate to OAuth Consent Screen
- Click on **"Authentication"** in the left sidebar
- Click on **"Settings"** tab
- Scroll down to **"Authorized domains"** section
- Look for **"OAuth consent screen"** link (or go directly to Google Cloud Console)

### 3. Update App Name in Google Cloud Console
1. Click **"OAuth consent screen"** link (this opens Google Cloud Console)
2. Or go directly to: https://console.cloud.google.com/apis/credentials/consent?project=lorewise-89533

3. In the **"App name"** field, change from:
   - Current: `lorewise-89533.firebaseapp.com`
   - To: `Lorewise`

4. Optionally update:
   - **User support email**: Your email
   - **App logo**: Upload a logo (optional)
   - **Application home page**: `https://lorewise-89533.web.app`
   - **Privacy policy link**: Add if you have one
   - **Terms of service link**: Add if you have one

5. Click **"Save and Continue"**

### 4. Verify Changes
After saving, when users sign in with Google, they should see:
- **"Choose an account"** 
- **"to continue to Lorewise"** (instead of the Firebase domain)

---

## Alternative: Custom Domain (Advanced)

If you want even more control, you can:
1. Set up a custom domain in Firebase Hosting
2. Update the OAuth consent screen to use your custom domain
3. This gives you full branding control

---

## Note
- Changes may take a few minutes to propagate
- Users may need to clear browser cache to see the new name
- The change affects all users signing in with Google

