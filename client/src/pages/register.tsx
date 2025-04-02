import { Link } from "wouter";
import RegisterForm from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../context/auth-provider";
import { useEffect } from "react";
import { useLocation } from "wouter";

const Register = () => {
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
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Sign up for Instabuy</h1>
          
          <RegisterForm setActiveTab={() => navigate("/login")} />
          
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-blue-500">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
