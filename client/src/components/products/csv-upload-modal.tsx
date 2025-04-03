import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
}

const CSVUploadModal = ({ isOpen, onClose, storeId }: CSVUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadCSV = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        if (!storeId) {
          throw new Error('Store ID is required');
        }
        console.log('Uploading CSV for store:', storeId);
        const response = await fetch(`/api/products/csv-upload/${storeId}`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.message);
          } else {
            const text = await response.text();
            throw new Error('Failed to upload CSV: ' + text);
          }
        }
        
        return response.json();
      } catch (error) {
        console.error('CSV upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${data.count} products have been added to your store.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/mine'] });
      onClose();
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload products",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        toast({
          title: "No file selected",
          description: "Please select a CSV file to upload",
          variant: "destructive",
        });
        return;
      }

      if (!storeId) {
        toast({
          title: "Store Error",
          description: "No store selected for upload",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("csvFile", file);
      console.log('Uploading file:', file.name, 'for store:', storeId);
      
      await uploadCSV.mutateAsync(formData);
      queryClient.invalidateQueries({ queryKey: [`/api/products/store/${storeId}`] });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV file",
        variant: "destructive",
      });
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Upload Product CSV
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Upload a CSV file containing your product data. The file should include columns for product name, description, price, stock, and category.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700">CSV File</label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                isDragging ? "border-primary border-dashed bg-blue-50" : "border-gray-300 border-dashed"
              } rounded-md`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center bg-gray-100 rounded-md p-2">
                      <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-900 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span onClick={handleBrowseClick}>Upload a file</span>
                        <input 
                          id="csv-upload" 
                          name="csv-upload" 
                          type="file" 
                          className="sr-only" 
                          accept=".csv" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploadCSV.isPending}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
            >
              {uploadCSV.isPending ? "Uploading..." : "Upload"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadModal;