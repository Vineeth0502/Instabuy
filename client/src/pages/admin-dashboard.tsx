import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, Product } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/product-table";
import CSVUploadModal from "@/components/products/csv-upload-modal";
import { useAuth } from "@/context/auth-context";
import { Upload, BarChart2, ShoppingBag, Clock } from "lucide-react";

const AdminDashboard = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user } = useAuth();

  // Fetch store data
  const { data: storeData, isLoading: isStoreLoading } = useQuery<Store>({
    queryKey: ['/api/store/my'],
  });

  // Fetch products data
  const { data: productsData, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/mine'],
    enabled: !!storeData?.id,
  });

  const showProductUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  if (isStoreLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading store information...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Store Found</h2>
          <p className="mb-6 text-gray-600">You need to create a store before you can access the admin dashboard.</p>
          <Button onClick={() => window.location.href = '/admin/store/create'}>
            Create Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-lg font-semibold text-primary">Store Admin</span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                <a href="#" className="bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md sidebar-link active">
                  <ShoppingBag className="text-gray-500 mr-3 h-6 w-6" />
                  Dashboard
                </a>

                <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md sidebar-link">
                  <BarChart2 className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                  Analytics
                </a>

                <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md sidebar-link">
                  <Clock className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                  Settings
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="page-container py-6"> {/*This is where the change was applied.  Further changes may be needed for complete alignment across the entire dashboard */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {storeData.name}
                  </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button 
                    onClick={showProductUploadModal}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Upload className="-ml-1 mr-2 h-5 w-5" />
                    Upload Products (CSV)
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Store overview cards */}
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <ShoppingBag className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Products
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {isProductsLoading ? "..." : productsData?.length || 0}
                            </div>
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Store Views
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              0
                            </div>
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Last Updated
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {storeData.createdAt ? new Date(storeData.createdAt).toLocaleDateString() : "Today"}
                            </div>
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="mt-8">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Products</h3>
                    <p className="mt-1 text-sm text-gray-500">A list of all products in your store.</p>
                  </div>
                </div>

                {isProductsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading products...</p>
                  </div>
                ) : (
                  <ProductTable products={productsData || []} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      {storeData && (
        <CSVUploadModal 
          isOpen={isUploadModalOpen} 
          onClose={closeUploadModal} 
          storeId={storeData.id}
        />
      )}
    </div>
  );
};

export default AdminDashboard;