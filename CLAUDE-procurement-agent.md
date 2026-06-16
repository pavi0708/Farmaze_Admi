# Procurement Agent — Web Dashboard Module (M5)

## What You're Building
New procurement pages in the existing freshflow-dashboard client app.
6 new routes under `/procurement/*` alongside existing 18 routes.
This is the analytics + control layer that complements the WhatsApp agent.

## CRITICAL: Don't Break Existing System
- Only ADD new files and routes. Never modify existing pages.
- Only ADD new nav items. Don't change existing navigation.
- Only ADD a new API client file. Don't modify analyticsApi.ts or orderApi.ts.
- Run `bun run build` before finishing to confirm no build errors.

## Existing Code to Reuse (Don't Rebuild)
- `src/api/analyticsAxios.ts` — Axios instance with Bearer token injection for analytics API
- `src/api/url_config.ts` — Base URL configuration (BACKEND_API_URL, ANALYTICS_API_URL)
- `src/context/AuthContext.tsx` — `useAuth()` hook for logged-in user, client_id
- `src/context/CartContext.tsx` — Reference for context pattern
- `src/components/layout/AuthLayout.tsx` — Page wrapper for authenticated routes
- `src/components/layout/Header.tsx` — Navigation (add procurement items to profile dropdown DropdownMenuContent around line 150-223)
- `src/App.tsx` — Router (add new routes with `<ProtectedRoute><AuthLayout>` wrapper, see existing pattern around line 151-171)
- Recharts library — Already installed, use for charts
- shadcn-ui components — Already configured (components.json), use for all UI
- TanStack React Query — Already installed, use for API state management
- `src/pages/AIOrderForecast.tsx` — Reference for how forecast page is built
- `src/pages/WasteAnalytics.tsx` — Reference for how waste page is built

## Tech Stack (already installed, no new deps needed)
- React 18.3 + Vite 5.4 + TypeScript
- shadcn-ui (Radix UI primitives) + Tailwind CSS 3.4
- Recharts 2.12 for charts
- TanStack React Query 5.56 for API state
- Axios 1.8 for HTTP calls
- date-fns 3.6 for date formatting
- lucide-react 0.462 for icons
- react-hook-form 7.53 + zod 3.23 for forms

## Design Tokens (match existing app)
- Primary: hsl(217 91% 60%) — blue
- Font: Rubik (body), Playfair Display (headings)
- Use shadcn-ui Card, Table, Badge, Button, Dialog, Sheet components
- Follow existing page patterns (see AIOrderForecast.tsx)

## Step 1: Create API Client

Create `src/api/procurementApi.ts`:

```typescript
import { analyticsAxios } from './analyticsAxios';
import axios from 'axios';
import { BACKEND_API_URL } from './url_config';

// Backend API for suppliers and orders
const backendApi = axios.create({ baseURL: BACKEND_API_URL });

// Copy the same token interceptor pattern from analyticsAxios.ts
backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('farmaze_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// --- Supplier endpoints (backend) ---
export const getSuppliers = () =>
  backendApi.get('/api/v1/suppliers');

export const createSupplier = (data: {
  name: string; phone: string; category: string;
  connection_type: string; whatsapp_number?: string;
}) => backendApi.post('/api/v1/suppliers', data);

export const getClientSuppliers = (clientId: string) =>
  backendApi.get(`/api/v1/clients/${clientId}/suppliers`);

export const mapSupplierToClient = (clientId: string, data: {
  supplier_id: string; categories: string[]; is_default?: boolean;
}) => backendApi.post(`/api/v1/clients/${clientId}/suppliers`, data);

export const removeSupplierMapping = (clientId: string, supplierId: string) =>
  backendApi.delete(`/api/v1/clients/${clientId}/suppliers/${supplierId}`);

// --- Supplier order endpoints (backend) ---
export const getSupplierOrders = (params: {
  client_id?: string; supplier_id?: string; status?: string;
  date_from?: string; date_to?: string;
}) => backendApi.get('/api/v1/supplier-orders', { params });

export const getSupplierOrderDetail = (id: string) =>
  backendApi.get(`/api/v1/supplier-orders/${id}`);

export const updateSupplierOrderStatus = (id: string, status: string) =>
  backendApi.put(`/api/v1/supplier-orders/${id}/status`, { status });

// --- Supplier scoring (backend) ---
export const getSupplierScore = (supplierId: string) =>
  backendApi.get(`/api/v1/suppliers/${supplierId}/score`);

// --- Analytics endpoints (farmaze-analytics) ---
export const getProcurementPlan = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/forecast/procurement-plan?client_id=${clientId}`);

export const checkWaste = (clientId: string, items: Array<{ product_id: string; proposed_qty: number }>) =>
  analyticsAxios.post('/api/v1/analytics/waste/check-order', { client_id: clientId, items });

export const comparePrices = (productIds: string) =>
  analyticsAxios.get(`/api/v1/analytics/prices/compare?product_ids=${productIds}`);

export const getPriceAlerts = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/prices/alerts?client_id=${clientId}`);

export const getProcurementMetrics = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/metrics/procurement?client_id=${clientId}`);
```

## Step 2: Add Routes to App.tsx

Add inside the existing `<Routes>` block (after the waste-analytics route):

```tsx
// Import new pages
import ProcurementOverview from './pages/procurement/ProcurementOverview';
import SupplierManagement from './pages/procurement/SupplierManagement';
import ForecastDashboard from './pages/procurement/ForecastDashboard';
import WasteReport from './pages/procurement/WasteReport';
import OrderHistory from './pages/procurement/OrderHistory';
import PriceIntelligence from './pages/procurement/PriceIntelligence';

// Add routes (use same ProtectedRoute + AuthLayout pattern as existing routes)
<Route path="/procurement" element={<ProtectedRoute><AuthLayout><ProcurementOverview /></AuthLayout></ProtectedRoute>} />
<Route path="/procurement/suppliers" element={<ProtectedRoute><AuthLayout><SupplierManagement /></AuthLayout></ProtectedRoute>} />
<Route path="/procurement/forecast" element={<ProtectedRoute><AuthLayout><ForecastDashboard /></AuthLayout></ProtectedRoute>} />
<Route path="/procurement/waste" element={<ProtectedRoute><AuthLayout><WasteReport /></AuthLayout></ProtectedRoute>} />
<Route path="/procurement/orders" element={<ProtectedRoute><AuthLayout><OrderHistory /></AuthLayout></ProtectedRoute>} />
<Route path="/procurement/prices" element={<ProtectedRoute><AuthLayout><PriceIntelligence /></AuthLayout></ProtectedRoute>} />
```

## Step 3: Add Navigation Item

In `src/components/layout/Header.tsx`, add to the DropdownMenuContent (profile dropdown, around line 150-223):

```tsx
import { ShoppingCart } from "lucide-react";

// Add this DropdownMenuItem alongside existing items like Invoices, Dashboard, Intelligence:
<DropdownMenuItem asChild>
  <Link to="/procurement" className="flex items-center gap-2">
    <ShoppingCart className="w-4 h-4" />
    Procurement
  </Link>
</DropdownMenuItem>
```

## Step 4: Build Pages

Create directory: `src/pages/procurement/`

### 4.1 ProcurementOverview.tsx (`/procurement`)

**Layout:**
- Page title: "Procurement Agent"
- Sub-navigation tabs: Overview | Suppliers | Forecast | Waste | Orders | Prices
- 3 stat cards at top row:
  - Today's Spend (₹ amount, vs yesterday %)
  - Waste Saved This Month (₹ amount)
  - No-Touch Order % (percentage, trend)
- Today's orders section: Table grouped by supplier
  - Columns: Supplier, Items, Total, Status (badge: Delivered/In Transit/Confirmed/Pending)
- Tomorrow's forecast preview: Compact card
  - Shows supplier count, item count, total estimate
  - "Confirm All" button, "View Details" link to /procurement/forecast

**API calls:**
- `getProcurementMetrics(clientId)` for stat cards
- `getSupplierOrders({ client_id: clientId, date_from: today, date_to: today })` for today's orders
- `getProcurementPlan(clientId)` for forecast preview

**Sub-navigation pattern** (use for all procurement pages):
```tsx
const procurementTabs = [
  { path: "/procurement", label: "Overview" },
  { path: "/procurement/suppliers", label: "Suppliers" },
  { path: "/procurement/forecast", label: "Forecast" },
  { path: "/procurement/waste", label: "Waste" },
  { path: "/procurement/orders", label: "Orders" },
  { path: "/procurement/prices", label: "Prices" },
];
// Render as horizontal tabs using shadcn Tabs or custom links
```

### 4.2 SupplierManagement.tsx (`/procurement/suppliers`)

**Layout:**
- Same sub-navigation tabs
- "Add Supplier" button (top right) → opens Dialog
- Supplier cards grid (3 columns on desktop):
  - Card: supplier name, category badge, score stars (out of 5), on-time %, phone number
  - Click card → opens Sheet (side panel)
- Sheet content:
  - Supplier detail header (name, phone, category, connection type badge)
  - Performance chart (Recharts line chart: on-time % over last 30 days)
  - Recent orders table (last 10 orders with status)
  - Category mappings (editable multi-select)

**Add Supplier Dialog form:**
- Fields: Name (text), Phone (text), WhatsApp Number (text), Category (select: fresh_produce, dairy, dry_goods, meat, packaging, other), Connection Type (select: whatsapp, email, api)
- Use react-hook-form + zod validation

**API calls:**
- `getClientSuppliers(clientId)` for supplier list
- `createSupplier(data)` + `mapSupplierToClient(clientId, data)` for adding
- `getSupplierScore(supplierId)` for performance data
- `getSupplierOrders({ supplier_id })` for order history

### 4.3 ForecastDashboard.tsx (`/procurement/forecast`)

**Layout:**
- Same sub-navigation tabs
- Date picker (default: tomorrow's date)
- Forecast table grouped by supplier (collapsible accordion sections):
  - Section header: Supplier name + subtotal
  - Table columns: Product, Predicted Qty (editable number input), Unit, Unit Price, Total, Confidence (badge: high/medium/low), Waste Flag
  - Waste-adjusted items: highlighted row with orange background, tooltip explaining "Reduced from 5kg → 3kg (over-ordered 3 of last 4 weeks)"
- Bottom summary bar:
  - Total cost across all suppliers
  - Total savings from waste adjustments
  - Forecast accuracy (last 7 days)
  - "Confirm All Orders" button (primary, large)

**API calls:**
- `getProcurementPlan(clientId)` — returns forecast grouped by supplier

### 4.4 WasteReport.tsx (`/procurement/waste`)

**Layout:**
- Same sub-navigation tabs
- Big stat card: "Saved ₹{amount} this month" (green, prominent)
- Waste trend chart: Recharts line chart, last 30 days, daily waste cost
- Item-level breakdown table:
  - Columns: Product, Avg Ordered, Avg Used (estimated), Waste Qty, Waste Cost/Week, Frequency (e.g., "3 of 4 weeks")
  - Sort by waste cost descending
  - Highlight items with frequency > 2 in red
- Over-ordering alerts section:
  - Cards for products flagged 3+ times
  - Each card: product name, waste trend, "Auto-Adjust" button

**API calls:**
- `checkWaste(clientId, items)` for waste analysis
- `getProcurementMetrics(clientId)` for savings total
- Reuse existing waste analytics endpoints if available

### 4.5 OrderHistory.tsx (`/procurement/orders`)

**Layout:**
- Same sub-navigation tabs
- Filter bar:
  - Supplier dropdown (from getClientSuppliers)
  - Date range picker (two date inputs)
  - Status dropdown: All / Draft / Sent / Confirmed / Delivered / Cancelled
- Orders table:
  - Columns: Date, Supplier, Items Count, Total (₹), Status (badge with color), Delivery Time
  - Sortable columns
  - Pagination (20 per page)
- Click row → opens Sheet (side panel):
  - Order detail header: supplier, date, total, status
  - Items table: product, qty, unit, unit price, line total
  - Status timeline: vertical timeline showing sent → confirmed → delivered timestamps
  - WhatsApp message status (if supplier is WhatsApp-connected)

**API calls:**
- `getSupplierOrders({ client_id, supplier_id, status, date_from, date_to })`
- `getSupplierOrderDetail(id)` for detail sheet
- `getClientSuppliers(clientId)` for filter dropdown

### 4.6 PriceIntelligence.tsx (`/procurement/prices`)

**Layout:**
- Same sub-navigation tabs
- Price comparison table:
  - Rows: products
  - Columns: Product Name, then one column per supplier with their price
  - Cheapest price per row highlighted in green
  - Most expensive in light red
- Price trend section:
  - Select a product → show Recharts line chart with price over last 30 days per supplier
- Spike alerts section:
  - Cards for products with >20% price increase this week
  - Each card: product name, old price, new price, % change, supplier

**API calls:**
- `comparePrices(productIds)` for comparison table
- `getPriceAlerts(clientId)` for spike alerts

## Testing Checklist

1. `bun run build` — Must pass with zero errors
2. Navigate to each `/procurement/*` route — verify page loads without crash
3. Check all existing routes still work: `/smart-order`, `/orders`, `/ai-forecast`, `/waste-analytics`
4. Verify auth — procurement pages redirect to `/login` if not authenticated
5. Verify procurement nav item appears in Header dropdown
6. Check responsive layout on mobile (procurement tabs should scroll horizontally)
