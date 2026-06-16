
import React, { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardTitle } from "@/components/ui/card";
import ProfileForm from "./ProfileForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import profileApi from "@/api/profileApi";

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  postCode: string;
  photo: string | null;
}

interface ProfileContentProps {
  profile: UserProfile;
  formValues: UserProfile;
  editing: {[key: string]: boolean};
  toggleEdit: (field: keyof UserProfile) => void;
  handleInputChange: (field: keyof UserProfile, value: string) => void;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  profile,
  formValues,
  editing,
  toggleEdit,
  handleInputChange
}) => {
  return (
    <TabsContent value="profile" className="m-0">
      <div className="p-8">
        <CardTitle className="text-xl font-semibold mb-8 text-farmaze-brown">Profile Information</CardTitle>
        <ProfileForm
          profile={profile}
          formValues={formValues}
          editing={editing}
          toggleEdit={toggleEdit}
          handleInputChange={handleInputChange}
        />
      </div>
    </TabsContent>
  );
};

export const MessagesContent: React.FC = () => {
  return (
    <TabsContent value="messages" className="m-0">
      <div className="p-8">
        <CardTitle className="text-xl font-semibold mb-6 text-farmaze-brown">Messages</CardTitle>
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-gray-50">
            <p className="font-medium mb-2">Welcome to Farmaze!</p>
            <p className="text-gray-600 text-sm">We're glad to have you as part of our community of restaurant owners and chefs.</p>
            <div className="text-xs text-gray-500 mt-2">2 days ago</div>
          </div>
          
          <div className="rounded-lg border p-4 bg-gray-50">
            <p className="font-medium mb-2">Order #FMZ-2023-089 delivered</p>
            <p className="text-gray-600 text-sm">Your recent order has been delivered successfully. Please rate your experience.</p>
            <div className="text-xs text-gray-500 mt-2">1 week ago</div>
          </div>
          
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              View All Messages
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export const SettingsContent: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    order_updates: true,
    product_updates: true,
    security_alerts: true,
    marketing_emails: false,
    weekly_summary: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load notification settings on mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const settings = await profileApi.getNotificationSettings();
      if (settings) {
        setNotificationSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Don't show error toast for 404 - just use defaults
      if (error.response?.status !== 404) {
        toast.error('Failed to load notification settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (setting: keyof typeof notificationSettings) => {
    try {
      const newValue = !notificationSettings[setting];
      const updatedSettings = { ...notificationSettings, [setting]: newValue };
      
      // Optimistically update UI
      setNotificationSettings(updatedSettings);
      
      // Update on server
      await profileApi.updateNotificationSettings(updatedSettings);
      
      toast.success(`${setting.replace('_', ' ')} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Revert on error
      setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
      toast.error('Failed to update notification settings');
      console.error('Error updating notification settings:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setSaving(true);
      await profileApi.sendTestNotification();
      toast.success('Test notification sent! Check your email.');
    } catch (error) {
      toast.error('Failed to send test notification');
      console.error('Error sending test notification:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      setSaving(true);
      await profileApi.resetSettings();
      await loadNotificationSettings(); // Reload settings
      toast.success('Settings reset to default');
    } catch (error) {
      toast.error('Failed to reset settings');
      console.error('Error resetting settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TabsContent value="settings" className="m-0">
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farmaze-orange"></div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="settings" className="m-0">
      <div className="p-8">
        <CardTitle className="text-xl font-semibold mb-6 text-farmaze-brown">Account Settings</CardTitle>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <Button 
                onClick={handleTestNotification}
                disabled={saving}
                variant="outline"
                size="sm"
              >
                {saving ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={notificationSettings.email_notifications}
                onCheckedChange={() => handleNotificationChange('email_notifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order-updates" className="font-medium">Order Updates</Label>
                <p className="text-sm text-gray-500">Get notified about order status changes</p>
              </div>
              <Switch 
                id="order-updates" 
                checked={notificationSettings.order_updates}
                onCheckedChange={() => handleNotificationChange('order_updates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-updates" className="font-medium">Product Updates</Label>
                <p className="text-sm text-gray-500">Receive product and price alerts</p>
              </div>
              <Switch 
                id="product-updates" 
                checked={notificationSettings.product_updates}
                onCheckedChange={() => handleNotificationChange('product_updates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="security-alerts" className="font-medium">Security Alerts</Label>
                <p className="text-sm text-gray-500">Important security notifications</p>
              </div>
              <Switch 
                id="security-alerts" 
                checked={notificationSettings.security_alerts}
                onCheckedChange={() => handleNotificationChange('security_alerts')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                <p className="text-sm text-gray-500">Promotional content and offers</p>
              </div>
              <Switch 
                id="marketing-emails" 
                checked={notificationSettings.marketing_emails}
                onCheckedChange={() => handleNotificationChange('marketing_emails')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-summary" className="font-medium">Weekly Summary</Label>
                <p className="text-sm text-gray-500">Weekly activity digest</p>
              </div>
              <Switch 
                id="weekly-summary" 
                checked={notificationSettings.weekly_summary}
                onCheckedChange={() => handleNotificationChange('weekly_summary')}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              onClick={handleResetSettings}
              disabled={saving}
              variant="outline"
              className="text-red-600 hover:bg-red-50"
            >
              {saving ? 'Resetting...' : 'Reset to Default'}
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};
