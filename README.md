# MediBot - Multilingual AI Healthcare Assistant

MediBot is a multilingual, full-stack clinical assistant and patient dispatch portal. It helps patients self-assess symptoms in English, Hindi, and Tamil, retrieves relevant clinical guidelines from local document stores using Retrieval-Augmented Generation (RAG), schedules telemedicine slots with approved physicians, and dispatches automated dosage alerts. It also includes an integrated Twilio IVR voice gateway for patients lacking stable internet connectivity.

> [!IMPORTANT]
> **Clinical Scope Disclaimer:**
> *This system provides preliminary health guidance only and is NOT a substitute for professional medical diagnosis. Always consult a qualified medical professional for health concerns.*

---

## Technical Stack

* **Frontend:** React.js, Tailwind CSS, Framer Motion, React Router DOM, Lucide Icons.
* **Backend:** Python FastAPI, Uvicorn, SQLAlchemy.
* **Database:** PostgreSQL (production compose) / SQLite (zero-config developer fallback).
* **AI & RAG:** Gemini API (`gemini-2.5-flash`), FAISS Vector Database, Sentence Transformers (`all-MiniLM-L6-v2`).
* **Telecommunications:** Twilio Webhooks (IVR Real-Time Speech-to-Text & Polly TTS).
* **Security:** Native bcrypt hashing, JSON Web Tokens (JWT), Role-Based Access Control (RBAC).

---

## Directory Structure

```text
Medi-bot/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── gemini_client.py       # Gemini API caller & JSON formatter
│   │   │   └── rag_service.py         # FAISS indexing & retrieval service
│   │   ├── routes/
│   │   │   ├── admin.py               # Stats, audit tracking, doctor approval
│   │   │   ├── appointments.py        # Booking scheduling & Jitsi meeting generation
│   │   │   ├── assessments.py         # Chat logs & PDF streaming routers
│   │   │   ├── auth.py                # Registration and JWT login
│   │   │   ├── doctors.py             # Practitioner lists and clinical sign-off
│   │   │   ├── ivr.py                 # Twilio TwiML IVR Voice endpoints
│   │   │   └── reminders.py           # Pill scheduler CRUD & cron trigger
│   │   ├── utils/
│   │   │   ├── notifications.py       # SMTP mailer & Twilio SMS helper
│   │   │   └── pdf_generator.py       # ReportLab PDF composer & QR generator
│   │   ├── config.py                  # Settings parser
│   │   ├── database.py                # Session local engines
│   │   ├── main.py                    # Entry coordinator
│   │   ├── models.py                  # Database schemas
│   │   └── schemas.py                 # Pydantic request models
│   ├── knowledge_base_docs/
│   │   ├── who_guidelines.txt         # Clinical WHO standards
│   │   ├── govt_health_guidelines.txt # Diabetes/hypertension guides
│   │   └── disease_awareness.txt      # Mosquito & acid reflux awareness
│   ├── scripts/
│   │   └── seed_data.py               # DB seeding script
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.jsx             # global warning footer
│   │   │   ├── Navbar.jsx             # navigation controls
│   │   │   └── ProtectedRoute.jsx     # session validation wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # JWT session coordinator
│   │   │   └── LanguageContext.jsx    # Translation tables EN/HI/TA
│   │   ├── pages/
│   │   │   ├── About.jsx              # design & RAG summary
│   │   │   ├── AdminDashboard.jsx     # approvals, audits & analytics
│   │   │   ├── ChatbotPage.jsx        # chat checker, Web Speech STT/TTS
│   │   │   ├── DoctorDashboard.jsx    # clinical ledger review
│   │   │   ├── LandingPage.jsx        # landing layout
│   │   │   ├── Login.jsx              # credentials form
│   │   │   ├── MedicationReminders.jsx# schedules & alert simulators
│   │   │   ├── PatientDashboard.jsx   # health index tracker
│   │   │   ├── Register.jsx           # multi-role fields toggles
│   │   │   ├── ReportsPage.jsx        # PDF downloads & QR codes modals
│   │   │   ├── Settings.jsx           # profile editors
│   │   │   └── TelemedicinePage.jsx   # slot reservation & Jitsi frame modal
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Routes Index

### Authentication
* `POST /api/auth/register` - Create patient account.
* `POST /api/auth/register/doctor` - Register doctor profile (pending approval).
* `POST /api/auth/login` - Obtain JWT Token.
* `GET /api/auth/me` - Resolve current user details.

### Assessments & RAG
* `POST /api/assessments/chat` - Feed symptoms & chat logs to get dynamic questions or final predictions.
* `POST /api/assessments/save` - Archive completed diagnosis reports.
* `GET /api/assessments` - List reports (Patient sees own, Doctor/Admin sees all).
* `GET /api/assessments/{id}/pdf` - Stream ReportLab PDF file.
* `POST /api/assessments/{id}/email` - Send PDF as email attachment.

### Appointments & Telemedicine
* `POST /api/appointments` - Book slot with approved doctor.
* `GET /api/appointments` - Fetch schedules.
* `PUT /api/appointments/{id}` - Accept/Reject slots & auto-spawn Jitsi webcam links.

### Medication Reminders
* `POST /api/reminders` - Schedule medicine alert.
* `GET /api/reminders` - Fetch pill schedules.
* `POST /api/reminders/trigger-sim` - Simulate pill alert trigger (sends SMS/Emails).

### Clinicians & Admin
* `PUT /api/doctors/feedback/{id}` - Save doctor notes & sign off.
* `GET /api/admin/analytics` - Read charts frequencies, total metrics.
* `PUT /api/admin/doctors/{id}/approve` - Activate doctor profile.
* `GET /api/admin/audit-logs` - Inspect system activity.

### Twilio IVR Webhooks
* `POST /api/ivr/call` - Welcome caller, ask language choice.
* `POST /api/ivr/language` - Set localization and trigger microphone.
* `POST /api/ivr/symptoms` - Run Gemini symptom assessment and read output back using TTS.

---

## Security Controls

1. **Role-Based Routing:** Authorization headers block patients from reviewing other patient files, and check that only admins approve doctors.
2. **Audit Trails:** Every security action (LOGIN, VIEW_REPORT, APPROVE_DOCTOR) is logged with timestamps and client IP markers.
3. **Data Sanitization:** Fields are validated using Pydantic schemas. Passwords are encrypted natively in DB using bcrypt.
