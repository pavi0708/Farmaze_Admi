# Freshflow Dashboard (Client Frontend)

React SPA for restaurant clients. Ordering, procurement management, analytics, forecasts, chat bot.

## Stack
React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui

## Key Pages
```
/orders              # Order history + instant ordering
/procurement         # Procurement tab (6 sub-pages)
/procurement/orders  # Supplier order tracking
/procurement/suppliers # Supplier management
/procurement/forecast # Demand forecast view
/procurement/waste   # Waste alerts
/procurement/prices  # Price comparison
/analytics           # Spending + volume analytics
/invoices            # Invoice history
```

## Architecture
```
src/
├── pages/           # Route pages
├── components/      # Reusable UI components
├── api/             # API client functions
│   ├── procurementApi.ts  # Procurement API calls
│   └── ...
├── contexts/        # React Context (auth, theme)
├── hooks/           # Custom hooks
└── lib/             # Utilities
```

## Chat Bot (being replaced)
Currently connects to farmaze-mcp-client via WebSocket.
Will be replaced by farmaze-agent Insights Agent (WebSocket).
See `docs/PLAN-PROCUREMENT-AGENT.md` Phase G.
