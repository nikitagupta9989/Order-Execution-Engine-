import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { orderQueue, registerWebSocketClient, unregisterWebSocketClient } from "./order-processor";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("[WebSocket] Client connected");
    registerWebSocketClient(ws);

    ws.on("close", () => {
      console.log("[WebSocket] Client disconnected");
      unregisterWebSocketClient(ws);
    });

    ws.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
      unregisterWebSocketClient(ws);
    });
  });

  // GET /api/orders - Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // GET /api/orders/:id - Get specific order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // POST /api/orders/execute - Submit new order
  app.post("/api/orders/execute", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertOrderSchema.parse(req.body);

      // Create order in storage
      const order = await storage.createOrder(validatedData);

      // Add order to processing queue
      await orderQueue.addOrder({
        orderId: order.id,
        tokenPair: order.tokenPair,
        amount: parseFloat(order.amount),
        slippageTolerance: parseFloat(order.slippageTolerance),
      });

      console.log(`[API] Order ${order.id} created and queued for processing`);

      // Return order immediately
      res.json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // GET /api/health - Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: Date.now(),
      queue: {
        active: "operational",
      },
    });
  });

  console.log("[API] Routes registered successfully");

  return httpServer;
}
