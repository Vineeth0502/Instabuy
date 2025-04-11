
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, Tag, Layers, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const { toast } = useToast(); 
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin h-12 w-12 border-t-2 border-primary border-solid rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !products) {
    return (
      <div className="container py-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error Loading Products</h2>
          <p className="text-muted-foreground">Sorry, we couldn't load the products. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">All Products</h1>
              <p className="text-muted-foreground">Browse through our collection of amazing products</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">No products available yet</h3>
              <p className="text-muted-foreground mt-2">Check back later for new products</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card 
                  key={product._id} 
                  className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="h-48 relative bg-muted overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-r from-primary/10 to-primary/5">
                        <Package className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="absolute top-2 right-2">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Tag className="mr-1 h-4 w-4" />
                          <span>${product.price}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Layers className="mr-1 h-4 w-4" />
                          <span>{product.stock} in stock</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const wasFavorite = isFavorite(product._id);
                        toggleFavorite(product._id);
                        toast({
                          title: wasFavorite ? "Removed from favorites" : "Added to favorites",
                          description: `${product.name} has been ${wasFavorite ? "removed from" : "added to"} your favorites`,
                        });
                      }}
                      className={cn(
                        "hover:text-red-500",
                        isFavorite(product._id) && "text-red-500"
                      )}
                    >
                      <Heart className="h-4 w-4" fill={isFavorite(product._id) ? "currentColor" : "none"} />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
