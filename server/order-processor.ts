import { storage } from "./storage";
import { dexRouter } from "./dex-router";
import type { OrderStatus, OrderStatusUpdate } from "@shared/schema";

// WebSocket clients registry
const wsClients = new Set<any>();

export function registerWebSocketClient(ws: any) {
  wsClients.add(ws);
}

export function unregisterWebSocketClient(ws: any) {
  wsClients.delete(ws);
}

function broadcastOrderUpdate(update: OrderStatusUpdate) {
  const message = JSON.stringify({
    type: "orderUpdate",
    data: update,
  });

  wsClients.forEach((ws) => {
    if (ws.readyState === 1) {
      // OPEN state
      ws.send(message);
    }
  });
}

async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  data?: OrderStatusUpdate["data"]
) {
  await storage.updateOrder(orderId, { status });

  const update: OrderStatusUpdate = {
    orderId,
    status,
    timestamp: Date.now(),
    data,
  };

  broadcastOrderUpdate(update);
}

// In-memory queue for order processing with true concurrency
class OrderQueue {
  private activeJobs = new Map<string, Promise<any>>();
  private readonly maxConcurrent = 10;

  async addOrder(order: {
    orderId: string;
    tokenPair: string;
    amount: number;
    slippageTolerance: number;
  }) {
    // Clear any stale state from the order
    await storage.updateOrder(order.orderId, {
      selectedDex: null,
      routingData: null,
      txHash: null,
      errorMessage: null,
    });

    // Wait if we're at max capacity
    while (this.activeJobs.size >= this.maxConcurrent) {
      await Promise.race(Array.from(this.activeJobs.values()));
    }

    // Start processing immediately with proper pending state
    const job = this.processOrder(order);
    this.activeJobs.set(order.orderId, job);

    job.finally(() => {
      this.activeJobs.delete(order.orderId);
    });
  }

  private async processOrder(order: {
    orderId: string;
    tokenPair: string;
    amount: number;
    slippageTolerance: number;
  }): Promise<void> {
    const { orderId, tokenPair, amount, slippageTolerance } = order;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Ensure order starts in pending state before processing
        if (attempts === 0) {
          await updateOrderStatus(orderId, "pending");
          console.log(`[OrderProcessor] Order ${orderId} queued for processing`);
        }

        console.log(
          `[OrderProcessor] Processing order ${orderId} (attempt ${attempts + 1}/${maxAttempts})`
        );

        // Step 1: Routing - Compare DEX prices
        await updateOrderStatus(orderId, "routing");
        console.log(`[OrderProcessor] Routing order ${orderId}`);

        const routingDecision = await dexRouter.getRoutingDecision(
          tokenPair,
          amount
        );

        // Update order with routing decision
        await storage.updateOrder(orderId, {
          selectedDex: routingDecision.selectedDex,
          routingData: routingDecision as any,
        });

        await updateOrderStatus(orderId, "routing", { routingDecision });

        // Step 2: Building - Create transaction
        await updateOrderStatus(orderId, "building");
        console.log(`[OrderProcessor] Building transaction for order ${orderId}`);

        // Small delay to simulate transaction building
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 3: Submitted - Execute swap
        await updateOrderStatus(orderId, "submitted");
        console.log(`[OrderProcessor] Submitting transaction for order ${orderId}`);

        const { txHash, executionPrice } = await dexRouter.executeSwap(
          routingDecision.selectedDex,
          tokenPair,
          amount,
          slippageTolerance
        );

        // Step 4: Confirmed - Transaction successful
        await storage.updateOrder(orderId, {
          status: "confirmed",
          txHash,
          executionPrice: executionPrice.toString(),
        });

        await updateOrderStatus(orderId, "confirmed", {
          txHash,
          executionPrice,
        });

        console.log(
          `[OrderProcessor] Order ${orderId} confirmed with tx ${txHash.slice(0, 8)}...`
        );

        return;
      } catch (error: any) {
        attempts++;
        const errorMessage = error.message || "Unknown error occurred";

        console.error(
          `[OrderProcessor] Error processing order ${orderId} (attempt ${attempts}/${maxAttempts}):`,
          errorMessage
        );

        if (attempts >= maxAttempts) {
          // All attempts failed - clear stale routing data and set failure state
          await storage.updateOrder(orderId, {
            status: "failed",
            errorMessage,
            selectedDex: null,
            routingData: null,
            txHash: null,
            executionPrice: null,
          });

          await updateOrderStatus(orderId, "failed", {
            errorMessage,
          });

          console.error(
            `[OrderProcessor] Order ${orderId} failed after ${maxAttempts} attempts: ${errorMessage}`
          );
          return;
        }

        // Exponential backoff: 2s (2^1), 4s (2^2), 8s (2^3)
        const backoffDelay = Math.pow(2, attempts) * 1000;
        console.log(
          `[OrderProcessor] Retrying order ${orderId} in ${backoffDelay}ms...`
        );

        // Clear stale data before retry
        await storage.updateOrder(orderId, {
          status: "pending",
          selectedDex: null,
          routingData: null,
          txHash: null,
          executionPrice: null,
          errorMessage: `Retry ${attempts}/${maxAttempts} after error: ${errorMessage}`,
        });

        // Wait for exponential backoff delay
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }
}

export const orderQueue = new OrderQueue();

console.log("[OrderProcessor] Order processing system initialized");
