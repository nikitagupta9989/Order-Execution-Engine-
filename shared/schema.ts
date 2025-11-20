import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Order status enum
export const orderStatuses = [
  "pending",
  "routing",
  "building",
  "submitted",
  "confirmed",
  "failed"
] as const;

export type OrderStatus = typeof orderStatuses[number];

// DEX platforms
export const dexPlatforms = ["raydium", "meteora"] as const;
export type DexPlatform = typeof dexPlatforms[number];

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenPair: text("token_pair").notNull(), // e.g., "SOL/USDC"
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  status: text("status").notNull().default("pending"),
  selectedDex: text("selected_dex"), // which DEX was chosen
  executionPrice: decimal("execution_price", { precision: 20, scale: 8 }),
  slippageTolerance: decimal("slippage_tolerance", { precision: 5, scale: 2 }).notNull().default("1.0"),
  txHash: text("tx_hash"),
  errorMessage: text("error_message"),
  routingData: jsonb("routing_data"), // stores DEX comparison data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema for orders
export const insertOrderSchema = createInsertSchema(orders).pick({
  tokenPair: true,
  amount: true,
  slippageTolerance: true,
}).extend({
  tokenPair: z.string().min(1, "Token pair is required"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  slippageTolerance: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Slippage must be between 0 and 100"),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// DEX Quote type (for routing comparison)
export interface DexQuote {
  dex: DexPlatform;
  price: number;
  liquidity: number;
  estimatedOutput: number;
  priceImpact: number;
  timestamp: number;
}

// Routing decision type
export interface RoutingDecision {
  raydiumQuote: DexQuote;
  meteoraQuote: DexQuote;
  selectedDex: DexPlatform;
  priceDifference: number; // percentage
  reason: string;
}

// WebSocket message types
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: number;
  data?: {
    routingDecision?: RoutingDecision;
    txHash?: string;
    executionPrice?: number;
    errorMessage?: string;
  };
}

// Transaction log type
export interface TransactionLog {
  id: string;
  orderId: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: number;
  data?: any;
}
