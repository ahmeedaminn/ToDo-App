# University Ticketing System - Product Roadmap

## 🎯 Vision
Transforming a core ticketing application into a secure, multi-tenant, university-wide support system.

---

## 🟢 Version 1.0 (The MVP - "Do Now")
*Focus: Stabilize the core application, finalize authentication, and polish the user experience for a single-department demo.*

### 1. Routing & Navigation
* **Feature:** Implement `react-router-dom`.
* **Why:** Transforms the app from a single-page script into a professional Web App with back/forward navigation (`/login`, `/register`, `/dashboard`).

### 2. User Onboarding
* **Feature:** Complete the Registration Logic.
* **Why:** You have the JWT backend and login frontend. The register form is the final required piece to allow real users to test the system.

### 3. Immediate Usability
* **Feature:** Frontend Search Box for Tickets/Assignees.
* **Why:** Provides instant filtering without requiring complex backend database changes. Crucial for UX.

---

## 🔵 Version 2.0 (The Enterprise Upgrade - "Lazy Evaluation")
*Focus: Scaling the system to handle multiple faculties, advanced workflows, and university-wide security.*

### 1. Multi-Tenancy Architecture (Faculty Isolation)
* **Feature:** Isolate data by faculty (e.g., CS vs. Medicine).
* **Why:** Crucial for university adoption. Requires adding `faculty_id` to users and tickets, and updating Express middleware to ensure cross-faculty data privacy.

### 2. Advanced Role-Based Access Control (RBAC)
* **Feature:** Admin roles and privileges.
* **Why:** Admins need access to all faculty tickets, ability to delete users, and view system metrics.

### 3. Bidirectional Ticket Communication
* **Feature:** Zendesk/Jira style comment threads on tickets.
* **Why:** Allows creators and assignees to converse, ask for clarification, and send multiple attachments over time. Requires a new `Comments` table in PostgreSQL.

### 4. Advanced Security & Recovery
* **Feature:** Forgot/Reset Password via Email.
* **Why:** Essential for production. Requires NodeMailer and secure temporary tokens.

### 5. Backend Pagination
* **Feature:** True database-level pagination (`skip`, `take`).
* **Why:** Necessary only when a single faculty generates hundreds of active tickets, to prevent browser lag.

### 6. Multiple Attachments
* **Feature:** Allow uploading multiple files per ticket/comment.
* **Why:** Better context for complex issues. Requires updating Multer and Prisma schema (`Attachment` relational table).
