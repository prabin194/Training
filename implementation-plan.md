# Implementation Plan: Advanced Blog Management System with Social Media Scheduling

## Phase 1: Foundation (Auth & Base Setup)

### 1.1 Project Scaffolding
- Initialize Laravel + React in MonoRepo (React in `resources/js/`)
- Configure Vite for React SPA build
- Set up Laravel Breeze / Sanctum for SPA auth
- Configure `SESSION_DOMAIN`, CORS, and cookie settings
- Database migrations for `users`, `personal_access_tokens`, `sessions`

### 1.2 Auth Flow (Backend)
- Register, Login, Logout API endpoints
- Email verification (signed URL)
- Forgot/Reset password with token
- OTP generation and verification
- Account settings, password change

### 1.3 Auth Flow (Frontend)
- Login/Register pages
- Email verification screen
- Forgot/Reset password pages
- OTP verification screen
- Auth state management (React Context/Zustand)
- Axios interceptor for Sanctum CSRF + auth redirect

### 1.4 User Profile & Settings
- Profile CRUD (avatar upload, bio, contact info)
- Account settings page (password change, email change)
- API: `UserController`, `ProfileController`

### 1.5 Device Logs
- `device_logs` table migration
- Middleware to record session on login
- API: list active sessions, revoke session
- Frontend: device management page

### 1.6 Activity Logs
- `activity_logs` table migration
- Spatie Laravel Activitylog (or custom) to log model events
- API: paginated activity feed
- Frontend: activity log page with filters

---

## Phase 2: Core Blog Module

### 2.1 Blog Models & Migrations
- `posts` (content stored as TipTap JSON), `categories`, `tags`, `category_post`, `post_tag`
- `media` table (uploads with thumbnails)
- SEO fields on posts: `meta_title`, `meta_description`, `og_image`, `slug`

### 2.2 Blog API (Backend)
- CRUD controllers: `PostController`, `CategoryController`, `TagController`, `MediaController`
- Form Requests for validation
- Media upload with image intervention/thumbnails
- Slug auto-generation

### 2.3 Blog UI (Frontend)
- TipTap rich text editor integration
- Post create/edit form with category/tag selectors, SEO fields
- Media library modal (upload, browse, select)
- Blog post list with search, filter by status/category, sort

### 2.4 Search & Filter
- Global search endpoint (`/api/search?q=`)
- Filtered post listing with pagination
- Frontend search bar + filter UI

### 2.5 Home Page / Dashboard
- Role-aware dashboard: recent posts, pending reviews, upcoming schedules
- API: `DashboardController` with aggregated stats
- Frontend: widget layout with cards

---

## Phase 3: Workflow & Approval System

### 3.1 State Machine
- Status enum: `draft`, `in_review`, `approved`, `rejected`, `scheduled`, `published`, `archived`
- `PostStatusTransition` model for audit trail
- Service class enforcing role-gated transitions

### 3.2 Review API
- Submit for review, approve, reject (with comment)
- View pending reviews (editor dashboard)
- Diff endpoint: compare draft vs published version

### 3.3 Review UI
- Editor review queue with diff view
- Approve/reject modal with comment input
- Rejected post returns to author's drafts with feedback visible

### 3.4 Roles & Permissions
- Role enum: `admin`, `editor`, `author`
- Gates/policies on each transition
- Admin user management page (CRUD, role assignment)

---

## Phase 4: Social Connections (OAuth)

### 4.1 Social Connection Backend
- `social_connections` table (provider, provider_id, token, refresh_token, expires_at)
- Facebook OAuth 2.0 login flow (Facebook Graph API)
- Instagram Business OAuth via Facebook
- Token refresh job (scheduled, runs before expiry)
- Connect/disconnect endpoints

### 4.2 Social Connection UI
- "Connect Facebook Page" / "Connect Instagram" buttons
- OAuth redirect handling
- Connected accounts list with status indicator
- Disconnect confirmation

---

## Phase 5: Scheduling & Calendar

### 5.1 Schedule Models & API
- `schedule_entries` table (post_id, user_id, platform, scheduled_at, content, image, status)
- CRUD endpoints for schedule entries
- Atomic `pending -> processing` transition on dispatch

### 5.2 Queue & Publishing
- `ProcessScheduleQueue` command (runs every minute via Laravel scheduler)
- `PublishToSocialJob` with 3 retries + exponential backoff
- Dead-letter after 3 failures -> `failed` status + user notification

### 5.3 Calendar UI
- FullCalendar integration
- Drag-and-drop reschedule via `eventDrop` -> API call
- Create/edit schedule from calendar
- Past-time validation error + revert

### 5.4 Cross-Posting & Preview
- Per-platform content customization UI (different text/image per platform)
- Instagram image: user-supplied > featured image fallback
- Pixel-perfect Facebook preview component
- Pixel-perfect Instagram preview component

---

## Phase 6: Social Publishing Engine

### 6.1 Facebook Publishing
- Facebook Graph API integration (feed post, link post)
- Handle rate limits, pagination, error codes

### 6.2 Instagram Publishing
- Instagram Graph API media container creation + publish
- Media upload, caption, container polling
- Enforce image/video requirement

### 6.3 Post History & Logs
- Publishing history page (status per entry: pending, processing, published, failed)
- Error detail display with retry button for failed posts
- Status polling or notification-driven updates

---

## Phase 7: Analytics

### 7.1 Analytics Backend
- Fetch metrics from Facebook/Instagram Graph APIs
- Cache layer with per-metric TTL
- API: dashboard stats, filtered by date/platform/account
- CSV/PDF export

### 7.2 Analytics UI
- Dashboard with charts (Recharts): line, bar, pie
- Date range picker, platform filter, account filter
- Stale data label: "Updated X hours ago"
- Export button (CSV/PDF)

### 7.3 Admin Analytics
- System-wide aggregate across all users/accounts
- Same chart components, admin-only route

---

## Phase 8: Messaging & Notifications

### 8.1 Messaging
- `messages` table (sender_id, recipient_id, subject, body, read_at)
- API: inbox, sent, send message, mark read
- Frontend: simple inbox list, message detail, compose form

### 8.2 Notifications
- `notifications` table
- In-app notification creation on key events (post status change, publish success/fail, message received, token expiry)
- API: list notifications, unread count (separate endpoint), mark read
- Frontend: notification dropdown/bell icon, polling every 30s

---

## Phase 9: Polish & Hardening

### 9.1 Scheduled Cleanup
- Artisan command to prune activity/device logs > 1 year
- Artisan command to prune old notifications
- Social token refresh job

### 9.2 Error Handling & Edge Cases
- Global error handling on API (friendly messages)
- Loading, empty, error states on every frontend page
- Network failure recovery (retry on queue failure)

### 9.3 Testing
- Laravel feature tests for all API endpoints
- Job tests for social publishing
- React component smoke tests (optional, depending on timeline)

### 9.4 Deployment Prep
- Production Vite build config
- Queue worker supervisor config
- Scheduler cron entry
- Environment variable documentation

---

## Decision Log

| Decision | Choice |
|---|---|
| Domain | Same domain (no subdomain) |
| Auth | Sanctum SPA cookie auth |
| Build | React builds into `resources/`, Laravel serves from `public/` |
| Queue dedup | Atomic `pending -> processing` status transition |
| Past-time drops | API rejects, FullCalendar reverts |
| Edit approved post | Editor edits in-place, schedule intact, no re-approval |
| Diffs | Separate draft/published versions |
| Instagram image | User-supplied > featured image fallback > never block |
| Preview quality | Pixel-perfect React components |
| Link preview | Laravel scrapes OG metadata |
| Analytics cache | Show cached with "last updated" label |
| Messaging | Simple inbox, no threading |
| Notifications | Polling every 30s + separate unread count endpoint |
| Activity logs | 1 year retention, cleaned by scheduled command |
| MonoRepo layout | React inside Laravel `resources/` |
