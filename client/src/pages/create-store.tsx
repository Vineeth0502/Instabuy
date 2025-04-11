import CreateStoreForm from "@/components/store/create-store-form";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const CreateStore = () => {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Check if user already has a store (updated for sellers)
  const { data: userStore, isLoading } = useQuery({
    queryKey: ["/api/store/seller"],
    enabled: isAuthenticated && user?.role === "seller",
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      if (user?.role !== "seller") {
        navigate("/dashboard");
        return;
      }

      if (userStore) {
        navigate("/seller/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate, userStore, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold text-gray-900">Create Your Store</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Set up your Instabuy store profile.</p>
        </div>

        <div className="border-t border-gray-200">
          <CreateStoreForm />
        </div>
      </div>
    </div>
  );
};

export default CreateStore;
