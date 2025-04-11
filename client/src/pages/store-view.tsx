import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Store, Product } from "@shared/schema";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface StoreViewProps {
  storeId: string;
}

const StoreView = ({ storeId }: StoreViewProps) => {
  const { data: store, isLoading: isLoadingStore } = useQuery<Store>({
    queryKey: ["/api/store", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/store/${storeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch store");
      }
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/store", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/by-store/${storeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  if (!storeId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Store ID</h1>
        <p className="text-muted-foreground mb-6">
          The store ID provided is not valid.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingStore || isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The store you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Store Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <StoreIcon className="h-10 w-10 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground mt-1">
            {store.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        {!products || products.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <StoreIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-medium mt-4">No products available</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              This store hasn't added any products yet. Check back later for new items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-muted-foreground text-sm truncate">
                    {product.description || "No description provided"}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold">${isNaN(Number(product.price)) ? product.price : Number(product.price).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default StoreView;