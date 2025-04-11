import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Package, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth"; //Import useAuth hook

export function CartDropdown() {
  const { user } = useAuth();
  const { items, totalItems, totalPrice, removeItem } = useCart();
  const { toast } = useToast();

  if (!user || user.role === "seller") return null;

  const handleRemoveItem = (itemId: string, event: React.MouseEvent) => { // Changed itemId type to string
    event.preventDefault();
    event.stopPropagation();
    removeItem(itemId);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Shopping Cart</p>
            <p className="text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </DropdownMenuLabel>

        <Separator />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] py-2">
              {items.map((item, index) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link href="/cart" className="flex items-start p-2 hover:bg-accent rounded-md">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-2 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      <p className="text-sm font-medium">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 ml-1 -mr-1"
                        onClick={(e) => handleRemoveItem(item._id, e)} // Changed to item._id
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </ScrollArea>

            <Separator />

            <div className="p-4">
              <div className="flex justify-between text-sm mb-4">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/cart">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}