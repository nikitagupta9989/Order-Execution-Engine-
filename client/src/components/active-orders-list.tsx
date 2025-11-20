import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderCard } from "./order-card";
import type { Order } from "@shared/schema";
import { Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActiveOrdersListProps {
  orders: Order[];
}

export function ActiveOrdersList({ orders }: ActiveOrdersListProps) {
  const activeOrders = orders.filter(
    (order) => order.status !== "confirmed" && order.status !== "failed"
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Active Orders
        </CardTitle>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">
            {activeOrders.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {activeOrders.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No active orders
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a new order to get started
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3" data-testid="list-active-orders">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
