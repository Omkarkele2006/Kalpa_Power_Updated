# Kalpa Power: Document Control & Approval Workflow System

A web-based document management and approval system for solar power projects. Designed to streamline the upload, review, and approval of engineering drawings while maintaining a complete revision history and secure archive.

## Overview

This system addresses the complexity of managing technical drawings across distributed solar projects. Engineers upload drawings, line managers review for completeness, department heads approve and stamp PDFs, and all approved documents are securely archived. The workflow ensures accountability through role-based access, revision tracking, and realtime notifications.

## System Architecture

<img width="1858" height="1911" alt="Kalpa Architecture flow example" src="https://github.com/user-attachments/assets/10e0e43a-9a22-4ab4-8b34-6a21d13df040" />

## Key Features

- **Role-Based Access Control** – Five user roles (Designer, Line Manager, Dept Head, Site Engineer, Vendor/Client) with granular permissions
- **Structured Workflow** – Working → Review → Approval → Archive lifecycle with status tracking
- **Revision Management** – Automatic revision numbering with overwrite vs. new-revision logic; old approved versions moved to archive
- **PDF Stamping** – Automatic approval stamps embedded in PDFs by Dept Heads
- **Auto-Generated Document Numbers** – Consistent naming: `GM-RT-DWG-[type]-[project]-[year]`
- **Secure Storage** – Private cloud storage with signed URL access (120s expiry)
- **Realtime Notifications** – Live updates for status changes and approvals via WebSocket
- **Drawing Preview** – In-browser PDF/CAD file viewing with access control
- **Project-Based Organization** – Drawings grouped by project with folder structure mirroring approval stage

## Workflow

```
DESIGNER (Upload)
     ↓
DESIGNER uploads drawing (Working folder)
     ↓
LINE MANAGER (Review)
     ↓
Line Manager reviews → Approves/Rejects
     ↓
DEPT HEAD (Approve & Stamp)
     ↓
Dept Head approves, PDF stamped, moved to Approved folder
     ↓
ARCHIVED
     ↓
Previous approved version moved to Archive
```

Each stage generates notifications and maintains a complete audit trail.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | Component framework with static typing |
| Build | Vite | Fast dev server and optimized production builds |
| Styling | Tailwind CSS | Utility-first responsive design |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Database | PostgreSQL (Supabase) | Schema with RLS policies for role-based access |
| Storage | Supabase Storage | Private bucket for CAD/PDF files |
| Realtime | Supabase Channels | WebSocket subscriptions for live updates |
| Deployment | Vercel | Frontend hosting |

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── AppSidebar.tsx
│   ├── DashboardHeader.tsx
│   ├── DrawingTable.tsx
│   ├── ProfileDialog.tsx
│   ├── UploadDrawingDialog.tsx
│   ├── RejectDialog.tsx
│   ├── StampingOverlay.tsx
│   └── ui/              # shadcn/ui component library
├── pages/               # Dashboard pages by role
│   ├── DesignerDashboard.tsx
│   ├── LineManagerDashboard.tsx
│   ├── DeptHeadDashboard.tsx
│   ├── SiteEngineerDashboard.tsx
│   └── VendorClientDashboard.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx      # Authentication context
│   ├── useDrawings.ts   # Drawings data fetching
│   └── useProjects.ts   # Projects data fetching
├── lib/                 # Utilities
│   ├── storageUtils.ts  # Cloud storage operations
│   ├── notifications.ts # Notification helpers
│   └── utils.ts         # General utilities
├── integrations/        # External service clients
│   ├── supabase/
│   └── kalpa_auth/
└── data/                # Mock data and constants
    ├── mockData.ts
    └── drawingCodes.ts  # Standard drawing type codes

supabase/
├── migrations/          # Database schema migrations
├── functions/           # Edge functions (PDF stamping)
└── config.toml          # Supabase local config
```

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/bun
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/kalpa-power.git
   cd kalpa-power
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Create `.env.local`**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start dev server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5173`

5. **Set up Supabase** (if local development)
   ```bash
   npm run supabase:start
   ```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for client auth |

Get these from Supabase dashboard: **Settings → API**.

## Database Schema

The system uses five main tables:

- **profiles** – User information, role assignments, contact details
- **user_roles** – Role assignments (RBAC mapping)
- **projects** – Solar project metadata (number, name, location)
- **drawings** – Drawing records with status, revisions, storage paths
- **drawing_comments** – Review comments and feedback threads
- **notifications** – Realtime activity log for users

All tables enforce Row-Level Security (RLS) policies based on user role.

## Key Workflows

### Upload Drawing (Designer)
1. Select project and drawing type
2. System auto-generates document number
3. Upload PDF and/or CAD file
4. File moved to Working folder
5. Notification sent to Line Manager

### Review & Approve (Line Manager)
1. View under-review drawings
2. Accept (move to pending Dept Head approval) or Reject
3. If rejected: notify designer, move to archive
4. Notification sent to Dept Head (if accepted)

### Final Approval & Stamp (Dept Head)
1. Review approved drawings
2. Generate approval stamp (date, signature)
3. Stamp PDF and upload to Approved folder
4. Archive previous approved version (if exists)
5. Notify designer and team

### View (Site Engineer / Vendor-Client)
1. Access only approved drawings
2. Download via signed URL (valid 120 seconds)
3. Cannot modify or approve

## API & Storage

- **API Client** – Supabase TypeScript SDK for database and auth
- **Storage** – Private bucket `drawing-files` with path structure: `{project_number}/[working|approved|archive]/{drawingNo}_R{revision}.ext`
- **Signed URLs** – Generated server-side with 120-second expiry for secure file access
- **Realtime** – Supabase channels listening to `notifications` table INSERT/UPDATE events

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Backend (Supabase)

1. Migrations run automatically on deployment
2. Edge functions deployed via Supabase CLI
3. No additional backend infrastructure required

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting & Formatting
```bash
npm run lint
npm run format
```

## Known Limitations & Future Improvements

- **Concurrent Uploads** – Multiple simultaneous revisions may trigger unique constraint errors (queuing logic planned)
- **Bulk Operations** – No batch approval UI yet (single-drawing workflow only)
- **CAD Rendering** – DWG preview requires third-party integration (currently download-only)
- **Custom Approver Routing** – Approval chain hardcoded to role hierarchy (configurable routing planned)
- **Audit Export** – No built-in report generation (accessible via Supabase exports)

## Team

**Project Contributors:**
- Karkele Om Vivekanand
- Kaustubh Devidas Mukdam
- Katkar Aditya Yashwant
- Kartik Mandhane

**Faculty Guide:**
- Dr. Kirti Wanjale
- Department of Computer Engineering
- VIT Pune

## License

This project is proprietary software developed for Kalpa Power. Unauthorized copying or distribution is prohibited.

---

**Questions or Issues?** Open an issue on this repository or reach out to the maintainers via GitHub.
