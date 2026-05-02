# 🎓 UniEvents — University Event Management System

A full-stack web application for managing university events end-to-end. Students can browse and register for campus events, organizers can create and manage events with QR-based check-in, and administrators have a bird's-eye view of the entire platform.

---

## ✨ Features

### 👩‍🎓 Students
- Browse and search events by category (Technical, Cultural, Academic, Sports, Workshop)
- Register for events with capacity enforcement
- Receive unique QR codes for registered events
- View personal registration history
- Submit post-event feedback with multi-dimensional ratings

### 🎤 Organizers
- Create events with rich details (guest speakers, prerequisites, tags, contact info)
- Track registrations in real time
- Scan attendee QR codes for check-in
- View event analytics and feedback summaries
- Export attendee data

### 🛡️ Administrators
- Approve / reject / cancel events submitted by organizers
- Manage all users (view, toggle active status, promote/demote roles)
- Platform-wide statistics dashboard (total users, events, registrations, organizers)
- Export events, registrations, and user lists
- Default admin account auto-seeded on first launch

### 🔄 Real-Time
- Live active-user count via Socket.IO

---

## 🏗️ Architecture

The project is composed of **two tiers** that communicate over a REST API:

```
┌─────────────────────────────────────┐
│          Frontend (React 19)        │
│  React Router · Framer Motion       │
│  Axios · Recharts · Socket.IO       │
│  QR Code generation & scanning      │
├─────────────────────────────────────┤
│          Backend (Express 4)        │
│  Mongoose ODM · JWT Auth            │
│  bcryptjs · express-validator       │
│  qrcode · Socket.IO                 │
├─────────────────────────────────────┤
│          MongoDB Database           │
└─────────────────────────────────────┘
```

There is also a **static HTML/CSS/JS version** in the project root (`index.html`, `login.html`, `register.html`, `admin.html`, `app.js`, `style.css`) that provides a lightweight standalone interface.

---

## 📁 Project Structure

```
university-event-management-system/
│
├── index.html                 # Static landing page
├── login.html                 # Static login page
├── register.html              # Static registration page
├── admin.html                 # Static admin dashboard
├── app.js                     # Client-side JS for static pages
├── style.css                  # Shared stylesheet for static pages
│
├── backend/
│   ├── server.js              # Express app entry point + Socket.IO setup
│   ├── package.json
│   ├── .env.example           # Environment variable template
│   ├── config/
│   │   └── db.js              # MongoDB connection helper
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── User.js            # User schema (admin / organizer / student)
│   │   ├── Event.js           # Event schema with virtuals
│   │   ├── Registration.js    # Registration schema with QR data
│   │   └── Feedback.js        # Multi-rating feedback schema
│   ├── routes/
│   │   ├── auth.js            # POST /register, POST /login
│   │   ├── events.js          # CRUD + approval workflow
│   │   ├── registrations.js   # Register, cancel, check-in, feedback
│   │   └── admin.js           # Admin-only stats & user management
│   └── utils/
│       └── eventPayload.js    # Shared response formatter
│
└── frontend/
    ├── package.json
    ├── public/                # CRA public assets
    └── src/
        ├── index.js           # React DOM entry
        ├── App.js             # Router + PrivateRoute guards
        ├── App.css
        ├── index.css
        ├── lib/
        │   └── api.js         # Axios instance with base URL
        └── pages/
            ├── Landing.jsx           # Public landing page
            ├── Login.jsx             # Login form
            ├── Register.jsx          # Student / Organizer registration
            ├── AdminSecretRegister.jsx  # Secret admin registration
            ├── StudentDashboard.jsx  # Student event browsing & registrations
            ├── OrganizerDashboard.jsx # Event management & QR check-in
            └── AdminDashboard.jsx    # Platform administration
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                                              |
|-------------|-------------------------------------------------------------------------|
| Frontend    | React 19, React Router 7, Framer Motion, Recharts, Axios, Socket.IO Client |
| QR          | `qrcode.react` (generation), `html5-qrcode` / `@zxing/library` (scanning) |
| Backend     | Node.js, Express 4, Socket.IO                                          |
| Database    | MongoDB with Mongoose 7 ODM                                            |
| Auth        | JSON Web Tokens (JWT), bcryptjs password hashing                       |
| Validation  | express-validator                                                       |
| Styling     | Vanilla CSS                                                             |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local install or cloud — e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** (ships with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Rajat77a/university-event-management-system.git
cd university-event-management-system
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unievents
JWT_SECRET=replace-with-a-strong-secret
ADMIN_EMAIL=admin@unievents.com
ADMIN_PASSWORD=Admin@123
ADMIN_REGISTRATION_SECRET=UNIEVENTS_ADMIN_2026
```

| Variable                     | Description                                           |
|------------------------------|-------------------------------------------------------|
| `PORT`                       | Backend server port (default `5000`)                  |
| `MONGODB_URI`                | MongoDB connection string                             |
| `JWT_SECRET`                 | Secret key used to sign JWTs                          |
| `ADMIN_EMAIL`                | Email for the auto-seeded default admin account       |
| `ADMIN_PASSWORD`             | Password for the default admin account                |
| `ADMIN_REGISTRATION_SECRET`  | Secret code required for admin self-registration      |

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the Application

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # starts Express with --watch for hot reload
```

```bash
# Terminal 2 — Frontend
cd frontend
npm start            # starts React dev server on port 3000
```

The React app will open at **http://localhost:3000** and proxy API requests to the backend at **http://localhost:5000**.

### 5. Default Admin Login

On first startup the backend auto-creates an admin account using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file. Log in with those credentials and select the **Administrator** role.

---

## 🔌 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint    | Description              | Auth |
|--------|-------------|--------------------------|------|
| POST   | `/register` | Create a new account     | ✗    |
| POST   | `/login`    | Authenticate & get JWT   | ✗    |

### Events — `/api/events`

| Method | Endpoint            | Description                        | Auth       |
|--------|---------------------|------------------------------------|------------|
| GET    | `/`                 | List all published events          | ✗          |
| GET    | `/:id`              | Get event details                  | ✗          |
| POST   | `/`                 | Create a new event                 | Organizer  |
| PUT    | `/:id`              | Update an event                    | Organizer  |
| DELETE | `/:id`              | Delete an event                    | Organizer  |
| PATCH  | `/:id/approve`      | Approve a pending event            | Admin      |
| PATCH  | `/:id/reject`       | Reject a pending event             | Admin      |
| PATCH  | `/:id/cancel`       | Cancel an event                    | Admin      |

### Registrations — `/api/registrations`

| Method | Endpoint              | Description                        | Auth      |
|--------|-----------------------|------------------------------------|-----------|
| POST   | `/`                   | Register for an event              | Student   |
| GET    | `/my`                 | Get current user's registrations   | Student   |
| DELETE | `/:id`                | Cancel a registration              | Student   |
| POST   | `/check-in`           | QR-based check-in                  | Organizer |
| POST   | `/:id/feedback`       | Submit post-event feedback         | Student   |
| GET    | `/event/:eventId`     | List registrations for an event    | Organizer |

### Admin — `/api/admin`

| Method | Endpoint              | Description                        | Auth  |
|--------|-----------------------|------------------------------------|-------|
| GET    | `/stats`              | Platform-wide statistics           | Admin |
| GET    | `/users`              | List all users                     | Admin |
| PATCH  | `/users/:id/role`     | Change a user's role               | Admin |
| PATCH  | `/users/:id/status`   | Toggle user active/inactive        | Admin |
| GET    | `/events`             | List all events (any status)       | Admin |
| GET    | `/registrations`      | List all registrations             | Admin |

### Real-Time — Socket.IO

| Event          | Direction       | Description                  |
|----------------|-----------------|------------------------------|
| `activeUsers`  | Server → Client | Current active user count    |

---

## 🗃️ Data Models

### User
| Field         | Type     | Notes                              |
|---------------|----------|------------------------------------|
| name          | String   | Required                           |
| email         | String   | Unique, lowercase                  |
| password      | String   | Hashed with bcrypt (select: false) |
| role          | Enum     | `admin` · `organizer` · `student`  |
| universityId  | String   | Optional                           |
| department    | String   | Optional                           |
| phone         | String   | Optional                           |
| isActive      | Boolean  | Default `true`                     |

### Event
| Field                | Type     | Notes                                                    |
|----------------------|----------|----------------------------------------------------------|
| title                | String   | Required                                                 |
| description          | String   | Required                                                 |
| date / endDate       | Date     | Start & optional end                                     |
| venue / buildingName | String   | Location details                                         |
| category             | Enum     | `Technical` · `Cultural` · `Academic` · `Sports` · `Workshop` |
| capacity             | Number   | Max attendees                                            |
| registrationDeadline | Date     | Cutoff for sign-ups                                      |
| status               | Enum     | `Draft` → `Pending Approval` → `Published` → …          |
| createdBy            | ObjectId | Ref → User (organizer)                                   |
| guestSpeaker         | Object   | `{ name, designation }`                                  |
| tags                 | [String] | Searchable keywords                                      |

### Registration
| Field       | Type     | Notes                            |
|-------------|----------|----------------------------------|
| userId      | ObjectId | Ref → User                       |
| eventId     | ObjectId | Ref → Event                      |
| status      | Enum     | `Registered` · `Checked-in` · `Cancelled` |
| qrData      | String   | Unique QR payload                |
| qrCode      | String   | Base64-encoded QR image          |
| checkedInAt | Date     | Timestamp of check-in            |
| checkedInBy | ObjectId | Ref → User (organizer)           |

### Feedback
| Field              | Type     | Notes                    |
|--------------------|----------|--------------------------|
| event              | ObjectId | Ref → Event              |
| student            | ObjectId | Ref → User               |
| registration       | ObjectId | Ref → Registration       |
| overallRating      | Number   | 1–5, required            |
| contentRating      | Number   | 1–5, optional            |
| organizationRating | Number   | 1–5, optional            |
| suggestions        | String   | Free text                |
| likedMost          | String   | Free text                |
| improvements       | String   | Free text                |

---

## 🔐 Authentication Flow

1. User registers via `/api/auth/register` (role: `student` or `organizer`).
2. Backend hashes the password with **bcryptjs** and stores the user in MongoDB.
3. User logs in via `/api/auth/login` — receives a signed **JWT**.
4. The frontend stores the token in `localStorage` and attaches it as a `Bearer` token in the `Authorization` header for subsequent requests.
5. The `auth` middleware verifies the JWT on protected routes and attaches `req.user`.
6. **PrivateRoute** components on the frontend redirect unauthorized users to `/login`.

---

## 📜 Available Scripts

### Backend (`backend/`)

| Command        | Description                                 |
|----------------|---------------------------------------------|
| `npm start`    | Start the server with Node                  |
| `npm run dev`  | Start with `--watch` for auto-restart       |

### Frontend (`frontend/`)

| Command         | Description                                |
|-----------------|--------------------------------------------|
| `npm start`     | Start React dev server (port 3000)         |
| `npm run build` | Create optimized production build          |
| `npm test`      | Run tests with React Testing Library       |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ for campus communities
</p>
