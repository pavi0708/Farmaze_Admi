
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, MessageSquare, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ProfileContent, MessagesContent, SettingsContent } from "./TabContent";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  profile: any;
  formValues: any;
  editing: {[key: string]: boolean};
  toggleEdit: (field: any) => void;
  handleInputChange: (field: any, value: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  activeTab, 
  onTabChange,
  profile,
  formValues,
  editing,
  toggleEdit,
  handleInputChange
}) => {
  const { logout } = useAuth();

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-6">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all rounded-md"
            >
              <User size={16} className="mr-2" />
              My Profile
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all rounded-md"
            >
              <MessageSquare size={16} className="mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all rounded-md"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <ProfileContent 
              profile={profile}
              formValues={formValues}
              editing={editing}
              toggleEdit={toggleEdit}
              handleInputChange={handleInputChange}
            />
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <MessagesContent />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <SettingsContent />
          </TabsContent>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:bg-red-50 mt-4 sm:mt-0"
          onClick={logout}
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileTabs;
