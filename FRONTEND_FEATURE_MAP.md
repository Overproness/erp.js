# Frontend Feature Map

Complete map of every user-facing feature and interaction in the application.

---

## Overview

This is a full-featured **ERP / CRM SaaS platform**. After logging in, the user lands on a main shell with a header at the top, an icon-based sidebar on the left, and page content filling the rest of the screen.

---

## Authentication

### Login

- The user enters their **email** and **password**.
- A **"Remember me"** checkbox keeps the session alive.
- A **"Forgot password"** link takes them to the reset flow.
- A link at the bottom takes them to the Sign Up page.
- On success, the user is redirected to the last page they were trying to visit (or the Dashboard).

### Sign Up

- The user fills in **Name**, **Email**, **Password**, and **Company Name**.
- On success, the account is created and the user is sent to the Dashboard.
- New owner accounts that have not finished onboarding are automatically redirected to the Onboarding wizard.

### Forgot Password

- The user enters their **email address**.
- A reset link is sent to that email.
- A success confirmation screen is shown.

### Reset Password

- Accessed via the link sent to the user's email.
- The user enters a **new password** and confirms it.
- On success they are redirected to Login.

---

## Layout — Always Visible

### Header (top bar)

- **Logo** — clicking it returns to the Dashboard.
- **Notification Bell** — shows a badge with the count of unread notifications, updated in real time. Clicking it opens a dropdown showing the 10 most recent notifications. The user can mark individual notifications as read, delete them, or click **"View All"** to see the full list.
- **Profile Menu** — shows the user's avatar, name, and email. Contains links to **Profile Settings** and **Logout**.

### Icon Sidebar (left)

- A vertical strip of icons, one per major section.
- On desktop it is always visible; on mobile a hamburger button opens it as a slide-in drawer.
- Only the icons the logged-in user has permission to access are shown.
- Hovering an icon shows a tooltip label.

**Sidebar items:**
| Icon | Destination |
|---|---|
| Dashboard | Main dashboard |
| Customers | Customer list |
| Quotes | Quote list |
| Invoices | Invoice list |
| Payments | Payment list |
| Payment Methods | Payment mode list |
| Follow-Ups | AI-enhanced follow-up management |
| Campaigns | Marketing campaigns |
| Behavior Triggers | Marketing automation triggers |
| Retargeting | Audience retargeting |
| Social Media | Social media management |
| Reputation | Reputation & review management |
| Surveys | Customer survey management |
| Chat | Internal team chat |
| AI Assistant | AI assistant tools |
| AI Learning | AI learning dashboard |
| URL Manager | Short URL management |
| Documents | Document management |
| Taxes | Tax configuration |
| Workflows | Workflow builder |
| Tasks | Task management |
| Appointments | Appointment scheduling |
| Analytics | Analytics & reporting |
| Team | Team management |
| Settings | App settings |

---

## Dashboard

The first thing the user sees after logging in.

- **4 KPI cards** at the top, each auto-refreshing every 60 seconds:
  - Total Invoices (+ amount this month, unpaid count)
  - Total Quotes (+ amount this month)
  - Total Payments received (+ amount this month)
  - Active Clients (+ new this month, total count)
- **Recent activity tables** below the cards: latest clients, invoices, quotes, and payments, each with a "View All" link.
- A shortcut button linking to the **N8N workflow automation** tool.

---

## CRM

### Customers

The user sees a table of all customers with columns for Name, Email, Phone, Company, Status, and Creation Date.

- **Summary bar** at the top shows Total, Active, and Recent customer counts.
- **Search bar** — filter by name, email, phone, or company as you type.
- **Status filter** — show All / Active / Inactive.
- Each row has **View**, **Edit**, and **Delete** action buttons.
- A **Create Customer** button opens the customer creation page.
- A **Bulk Import** button lets the user upload a CSV file to import many customers at once.

**Creating / Editing a Customer:**
The user fills in:

- Name _(required)_
- Customer Type — Individual or Company
- Email _(required)_
- Phone _(required)_
- Company name
- Address
- Demographics: Age, Gender (Male / Female / Other), Location, Income Range

**Viewing a Customer:**
Full read-only view of all customer details with links to their related quotes, invoices, and payments.

---

### Quotes

A list of all quotes with columns for customer, amount, status, and dates.

- **Create Quote** opens a multi-line item builder where the user:
  - Selects a customer (searchable dropdown)
  - Adds line items (product/service name, quantity, unit price, tax, discount)
  - Sets a due date, payment terms, and notes
  - Assigns a status (Draft / Sent / Accepted / Declined)
- **View Quote** shows the full quote with a button to **generate and download a PDF**, a button to **send it by email**, and a button to **convert it to an Invoice**.
- **Edit** and **Delete** actions are available on the list.

---

### Invoices

A list of all invoices with status, amount due, and due dates.

- **Create Invoice** works like a quote but with invoice-specific fields (invoice number, payment due date).
- **View Invoice** shows full details with a **Record Payment** button.
- **Record Payment** (`/invoice/pay/:id`) — the user fills in:
  - Payment number, Date, Amount
  - Payment Mode (searchable dropdown with a "Create New" shortcut)
  - Reference and Description
- **Edit** and **Delete** actions on the list.

---

### Payments

A list of all recorded payments.

- Columns: Payment number, Date, Amount, Mode, Customer, Reference.
- **View** and **Edit** per row.
- **Edit Payment** — update any field on an existing payment record.

---

### Payment Methods

A list of payment modes (e.g., Bank Transfer, Credit Card, Cash).

- **Summary bar**: Total, Active, Default, Recently Added counts.
- **Toggle Default** — one click marks a mode as the default.
- **Toggle Enabled** — enable or disable a mode without deleting it.
- **Create / Edit** form fields: Name, Description, Is Default switch, Enabled switch.
- **Bulk Import** button.

---

### Follow-Up Management

AI-assisted follow-up tracking for customers.

- **Analytics cards**: Total Follow-Ups, Pending, Completed, Conversion Rate.
- **Follow-up table**: Customer name, Type, Status, Due Date, Priority, Actions.
- **Filter** by status (All / Pending / Completed / Cancelled).
- **Create Follow-Up** button opens a modal with:
  - Customer selector
  - Type — Email / Call / Meeting / Task
  - Reason, Scheduled Date, Subject, Message
  - Priority — Low / Medium / High / Urgent
- Per-row actions: **Send Now**, **Reschedule**, **Delete**.
- **Bulk Import** button.

---

## Document Management

### Document List

- **Summary bar**: Total documents, Recent uploads, Total storage used, Number of categories.
- **Search bar** — search by name.
- **Advanced Search** modal — filter by document type, date range, and tags.
- **Table columns**: Name, Type, Size, Tags, Created date, Actions.
- Per-row actions: **View**, **Edit** (opens the editor), **Download**, **Share**, **Delete**.
- **AI Document Manager** button — AI-assisted document analysis.
- **Bulk URL Import** button.

### Creating a Document

Fields: Name, Description, Document Type (Invoice / Contract / Report / Receipt / Agreement / Certificate / Legal / Financial / Other), Tags (the system auto-suggests tags using NLP), File upload (drag-and-drop, supports PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, images, MD, JSON, HTML).

### Document Editor

- A full-featured **rich text editor** for text documents.
- A **PDF Viewer with annotation support** for PDFs.
- **Version History panel** — view all past saves; restore any previous version.
- **Digital Signature modal** — place a signature at a chosen page and position, with a reason field.
- **Edit Summary** field before saving.

### Shared Document (Public — no login needed)

- Accessed via a share link. May be **password-protected**.
- Shows document metadata and a **Download** button.
- Handles expired links, click-limit-reached states, and invalid links with appropriate messages.

---

## Taxes

- **Summary bar**: Total, Active, Default, Average Rate.
- **Table**: Name, Tax Value, Tax Rate %, Default toggle.
- **Create / Edit** form: Name, Tax Value, Tax Rate, Is Default switch.
- **Bulk Import** button.

---

## Workflow Builder

### Workflow Dashboard

- **Statistics cards**: Total Workflows, Active Workflows, Completed Tasks, Average Execution Time (auto-refreshes every 5 minutes).
- **Workflow canvas** — a visual drag-and-drop designer (ReactFlow-based).
- **Node Palette** sidebar — the user drags **trigger nodes**, **action nodes**, and **condition nodes** onto the canvas.
- **Canvas toolbar**: Save Workflow, Run Workflow, Share Workflow, Clear Workflow.

### Workflow Designer (advanced editor)

- Full **ReactFlow canvas** with custom node types.
- Clicking a node opens a **configuration panel** on the right to set inputs, outputs, retry policy, and timeout.
- **Workflow metadata** form: Name, Description, Tags.
- **Tabs**: Design view / Monitoring view.
- **Execution History drawer** — past runs with status (success / failed / running).
- **Settings drawer** — workflow-level settings.
- Buttons: **Save**, **Run / Execute**, **Debug**, **Share**, **Back**.

### Workflow List

Standard table of saved workflows with Create, View, Edit, and Delete actions.

---

## Tasks

- **Statistics**: Total Tasks, Completed, In Progress, Overdue.
- **Task list** grouped by status, each group collapsible.
- **Create Task** button opens a modal. Fields:
  - Title, Description
  - Assigned To (searchable user dropdown)
  - Progress % slider, Time Spent (minutes)
  - Start Date, Deadline, Completion Date
  - Status, Priority
  - Tags, File attachments, Watchers
- **View Task** modal — full read-only details with an Edit button.
- **Edit Task** modal — same form pre-filled.
- **AI Suggestions** modal — AI-powered task recommendations based on the current workload.
- **Bulk Import** button.

---

## Appointments

- **Statistics**: Upcoming, Today's, Confirmed, Completion Rate.
- **View toggle**: Switch between a **List view** and a **Calendar view**.
- In Calendar view, days with appointments show dots; clicking a day shows the appointments for that day.
- **Filter** by Status (Scheduled / Confirmed / Completed / Cancelled) and Type.
- **Create / Edit Appointment** modal. Fields:
  - Title, Description
  - Date & Time range (start + end with time pickers)
  - Type — Meeting / Call / Demo / Consultation / Follow-Up / Other
  - Location Type — Virtual / In-Person / Phone
  - Location address (for in-person) or Meeting URL (for virtual)
  - Duration, Customer link (searchable), Priority
  - Attendees list
  - Generate Booking URL toggle
- Per-row actions: **Edit**, **Confirm**, **Delete**, with status badges.
- **Bulk Import** button.

---

## Marketing

### Campaign Dashboard

- **Statistics**: Total Campaigns, Active, Draft, Completed.
- **Campaign table**: Name, Status, Type, Audience, Sent Count, Open Count, Created date.
- Per-row actions: **View**, **Edit**, **Analytics**, **Delete**.
- **Create Campaign** button opens the Campaign Builder wizard.

### Campaign Builder (5-step wizard)

1. **Campaign Info** — Name, Description, Campaign Type.
2. **Audience** — Select or create a target audience segment.
3. **Content** — Compose content for the selected channels (email body, SMS text, social post).
4. **Channels** — Choose channels: Email / SMS / Social / Push.
5. **Review & Launch** — Summary of all settings; click Launch to start the campaign.

### Behavior Triggers

Automated marketing actions that fire when certain events occur.

- **Statistics**: Total, Active, High Priority, Triggered Today.
- **Trigger table**: Name, Event Type, Conditions count, Actions count, Priority, Active toggle, Created date.
- Toggle a trigger **Active / Inactive** with a single click.
- **Delete** with confirmation.
- **Create Trigger** button opens a form with: Event Type, Conditions list (add / remove conditions), Actions list (add / remove actions), Scheduling settings.

### Retargeting Audiences

- **Statistics**: Total Audiences, Total Reach, Connected Platforms, Last Sync Time.
- **Tabs**: Audiences / Platform Connections.
- **Audience table**: Name, Description, Size, Connected Platforms (Facebook / Instagram / Twitter / Google icons), Status.
- **Sync** button — syncs all audiences with connected platforms.
- **Delete** with confirmation.

### Campaign Analytics

Per-campaign performance page showing detailed engagement metrics.

---

## Social Media

### Dashboard

Overview of all connected social accounts and recent post performance statistics.

### Post Management

- List of all scheduled and published posts.
- **Create Post** — write post content, select which platforms to publish to (Facebook, Instagram, Twitter, LinkedIn), pick a schedule date/time, and optionally attach media.
- **Edit** and **Delete** existing posts.

### Analytics

Engagement metrics, reach, and impressions across all connected platforms shown in bar and line charts.

### Mentions

Social listening feed — shows mentions of the brand or configured keywords across all connected platforms.

### AI Content

- The user describes what kind of post they want.
- Selects a tone/style (professional, casual, humorous, etc.) and a target platform.
- AI generates a suggested post. The user can edit it before publishing.

---

## Reputation Management

### Header Summary

Always visible at the top: Average Rating (x / 5), Total Reviews, Response Rate %, Connected Platforms count.

### Dashboard Tab

- Rating trend charts over time.
- Platform-by-platform rating breakdown.
- Sentiment analysis (positive / neutral / negative).
- Average response time metrics.

### Reviews Tab

- Live review feed pulled from all connected platforms.
- Filter by platform, star rating, or date range.
- **Respond inline** — type and submit a response to any review directly in the app.

### Response Tab

- **AI-suggested responses** — the system suggests a reply for each unanswered review.
- **Template library** — the user can save and reuse response templates.

### Integration Tab

- Connect Google Business, Yelp, Facebook, and other review platforms via OAuth.
- **Review portal embed code** — generates an HTML snippet the user can put on their own website to collect reviews.

### Review Links

- List of shareable review request links (e.g., a link you send to customers asking them to leave a review).
- **Create** a new link: choose target platform, write a custom message.
- **Edit** existing links.

### Reputation Analytics

In-depth analytics page with charts for review volume, rating trends, and sentiment over customizable date ranges.

---

## Survey Management

### Survey List

- **Table**: Title, Description, Type, Status, Response Count, Completion Rate, Created date.
- Per-row actions: **View**, **Edit**, **Publish / Pause** toggle, **Duplicate**, **Share** (shows the public URL with a copy-to-clipboard button), **Delete**.
- Status labels: Draft / Active / Paused / Closed / Archived.
- **Create Survey** button.

### Creating / Editing a Survey

Fields:

- **Title** and **Description**
- **Survey Type** — NPS, CSAT, General Feedback, Custom
- **Status** — Draft / Active / Paused / Closed / Archived
- **Questions builder** — add, remove, and reorder questions. Each question has:
  - Question text
  - Question type: Rating (1–5 stars), NPS (0–10 scale), Text (open ended), Multiple Choice, Single Choice, Scale (1–10), Yes / No
  - For choice-type questions: add or remove individual answer options
- **Settings toggles**: Allow Anonymous Responses, Require Email, One Response Per User, Show Progress Bar, Show Question Numbers, Randomize Question Order
- **Thank You Message** shown after submission
- **Redirect URL** to send respondents to after completion
- **Distribution window**: Start Date and End Date

### Public Survey (no login required)

- Accessed by end-customers via a short link.
- Shows questions one at a time with a progress bar.
- Optional name and email fields.
- On submission, shows the **Thank You** screen.

### Survey Analytics

- Response count, completion rate, and average time to complete.
- Per-question breakdown charts.

---

## URL Manager

### URL List

- **Table**: Short Code, Original URL, Title, Click Count, Created date, Status.
- Per-row actions: **View details**, **Edit**, **Analytics**, **Delete**.
- **Create URL** button.
- **Bulk Import** button.

### Creating a URL

Fields: Original URL, Title, Custom Short Code (optional, auto-generated if left blank), Description, Expiry Date, Password protection, Maximum Clicks limit, UTM parameters (source / medium / campaign).

### URL Details

Shows full metadata, total click count, QR code display, and share buttons.

### URL Analytics

- Click trend chart over time.
- Geographic breakdown of clicks.
- Referrer breakdown (where clicks came from).
- Device and browser breakdown.

### A/B Testing

- List of all A/B tests.
- **Create A/B Test** — define two URL variants (A and B), set the traffic split percentage (e.g., 50/50), give the test a name.
- **Results page** — shows conversion comparison between variants with a winner recommendation.

### Short URL Redirect (Public — no login required)

A redirect page that handles the short code and either sends the visitor straight to the destination or shows a preview page first.

---

## AI Assistant

### AI Assistants Dashboard

- **Statistics**: Total Assistants, Active, Total Conversations, Average Response Time.
- **Table** of all configured AI assistants: Name, Status, Type, Conversation count, Created date.
- Per-row actions: **Chat**, **View**, **Edit**, **Delete**.
- **Create Assistant** button.
- **Start Chat** button (opens global chat against default assistant).

### Creating an AI Assistant

Fields: Name, Description, System Prompt (custom instructions), Model selection, Temperature, Max Tokens, Knowledge base items, Enable / Disable toggle.

### AI Chat Interface

Two-panel layout:

- **Left panel** — Conversation history: list of past conversations, assistant selector dropdown.
- **Right panel** — Active chat:
  - Message bubbles (user messages on the right, AI on the left)
  - Typing indicator while AI is responding
  - Quick-prompt suggestion chips
  - Emoji picker
  - Model selector (GPT-4o, Claude, Gemini, etc.)
  - Text input with Send button

### AI Settings

Configure API keys for OpenAI, Gemini, and Claude; set default model, temperature, and context window size; enable/disable AI Copilot features.

### AI Suggestions

Auto-generated business improvement suggestions organised by module (Automation, Optimization, Insights). The user can browse, apply, or dismiss suggestions.

### AI Analytics

Usage metrics per model, cost tracking, and performance comparisons between models.

### Data Processor

OCR processing, data extraction templates (define fields to extract from uploaded documents), and workflow automation setup.

---

## AI Learning Dashboard

- **Statistics**: Total Interactions, Success Rate, Average Confidence, Active Modules.
- **Charts**: Learning progress over time (area chart), Accuracy over time (bar chart).
- **Tabs**:
  - **Overview** — high-level learning metrics.
  - **Insights** — categorised insights (Automation / Optimization / Insights).
  - **Recent Interactions** — table showing Type, Module, Confidence score, User Rating, Date.
- **Rate Interaction** button — the user can give 1–5 star feedback on any interaction to help the AI improve.

---

## Analytics & Reporting

- **Date range picker** at the top (default: last 30 days).
- **Module filter** dropdown — see data for All / CRM / Marketing / Sales / Tasks / etc.
- **Overview cards**: Total Revenue, Customers, Active Campaigns, Completed Tasks.
- **Charts**: Bar chart (revenue by month), Pie chart (customer segments), Line chart (trends over time).
- **Export** button — download current report as CSV or Excel.
- **AI Suggestions** modal — click to get AI-powered insights and recommendations based on the current data.
- **Custom Report Builder** modal — drag-and-drop interface to build a custom report layout.
- **Predictive Analytics** modal — AI forecasting charts showing projected trends.
- Data refreshes automatically every 30 seconds.

---

## Team Management

- **Statistics**: Total Members, Active Teams, Completed Tasks, New This Month.
- **Team table** — list of all team members and teams.
- **Create Team** page — set team name, description, and assign members.
- **View Team** page — read-only details of a team.
- **Edit Team** page — update team details.
- **Invite Member** — enter an email address; the system generates a unique invitation token and sends it by email.
- **Accept Invitation** (public page, no login required) — the invitee clicks the link in their email, the token is validated, and they are added to the team.
- **Bulk Import** button.

---

## Settings

A tabbed settings page with 7 tabs:

| Tab                       | What the user configures                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| **General Settings**      | App name, default language, timezone, date format, version info                                     |
| **Company Settings**      | Company name, address, phone, website, tax ID, registration number                                  |
| **Company Logo**          | Upload company logo via drag-and-drop                                                               |
| **Currency Settings**     | Currency code, symbol, position (before / after amount), decimal separator, thousands separator     |
| **Finance Settings**      | Default payment terms, late fee %, grace period, invoice prefix/suffix, quote validity days         |
| **AI Settings**           | OpenAI / Gemini / Claude API keys, default model, temperature, max tokens, enable / disable Copilot |
| **Social Media Settings** | Connect Facebook, Instagram, Twitter, and LinkedIn accounts via OAuth; manage stored access tokens  |

A URL parameter lets a link open directly to a specific tab.

---

## Profile

- Edit **name**, **surname**, and **email**.
- **Change password** form.
- **Profile photo** upload.

---

## Onboarding Wizard

Shown automatically to new account owners who have not yet completed setup.

A multi-step wizard that collects:

1. Company name, address, and logo.
2. Industry and company size.
3. Initial settings — currency and timezone.

Once completed, the wizard is never shown again.

---

## Internal Chat

Full-featured internal messaging between team members.

- **Left panel** — Contact list: all users in the company, each showing avatar, name, last message preview, and an unread message badge.
- **Right panel** — Message thread:
  - Messages bubbles — own messages appear on the right, others on the left.
  - Timestamps on each message.
  - **Emoji picker** (categorised: Smileys, Gestures, Hearts, Objects, Emotions).
  - **New Chat** button — shows a list of all users to start a new conversation.
  - Per-message options menu (⋮).
  - All messages delivered in real time.
- A URL parameter opens the chat directly to a specific user's conversation.

---

## Customer Chat (Public — no login required)

External customer-facing support chat.

- Accessed via a link containing an `?token=` query parameter.
- The token is validated before the chat interface loads.
- Invalid or expired tokens show an appropriate error message.
- Once validated, the customer can send and receive messages in real time.

---

## Public-Facing Pages (No Login Required)

| Page                       | Purpose                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| Survey response form       | End-customers fill in a survey sent to them                                 |
| Shared document viewer     | View or download a document shared via link (optionally password-protected) |
| Short URL redirect         | Handles a short link and redirects to the destination                       |
| Customer support chat      | External customer messaging room                                            |
| Team invitation acceptance | Invited users click to join a team without needing an existing account      |
