import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import SiteHeader from "@/components/layout/site-header";
import Footer from "@/components/ui/footer";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import CreateStore from "@/pages/create-store";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import SellerDashboard from "@/pages/seller-dashboard";
import StoreView from "@/pages/store-view";
import ProfilePage from "@/pages/profile-page";
import StoresPage from "@/pages/stores-page";
import ProductsPage from "@/pages/products-page";
import CartPage from "@/pages/cart-page";
import PaymentPage from "./pages/payment-page"; // Added import for PaymentPage
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/stores" component={StoresPage} />
              <Route path="/products" component={ProductsPage} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <Route path="/cart" component={CartPage} />
              <Route path="/payment" component={PaymentPage} /> {/* Added payment route */}
              <ProtectedRoute path="/user-dashboard" component={UserDashboard} roles={['user']} />
              <ProtectedRoute path="/admin" component={AdminDashboard} roles={['admin']} />
              <ProtectedRoute path="/seller" component={SellerDashboard} roles={['seller']} />
              <ProtectedRoute path="/seller/store/create" component={CreateStore} roles={['seller']} />
              <Route path="/store/:storeId">
                {(params) => <StoreView storeId={params.storeId} />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;