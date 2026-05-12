// ─────────────────────────────────────────────────────────────────────────────
// Firebase Realtime Database – Booking Calendar
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  REPLACE the firebaseConfig values below with your own project's config.
//     Firebase Console → Project Settings → Your apps → SDK setup & config
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }             from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, get, child }
                                     from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";



// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDs84WMvaBXNSpBR6q9sawhUupiJAydatQ",
  authDomain: "skywind-24814.firebaseapp.com",
  databaseURL: "https://skywind-24814-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skywind-24814",
  storageBucket: "skywind-24814.firebasestorage.app",
  messagingSenderId: "480721783076",
  appId: "1:480721783076:web:d0072b88309a9376118bb1",
  measurementId: "G-VWGT1FD4WK"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── 2. CONSTANTS ─────────────────────────────────────────────────────────────
const SERVICE_DURATION = 90;   // minutes
const BUSINESS_START   = 6;    // 06:00
const BUSINESS_END     = 18;   // 18:00  (last slot starts at 16:30)

let bookedAppointments = [];   // array of ISO date-time strings from DB

// ── 3. DATE-TIME PICKER SETUP ────────────────────────────────────────────────
function initializeDateTimePicker() {
    const input = document.getElementById('appointment-datetime');
    if (!input) return;

    const now = new Date();

    // Minimum: today at 06:00
    const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), BUSINESS_START, 0);
    input.min = toLocalDateTimeString(minDate);

    // Maximum: one year from today at 16:30
    const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 16, 30);
    input.max = toLocalDateTimeString(maxDate);

    input.addEventListener('change', () => validateSelection(input));
}

// "YYYY-MM-DDTHH:mm" format required by datetime-local inputs
function toLocalDateTimeString(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function validateSelection(input) {
    if (!input.value) return;

    const selected = new Date(input.value);
    const h = selected.getHours();
    const m = selected.getMinutes();

    if (h < BUSINESS_START || h > 16 || (h === 16 && m > 30)) {
        alert('Please select a time between 6:00 AM and 4:30 PM.\n(Last slot starts at 4:30 PM to finish by 6:00 PM.)');
        input.value = '';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDay = new Date(selected);
    selDay.setHours(0, 0, 0, 0);
    if (selDay < today) {
        alert('Please select a future date.');
        input.value = '';
        return;
    }

    if (!isTimeSlotAvailable(input.value)) {
        alert('This time slot is already booked. Please choose another time.');
        input.value = '';
    }
}

// ── 4. CONFLICT CHECK ─────────────────────────────────────────────────────────
function isTimeSlotAvailable(selectedDateTimeStr) {
    const selectedStart = new Date(selectedDateTimeStr);
    const selectedEnd   = new Date(selectedStart.getTime() + SERVICE_DURATION * 60000);

    for (const bookedStr of bookedAppointments) {
        const bookedStart = new Date(bookedStr);
        const bookedEnd   = new Date(bookedStart.getTime() + SERVICE_DURATION * 60000);

        if (selectedStart < bookedEnd && selectedEnd > bookedStart) {
            return false;
        }
    }
    return true;
}

// ── 5. LOAD EXISTING BOOKINGS FROM FIREBASE ───────────────────────────────────
async function loadBookedAppointments() {
    try {
        const snapshot = await get(child(ref(db), 'bookings'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Extract just the date_time value from each booking record
            bookedAppointments = Object.values(data)
                .map(b => b.date_time)
                .filter(Boolean);
        } else {
            bookedAppointments = [];
        }
    } catch (error) {
        console.warn('Could not load bookings from Firebase:', error.message);
        bookedAppointments = [];
    } finally {
        initializeDateTimePicker();
    }
}

// ── 6. SAVE NEW BOOKING TO FIREBASE ──────────────────────────────────────────
async function saveBooking(formData) {
    const bookingsRef = ref(db, 'bookings');
    await push(bookingsRef, {
        ...formData,
        submitted_at: new Date().toISOString()
    });
}

// ── 7. MODAL HELPERS ──────────────────────────────────────────────────────────
function showSuccessModal() {
    document.getElementById('successModal').classList.add('show');
}

// closeModal is called from inline onclick in the HTML, so attach to window
window.closeModal = function () {
    document.getElementById('successModal').classList.remove('show');
};

// ── 8. FORM SUBMISSION ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Close modal on backdrop click
    document.getElementById('successModal').addEventListener('click', e => {
        if (e.target.id === 'successModal') window.closeModal();
    });

    document.getElementById('booking-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            name      : document.getElementById('name').value.trim(),
            email     : document.getElementById('email').value.trim(),
            contact   : document.getElementById('contact').value.trim(),
            address   : document.getElementById('address').value.trim(),
            service   : document.getElementById('service').value,
            units     : document.getElementById('units').value,
            aircontype: document.getElementById('aircontype').value,
            date_time : document.getElementById('appointment-datetime').value,
            note      : document.getElementById('note').value.trim()
        };

        // Required fields
        if (!formData.name || !formData.email || !formData.contact || !formData.address) {
            alert('Please complete all required fields.');
            return;
        }
        if (!formData.service) {
            alert('Please select a service.');
            return;
        }
        if (!formData.aircontype) {
            alert('Please select an aircon type.');
            return;
        }
        if (!formData.date_time) {
            alert('Please select an appointment date and time.');
            return;
        }

        // Business hours validation
        const selected = new Date(formData.date_time);
        const h = selected.getHours();
        const m = selected.getMinutes();

        if (h < BUSINESS_START) {
            alert('Appointments must start at 6:00 AM or later.');
            return;
        }
        if (h > 16 || (h === 16 && m > 30)) {
            alert('Last appointment slot is 4:30 PM (service ends by 6:00 PM).');
            return;
        }

        const endTime = new Date(selected.getTime() + SERVICE_DURATION * 60000);
        if (endTime.getHours() > BUSINESS_END || (endTime.getHours() === BUSINESS_END && endTime.getMinutes() > 0)) {
            alert('This slot runs past 6:00 PM. Please pick an earlier time.');
            return;
        }

        // Conflict check against live bookings
        if (!isTimeSlotAvailable(formData.date_time)) {
            alert('This time slot is already booked. Please choose a different time.');
            return;
        }

        // Disable submit while saving
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        try {
            await saveBooking(formData);
            showSuccessModal();
            this.reset();
            await loadBookedAppointments(); // refresh conflict list
        } catch (error) {
            alert('Failed to save booking: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    });

    // Load existing bookings and set up the date picker
    loadBookedAppointments();
});