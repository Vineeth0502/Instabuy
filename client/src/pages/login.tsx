import { Link } from "wouter";
import LoginForm from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../context/auth-provider";
import { useEffect } from "react";
import { useLocation } from "wouter";

const Login = () => {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-0">
      <Card className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <CardContent className="p-0">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Log in to Instabuy</h1>
          
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
