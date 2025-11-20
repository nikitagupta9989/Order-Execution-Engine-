import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, InsertOrder, OrderStatusUpdate, TransactionLog } from "@shared/schema";
import { OrderForm } from "@/components/order-form";
import { ActiveOrdersList } from "@/components/active-orders-list";
import { OrderHistory } from "@/components/order-history";
import { TransactionLogs } from "@/components/transaction-logs";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowDownUp, Activity } from "lucide-react";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial orders
  const { data: initialOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "orderUpdate") {
            const update: OrderStatusUpdate = message.data;
            
            // Update orders state
            setOrders((prev) =>
              prev.map((order) =>
                order.id === update.orderId
                  ? {
                      ...order,
                      status: update.status,
                      updatedAt: new Date(update.timestamp).toISOString(),
                      ...(update.data?.routingDecision && {
                        selectedDex: update.data.routingDecision.selectedDex,
                        routingData: update.data.routingDecision,
                      }),
                      ...(update.data?.txHash && { txHash: update.data.txHash }),
                      ...(update.data?.executionPrice && {
                        executionPrice: update.data.executionPrice.toString(),
                      }),
                      ...(update.data?.errorMessage && {
                        errorMessage: update.data.errorMessage,
                      }),
                    }
                  : order
              )
            );

            // Add log entry
            const logMessage =
              update.status === "routing"
                ? "Comparing DEX prices..."
                : update.status === "building"
                ? "Creating transaction..."
                : update.status === "submitted"
                ? "Transaction sent to network"
                : update.status === "confirmed"
                ? `Order confirmed! Tx: ${update.data?.txHash?.slice(0, 8)}...`
                : update.status === "failed"
                ? `Order failed: ${update.data?.errorMessage}`
                : `Order status: ${update.status}`;

            setLogs((prev) => [
              {
                id: `${update.orderId}-${update.timestamp}`,
                orderId: update.orderId,
                level: update.status === "failed" ? "error" : "info",
                message: logMessage,
                timestamp: update.timestamp,
                data: update.data,
              },
              ...prev,
            ]);

            // Show toast for important status changes
            if (update.status === "confirmed") {
              toast({
                title: "Order Confirmed!",
                description: `Order ${update.orderId.slice(0, 8)}... executed successfully`,
              });
            } else if (update.status === "failed") {
              toast({
                title: "Order Failed",
                description: update.data?.errorMessage || "Unknown error",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [toast]);

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const response = await apiRequest<Order>("POST", "/api/orders/execute", data);
      return response;
    },
    onSuccess: (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      
      setLogs((prev) => [
        {
          id: `${newOrder.id}-${Date.now()}`,
          orderId: newOrder.id,
          level: "info",
          message: `Order submitted: ${newOrder.tokenPair} - ${newOrder.amount}`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      toast({
        title: "Order Submitted",
        description: `Order ${newOrder.id.slice(0, 8)}... is being processed`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit order",
        description: error.message || "Please try again",
        variant: "destructive",
      });

      setLogs((prev) => [
        {
          id: `error-${Date.now()}`,
          orderId: "",
          level: "error",
          message: `Failed to submit order: ${error.message}`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-md p-2">
                <ArrowDownUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">DEX Order Engine</h1>
                <p className="text-xs text-muted-foreground">
                  Market Orders · Raydium & Meteora
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-md">
                <div
                  className={`h-2 w-2 rounded-full ${
                    wsConnected ? "bg-success animate-pulse" : "bg-muted-foreground"
                  }`}
                  data-testid="indicator-ws-status"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {wsConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Form & Active Orders */}
          <div className="lg:col-span-2 space-y-6">
            <OrderForm
              onSubmit={(data) => submitOrderMutation.mutate(data)}
              isPending={submitOrderMutation.isPending}
            />
            <ActiveOrdersList orders={orders} />
          </div>

          {/* Right Column - History & Logs */}
          <div className="space-y-6">
            <OrderHistory orders={orders} />
            <TransactionLogs logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}
