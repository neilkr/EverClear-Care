# EverClear-Care — Elderly Alert & Daily Schedule App
### Created for the Congressional App Challenge (U.S. House of Representatives)

**EverClear-Care** is an accessible, senior-first daily scheduling and automated caregiver alert application designed to support senior citizens (65+) in living independently while keeping family members and caregivers informed and connected in real time.

---

## 🌟 Key Features

### 👵 Senior Citizen View (Accessible & Intuitive)
- **High-Contrast & Large Font Mode**: Extra-large touch targets (minimum 48px), readable fonts, and a 1-click "Senior Large Text" accessibility toggle in the navigation bar.
- **Visual & Audio Reminders**:
  - Voice announcements (using text-to-speech) and pleasant audio chime reminders when a task (such as a morning walk or medication) is due.
  - "🔊 Read Today's Schedule" button reads the full routine aloud.
- **One-Touch Completion**: Huge "✅ I Did This!" buttons to easily mark activities completed with zero hassle.
- **Caregiver Contact & Emergency SOS**:
  - Direct 1-tap "📞 Call Caregiver" (`tel:`) and "💬 Text Caregiver".
  - "🚨 Emergency Help Alert" button instantly dispatches an urgent priority alert to all linked caregivers.
  - "👋 Send Check-in" button sends a reassuring "I'm doing well" notification.
- **Quick Routine Presets**: 1-click buttons to add common routines like *Morning Walk (8:00 AM)*, *Morning Medication (9:00 AM)*, *Lunch (12:30 PM)*, *Hydration (3:00 PM)*, *Evening Walk (5:30 PM)*, and *Evening Meds (8:30 PM)*.

### 🩺 Caregiver Dashboard (Real-Time Monitoring & Alerts)
- **Instant Connection**: Links securely to the senior citizen via an easy 8-character invite code.
- **Real-Time Alert Feed**:
  - Automatic alerts triggered if a senior misses their routine beyond the grace period (e.g. *“⚠️ Schedule Missed: Grandma Eleanor did not confirm 'Morning walk' (due at 8:00 AM)”*).
  - Emergency SOS alerts and check-in notifications with audible chime alerts.
  - Quick action to directly call or message the senior from any alert.
- **Schedule Management**: Caregivers can view today's live completion progress and add or adjust routines for their senior loved ones directly.

---

## 🛠️ Project Structure

- `client/` — Modern React front end built with Vite, React Router, speech synthesis, Web Audio API chime generator, and responsive senior-friendly styling.
- `server/` — Node.js & Express API with a local SQLite database (JWT auth, bcrypt password hashing, input validation, rate-limited login, and automated cron task scheduler).
- `desktop/` — Electron shell that packages the client and server into a standalone cross-platform desktop application.

---

## 🚀 Getting Started & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ LTS recommended).

### 1. Server Setup

```powershell
cd server
copy .env.example .env
npm install
npm start
```
The server will start on `http://localhost:4000`.

### 2. Client Setup

In a separate terminal:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Desktop App Setup (Optional)

```powershell
cd client
npm run build

cd ../desktop
npm install
npm start
```

---

## 🎬 Testing & Demoing for the Congressional App Challenge

1. **Register a Senior Account**:
   - Go to `/register`, select **Senior Citizen (65+)**, enter a name (e.g., *Grandma Eleanor*), and phone number.
   - Note the **8-character Connection Code** on the screen.
   - Add a task scheduled for 1–2 minutes from now (e.g. *Morning Walk*).

2. **Register a Caregiver Account**:
   - In another browser tab or private window, register as **Caregiver / Family** (e.g., *John Doe*).
   - Enter the senior's invite code and click **Connect Senior**.

3. **Verify Reminders & Alerts**:
   - When the scheduled time arrives, the senior view sounds a chime and speaks the voice reminder.
   - Click **"✅ I Did This!"** on the senior screen to see it instantly mark complete on both dashboards.
   - Test the **"🚨 Emergency Help Alert"** or **"🧪 Test Alert (Demo)"** button to see real-time alerts appear in the caregiver alert feed!
