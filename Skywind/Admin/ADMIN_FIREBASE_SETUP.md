# SKYWIND ADMIN – Firebase Setup Guide

## Files delivered

| New file                | Replaces PHP file       | Purpose                              |
|-------------------------|-------------------------|--------------------------------------|
| `firebase-admin.js`     | `db.php` + all PHP logic| Shared Firebase init, auth, DB calls |
| `main.html`             | `main.php`              | Admin login                          |
| `adminregister.html`    | `adminregister.php`     | Admin registration                   |
| `home.html`             | `home.php`              | Dashboard home                       |
| `personal.html`         | `personal.php`          | Admin profile page                   |
| `request.html`          | `request.php`           | View / accept / reject bookings      |
| `schedule.html`         | `schedule.php`          | View / complete scheduled jobs       |
| `logout.html`           | `logout.php`            | Sign out + redirect                  |

CSS files (`main1.css`, `home.css`, `personal.css`, `request.css`,
`schedule.css`, `adminregister.css`, `logout.css`) are **unchanged** — copy
them as-is.

---

## Step 1 – Firebase project (if not already done)

Same project as the userside Firebase setup:
- Firebase Console → Realtime Database → already created ✓
- Enable **Authentication** → Sign-in method → **Email/Password** → Enable

---

## Step 2 – Fill in credentials

Open `firebase-admin.js` and replace all `YOUR_...` placeholders with your
real Firebase config (same values as `firebase-config.js` on the userside).

---

## Step 3 – Realtime Database structure

```
skywind-db/
├── users/                        ← admin accounts
│   └── <firebase-uid>/
│       ├── name
│       ├── email
│       ├── address
│       ├── contact
│       ├── role: "admin"
│       └── created_at
│
├── bookings/                     ← pending requests (written by userside)
│   └── <auto-id>/
│       ├── name, email, contact, address
│       ├── service, units, aircontype
│       ├── date_time             ("YYYY-MM-DD HH:mm")
│       ├── note
│       ├── status: "pending"
│       └── created_at
│
└── schedules/                    ← accepted appointments
    └── <auto-id>/
        ├── (all booking fields)
        ├── status: "scheduled"
        └── accepted_at
```

---

## Step 4 – Firebase Realtime Database Rules

Paste these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "bookings": {
      ".read":  "auth !== null",
      ".write": true
    },
    "schedules": {
      ".read":  "auth !== null",
      ".write": "auth !== null"
    }
  }
}
```

**Explanation:**
- `bookings` write is open — the public userside needs to write bookings
  without logging in.
- `bookings` read and all `schedules` read/write require an authenticated
  admin.
- `users` profiles are private — each admin can only read/write their own.

---

## Step 5 – Deploy to Firebase Hosting

Put all admin files in a subfolder, e.g. `/admin/`:

```
public/
├── (userside files: index.html, booking.html, etc.)
└── admin/
    ├── firebase-admin.js
    ├── main.html
    ├── adminregister.html
    ├── home.html
    ├── personal.html
    ├── request.html
    ├── schedule.html
    ├── logout.html
    ├── main1.css
    ├── home.css
    ├── personal.css
    ├── request.css
    ├── schedule.css
    ├── adminregister.css
    ├── logout.css
    └── logo.png
```

```bash
firebase deploy --only hosting
```

---

## Note on SMS (iProgSMS)

The SMS function in `firebase-admin.js` makes a browser-to-API call.
If the iProgSMS API does not send a CORS header, the browser will block it.

**Fix:** Create a Firebase Cloud Function as a thin proxy:

```js
// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.sendSMS = functions.https.onCall(async (data) => {
  const body = new URLSearchParams({
    api_token:    "328597cd7ac503e191434f418d6e4ea35c541cbc",
    message:      data.message,
    phone_number: data.phone_number,
  });
  const res = await fetch("https://www.iprogsms.com/api/v1/sms_messages", {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return { ok: res.ok, text: await res.text() };
});
```

Then update `sendSMS()` in `firebase-admin.js` to call this Cloud Function
using the Firebase `httpsCallable` SDK instead of `fetch`.

---

## Files you can DELETE (no longer needed)

`db.php`, `config.php`, `fix_login.php`, `adminregister.php`, `home.php`,
`personal.php`, `request.php`, `schedule.php`, `logout.php`, `main.php`
