import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./order-status-badge";
import { Progress } from "@/components/ui/progress";
import type { Order, OrderStatus } from "@shared/schema";
import { Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface OrderCardProps {
  order: Order;
}

const statusSteps: OrderStatus[] = [
  "pending",
  "routing",
  "building",
  "submitted",
  "confirmed",
];

function getProgressPercentage(status: OrderStatus): number {
  if (status === "failed") return 100;
  const currentIndex = statusSteps.indexOf(status);
  return ((currentIndex + 1) / statusSteps.length) * 100;
}

export function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  const routingData = order.routingData as any;

  return (
    <Card className="hover-elevate" data-testid={`card-order-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-base truncate">
                {order.tokenPair}
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                {order.amount}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => copyToClipboard(order.id, "Order ID")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono group"
                data-testid={`button-copy-${order.id}`}
              >
                {order.id.slice(0, 8)}...
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.createdAt), "MMM d, HH:mm:ss")}
              </span>
            </div>
          </div>
          <OrderStatusBadge status={order.status as OrderStatus} />
        </div>

        {order.status !== "failed" && (
          <Progress
            value={getProgressPercentage(order.status as OrderStatus)}
            className="h-1.5 mt-3"
            data-testid={`progress-${order.id}`}
          />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {order.selectedDex && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Executed on:</span>
            <Badge variant="secondary" className="uppercase text-xs font-semibold">
              {order.selectedDex}
            </Badge>
          </div>
        )}

        {order.executionPrice && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Execution Price:</span>
            <span className="font-mono text-sm font-medium">
              ${parseFloat(order.executionPrice).toFixed(4)}
            </span>
          </div>
        )}

        {order.txHash && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Transaction:</span>
            <a
              href={`https://solscan.io/tx/${order.txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline font-mono"
              data-testid={`link-tx-${order.id}`}
            >
              {order.txHash.slice(0, 8)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {order.errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-3">
            <p className="text-xs text-destructive font-medium">
              {order.errorMessage}
            </p>
          </div>
        )}

        {routingData && (
          <div className="border-t pt-3 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between p-2 h-auto"
              data-testid={`button-expand-${order.id}`}
            >
              <span className="text-xs font-medium">DEX Routing Details</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expanded && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-accent/50 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Raydium
                      </span>
                      {routingData.selectedDex === "raydium" && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Price:</span>
                        <span className="text-xs font-mono font-medium">
                          ${routingData.raydiumQuote?.price.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <span className="text-xs font-mono">
                          {routingData.raydiumQuote?.priceImpact.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/50 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Meteora
                      </span>
                      {routingData.selectedDex === "meteora" && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Price:</span>
                        <span className="text-xs font-mono font-medium">
                          ${routingData.meteoraQuote?.price.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <span className="text-xs font-mono">
                          {routingData.meteoraQuote?.priceImpact.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {routingData.priceDifference !== undefined && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Price Difference:
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          Math.abs(routingData.priceDifference) > 2
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      >
                        {routingData.priceDifference > 0 ? "+" : ""}
                        {routingData.priceDifference.toFixed(2)}%
                      </span>
                    </div>
                    {routingData.reason && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {routingData.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
