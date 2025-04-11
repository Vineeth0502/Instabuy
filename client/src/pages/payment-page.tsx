
import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft } from "lucide-react";

export default function PaymentPage() {
  const [location, setLocation] = useLocation();
  const { cart = [], totalPrice = 0, clearCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  if (!cart || cart.length === 0) {
    setLocation("/cart");
    return null;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        total: totalPrice * 1.08 // Including tax
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create order");
      }

      toast({
        title: "Order placed successfully",
        description: "Thank you for your purchase!"
      });
      clearCart();
      setLocation("/user-dashboard");

    } catch (error) {
      toast({
        title: "Failed to place order",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16 flex flex-col items-center">
      <Button variant="ghost" className="mb-6" onClick={() => setLocation("/cart")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cart
      </Button>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <form onSubmit={handlePayment}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Number</label>
              <Input 
                required
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input required placeholder="MM/YY" maxLength={5} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVV</label>
                <Input required placeholder="123" maxLength={3} type="password" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name on Card</label>
              <Input required placeholder="John Doe" />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Tax (8%)</span>
                <span>${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-t-2 border-current rounded-full mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${(totalPrice * 1.08).toFixed(2)}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
