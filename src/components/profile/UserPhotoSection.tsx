
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, User, Upload } from "lucide-react";
import { toast } from "sonner";

interface UserPhotoSectionProps {
  photo: string | null;
  displayName: string;
}

const UserPhotoSection: React.FC<UserPhotoSectionProps> = ({ photo, displayName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(photo);
  
  const handlePhotoChange = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // Handle file selection
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Simple validation
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setIsLoading(true);
      
      // Simulate upload with a timeout
      setTimeout(() => {
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setUserPhoto(objectUrl);
        setIsLoading(false);
        
        toast.success('Profile photo updated successfully');
        
        // In a real implementation, you would upload the file to a server here
      }, 1500);
    };
    
    // Trigger file selection dialog
    fileInput.click();
  };
  
  return (
    <div className="lg:w-1/4 flex flex-col items-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-farmaze-orange to-amber-500 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-md">
        {userPhoto ? (
          <img 
            src={userPhoto} 
            alt={displayName} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User size={48} />
        )}
      </div>
      <Button 
        className="bg-farmaze-orange hover:bg-farmaze-orange/90 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        onClick={handlePhotoChange}
        disabled={isLoading}
      >
        {isLoading ? (
          <RefreshCcw size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        Change Photo
      </Button>
    </div>
  );
};

export default UserPhotoSection;
