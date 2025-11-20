This project is a simple order execution engine that supports **market orders** with basic DEX routing and WebSocket updates. I tried to structure the backend and frontend in a way that’s easy to follow, easy to swap out mocked logic later, and flexible enough to add more order types without rewriting everything.

## Why I Picked Market Orders

same pipeline used by market orders. Only tI started with market orders because they’re the easiest to implement end-to-end. They don’t need waiting logic, they don’t need trigger conditions, and they map nicely to the “just execute this now at the best price” flow. It let me focus on the main parts of the assignment (routing, status updates, queueing, etc.) without getting stuck in price-watching logic.

**How to add limit/sniper later:**
The engine is already structured so limit/sniper orders can basically “wait” for their trigger and then run through the he trigger logic changes, everything else (routing → build → submit → confirm) stays the same.

## Backend Overview (server/)

### API + WebSocket Layer (`server/routes.ts`)

This file exposes:

* `POST /api/orders/execute` → creates a new order and pushes it to the processor
* `GET /api/orders` → order history
* `GET /api/orders/:id` → single order
* WebSocket server on `/ws`

The WebSocket connection is how the UI gets the real-time status updates like `"routing"` or `"submitted"`.
The server keeps track of connected clients and broadcasts updates for the specific orderId.

### DEX Router (`server/dex-router.ts`)

This is a mocked version of Raydium + Meteora:

* I simulate fetching quotes from both DEXes with a small delay (to feel realistic).
* Prices are randomly varied by 2–5% so there’s always a “better” DEX.
* The router returns:

  * quotes from both DEXes
  * which one is better
  * a small explanation (percentage difference)

The goal was to match the assignment’s idea of “compare both venues and choose the best one,” without actually integrating the SDKs.

If I ever want to switch to real devnet trading, this file is the only one that needs major changes.

### Order Processing (`server/order-processor.ts`)

This is where the actual workflow happens. An order goes through:

1. **pending** – accepted
2. **routing** – ask both DEXes for prices
3. **building** – simulate creating a transaction
4. **submitted** – pretend to send it
5. **confirmed** – pretend the chain accepted it
6. **failed** – if anything broke

Every stage sends a WebSocket update to the UI.

There’s also retry logic using exponential backoff.
So if routing fails or the “swap” fails (in the mock), it tries again up to the allowed attempts.

### Storage (`server/storage.ts`)

Currently using a simple in-memory map (`MemStorage`) because it was enough for this assignment.
The interface is written so swapping this out for Postgres later won’t change anything in the processor logic.

## Shared Types (`shared/schema.ts`)

I put all the TypeScript types (orders, statuses, DEX types, routing decisions, WebSocket events) in one place so both the frontend and backend use the exact same definitions.

This helped a lot with the UI because I could import `OrderStatus` and use it directly in things like:

* `order-status-badge.tsx`
* `active-orders-list.tsx`
* `transaction-logs.tsx`

## Frontend Overview (client/src/)

### Components

You have a few “core” components:

* **`order-form.tsx`** → lets users submit a new order (amount, tokens, slippage, etc.)
* **`active-orders-list.tsx`** → shows currently processing orders
* **`order-card.tsx`** → each order with its status + routing info
* **`order-status-badge.tsx`** → small badge showing `"pending"`, `"routing"`, `"confirmed"`, etc.
* **`transaction-logs.tsx`** → essentially a debugging / transparency panel
* **`order-history.tsx`** → shows saved orders from backend

The UI folder also has all the ShadCN components; I didn’t modify those much except using `Button`, `Card`, `Select`, etc.

The frontend side is pretty straightforward because the backend sends well-typed updates (thanks to `shared/schema.ts`).

## How Everything Talks to Everything

### When the user submits a market order:

```
OrderForm → POST /api/orders/execute → server creates order → pushes to processor
```

### Then the processor handles each stage:

```
pending → routing → building → submitted → confirmed
```

### And UI gets real-time events:

```
WebSocket "/ws" → ActiveOrdersList → OrderCard → StatusBadge
```

## Why This Architecture Works (Without Being Overkill)

I aimed for something that:

* is simple enough for an assignment
* but still looks like a “real” routing engine architecture
* and is easy to extend with more complex order types later

The DEX router is isolated, the processor is isolated, and the UI is typed against shared schemas.
It’s all mocked, but the shape matches how a real Solana DEX router would work.

## Adding Limit / Sniper Orders Later (Summary)

I didn’t implement them yet, but the plan would basically be:

* Add `limitPrice` or “launch trigger” fields in `schema.ts`
* Add a small watcher/trigger that activates the order when condition is met
* Once triggered, run it through **the exact same pipeline** as market orders

So there’s no need to rebuild routing, WebSockets, or history.
Only the “when does this order start?” part changes.

## Development Notes / Constraints

* Built with **Node.js + TypeScript**
* Backend uses Fastify
* Frontend uses Vite + React
* Routing + mock slippage + mock tx hash are all simulated
* Queue concurrency and retry logic are conceptually implemented (not using BullMQ yet)
