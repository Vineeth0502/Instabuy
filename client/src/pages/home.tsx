
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product, Store } from "@shared/schema";
import { Loader2, ShoppingBag, Star, TrendingUp, Package, Heart, ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user } = useAuth();

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products/featured");
      if (!res.ok) throw new Error("Failed to fetch featured products");
      return res.json();
    },
  });

  const { data: stores, isLoading: loadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stores");
      if (!res.ok) throw new Error("Failed to fetch stores");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/20 to-background py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Welcome to Instabuy{user ? `, ${user.username}` : ""}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover amazing products from trusted sellers. Your one-stop destination for quality shopping.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="px-8" asChild>
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link href="/stores">Browse Stores</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Fast Delivery</h3>
                <p className="text-muted-foreground">Quick and reliable shipping</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Shopping</h3>
                <p className="text-muted-foreground">100% protected payments</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quality Products</h3>
                <p className="text-muted-foreground">Handpicked items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground">Discover our most popular items</p>
          </div>
          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products?.slice(0, 4).map((product) => (
                <Card key={product._id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-2xl font-bold text-primary">${product.price}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Stores */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Stores</h2>
            <p className="text-muted-foreground">Meet our trusted sellers</p>
          </div>
          {loadingStores ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stores?.slice(0, 3).map((store) => (
                <Card key={store._id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="h-40 relative bg-muted rounded-lg overflow-hidden mb-4">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2">{store.name}</CardTitle>
                    <p className="text-muted-foreground line-clamp-2">{store.description}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
