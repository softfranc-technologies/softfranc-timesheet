# 🏢 SoftFranc Timesheet & Attendance System

A full-stack MERN web application for employee attendance tracking and timesheet management, built with Express, MongoDB, and React + Vite.

---

## 📁 Project Structure

```
softfranc/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point, Express app, DB connect
│   │   ├── models/
│   │   │   ├── User.js            # User schema (bcrypt, roles)
│   │   │   ├── AttendanceLog.js   # Punch in/out logs
│   │   │   └── Timesheet.js       # Weekly timesheets
│   │   ├── routes/
│   │   │   ├── auth.js            # Login, refresh, me, logout
│   │   │   ├── attendance.js      # Employee punch in/out, history, stats
│   │   │   ├── timesheets.js      # Employee timesheet CRUD + submit
│   │   │   ├── admin.js           # Admin dashboard, approve/reject, users
│   │   │   └── users.js           # Profile, password change
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verify + role guard
│   │   └── utils/
│   │       └── seed.js            # Creates admin + 4 sample employees
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx               # ReactDOM entry
    │   ├── App.jsx                # Router + ProtectedRoute
    │   ├── index.css              # Global CSS + design tokens
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Login state, token storage
    │   │   └── ThemeContext.jsx   # Dark/light mode
    │   ├── services/
    │   │   └── api.js             # Axios + refresh token interceptor
    │   ├── hooks/
    │   │   └── useToast.js        # Toast notification system
    │   ├── components/
    │   │   ├── Layout.jsx         # Sidebar nav + header
    │   │   ├── Layout.module.css
    │   │   ├── UI.jsx             # Button, Card, Table, Modal, Badge, etc.
    │   │   └── UI.module.css
    │   └── pages/
    │       ├── Login.jsx          # Login page
    │       ├── Login.module.css
    │       ├── EmployeeDashboard.jsx  # Clock widget, attendance, timesheets
    │       ├── AdminDashboard.jsx     # Stats, approval, employee management
    │       ├── Dashboard.module.css
    │       ├── Profile.jsx            # Profile info + password change
    │       └── Profile.module.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Getting Started From Scratch

### Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **npm** v8+
- A **MongoDB Atlas** account (free) → https://mongodb.com/cloud/atlas

---

## Step 1 — Set up MongoDB Atlas

1. Sign up at https://mongodb.com/cloud/atlas
2. Create a **Free M0 Cluster** (choose any region)
3. Under **Database Access**: click "Add New Database User"
   - Auth method: **Password**
   - Username: e.g. `softfranc_user`
   - Password: generate a secure password (save it!)
   - Built-in role: **Atlas admin**
4. Under **Network Access**: click "Add IP Address"
   - For development: choose "Allow Access from Anywhere" (`0.0.0.0/0`)
5. Go back to **Clusters** → click **Connect** → **Drivers**
   - Copy the connection string, which looks like:
     ```
     mongodb+srv://softfranc_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add the database name before `?`:
     ```
     mongodb+srv://softfranc_user:yourpassword@cluster0.xxxxx.mongodb.net/softfranc_timesheet?retryWrites=true&w=majority
     ```

---

## Step 2 — Backend Setup

```bash
# Navigate to backend folder
cd softfranc/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
```

Now **edit the `.env` file**:

```env
PORT=5000
MONGO_URI=mongodb+srv://softfranc_user:yourpassword@cluster0.xxxxx.mongodb.net/softfranc_timesheet?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here_min_32_chars
JWT_REFRESH_SECRET=another_different_long_random_string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

> 💡 For JWT secrets, you can generate them by running:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Run the Seed Script (creates users)

```bash
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing users
👤 Admin created: admin@softfranc.com
👤 Employee created: alice@softfranc.com
👤 Employee created: bob@softfranc.com
...
✅ Seed completed!
─────────────────────────────────────────
🔑 Admin Login:    admin@softfranc.com / admin123
🔑 Employee Login: alice@softfranc.com / emp123
```

### Start the Backend

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
📌 Environment: development
```

Test the API: http://localhost:5000/api/health

---

## Step 3 — Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd softfranc/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser.

---

## 🔑 Login Credentials

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Admin    | admin@softfranc.com      | admin123  |
| Employee | alice@softfranc.com      | emp123    |
| Employee | bob@softfranc.com        | emp123    |
| Employee | carol@softfranc.com      | emp123    |
| Employee | david@softfranc.com      | emp123    |

---

## ✨ Features

### Employee
- **Punch In / Punch Out** — one-click with live clock display
- **Attendance History** — paginated personal attendance log
- **Weekly Timesheets** — log hours per day with project + description
- **Submit for Approval** — draft → submitted → approved workflow
- **Profile Management** — update name, dept, position, password

### Admin
- **Dashboard Overview** — employee count, today's attendance, pending timesheets, monthly hours
- **All Attendance Logs** — view every employee's punch in/out across all dates
- **Timesheet Approval** — approve or reject submitted timesheets with reason
- **Employee Management** — add new employees, activate/deactivate accounts
- **Filtering** — filter timesheets by status (submitted/approved/rejected/draft)

### General
- **Dark/Light Mode** — persists per device
- **JWT Auth** — 15min access token + 7-day refresh token with auto-refresh
- **Role-based Routing** — admin and employee see completely separate dashboards
- **Toast Notifications** — success/error/warning feedback on all actions
- **Responsive Design** — works on mobile, tablet, and desktop

---

## 🛠️ API Endpoints Reference

### Auth
| Method | Endpoint            | Access   | Description         |
|--------|---------------------|----------|---------------------|
| POST   | /api/auth/login     | Public   | Returns JWT tokens  |
| POST   | /api/auth/refresh   | Public   | Refresh access token|
| GET    | /api/auth/me        | Any auth | Current user info   |
| POST   | /api/auth/logout    | Any auth | Logout              |

### Employee Attendance
| Method | Endpoint                    | Access   | Description           |
|--------|-----------------------------|----------|-----------------------|
| POST   | /api/attendance/punch-in    | Employee | Create today's log    |
| POST   | /api/attendance/punch-out   | Employee | Close today's log     |
| GET    | /api/attendance/today       | Employee | Today's punch status  |
| GET    | /api/attendance/history     | Employee | Personal history      |
| GET    | /api/attendance/stats       | Employee | Monthly stats         |

### Timesheets
| Method | Endpoint                     | Access   | Description           |
|--------|------------------------------|----------|-----------------------|
| GET    | /api/timesheets/me           | Employee | Own timesheets        |
| GET    | /api/timesheets/current      | Employee | Current week          |
| POST   | /api/timesheets              | Employee | Save/update draft     |
| POST   | /api/timesheets/:id/submit   | Employee | Submit for approval   |

### Admin
| Method | Endpoint                              | Access | Description            |
|--------|---------------------------------------|--------|------------------------|
| GET    | /api/admin/dashboard                  | Admin  | Overview stats         |
| GET    | /api/admin/attendance/all             | Admin  | All attendance logs    |
| GET    | /api/admin/timesheets                 | Admin  | All timesheets         |
| PUT    | /api/admin/timesheets/:id/approve     | Admin  | Approve timesheet      |
| PUT    | /api/admin/timesheets/:id/reject      | Admin  | Reject with reason     |
| GET    | /api/admin/users                      | Admin  | List employees         |
| POST   | /api/admin/users                      | Admin  | Create new employee    |
| PATCH  | /api/admin/users/:id/toggle-active    | Admin  | Activate/deactivate    |

---

## 🔧 Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Backend   | Node.js, Express.js           |
| Database  | MongoDB Atlas + Mongoose      |
| Auth      | JWT (access + refresh tokens) |
| Security  | bcryptjs, helmet, cors, zod   |
| Frontend  | React 18, Vite                |
| Routing   | React Router v6               |
| HTTP      | Axios (with interceptors)     |
| Styling   | CSS Modules                   |
| Icons     | Lucide React                  |
| Fonts     | Syne + DM Sans (Google Fonts) |

---

## 🐛 Common Issues

### "MongoDB connection failed"
- Check your `MONGO_URI` in `.env` is correct
- Make sure you replaced `<password>` with your actual Atlas password
- Confirm your IP is whitelisted in Atlas Network Access

### "Cannot GET /api/..."
- Make sure backend is running on port 5000
- The Vite proxy in `vite.config.js` forwards `/api` requests to `:5000`

### "Invalid credentials" on login
- Run `npm run seed` again to recreate users
- Use exact credentials: `admin@softfranc.com` / `admin123`

### Frontend shows blank/crashes
- Run `npm install` in the frontend directory
- Check browser console for errors
- Make sure both backend AND frontend are running simultaneously

---

## 📦 Build for Production

```bash
# Backend — runs directly with Node
cd backend
NODE_ENV=production node src/server.js

# Frontend — build static files
cd frontend
npm run build
# Output will be in frontend/dist/
# Deploy to Vercel, Netlify, or serve via Express
```

---

## 🙏 Credits

Built for **SoftFranc Technologies** — MERN Stack Timesheet & Attendance System v1.0
