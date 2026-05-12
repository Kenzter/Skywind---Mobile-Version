# SKYWIND – Firebase Setup Guide

## Files you received
| File | Purpose |
|---|---|
| `firebase-config.js` | Initializes the Firebase app & exports the DB instance |
| `booking-calendar.js` | Replaces the old PHP-dependent version; reads/writes Firebase |

---

## Step 1 – Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `skywind-db`) → Create
3. On the left sidebar → **Realtime Database** → **Create database**
4. Choose your region (e.g. `asia-southeast1` for Philippines)
5. Start in **Test mode** (you can add security rules later)

---

## Step 2 – Get your Firebase credentials
1. Firebase Console → ⚙️ Project Settings → **Your apps** tab
2. Click **</>** (Web) → Register app → name it (e.g. `skywind-web`)
3. Copy the `firebaseConfig` object shown

---

## Step 3 – Fill in firebase-config.js
Open `firebase-config.js` and replace every `YOUR_...` placeholder:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "skywind-db.firebaseapp.com",
  databaseURL:       "https://skywind-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "skywind-db",
  storageBucket:     "skywind-db.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

> ⚠️ The `databaseURL` must match your region exactly — copy it from the
> Realtime Database dashboard, not from the config snippet.

---

## Step 4 – Update booking.html (one change only)
The JS files now use ES Modules (`import`/`export`).
Find the `<script>` tag in `booking.html` and change it from:

```html
<script src="booking-calendar.js" defer></script>
```

to:

```html
<script type="module" src="booking-calendar.js"></script>
```

That's the **only** change needed in any HTML file.

---

## Step 5 – Deploy to Firebase Hosting (recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting       # set public dir to your project folder
firebase deploy
```

Or deploy to any static host (Netlify, GitHub Pages, etc.) — it's all
client-side now, no PHP server needed.

---

## Firebase Realtime Database Structure
Each booking is stored under `/bookings/<auto-id>`:

```json
{
  "bookings": {
    "-Nxyz123": {
      "name":       "Juan dela Cruz",
      "email":      "juan@email.com",
      "contact":    "09269055430",
      "address":    "Manila",
      "service":    "Aircon Cleaning",
      "units":      "1",
      "aircontype": "Split Type",
      "date_time":  "2025-06-15 09:00",
      "note":       "",
      "created_at": "2025-06-10T08:00:00.000Z",
      "status":     "pending"
    }
  }
}
```

You can view, edit, and export all bookings from the Firebase Console →
Realtime Database → Data tab.

---

## Security Rules (set after testing)
In Firebase Console → Realtime Database → **Rules**, paste:

```json
{
  "rules": {
    "bookings": {
      ".read": false,
      ".write": true
    }
  }
}
```

This allows anyone to **write** (book) but not **read** others' bookings
from the browser. For an admin dashboard, set up Firebase Authentication
and scope `.read` to authenticated users only.
