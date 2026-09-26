# 🏢 RentFlow — Rent & Maintenance Collection SaaS

> **A modern full-stack SaaS product designed for landlords and tenants to automate billing, track rent collection with UPI QR & UTR verification, eliminate missed payments, raise repair tickets, and monitor occupancy.**

---

## 🌟 Live Demo & Quick Links

- **Frontend Web & PWA App**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **PostgreSQL Database**: Port `5433` (Data: `pgdata/`)

### 🔑 Pre-seeded Demo Credentials (1-Click Switch on Login)
| Role | Portal / App | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- | :--- |
| **Landlord** | [Command Center](http://localhost:3000/login) | `rahul.sharma@example.com` | `Password123!` | Dual Desktop & Smartphone views, buildings, units, leases, batch billing, 3 pre-set WhatsApp templates, notification bell, maintenance resolution |
| **Tenant** | [Tenant Mobile App](http://localhost:3000/login) | `amit.kumar@example.com` | `Password123!` | Rent due hero card, 1-tap UPI QR pay, UTR submission, HRA tax receipts, raise repair tickets, live notification feed |

---

## 📂 Clean & Modular Project Structure

The project is structured as an enterprise-grade monorepo separating Backend API, Frontend App, and Operational Scripts:

```
rentflow/
├── backend/                       # NestJS 10 REST API & Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL entities (Users, Properties, Units, Leases, Invoices, Payments, Maintenance, Notifications)
│   │   ├── migrations/            # Schema version history
│   │   └── seed.ts                # Database seeder with realistic test data
│   ├── src/
│   │   ├── common/                # Shared decorators, exception filters, guards, and interceptors
│   │   │   ├── decorators/        # @CurrentUser()
│   │   │   ├── filters/           # Global HttpExceptionFilter
│   │   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   │   └── interceptors/      # TransformInterceptor ({ success: true, data })
│   │   ├── modules/               # Domain feature modules
│   │   │   ├── auth/              # JWT authentication & password hashing
│   │   │   ├── dashboard/         # Aggregated financial KPIs & occupancy analytics
│   │   │   ├── invoices/          # Automated batch invoice engine & public bills
│   │   │   ├── leases/            # Active lease agreements & unit state sync
│   │   │   ├── maintenance/       # Repair tickets lifecycle (OPEN, IN_PROGRESS, RESOLVED)
│   │   │   ├── notifications/     # In-app notification center & unread counter
│   │   │   ├── payments/          # Atomic payment ledger & audit trail
│   │   │   ├── properties/        # Multi-property CRUD operations
│   │   │   ├── tenant-portal/     # Tenant dashboard & UTR payment reporting
│   │   │   ├── tenants/           # Tenant registry & contact management
│   │   │   ├── units/             # Flat & unit allocations with occupancy status
│   │   │   └── users/             # Landlord profile, UPI, bank, & PAN settings
│   │   ├── prisma/                # PrismaService & PrismaModule
│   │   ├── app.module.ts          # Central NestJS application module
│   │   └── main.ts                # NestJS bootstrap entrypoint (Port 4000)
│   ├── test/                      # 29 End-to-end integration test suites
│   ├── .env                       # Backend database connection & JWT secrets
│   ├── nest-cli.json              # NestJS CLI configuration
│   ├── package.json               # Backend dependencies & script definitions
│   └── tsconfig.json              # Backend TypeScript configuration
│
├── frontend/                      # Next.js 14 App Router & Tailwind CSS PWA
│   ├── public/
│   │   ├── manifest.json          # Web App Manifest for mobile standalone mode
│   │   ├── sw.js                  # Service Worker with offline caching strategies
│   │   ├── icon-192.png           # 192x192 PWA maskable app icon
│   │   ├── icon-512.png           # 512x512 PWA maskable app icon
│   │   └── apple-touch-icon.png   # iOS home screen bookmark icon
│   ├── src/
│   │   ├── app/                   # Next.js 14 App Router pages & layouts
│   │   │   ├── (auth)/            # Login & Register authentication flows
│   │   │   ├── dashboard/         # Landlord Portal (Properties, Tenants, Invoices, Ledger, Maintenance, Settings)
│   │   │   ├── pay/[id]/          # Public tenant payment & printable receipt page
│   │   │   ├── tenant/            # Tenant Mobile Portal (Home, Receipts/HRA, Maintenance)
│   │   │   ├── layout.tsx         # Root layout with PWA meta & installer banner
│   │   │   └── page.tsx           # High-converting SaaS landing page
│   │   ├── components/            # Reusable UI component library
│   │   │   ├── layout/            # Desktop Header, Landlord Mobile Header, Bottom Nav, Sidebar, Notification Bell
│   │   │   ├── modals/            # WhatsApp Reminder Modal, Payment Modal
│   │   │   ├── pwa/               # PWA Install Prompt & iOS Safari instructions
│   │   │   ├── pwa-installer.tsx  # Modular re-export
│   │   │   └── whatsapp-modal.tsx # Modular re-export
│   │   ├── lib/
│   │   │   └── api.ts             # Type-safe API client & JWT token manager
│   │   └── styles/
│   │       └── globals.css        # Tailwind CSS styling & animations
│   ├── package.json               # Frontend dependencies & Next.js scripts
│   ├── tailwind.config.ts         # Tailwind design system & theme colors
│   └── tsconfig.json              # Frontend TypeScript configuration
│
├── scripts/                       # Operational & Developer tooling
│   ├── start-all.ps1              # Full-stack PowerShell launcher
│   └── start-all.bat              # 1-Click launcher for Windows Explorer
│
├── pgdata/                        # Local PostgreSQL database cluster (Port 5433)
├── .gitignore                     # Repository gitignore (ignores builds, node_modules, pgdata, .env)
├── package.json                   # Root monorepo workspace orchestrator
├── start.bat                      # Instant 1-click startup from repository root
└── README.md                      # Complete system documentation
```

---

## ⚡ Root Monorepo Commands

Run any of these unified commands directly from the root repository:

```powershell
# Start both backend and frontend concurrently
npm run build              # Builds both backend (NestJS) and frontend (Next.js)
npm run build:backend      # Builds only the NestJS backend
npm run build:frontend     # Builds only the Next.js frontend

# Development modes
npm run dev:backend        # Runs backend in hot-reload watch mode
npm run dev:frontend       # Runs Next.js frontend in development mode

# Production runtime
npm run start:backend      # Starts backend via node dist/src/main.js
npm run start:frontend     # Starts Next.js production server

# Database utilities
npm run db:push            # Synchronizes Prisma schema with PostgreSQL
npm run db:seed            # Seeds demo landlord, tenants, invoices, and tickets
npm run db:studio          # Launches Prisma Studio visual database GUI
```

---

## 🚀 1-Click Launchers for Windows

You can launch all services (PostgreSQL, NestJS API, Next.js Web App, and open the browser) with a single click:

- Double-click **`start.bat`** in the repository root.
- Or run in PowerShell:
  ```powershell
  .\start-all.ps1
  ```

---

## 📱 Feature Highlights

1. **Installable PWA (Add to Home Screen)**:
   - Full offline caching via Service Worker (`public/sw.js`).
   - "Install RentFlow App" prompt with automatic Safari iOS instruction modal.
   - Launches in standalone mode without browser navigation bars.

2. **In-App Notification Center & Live Activity Feed**:
   - Notification bell with unread badge counter in Landlord & Tenant headers.
   - Fires live on:
     - Tenant submits payment UTR.
     - Landlord marks invoice settled.
     - Maintenance ticket changes status to `IN_PROGRESS` or `RESOLVED`.

3. **Pre-Set WhatsApp Reminder Templates**:
   - 1-click modal with 3 customized templates:
     - *Gentle Reminder (3 days before)*
     - *Due Today Reminder*
     - *Firm Overdue Notice*
   - Includes live preview, custom edits, 1-tap copy, and direct WhatsApp dispatch.

4. **Dual Smartphone & Desktop Views**:
   - Responsive design allowing landlords to toggle between an authentic mobile app frame and an expansive desktop management console.
