import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TransactionLog } from "@shared/schema";
import { Terminal, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface TransactionLogsProps {
  logs: TransactionLog[];
}

const logLevelConfig = {
  info: {
    icon: Info,
    className: "text-info",
    bgClassName: "bg-info/10",
  },
  warn: {
    icon: AlertTriangle,
    className: "text-warning",
    bgClassName: "bg-warning/10",
  },
  error: {
    icon: AlertCircle,
    className: "text-destructive",
    bgClassName: "bg-destructive/10",
  },
};

export function TransactionLogs({ logs }: TransactionLogsProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Transaction Logs
        </CardTitle>
        <Terminal className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {sortedLogs.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No logs yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 font-mono text-xs" data-testid="list-transaction-logs">
              {sortedLogs.map((log) => {
                const config = logLevelConfig[log.level];
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className={`flex gap-2 p-2 rounded-md ${config.bgClassName}`}
                    data-testid={`log-${log.id}`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">
                          {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                        </span>
                        <Badge
                          variant="outline"
                          className={`uppercase ${config.className} text-[10px] px-1.5 py-0`}
                        >
                          {log.level}
                        </Badge>
                        {log.orderId && (
                          <span className="text-muted-foreground text-[10px]">
                            [{log.orderId.slice(0, 8)}]
                          </span>
                        )}
                      </div>
                      <p className="break-words">{log.message}</p>
                      {log.data && (
                        <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
