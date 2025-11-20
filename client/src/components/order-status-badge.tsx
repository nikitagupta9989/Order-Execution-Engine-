import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@shared/schema";
import {
  Clock,
  Route,
  Hammer,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  },
  routing: {
    label: "Routing",
    icon: Route,
    className: "bg-info/10 text-info border-info/20 animate-pulse-subtle",
  },
  building: {
    label: "Building",
    icon: Hammer,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className} flex items-center gap-1.5 px-2.5 py-1`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {config.label}
      </span>
    </Badge>
  );
}
