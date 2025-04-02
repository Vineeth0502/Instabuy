import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UpdateProfile } from "@shared/schema";

export function useProfile() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { profileData: UpdateProfile; profileImage?: File }) => {
      const formData = new FormData();
      
      // Add basic profile data
      Object.entries(data.profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add profile image if provided
      if (data.profileImage) {
        formData.append('profileImage', data.profileImage);
      }
      
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate user data to refetch with updated information
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateProfileMutation,
  };
}