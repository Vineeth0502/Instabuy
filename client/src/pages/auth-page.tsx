import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Building2, ShoppingBag } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect to appropriate dashboard based on user role
  if (!isLoading && user) {
    if (user.role === 'admin') {
      return <Redirect to="/admin-dashboard" />;
    } else if (user.role === 'seller') {
      return <Redirect to="/seller" />;
    } else {
      return <Redirect to="/user-dashboard" />;
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">
            Welcome to Instabuy
          </h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  {activeTab === "login" ? "Sign in to your account" : "Create an account"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "login" 
                    ? "Enter your credentials to access your account"
                    : "Fill in your information to create a new account"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <LoginForm />
                </TabsContent>
                
                <TabsContent value="register" className="mt-0">
                  <RegisterForm setActiveTab={setActiveTab} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden md:flex flex-col w-1/2 bg-primary text-primary-foreground">
        <div className="flex flex-col justify-center h-full px-12 py-24">
          <h2 className="text-4xl font-bold mb-6">Shop Smarter with Instabuy</h2>
          <p className="text-xl mb-8 opacity-90">
            Your one-stop e-commerce platform for all your shopping needs.
          </p>
          
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/10 p-3 rounded-full">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Shop Anywhere</h3>
                <p className="opacity-90">
                  Browse products from multiple stores in one place.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-foreground/10 p-3 rounded-full">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sell Effortlessly</h3>
                <p className="opacity-90">
                  Create your own store and start selling in minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}