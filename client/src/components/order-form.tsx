import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertOrderSchema, type InsertOrder } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownUp } from "lucide-react";

interface OrderFormProps {
  onSubmit: (data: InsertOrder) => void;
  isPending: boolean;
}

const TOKEN_PAIRS = [
  "SOL/USDC",
  "SOL/USDT",
  "RAY/USDC",
  "BONK/SOL",
  "JUP/USDC",
  "ORCA/USDC",
];

export function OrderForm({ onSubmit, isPending }: OrderFormProps) {
  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      tokenPair: "",
      amount: "",
      slippageTolerance: "1.0",
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">New Market Order</CardTitle>
        <ArrowDownUp className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tokenPair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Pair</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-token-pair">
                        <SelectValue placeholder="Select token pair" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TOKEN_PAIRS.map((pair) => (
                        <SelectItem key={pair} value={pair} data-testid={`option-${pair}`}>
                          {pair}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.00000001"
                      placeholder="0.00"
                      disabled={isPending}
                      data-testid="input-amount"
                      className="font-mono text-base"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Amount in base token
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slippageTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slippage Tolerance (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      disabled={isPending}
                      data-testid="input-slippage"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Maximum price movement allowed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              data-testid="button-submit-order"
            >
              {isPending ? "Submitting Order..." : "Execute Market Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
