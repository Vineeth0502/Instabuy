
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function PlaceOrder() {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item._id,
            quantity: item.quantity,
            price: item.price
          })),
          total: totalPrice
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to place order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and is being processed.",
      });
      clearCart();
      navigate("/user-dashboard?tab=orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={() => placeOrderMutation.mutate()}
      disabled={items.length === 0 || placeOrderMutation.isPending}
    >
      {placeOrderMutation.isPending ? "Processing..." : `Place Order ($${totalPrice.toFixed(2)})`}
    </Button>
  );
}
