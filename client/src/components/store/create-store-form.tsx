import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

const createStoreSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  logo: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        return files[0].size <= MAX_FILE_SIZE;
      },
      { message: `Max file size is 10MB.` }
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        return ACCEPTED_IMAGE_TYPES.includes(files[0].type);
      },
      { message: "Only .jpg, .jpeg, .png and .gif formats are supported." }
    ),
});

type CreateStoreFormValues = z.infer<typeof createStoreSchema>;

const CreateStoreForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreateStoreFormValues>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Watch for file changes to generate preview
  const logoFile = watch("logo");
  if (logoFile && logoFile.length > 0 && !previewUrl) {
    const file = logoFile[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  }

  const createStore = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/store/create", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store created",
        description: "Your store has been successfully created!",
      });
      navigate("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateStoreFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a store",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.logo && data.logo.length > 0) {
        formData.append("logo", data.logo[0]);
      }
      
      await createStore.mutateAsync(formData);
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // For drag-and-drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE) {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          // Trigger a change event manually
          const event = new Event('change', { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
        }
        
        // Preview the image
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrl(fileReader.result as string);
        };
        fileReader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG, GIF) less than 10MB",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-4">
          <div className="sm:col-span-4">
            <Label htmlFor="store-name" className="block text-sm font-medium text-gray-700">
              Store name
            </Label>
            <div className="mt-1">
              <Input
                id="store-name"
                {...register("name")}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-6">
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </Label>
            <div className="mt-1">
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
              <p className="mt-2 text-sm text-gray-500">Brief description of your store and what you sell.</p>
            </div>
          </div>

          <div className="sm:col-span-6">
            <Label className="block text-sm font-medium text-gray-700">Store logo</Label>
            <div 
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={previewUrl} alt="Logo Preview" className="h-24 w-24 object-cover rounded-full" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span onClick={handleFileClick}>Upload a file</span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          {...register("logo")}
                          ref={fileInputRef}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
            {errors.logo && (
              <p className="mt-1 text-xs text-red-500">{errors.logo.message}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Button
          type="button"
          onClick={handleCancel}
          variant="outline"
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || createStore.isPending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {(isLoading || createStore.isPending) ? "Creating..." : "Create Store"}
        </Button>
      </div>
    </form>
  );
};

export default CreateStoreForm;
