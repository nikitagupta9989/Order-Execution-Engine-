import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@shared/schema";
import { History, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  const completedOrders = orders
    .filter((order) => order.status === "confirmed" || order.status === "failed")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Order History
        </CardTitle>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">
            {completedOrders.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {completedOrders.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No completed orders yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2" data-testid="list-order-history">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-md p-3 hover-elevate space-y-2"
                  data-testid={`history-order-${order.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {order.tokenPair}
                        </span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {order.amount}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {order.id.slice(0, 16)}...
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-mono">
                        {format(new Date(order.updatedAt), "MMM d, HH:mm:ss")}
                      </p>
                    </div>
                    {order.selectedDex && (
                      <div>
                        <span className="text-muted-foreground">DEX:</span>
                        <p className="font-semibold uppercase">{order.selectedDex}</p>
                      </div>
                    )}
                    {order.executionPrice && (
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-mono font-medium">
                          ${parseFloat(order.executionPrice).toFixed(4)}
                        </p>
                      </div>
                    )}
                    {order.txHash && (
                      <div>
                        <span className="text-muted-foreground">Tx:</span>
                        <a
                          href={`https://solscan.io/tx/${order.txHash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-mono"
                          data-testid={`link-history-tx-${order.id}`}
                        >
                          {order.txHash.slice(0, 8)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {order.errorMessage && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
                      <p className="text-xs text-destructive">
                        {order.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
