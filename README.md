# BuildFlow AI - Modern Construction ERP SaaS Platform

BuildFlow AI is a high-performance, enterprise-grade Construction ERP SaaS platform designed for small-to-medium construction businesses, builders, contractors, and site supervisors in India. 

It replaces fragmented WhatsApp groups, Excel ledger lists, and paper notebooks with a unified executive interface managing site timelines, material safety stocks, GPS-verified selfie checks, UPI weekly wage settlements, and AI-enabled financial forecasts.

---

## 🏗️ Architecture Design & Stack

### Frontend Client
* **React (TypeScript)**: Core single-page application structure.
* **Vite**: Rapid hot-reloading development compiler.
* **Tailwind CSS**: Custom Vercel-inspired UI theme (backdrop-blur glass cards, custom borders).
* **Framer Motion**: Smooth drawer slides and dialog animations.
* **Recharts**: Executive reporting widgets (Cash Flow area, Progress bars, Stock levels).
* **Lucide Icons**: Modern scalable clean icons library.

### API Server Backend
* **Node.js (Express & TypeScript)**: High-throughput API gateway router.
* **JWT**: Stateless token authentication.
* **RBAC**: Custom role permissions checking (e.g. only Accountants can release payouts).
* **PostgreSQL (Prisma)**: Relational database client support with complex indexes.

---

## 🔐 User Roles & Permissions Matrix

BuildFlow AI implements strict role-based dashboard access controls (RBAC):
* **Company Owner / Super Admin**: Unrestricted read/write access to financials, PO approvals, roster hires, and subscriptions.
* **Project Manager**: Access to Kanban tasks scheduling, site logs uploading, and procurement drafts.
* **Site Engineer**: Site updates logs, task status shifts, and GPS check-ins verification.
* **Accountant**: Salary slips generator, ledger bookkeeping, and PO invoice payouts approval.
* **Store Manager**: Material inward/outward logging and procurement drafts.
* **Labour Supervisor**: Daily rosters view and attendance logs marking.
* **Vendor**: Quotation bid logs uploads (Restricted portal).

---

## 📡 REST API Reference

### 1. Security & Authentication
* `POST /api/auth/signup`: Registers a new SaaS tenant company and owner profile.
* `POST /api/auth/login`: Validates credentials or simulated SMS OTP code, returning JWT tokens.
* `POST /api/auth/send-otp`: Sends simulated OTP verify codes to mobile numbers.

### 2. Project Operations
* `GET /api/projects`: Lists active projects registered under the tenant's workspace.
* `POST /api/projects`: Registers new site project coordinates and initializes default material levels.
* `PATCH /api/projects/:id`: Adjusts site attributes (dates, status tags).

### 3. Schedule & Kanban
* `GET /api/projects/:id/tasks`: Retrieves Kanban board tasks.
* `POST /api/projects/:id/tasks`: Schedules work items.
* `PATCH /api/tasks/:id`: Moves task columns (Planned, In Progress, Blocked, Completed).

### 4. Labour & Wages
* `GET /api/labour`: Lists hired workers profiles (daily rate, skill category).
* `POST /api/labour`: Registers worker credentials (validates 12-digit Aadhaar ID format).
* `GET /api/projects/:id/attendance`: Fetches daily check-in histories.
* `POST /api/projects/:id/attendance`: Logs selfie verification checks at GPS site coordinates.
* `POST /api/payroll/generate`: Release salary slips with auto ledger logging and BHIM UPI QR generation payloads.

### 5. Procurement & Suppliers
* `GET /api/materials/:projectId`: Inspects safety stock levels.
* `POST /api/materials/transaction`: Logs inward purchase deliveries or outward daily consumption.
* `GET /api/vendors`: Lists suppliers contact profiles and GSTIN codes.
* `POST /api/procurement`: Creates purchase order requests comparing pricing and lead times.
* `PATCH /api/procurement/:id/approve`: Reconciles invoices and unlocks material deliveries.

### 6. AI & Analysis Models
* `GET /api/finances/ai-prediction`: AI projection models predicting budget cost overruns and material requests.
* `POST /api/ai/chat`: OpenAI chatbot assistant trained on site logs (handles prompt queries).

---

## 🚀 Quick Start Guide (Local Development)

### 1. Backend Server Setup
1. Move to backend folder:
   ```bash
   cd backend
   ```
2. Configure `.env` values (JWT Secret, Database Url):
   ```env
   PORT=5000
   JWT_SECRET=buildflow-secret-key-12345
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/buildflow
   ```
3. Install packages and run in typescript dev mode:
   ```bash
   npm install
   npm run dev
   ```

### 2. Frontend Client Setup
1. Move to frontend folder:
   ```bash
   cd frontend
   ```
2. Load dependency trees and run dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open browser: [http://localhost:5173](http://localhost:5173).

---

## 🐳 Docker Deployment

To build and run the entire platform locally via Docker Containers, execute:
```bash
# Build images and start Postgres, Express API, and Nginx Web client
docker-compose up --build
```
* **Frontend Application**: Exposed on `http://localhost:3000`
* **API Gateway Services**: Exposed on `http://localhost:5000`
* **PostgreSQL Engine**: Exposed on port `5432`
