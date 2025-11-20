# DEX Order Execution Engine

A professional order execution engine with DEX routing between Raydium and Meteora, real-time WebSocket status updates, and concurrent order processing.

## Overview

This application processes **market orders** through an intelligent DEX router that compares prices between Raydium and Meteora pools in real-time, automatically selecting the best execution venue.

### Why Market Orders?

**Market orders** were chosen because they provide:
- **Immediate execution** at current market prices
- **Simpler implementation** focusing on core routing logic
- **Real-time price comparison** showcasing DEX router capabilities
- **Clear user experience** with predictable order flow

### Extension to Other Order Types

The architecture is designed for easy extension:

**Limit Orders**: Add price monitoring in the queue worker. Instead of immediate execution, orders would wait in "pending" status until the target price is reached via periodic price checks.

**Sniper Orders**: Implement token launch detection using Solana program subscribe. Orders would trigger automatically when new token pools are detected on Raydium/Meteora.

## Features

### Core Functionality
- ✅ Market order execution with mock DEX implementation
- ✅ DEX router comparing Raydium vs Meteora prices (2-5% variation)
- ✅ Real-time WebSocket status updates (pending → routing → building → submitted → confirmed/failed)
- ✅ BullMQ queue with Redis for concurrent processing (up to 10 orders)
- ✅ Exponential backoff retry logic (≤3 attempts)
- ✅ Order history with transaction hashes
- ✅ Comprehensive error handling and logging

### Technical Stack
- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Queue**: BullMQ + Redis (in-memory mode)
- **WebSocket**: ws library for real-time updates
- **Storage**: In-memory storage (MemStorage)

## Order Flow

```
1. User submits order via POST /api/orders/execute
2. API validates order and returns orderId
3. Order added to BullMQ queue for processing
4. WebSocket connection broadcasts status updates:
   - "pending" - Order received and queued
   - "routing" - Comparing Raydium vs Meteora prices
   - "building" - Creating transaction
   - "submitted" - Transaction sent to network
   - "confirmed" - Success (includes txHash)
   - "failed" - Error occurred (includes error message)
5. DEX router compares quotes and selects best venue
6. Mock transaction execution (2-3 second delay)
7. Final status with transaction hash returned
```

## DEX Router Logic

The router compares quotes from both DEXs considering:
- **Price**: Lower price = better for buying
- **Liquidity**: Higher liquidity = lower price impact
- **Price Impact**: Calculated based on order size vs pool liquidity

Selection criteria:
1. If price difference > 0.5%, select cheaper DEX
2. If similar prices, select based on liquidity
3. Mock implementation includes 2-5% price variations

## Installation & Setup

### Prerequisites
- Node.js 20+
- Redis (optional - uses in-memory mode by default)

### Install Dependencies
```bash
npm install
```

### Environment Variables
No external API keys required - fully self-contained mock implementation.

### Run Application
```bash
npm run dev
```

The application will start on http://localhost:5000

## API Documentation

### POST /api/orders/execute
Submit a new market order for execution.

**Request Body:**
```json
{
  "tokenPair": "SOL/USDC",
  "amount": "1.5",
  "slippageTolerance": "1.0"
}
```

**Response:**
```json
{
  "id": "abc123...",
  "tokenPair": "SOL/USDC",
  "amount": "1.5",
  "status": "pending",
  "slippageTolerance": "1.0",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/orders
Retrieve all orders.

### GET /api/orders/:id
Retrieve specific order by ID.

### WebSocket /ws
Real-time order status updates.

**Message Format:**
```json
{
  "type": "orderUpdate",
  "data": {
    "orderId": "abc123...",
    "status": "confirmed",
    "timestamp": 1234567890,
    "data": {
      "txHash": "5J7K...",
      "executionPrice": 98.45
    }
  }
}
```

## Architecture Decisions

### Mock vs Real Implementation
**Decision**: Mock DEX implementation with realistic delays and price variations.

**Reasoning**:
- Focuses on demonstrating architecture and real-time flow
- No external dependencies or API keys required
- Faster development and testing
- Easy to extend to real Raydium/Meteora SDKs later

### Queue System
**Decision**: BullMQ with Redis for order processing.

**Reasoning**:
- Handles concurrent orders (10 max)
- Built-in retry logic with exponential backoff
- Job persistence and monitoring
- Rate limiting (100 orders/minute)
- Production-ready reliability

### WebSocket vs HTTP Polling
**Decision**: WebSocket for status updates.

**Reasoning**:
- Real-time updates with low latency
- Efficient - no repeated HTTP requests
- Better user experience with instant feedback
- Scales well for multiple concurrent orders

### In-Memory Storage
**Decision**: MemStorage instead of PostgreSQL.

**Reasoning**:
- Simpler setup and demonstration
- No database configuration required
- Sufficient for development and testing
- Easy to swap with real database later

## Testing

Submit multiple orders simultaneously to see:
- ✅ WebSocket status updates in real-time
- ✅ DEX routing decisions logged
- ✅ Queue processing multiple orders concurrently
- ✅ Retry logic on failures (5% random failure rate)

## Future Enhancements

1. **Real Solana Integration**
   - Integrate @raydium-io/raydium-sdk-v2
   - Integrate @meteora-ag/dynamic-amm-sdk
   - Execute real devnet transactions

2. **Additional Order Types**
   - Limit orders with price monitoring
   - Sniper orders with token launch detection
   - Stop-loss orders

3. **Advanced Features**
   - Multi-hop routing across more DEXs
   - Gas optimization
   - MEV protection
   - Order book visualization

4. **Database**
   - PostgreSQL for persistent storage
   - Order analytics and reporting
   - Historical data analysis

## License

MIT
