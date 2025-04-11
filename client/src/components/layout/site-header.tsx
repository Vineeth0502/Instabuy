import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../theme-toggle";
import { CartDropdown } from "@/components/ui/cart-dropdown";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LogIn,
  LogOut,
  Menu,
  User,
  Store,
  Home,
  ShoppingBag,
  Package,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SiteHeader() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { user, logoutMutation } = useAuth();
  const { theme } = useTheme();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    // Redirect to home page after logout
    window.location.href = "/";
  };

  const navItems = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/stores", label: "Stores", icon: <Store className="h-4 w-4 mr-2" /> },
    { href: "/products", label: "Products", icon: <Package className="h-4 w-4 mr-2" /> },
  ];

  const getInitials = (username: string) => {
    return username ? username.slice(0, 2).toUpperCase() : "U";
  };

  const renderDesktopNav = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">Instabuy</span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location === item.href && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Link href={item.href}>
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          <CartDropdown />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.profileImage || ""} />
                    <AvatarFallback>
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={
                    user.role === "admin" ? "/admin" : 
                    user.role === "seller" ? "/seller" : 
                    "/user-dashboard"
                  } className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );

  const renderMobileNav = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="font-bold">Instabuy</span>
        </Link>

        <div className="flex items-center gap-2">
          <CartDropdown />
          <ThemeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Instabuy</SheetTitle>
                <SheetDescription>
                  Shop the best products at the best prices
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                {user && (
                  <div className="flex items-center gap-4 py-4">
                    <Avatar>
                      <AvatarImage src={user.profileImage || ""} />
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={location === item.href ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    </Link>
                  ))}

                  {user ? (
                    <>
                      <Link href="/profile">
                        <Button
                          variant={location === "/profile" ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </Link>

                      <Link href={
                        user.role === "admin" ? "/admin" : 
                        user.role === "seller" ? "/seller" : 
                        "/user-dashboard"
                      }>
                        <Button
                          variant={
                            (user.role === "admin" && location === "/admin") ||
                            (user.role === "seller" && location === "/seller") ||
                            (user.role === "user" && location === "/user-dashboard")
                              ? "default"
                              : "ghost"
                          }
                          className="w-full justify-start"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>

                      <Button
                        variant="destructive"
                        className="w-full justify-start mt-4"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth">
                      <Button
                        className="w-full justify-start mt-4"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );

  return isMobile ? renderMobileNav() : renderDesktopNav();
}