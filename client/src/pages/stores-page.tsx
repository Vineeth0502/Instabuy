import { useQuery } from "@tanstack/react-query";
import { Store } from "@shared/schema";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function StoresPage() {
  const { data: stores, isLoading, error } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const response = await fetch("/api/stores", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch stores");
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

  if (error || !stores) {
    return (
      <div className="container py-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error Loading Stores</h2>
          <p className="text-muted-foreground">Sorry, we couldn't load the stores. Please try again.</p>
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
            <h1 className="text-3xl font-bold">Explore Stores</h1>
            <p className="text-muted-foreground">Discover amazing products from our sellers</p>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No stores available yet</h3>
            <p className="text-muted-foreground mt-2">Check back later for new stores</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link key={store.id} href={`/store/${store.id}`}>
                <Card className="h-full cursor-pointer transition-all hover:shadow-md overflow-hidden">
                  <div className="h-48 relative bg-muted overflow-hidden">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-r from-primary/10 to-primary/5">
                        <ShoppingBag className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">{store.name}</CardTitle>
                      <Badge className="ml-2 whitespace-nowrap">Store</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {store.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="mr-1 h-4 w-4" />
                      <span>{store.productCount || 0} Products</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Store ID: {store.store_id}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>
                      {store.createdAt
                        ? `Joined ${format(new Date(store.createdAt), 'MMM yyyy')}`
                        : "Recently joined"}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}