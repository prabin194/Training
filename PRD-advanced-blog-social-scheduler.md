# PRD: Advanced Blog Management System with Social Media Scheduling

## Problem Statement

Content creators and marketing teams need a unified platform to write, manage, and publish blog content while simultaneously scheduling and publishing that content to Facebook and Instagram. Currently, teams must use separate tools for blog management and social media scheduling, leading to fragmented workflows, duplicate effort, and inconsistent cross-platform messaging. There is no centralized system that handles the full lifecycle — from drafting and approval to multi-platform social scheduling and performance analytics.

## Solution

A single web application (Laravel backend + React SPA frontend) that combines a full-featured blog content management system with Facebook and Instagram social media scheduling. Users can write blog posts with rich text editing, manage media, add SEO metadata, move content through an approval workflow, and then schedule it for publication on the blog, Facebook, Instagram, or any combination — all from one interface. The system includes a calendar view for visual schedule management, per-platform content customization, social post previews, and an analytics dashboard to track social post performance.

## Tech Stack

- **Backend**: Laravel (PHP) — RESTful JSON API with Sanctum SPA authentication, queue workers for social publishing, and Form Request validation.
- **Frontend**: React (JavaScript/TypeScript) — SPA with React Router for client-side routing, TipTap for rich text editing, FullCalendar for schedule views, and Recharts for analytics dashboards.
- **Database**: MySQL — relational data store with standard Laravel migrations.
- **Architecture Pattern**: Single Page Application (SPA) with a decoupled Laravel backend serving as a pure JSON API.
- **Repository Structure**: MonoRepo — backend (Laravel) and frontend (React) housed in a single repository under separate directories.

## Core Application Features

- **Authentication & Security**: User registration, login, logout, and session management via Laravel Sanctum SPA authentication. OTP verification, forgot password, reset password, and email verification flows for account security.
- **User Profile & Settings**: Editable user profile with avatar, bio, and contact info. Application settings for preferences (notifications, privacy, display).
- **Home Page**: Dashboard view showing relevant content, recent activity, and quick actions based on user role.
- **Search & Filter**: Global search across posts, categories, tags, and scheduled content. Filterable lists with sort and pagination.
- **Messaging**: Internal messaging system for user-to-user communication (author/editor/admin collaboration).
- **Notifications**: Real-time in-app notifications for key events — post status changes, scheduled publish success/failure, comments, messages, and token expiry warnings.
- **Activity Logs**: Audit trail of all user actions — post creation, edits, status transitions, logins, and configuration changes.
- **Device Logs**: Record of active sessions with device/browser/IP info, allowing users to view and revoke sessions.

## User Stories

1. As an author, I want to create blog posts using a rich text editor (TipTap), so that I can format content without needing to know HTML or markdown.
2. As an author, I want to add categories and tags to my posts, so that content is organized and discoverable.
3. As an author, I want to upload images and other media to a media library, so that I can reuse assets across multiple posts.
4. As an author, I want to set SEO metadata (title, description, OG image, slug) for each post, so that the blog performs well in search engines.
5. As an author, I want to save posts as drafts, so that I can work on them incrementally before submitting for review.
6. As an author, I want to submit my posts for editorial review, so that an editor can approve content before it goes live.
7. As an author, I want to see the current approval status of my posts (draft, in review, approved, rejected, scheduled, published), so that I know what action is needed next.
8. As an editor, I want to review submitted posts with diff tracking on changes, so that I can see what was modified since my last review.
9. As an editor, I want to approve or reject posts with comments, so that authors know what needs to change.
10. As an editor, I want to assign categories and tags to posts during review, so that taxonomy remains consistent.
11. As an admin, I want to manage users and assign roles (admin, editor, author), so that the right people have the right permissions.
12. As an admin, I want to define and manage categories and tags globally, so that the content taxonomy is controlled.
13. As an admin, I want to configure social media connections (Facebook Pages and Instagram Business accounts) via OAuth, so that users can schedule posts to authorized social accounts.
14. As an admin, I want to manage all scheduled posts across all users in a calendar view, so that I can see the full content pipeline.
15. As a user, I want to connect my Facebook Page to the system via OAuth, so that I can schedule posts to it.
16. As a user, I want to connect my Instagram Business account to the system via OAuth, so that I can schedule posts to it.
17. As a user, I want to disconnect a social account at any time, so that I can revoke access when needed.
18. As a user, I want to link a blog post to a social media schedule entry, so that clicking the social post leads back to the blog.
19. As a user, I want to schedule a blog post to be published on the blog at a future date and time, so that content goes live automatically.
20. As a user, I want to schedule a standalone social post (not linked to a blog post) to Facebook, so that I can share non-blog content.
21. As a user, I want to schedule a standalone social post to Instagram, so that I can share non-blog content.
22. As a user, I want to cross-post the same content to both Facebook and Instagram simultaneously, so that I save time while maintaining presence on both platforms.
23. As a user, I want to customize the message, image, and link per platform when cross-posting, so that content is optimized for each platform's audience.
24. As a user, I want to preview how my social post will look on Facebook before scheduling it, so that I can verify formatting and appearance.
25. As a user, I want to preview how my social post will look on Instagram before scheduling it, so that I can verify formatting and appearance.
26. As a user, I want to see a calendar view of all scheduled social posts, so that I can plan my content calendar visually.
27. As a user, I want to drag and drop scheduled posts on the calendar to reschedule them, so that I can adjust timing easily.
28. As a user, I want to edit a scheduled post's content before it goes live, so that I can make last-minute changes.
29. As a user, I want to cancel a scheduled post, so that it does not get published.
30. As a user, I want to view the publishing history and status (pending, published, failed) of each scheduled post, so that I can troubleshoot failures.
31. As a user, I want to receive notifications when a scheduled post is successfully published, so that I can confirm it went live.
32. As a user, I want to receive notifications when a scheduled post fails to publish (with error details), so that I can take corrective action.
33. As a user, I want to view analytics for published social posts (likes, shares, comments, clicks, reach, impressions), so that I can measure content performance.
34. As a user, I want to compare analytics across posts in a dashboard with charts, so that I can identify top-performing content.
35. As a user, I want to filter analytics by date range, platform, and account, so that I can analyze specific segments.
36. As a user, I want to export analytics data as CSV or PDF, so that I can share reports with stakeholders.
37. As an admin, I want to view system-wide analytics across all users and accounts, so that I can measure overall social media performance.
38. As a user, I want the system to automatically refresh expired Facebook/Instagram OAuth tokens, so that scheduled posts continue to work without manual intervention.

## Implementation Decisions

### Modules

The system is composed of the following modules:

1. **Auth Module** — Handles registration, login, password reset, and session management via Laravel Sanctum SPA authentication. Enforces role-based access control (admin, editor, author) with granular permissions scoped per module.

2. **Blog Module** — Core blog content management. Handles CRUD for posts, categories, tags, and media library. Post content is stored as TipTap-compatible JSON (ProseMirror schema). SEO fields are first-class properties on the post model. Media library supports images with automatic thumbnailing and alt-text management.

3. **Workflow Module** — State machine managing the post lifecycle: draft → in_review → approved → (scheduled | published) → archived. Transitions are role-gated (author can submit to review, editor can approve/reject, admin can schedule/publish). Each transition logs an audit entry. Rejected posts include editor feedback and return to draft.

4. **Social Connection Module** — Manages OAuth 2.0 flows for Facebook and Instagram. Stores access tokens with expiry timestamps. Implements automatic token refresh using refresh tokens. Each connection is tied to a Facebook Page or Instagram Business account. Supports multiple connections per user.

5. **Scheduling Module** — Manages schedule entries with datetime, target platform, and content. Each schedule entry can be linked to a blog post (for blog publishing) or standalone (social-only). Tracks status: pending, processing, published, failed. Includes a queue system for processing due schedules via Laravel's scheduler + queues.

6. **Social Publishing Module** — Handles the actual API calls to Facebook Graph API and Instagram Graph API when a schedule is due. Supports cross-posting (same content to both platforms) and individual posting. Manages rate limits, retry logic with exponential backoff, and error handling. Content formatting adapts per platform (Instagram requires images, Facebook supports links + text).

7. **Social Preview Module** — Client-side rendering of how posts will appear on Facebook and Instagram before scheduling. Uses platform-specific layout components in React to simulate the look and feel of each platform.

8. **Analytics Module** — Fetches and caches post performance metrics from Facebook/Instagram Graph APIs. Provides aggregate dashboards with charts (line, bar, pie). Supports date range filtering, platform filtering, and account filtering. Data is cached with configurable TTL to respect API rate limits.

9. **Notification Module** — Sends in-app notifications and (optionally) email notifications for scheduled post outcomes. Alerts for publish success, publish failure (with error details), and token expiry warnings.

### Architecture

- **Backend**: Laravel with API resource controllers, Form Requests for validation, and Jobs for async social publishing. The social publishing queue uses Laravel's queue system with a dedicated `social-publishing` queue.
- **Frontend**: React SPA with React Router for routing, TipTap for rich text editing, FullCalendar (or equivalent) for calendar view, and Chart.js/Recharts for analytics charts. State managed with React Context or Zustand.
- **Database**: Standard Laravel migrations. Separate `social_connections`, `schedule_entries`, `social_analytics` tables alongside core `posts`, `categories`, `tags`, `media` tables.
- **Job Scheduling**: Laravel's `schedule:run` fires a `ProcessScheduleQueue` command every minute that checks for due `schedule_entries` and dispatches `PublishToSocialJob` jobs.

### API Contracts

- RESTful JSON API with Laravel Sanctum cookie-based SPA authentication.
- Social publishing jobs interact with Facebook Graph API v20+ and Instagram Graph API.
- Analytics fetched via Facebook Graph API `/me/insights` and `/me/posts` endpoints, cached server-side.

## Testing Decisions

Testing scope to be determined at implementation time. Recommended approach:

- **What makes a good test**: Tests should verify behavior, not implementation details. Test that a post transitions from draft to in_review when submitted, not that a specific method was called. Test that a scheduled post is dispatched to the queue at the right time, not the internal queue mechanics.
- **Prior art**: Standard Laravel feature tests for API endpoints (using `TestCase` with `RefreshDatabase`), job tests (dispatching jobs and asserting outcomes), and React Testing Library component tests for the frontend.

## Out of Scope

- TikTok, Twitter/X, LinkedIn, or other social platform integrations (Facebook and Instagram only)
- Native mobile apps (web SPA only for now)
- Blog content analytics (page views, bounce rate, etc. — social analytics only)
- E-commerce or product catalog management
- Multi-language/internationalization support
- Headless CMS API for external consuming applications
- A/B testing of social posts
- AI-generated content or scheduling recommendations

## Further Notes

- Facebook and Instagram scheduling requires that connected accounts have the appropriate permissions: `pages_manage_posts` for Facebook Pages and `instagram_basic`, `instagram_content_publish` for Instagram Business accounts. This should be clearly documented for users during the OAuth flow.
- Instagram posting requires an accompanying image or video — text-only posts are not supported by the Instagram Graph API. The UI should enforce this constraint during scheduling.
- Token refresh is critical for long-running schedules — the system must proactively refresh tokens before expiry and alert users if a token cannot be refreshed.
- The social publishing queue should implement a dead-letter mechanism: if a post fails after 3 retries, it moves to a "failed" state and notifies the user, rather than blocking the queue indefinitely.
