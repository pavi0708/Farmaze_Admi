
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { User, Settings, Bell, Lock, Upload, Loader2 } from "lucide-react";
import profileApi, { UserProfile, UserSettings, UserProfileUpdate } from "@/api/profileApi";
import { updateMyWhatsApp, getClientDetails } from "@/api/procurementApi";
import FadeInSection from "@/components/ui/FadeInSection";
import { useInteractionTracking, useAnalyticsTracking } from "@/hooks/useActivityTracking";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Analytics tracking hooks
  const { trackClick, trackFormSubmit } = useInteractionTracking();
  const { trackProfileUpdate } = useAnalyticsTracking();

  // Onboarding state (for dev reset)
  const onboarding = useOnboarding();
  const navigate = useNavigate();

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // WhatsApp state
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileData, settingsData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getSettings(),
      ]);
      
      setProfile(profileData);
      setSettings(settingsData);

      // Initialize form with profile data
      setProfileForm({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        email: profileData.email || "",
        phone_number: profileData.phone_number || "",
      });

      // Load WhatsApp settings from client details
      try {
        const clientDetails = await getClientDetails();
        if (clientDetails.whatsapp_number) {
          setWhatsappEnabled(true);
          setWhatsappNumber(clientDetails.whatsapp_number);
        }
      } catch (e) {
        // Non-critical — WhatsApp settings are optional
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile: UserProfileUpdate) => {
    setSaving(true);
    try {
      await profileApi.updateProfile(updatedProfile);
      await loadProfileData(); // Reload to get updated data
      
      // Track profile update
      trackProfileUpdate('profile_info');
      trackFormSubmit('profile_update', true);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      trackFormSubmit('profile_update', false);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = profileApi.validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Error",
        description: passwordValidation.errors[0] || "Password does not meet requirements",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await profileApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      
      // Track password change
      trackProfileUpdate('password_change');
      trackFormSubmit('password_change', true);
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      trackFormSubmit('password_change', false);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profileApi.isValidImageFile(file)) {
      toast({
        title: "Error",
        description: "Please select a valid image file (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    if (!profileApi.isValidFileSize(file)) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await profileApi.uploadAvatar(file);
      await loadProfileData(); // Reload to get updated avatar
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsAppSave = async () => {
    setSavingWhatsapp(true);
    try {
      await updateMyWhatsApp(whatsappNumber, whatsappEnabled);
      toast({ title: "Success", description: "WhatsApp settings updated" });
    } catch (error) {
      console.error("Failed to update WhatsApp settings:", error);
      toast({
        title: "Error",
        description: "Failed to update WhatsApp settings",
        variant: "destructive",
      });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleWhatsAppToggle = async (checked: boolean) => {
    setWhatsappEnabled(checked);
    if (!checked) {
      setSavingWhatsapp(true);
      try {
        await updateMyWhatsApp("", false);
        setWhatsappNumber("");
        toast({ title: "Success", description: "WhatsApp notifications disabled" });
      } catch (error) {
        setWhatsappEnabled(true);
        toast({
          title: "Error",
          description: "Failed to update WhatsApp settings",
          variant: "destructive",
        });
      } finally {
        setSavingWhatsapp(false);
      }
    }
  };

  const handleSettingsUpdate = async (updatedSettings: Partial<UserSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      await profileApi.updateSettings({ ...settings, ...updatedSettings });
      await loadProfileData(); // Reload to get updated settings
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !settings) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-500">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="frame-container mx-auto px-4 py-8">
      <FadeInSection>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farmaze-brown mb-2">My Profile</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock size={16} />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.profile_picture_url || ""} />
                    <AvatarFallback>
                      {profileApi.getUserInitials(profile)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2" 
                      disabled={uploading}
                      onClick={() => {
                        trackClick('upload_photo_button');
                        document.getElementById('avatar-upload')?.click();
                      }}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAvatarUpload(file);
                          // Reset the input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                    />
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP up to 2MB</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleProfileUpdate(profileForm)}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <select
                      id="theme"
                      className="w-full p-2 border rounded-md"
                      value={settings.dashboard_theme}
                      onChange={(e) => handleSettingsUpdate({ dashboard_theme: e.target.value as any })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="defaultPeriod">Default Time Period</Label>
                    <select
                      id="defaultPeriod"
                      className="w-full p-2 border rounded-md"
                      value={settings.default_time_period}
                      onChange={(e) => handleSettingsUpdate({ default_time_period: e.target.value as any })}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      className="w-full p-2 border rounded-md"
                      value={settings.date_format}
                      onChange={(e) => handleSettingsUpdate({ date_format: e.target.value as any })}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={profile?.notification_settings?.email_notifications === true}
                      onCheckedChange={(checked) => {
                        trackClick('toggle_email_notifications');
                        handleProfileUpdate({
                          notification_settings: {
                            ...profile?.notification_settings,
                            email_notifications: checked,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Order Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about order status changes</p>
                    </div>
                    <Switch
                      checked={profile?.notification_settings?.order_updates === true}
                      onCheckedChange={(checked) => {
                        trackClick('toggle_order_updates');
                        handleProfileUpdate({
                          notification_settings: {
                            ...profile?.notification_settings,
                            order_updates: checked,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Price Alerts</Label>
                      <p className="text-sm text-gray-500">Alerts when product prices change significantly</p>
                    </div>
                    <Switch
                      checked={profile?.notification_settings?.price_alerts === true}
                      onCheckedChange={(checked) => {
                        trackClick('toggle_price_alerts');
                        handleProfileUpdate({
                          notification_settings: {
                            ...profile?.notification_settings,
                            price_alerts: checked,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Summary</Label>
                      <p className="text-sm text-gray-500">Weekly analytics and insights summary</p>
                    </div>
                    <Switch
                      checked={profile?.notification_settings?.weekly_summary === true}
                      onCheckedChange={(checked) => {
                        trackClick('toggle_weekly_summary');
                        handleProfileUpdate({
                          notification_settings: {
                            ...profile?.notification_settings,
                            weekly_summary: checked,
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">WhatsApp Notifications</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>WhatsApp Order Updates</Label>
                      <p className="text-sm text-gray-500">Receive order confirmations and updates on WhatsApp</p>
                    </div>
                    <Switch
                      checked={whatsappEnabled}
                      onCheckedChange={handleWhatsAppToggle}
                    />
                  </div>

                  {whatsappEnabled && (
                    <div className="mt-3">
                      <Label>WhatsApp Phone Number</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="+91 98765 43210"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                        />
                        <Button
                          onClick={handleWhatsAppSave}
                          disabled={savingWhatsapp || !whatsappNumber.trim()}
                        >
                          {savingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Include country code (e.g., +91 for India)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="w-full md:w-auto"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Onboarding controls — useful for verifying the wizard UI during
                staging since all existing clients already have Farmaze as a
                supplier and would otherwise never see the flow. */}
            <Card>
              <CardHeader>
                <CardTitle>Setup & Onboarding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Onboarding status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {onboarding.completed
                        ? "Completed — setup done"
                        : onboarding.skipped
                        ? "Skipped — you can start anytime"
                        : `In progress (step ${onboarding.step} of 5)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/onboarding")}
                    >
                      {onboarding.completed ? "Re-run setup" : "Start setup"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onboarding.reset();
                        toast({
                          title: "Onboarding reset",
                          description: "The wizard will appear on next login.",
                        });
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeInSection>
    </div>
  );
};

export default Profile;
