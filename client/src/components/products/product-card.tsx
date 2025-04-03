import { Button } from "@/components/ui/button";
import { Product } from "@/shared/schema";
import { ShoppingCart, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  storeName?: string;
  showStoreName?: boolean;
}

const ProductCard = ({ product, storeName, showStoreName = false }: ProductCardProps) => {
  const getStockStatusDisplay = () => {
    if (product.stock <= 0) {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
          Out of Stock
        </span>
      );
    } else if (product.stock < 10) {
      return (
        <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
          Low Stock ({product.stock})
        </span>
      );
    } else {
      return (
        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
          In Stock ({product.stock})
        </span>
      );
    }
  };

  // Parse price to display in correct format
  const formatPrice = (price: string) => {
    // Handle if price is already in correct format
    if (price.startsWith('$')) {
      return price;
    }
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    
    return `$${numPrice.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {product.image ? (
        <img 
          className="w-full h-48 object-cover" 
          src={product.image} 
          alt={product.name} 
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No Image</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
            {showStoreName && storeName && (
              <p className="text-sm text-gray-500 mt-1">{storeName}</p>
            )}
          </div>
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
        </div>
        {product.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3">
          {getStockStatusDisplay()}
        </div>
        <div className="mt-4">
          <div className="flex gap-2">
            <Button 
              className="flex-1 inline-flex justify-center items-center"
              disabled={product.stock <= 0}
              onClick={() => {
                useCart.getState().addItem(product);
                toast({
                  title: "Added to cart",
                  description: `${product.name} has been added to your cart`,
                });
              }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                "hover:text-red-500",
                isFavorite(product.id) && "text-red-500"
              )}
            >
              <Heart className="w-5 h-5" fill={isFavorite(product.id) ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { ShoppingCart, Store as StoreIcon } from "lucide-react";

interface ProductCardProps {
  product: Product;
  showStore?: boolean;
}

export function ProductCard({ product, showStore = true }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">${Number(product.price).toFixed(2)}</div>
          {showStore && product.store && (
            <Link href={`/store/${product.store.store_id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center">
              <StoreIcon className="h-4 w-4 mr-1" />
              {product.store.name}
            </Link>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
