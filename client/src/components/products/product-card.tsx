import { Button } from "@/components/ui/button";
import { Product } from "@/shared/schema";
import { ShoppingCart, Heart, Package } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  showStore?: boolean;
}

export function ProductCard({ product, showStore = true }: ProductCardProps) {
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();
  const { user } = useAuth();
  const isSeller = user?.role === "seller";

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-2xl font-bold">${Number(product.price).toFixed(2)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          {!isSeller && (
            <Button 
              className="flex-1"
              onClick={() => {
                addItem(product);
                toast({
                  title: "Added to cart",
                  description: `${product.name} has been added to your cart`,
                });
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              toggleFavorite(product._id);
              toast({
                title: isFavorite(product._id) ? "Removed from favorites" : "Added to favorites",
                description: `${product.name} has been ${isFavorite(product._id) ? "removed from" : "added to"} your favorites`,
              });
            }}
            className={cn(
              "hover:text-red-500",
              isFavorite(product._id) && "text-red-500"
            )}
          >
            <Heart className="h-4 w-4" fill={isFavorite(product._id) ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;