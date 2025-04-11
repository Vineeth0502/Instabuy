import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Store, Product, InsertProduct } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
  FileUp,
  Package,
  ShoppingBag,
  DollarSign,
  Layers,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Link, useLocation as useWouter } from "wouter";

// Form schema for adding/editing a product
const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  category: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stock must be a positive number"),
  image: z.string().url().optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useWouter();
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get seller's store first
  const { data: store, isLoading: isLoadingStore } = useQuery<Store | null>({
    queryKey: ["/api/store/seller"],
    queryFn: async () => {
      const res = await fetch("/api/store/seller", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch store");
      return res.json();
    },
    enabled: !!user,
    retry: 1,
  });

  // Get orders for the store's products
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/store/orders", store?._id],
    queryFn: async () => {
      if (!store?._id) throw new Error("Store not found");
      const res = await fetch("/api/store/orders", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!store?._id,
  });


  // Get products for the store after store is loaded
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products/store", store?._id],
    queryFn: async () => {
      if (!store?._id) throw new Error("Store not found");
      const res = await fetch(`/api/products/store/${store._id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!store?._id,
  });

  useEffect(() => {
    if (store && location === "/seller") {
      setLocation("/seller?tab=products");
    }
  }, [store, location, setLocation]);

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/stores", storeData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Created",
        description: "Your store has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/store/seller"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create store",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add product form
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      sku: "",
      stock: 0,
      image: "",
    },
  });

  // Populate form when editing product
  useEffect(() => {
    if (editingProduct) {
      productForm.reset({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price,
        category: editingProduct.category || "",
        sku: editingProduct.sku || "",
        stock: editingProduct.stock,
        image: editingProduct.image || "",
      });
    } else {
      productForm.reset({
        name: "",
        description: "",
        price: "",
        category: "",
        sku: "",
        stock: 0,
        image: "",
      });
    }
  }, [editingProduct, productForm]);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormValues) => {
      if (!store) throw new Error("Store not found");

      if (!store?.store_id) {
        throw new Error("Store ID is not available");
      }

      const data = {
        ...productData,
        storeId: store.store_id,
      };

      console.log("Submitting product with data:", data);
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Product Added",
        description: "Your product has been added successfully!",
      });
      productForm.reset();
      setIsAddingProduct(false);
      await queryClient.invalidateQueries({
        queryKey: ["/api/products/store", store?.store_id],
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ProductFormValues;
    }) => {
      console.log("Updating product:", { id, data });
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }
      return await res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully!",
      });
      setEditingProduct(null);
      await queryClient.invalidateQueries({
        queryKey: ["/api/products/store", store?.store_id],
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      return await res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully!",
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/products/store", store?.store_id],
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // CSV upload mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!store) throw new Error("Store not found");

      const res = await fetch(`/api/products/csv-upload/${store._id}`, {
        method: "POST",
        body: formData,
        credentials: "include",
        // Let the browser set the content-type with proper boundary
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload CSV file");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV Upload Successful",
        description: `${data.count} products have been added to your store.`,
      });
      setIsUploadingCsv(false);
      queryClient.invalidateQueries({
        queryKey: ["/api/products/store", store?.store_id],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "CSV Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for product form submission
  const onSubmitProduct = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // Create store form submission handler
  const onSubmitStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/store/create", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create store");
      }

      toast({
        title: "Store Created",
        description: "Your store has been created successfully!",
      });

      // Invalidate store query and redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/store/seller"] });
      window.location.href = "/seller?tab=products";
    } catch (err: any) {
      toast({
        title: "Store creation failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Handler for CSV file upload
  const handleCsvUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const csvFile = formData.get("csvFile") as File;

    if (!csvFile) {
      toast({
        title: "CSV file required",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadCsvMutation.mutate(formData);
  };

  // Loading state
  if (isLoadingStore) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin h-12 w-12 border-t-2 border-primary border-solid rounded-full"></div>
        </div>
      </div>
    );
  }

  // Show store creation form if no store exists
  if (!store) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create Your Store</CardTitle>
            <CardDescription>
              Set up your store to start selling products on InstaBuy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="create-store-form" onSubmit={onSubmitStore}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Store Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your store name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Store Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your store..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="logo" className="text-sm font-medium">
                    Store Logo
                  </label>
                  <Input id="logo" name="logo" type="file" accept="image/*" />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="create-store-form" className="w-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Create Store
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main dashboard with store information and products
  return (
    <div className="container mx-auto px-4 max-w-7xl py-6">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <div className="flex items-center text-muted-foreground">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>
              Managing {store?.name} (Store ID: {store?.store_id})
            </span>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="csv-upload">CSV Upload</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-muted-foreground mr-2" />
                    <div className="text-2xl font-bold">
                      {products?.length || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Stock Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                    <div className="text-2xl font-bold">
                      $
                      {products
                        ?.reduce((sum, product) => {
                          const price = parseFloat(product.price) || 0;
                          return sum + price * product.stock;
                        }, 0)
                        .toFixed(2) || "0.00"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inventory Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 text-muted-foreground mr-2" />
                    <div className="text-2xl font-bold">
                      {products?.reduce(
                        (sum, product) => sum + product.stock,
                        0,
                      ) || 0}{" "}
                      items
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Store Name</h3>
                  <p>{store?.name}</p>
                </div>
                {store?.description && (
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{store.description}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">Created On</h3>
                  <p>{new Date(store?.createdAt || "").toLocaleDateString()}</p>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline">
                    <Link href={`/store/${store?.id}`}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      View Public Store
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {products && products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>
                    Distribution of products by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(
                      new Set(
                        products.map((p) => p.category || "Uncategorized"),
                      ),
                    ).map((category, index) => {
                      const count = products.filter(
                        (p) => (p.category || "Uncategorized") === category,
                      ).length;
                      const percentage = Math.round(
                        (count / products.length) * 100,
                      );

                      return (
                        <div
                          key={`category-${category}-${index}`}
                          className="space-y-1"
                        >
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="text-muted-foreground">
                              {count} products ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-secondary overflow-hidden rounded-full">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Products</h2>
              <Button onClick={() => setIsAddingProduct(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            {isLoadingProducts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-t-2 border-primary border-solid rounded-full"></div>
              </div>
            ) : products?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No products yet</h3>
                  <p className="text-muted-foreground text-center mt-1 mb-4">
                    Start adding products or use the CSV upload feature to
                    quickly add multiple products
                  </p>
                  <div className="flex gap-4">
                    <Button onClick={() => setIsAddingProduct(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("csv-upload-tab")?.click()
                      }
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>
                    Total of {products?.length} products
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.price}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              product.stock > 10
                                ? "default"
                                : product.stock > 0
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the product
                                    "{product.name}"? This action cannot be
                                    undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      deleteProductMutation.mutate(product._id)
                                    }
                                    disabled={deleteProductMutation.isPending}
                                  >
                                    {deleteProductMutation.isPending
                                      ? "Deleting..."
                                      : "Delete"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* CSV Upload Tab */}
          <TabsContent
            id="csv-upload-tab"
            value="csv-upload"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Products</CardTitle>
                <CardDescription>
                  Upload a CSV file to add multiple products at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format Requirements</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      Your CSV file should have the following columns:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>name (required)</li>
                      <li>description (optional)</li>
                      <li>price (required)</li>
                      <li>category (optional)</li>
                      <li>sku (optional)</li>
                      <li>stock (required, numeric)</li>
                      <li>image (optional, URL)</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <form id="csv-upload-form" onSubmit={handleCsvUpload}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="csvFile" className="text-sm font-medium">
                        CSV File
                      </label>
                      <Input
                        id="csvFile"
                        name="csvFile"
                        type="file"
                        accept=".csv"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  form="csv-upload-form"
                  disabled={uploadCsvMutation.isPending}
                  className="w-full"
                >
                  {uploadCsvMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload CSV
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sample CSV</CardTitle>
                <CardDescription>
                  Here's a sample of how your CSV file should be formatted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto text-xs">
                  name,description,price,category,sku,stock,image
                  <br />
                  Wireless Mouse,High-quality wireless mouse suitable for daily
                  use.,155.57,Accessories,MS-001,41,https://example.com/images/wireless_mouse.jpg
                  <br />
                  Bluetooth Headphones,Premium sound quality with noise
                  cancelling.,250.38,Electronics,BH-002,44,https://example.com/images/bluetooth_headphones.jpg
                  <br />
                  Laptop Stand,Adjustable height and angle for better
                  ergonomics.,427.21,Office
                  Supplies,LS-003,34,https://example.com/images/laptop_stand.jpg
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Orders</CardTitle>
                <CardDescription>View orders containing your products</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-t-2 border-primary border-solid rounded-full"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => (
                        <TableRow key={order._id.toString()}>
                          <TableCell className="font-medium">#{order._id.slice(-6)}</TableCell>
                          <TableCell>{order.userDetails?.username || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.quantity}x {item.productDetails?.name || item.name}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Product Dialog */}
        <Dialog
          open={isAddingProduct || !!editingProduct}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddingProduct(false);
              setEditingProduct(null);
              productForm.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update the details of your product"
                  : "Fill out the form below to add a new product to your store"}
              </DialogDescription>
            </DialogHeader>

            <Form {...productForm}>
              <form
                onSubmit={productForm.handleSubmit(onSubmitProduct)}
                className="space-y-4"
              >
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={productForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control                    control={productForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Electronics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional SKU code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={productForm.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for the product image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      createProductMutation.isPending ||
                      updateProductMutation.isPending
                    }
                  >
                    {createProductMutation.isPending ||
                    updateProductMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {editingProduct ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>{editingProduct ? "Update Product" : "Add Product"}</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}