# freshflow-dashboard (→ farmaze-client)

> See `~/mywork/farmaze/CLAUDE.md` for repo map, deploy, staging URLs. Loveable design spec: `docs/loveable-farmaze-client.md`.

## What This Service Does
React/Vite client-facing dashboard. Restaurants/HoReCa users browse products, place orders (text/image/voice), see forecasts, waste alerts, AI chat. 18 routes. Two role experiences: `client_admin` and `client`.

**Stack:** React 18, Vite, TypeScript, shadcn-ui, Tailwind, TanStack Query, Recharts, lucide-react.
**Design tokens:** primary blue hsl(217 91% 60%), Rubik (body) + Playfair Display (headings), 8px radius.

## Layout

```
src/
├── pages/
│   ├── InsightsAgent.tsx         client_admin index — Claude-style chat (agentChat)
│   ├── SmartOrder.tsx            client index — text/image/voice instant ordering
│   ├── OnboardingSetup.tsx       NEW — Drive folder onboarding via farmaze-agent SSE
│   ├── AIOrderForecast.tsx       Prophet forecast charts + confidence bands
│   ├── WasteAnalytics.tsx        waste KPIs + alerts
│   ├── BranchManagement.tsx      table view CRUD
│   ├── MySuppliers.tsx, MyProducts.tsx, Cart.tsx, Orders.tsx, Profile.tsx, …
├── components/
│   ├── orders/                   OrderTabs, ProductMatchPreview, InstantOCRUpload
│   ├── chat/ChatInterface.tsx    AI chat (agent /chat HTTP)
│   ├── auth/RoleBasedRoute.tsx   role guard
│   ├── waste/, forecasts/        sub-components
│   └── layout/Header.tsx         role-aware nav
├── api/
│   ├── agentApi.ts               agentChat() + agentGenerateInsights() → farmaze-agent
│   ├── analyticsApi.ts           forecast + waste + recommendations
│   ├── orderApi.ts, procurementApi.ts, mcpInsightsApi.ts (HTTP via agent)
├── context/
│   ├── AuthContext.tsx           loads user + branches on login, role from JWT
│   └── CartContext.tsx           per-user localStorage, has deliveryBranchId
├── utils/onboardingTransform.ts  SSE events → UI timeline (used by OnboardingSetup)
└── App.tsx                       RootRedirect by role + RoleBasedRoute guards
```

## Role-Based Navigation

| | client_admin | client |
|---|---|---|
| Index | `/insights` | `/smart-order` |
| Nav | Insights, Dashboard | Smart Order, Orders, Support |
| Blocked | `/smart-order`, `/orders`, `/support` | `/insights`, `/dashboard`, `/analytics` |
| Logo home | `/insights` | `/smart-order` |

Implemented in `App.tsx` (`RootRedirect`, `RoleBasedRoute`) and `Header.tsx` (`isAdmin` flag).

## Onboarding Flow (`OnboardingSetup.tsx`)

Used to bulk-import a new client's historical orders from a Google Drive folder.
- Calls farmaze-agent `/onboard/*` endpoints (see `farmaze-agent/CLAUDE.md`)
- Subscribes to SSE event stream; `utils/onboardingTransform.ts` converts events → timeline state
- Events: `listed`, `extracted` (carries `branch` + `date`), `persisted`, `error`, `done`
- Per-branch stats from `aggregate()` shown in summary cards

**All users:** `/cart`, `/profile`, `/invoices`, `/invoice/:id`, `/order/:id`, `/ai-forecast`, `/branches`, `/procurement/*`, `/my-suppliers`, `/my-products`

When debugging: the SSE stream is the source of truth. If timeline looks wrong, check the transform first, not the agent.

## Frontend Workflow
Loveable AI generates UI from `docs/loveable-farmaze-client.md`. Claude Code wires API calls (`analyticsApi.ts`, `agentApi.ts`, `orderApi.ts`), `CartContext` + `AuthContext`, routes in `App.tsx`, sidebar/header nav, TanStack Query, error boundaries.

## Common Tasks
- **New page:** Loveable → `pages/` → API call in `api/` → route in `App.tsx` → nav item in `Header.tsx` (gated by role if needed)
- **New API method:** prefer `agentApi.ts` for AI-flavored ops (auto-routes order vs question), `analyticsApi.ts` for analytics, `orderApi.ts` for raw CRUD
- **New role guard:** wrap route in `<RoleBasedRoute allowedRoles={[...]}>`

## Local Dev
```bash
npm install
npm run dev          # Vite :8080
npx tsc --noEmit     # type check
```

## Deploy
```bash
./scripts/deploy-staging.sh client
```
Container: `farmaze-client`. Staging: https://staging-client.farmaze.com/

## New Pages (Feb 2026)

| Page | File | Backend Endpoint |
|------|------|-----------------|
| My Suppliers | `src/pages/MySuppliers.tsx` | `GET /api/v1/b2bclients/my/suppliers` |
| My Products | `src/pages/MyProducts.tsx` | `GET/POST/DELETE /api/v1/b2bclients/my/products` |
| WhatsApp Settings | `src/pages/Profile.tsx` (Notifications tab) | `PUT /api/v1/b2bclients/my/whatsapp` |
| Supply Setup | `src/pages/SupplySetup.tsx` | `GET /onboard/session/:clientId` |

**API methods** in `src/api/procurementApi.ts`:
- `getMySuppliers()`, `getMyProducts()`, `addToMyProducts()`, `removeFromMyProducts()`
- `getClientDetails()`, `updateMyWhatsApp()`

**Nav:** My Suppliers (Truck icon) + My Products (Package icon) in Header dropdown menu.

## Testing
- Login as `client_admin` → lands on `/insights`, nav shows Insights + Dashboard
- Login as `client` → lands on `/smart-order`, nav shows Smart Order + Orders + Support
- `client` visiting `/insights` → redirected to `/smart-order`
- `client_admin` visiting `/smart-order` → redirected to `/insights`
- `/my-suppliers` → shows Farmaze as default supplier (auto-assigned for all clients)
- `/my-products` → shows assigned products + browse/add from global catalog
- `/profile?tab=notifications` → WhatsApp toggle + phone number save
- Paste text order → verify instant matching (not PENDING_REVIEW)
- Upload image → verify OCR + matching flow
- Verify branch selector persists across pages
