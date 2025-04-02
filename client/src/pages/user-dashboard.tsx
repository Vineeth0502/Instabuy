import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Store, Product } from "@shared/schema";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  ShoppingBag, 
  ShoppingCart, 
  Heart, 
  Clock, 
  Store as StoreIcon, 
  User, 
  Tag,
  ChevronRight,
  List
} from "lucide-react";
import { format } from "date-fns";
import { useCart } from "@/hooks/use-cart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserDashboard() {
  const { user } = useAuth();
  const { items: cartItems, totalPrice } = useCart();

  // Get all stores
  const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    retry: 1,
  });

  // Get recent products (featured/newest)
  const { data: recentProducts, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/recent"],
    retry: 1,
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl py-6">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">User Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Cart ({cartItems.length})</span>
                  {cartItems.length > 0 && (
                    <Badge variant="secondary">${totalPrice.toFixed(2)}</Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>Welcome back, {user.fullName || user.username}</span>
          </div>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profileImage || ""} alt={user.username} />
                    <AvatarFallback className="text-lg">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">{user.fullName || user.username}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.phoneNumber && (
                      <p className="text-muted-foreground">{user.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/profile">
                    Edit Profile
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Shopping Cart Preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Shopping Cart</CardTitle>
                  {cartItems.length > 0 && (
                    <Badge>{cartItems.length} items</Badge>
                  )}
                </div>
                <CardDescription>Your current shopping cart</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Your cart is empty</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Start shopping to add items to your cart
                    </p>
                    <Button asChild>
                      <Link href="/products">
                        Browse Products
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{item.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    
                    {cartItems.length > 3 && (
                      <div className="text-sm text-center text-muted-foreground pt-2">
                        + {cartItems.length - 3} more items
                      </div>
                    )}

                    <Separator />
                    
                    <div className="flex justify-between items-center pt-2">
                      <p className="font-medium">Total</p>
                      <p className="font-bold">${totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              {cartItems.length > 0 && (
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/cart">
                      View Cart & Checkout
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Recent Products Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Featured Products</h2>
                <Link href="/products" className="text-sm text-primary flex items-center">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              {isLoadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-t-2 border-primary border-solid rounded-full"></div>
                </div>
              ) : !recentProducts || recentProducts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No products available</h3>
                    <p className="text-muted-foreground text-center mt-1">
                      Check back later for new products
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProducts.slice(0, 6).map((product) => (
                    <Card 
                      key={product.id} 
                      className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="h-40 relative bg-muted overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-r from-primary/10 to-primary/5">
                            <Package className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                        {product.category && (
                          <Badge variant="secondary" className="absolute top-2 right-2">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {product.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 text-sm flex-grow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm">
                            <Tag className="mr-1 h-4 w-4" />
                            <span>${product.price}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          className="w-full text-xs" 
                          size="sm"
                          onClick={() => {/* Add to Cart Logic */}}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Stores Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Popular Stores</h2>
                <Link href="/stores" className="text-sm text-primary flex items-center">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              {isLoadingStores ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-t-2 border-primary border-solid rounded-full"></div>
                </div>
              ) : !stores || stores.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No stores available</h3>
                    <p className="text-muted-foreground text-center mt-1">
                      Check back later for new stores
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.slice(0, 3).map((store) => (
                    <Card 
                      key={store.id} 
                      className="h-full hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className="h-32 relative bg-muted overflow-hidden">
                        {store.logo ? (
                          <img
                            src={store.logo}
                            alt={store.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-r from-primary/10 to-primary/5">
                            <ShoppingBag className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {store.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        <Button variant="outline" asChild className="w-full">
                          <Link href={`/store/${store.store_id}`}>
                            <StoreIcon className="h-4 w-4 mr-2" />
                            Visit Store
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Favorites</CardTitle>
                <CardDescription>Products and stores you've marked as favorites</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No favorites yet</h3>
                <p className="text-muted-foreground text-center mt-1 mb-4">
                  Start browsing and add items to your favorites
                </p>
                <div className="flex gap-4">
                  <Button asChild variant="outline">
                    <Link href="/products">
                      <Package className="mr-2 h-4 w-4" />
                      Browse Products
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/stores">
                      <StoreIcon className="mr-2 h-4 w-4" />
                      Browse Stores
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>Track and manage your orders</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <List className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-muted-foreground text-center mt-1 mb-4">
                  Your order history will appear here
                </p>
                <Button asChild>
                  <Link href="/products">
                    Start Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}