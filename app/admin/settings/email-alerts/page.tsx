'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Mail,
  Crown,
  TestTube,
  RefreshCw,
  Power,
  PowerOff,
  Eye,
  EyeOff
} from 'lucide-react';

interface EmailAlertSetting {
  id: string;
  alertType: string;
  alertName: string;
  description: string;
  isEnabled: boolean;
  enabledForPlayers: boolean;
  enabledForAdmins: boolean;
  enabledForTeamOwners: boolean;
  testingMode: boolean;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailAlertSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertSettings, setAlertSettings] = useState<EmailAlertSetting[]>([]);
  const [globalTestingMode, setGlobalTestingMode] = useState(false);

  useEffect(() => {
    fetchAlertSettings();
  }, []);

  const fetchAlertSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-alert-settings');
      if (response.ok) {
        const data = await response.json();
        setAlertSettings(data.alertSettings || []);
        
        // Check if any settings are in testing mode
        const hasTestingMode = data.alertSettings?.some((setting: EmailAlertSetting) => setting.testingMode);
        setGlobalTestingMode(hasTestingMode);
      } else {
        const error = await response.json();
        toast({
          title: "Load Failed",
          description: error.error || "Failed to load email alert settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching alert settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email alert settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAlertSetting = async (alertType: string, updates: Partial<EmailAlertSetting>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/email-alert-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType, updates })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setAlertSettings(prev => 
          prev.map(setting => 
            setting.alertType === alertType 
              ? { ...setting, ...updates }
              : setting
          )
        );

        toast({
          title: "Setting Updated",
          description: data.message,
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Update Failed",
          description: error.error || "Failed to update alert setting",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating alert setting:', error);
      toast({
        title: "Error",
        description: "Failed to update alert setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateSettings = async (action: string, alertTypes?: string[]) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/email-alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, alertTypes })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchAlertSettings(); // Refresh all settings
        
        toast({
          title: "Bulk Update Complete",
          description: data.message,
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Bulk Update Failed",
          description: error.error || "Failed to perform bulk update",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk update",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleGlobalTestingMode = async () => {
    const action = globalTestingMode ? 'disable_testing_mode' : 'enable_testing_mode';
    await bulkUpdateSettings(action);
    setGlobalTestingMode(!globalTestingMode);
  };

  const enableAllAlerts = () => {
    const allAlertTypes = alertSettings.map(setting => setting.alertType);
    bulkUpdateSettings('bulk_enable', allAlertTypes);
  };

  const disableAllAlerts = () => {
    const allAlertTypes = alertSettings.map(setting => setting.alertType);
    bulkUpdateSettings('bulk_disable', allAlertTypes);
  };

  const getAlertTypeIcon = (alertType: string) => {
    if (alertType.includes('registration')) return '📝';
    if (alertType.includes('approval')) return '✅';
    if (alertType.includes('rejection')) return '❌';
    if (alertType.includes('auction')) return '🏏';
    if (alertType.includes('payment')) return '💰';
    if (alertType.includes('reminder') || alertType.includes('tournament')) return '⏰';
    if (alertType.includes('system')) return '🔔';
    return '📧';
  };

  const getCategorySettings = (category: string) => {
    const categoryFilters = {
      registration: ['player_registration', 'team_registration', 'team_owner_registration'],
      approval: ['player_approval', 'team_approval', 'team_owner_approval'],
      rejection: ['player_rejection', 'team_rejection', 'team_owner_rejection'],
      auction: ['auction_player_sold', 'auction_player_unsold'],
      payment: ['payment_received', 'payment_pending'],
      notifications: ['tournament_reminder', 'system_alert']
    };

    return alertSettings.filter(setting => 
      categoryFilters[category as keyof typeof categoryFilters]?.includes(setting.alertType)
    );
  };

  const AlertSettingCard = ({ setting }: { setting: EmailAlertSetting }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl flex-shrink-0">{getAlertTypeIcon(setting.alertType)}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg break-words">{setting.alertName}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{setting.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {setting.testingMode && (
              <Badge variant="destructive" className="text-xs">
                <TestTube className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Testing</span>
                <span className="sm:hidden">Test</span>
              </Badge>
            )}
            <Switch
              checked={setting.isEnabled}
              onCheckedChange={(checked) => 
                updateAlertSetting(setting.alertType, { isEnabled: checked })
              }
              disabled={saving}
            />
          </div>
        </div>
      </CardHeader>
      
      {setting.isEnabled && (
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            <Separator />
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">Send emails to:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={setting.enabledForPlayers}
                    onCheckedChange={(checked) => 
                      updateAlertSetting(setting.alertType, { enabledForPlayers: checked })
                    }
                    disabled={saving}
                  />
                  <label className="text-xs sm:text-sm">Players/Teams</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={setting.enabledForAdmins}
                    onCheckedChange={(checked) => 
                      updateAlertSetting(setting.alertType, { enabledForAdmins: checked })
                    }
                    disabled={saving}
                  />
                  <label className="text-xs sm:text-sm">Admins</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={setting.enabledForTeamOwners}
                    onCheckedChange={(checked) => 
                      updateAlertSetting(setting.alertType, { enabledForTeamOwners: checked })
                    }
                    disabled={saving}
                  />
                  <label className="text-xs sm:text-sm">Team Owners</label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 sm:space-y-4">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading email alert settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">
                Email Alert Management
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                Configure email notification settings • SUPERADMIN Only
              </p>
            </div>
          </div>

          {/* SUPERADMIN Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs sm:text-sm font-medium">
            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>SUPERADMIN Access Required</span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Testing Mode Control */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TestTube className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <span className="text-sm sm:text-base">Testing Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {globalTestingMode ? 'Testing Active' : 'Live Emails'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {globalTestingMode 
                      ? 'Emails logged but not sent' 
                      : 'Emails sent normally'
                    }
                  </p>
                </div>
                <Switch
                  checked={globalTestingMode}
                  onCheckedChange={toggleGlobalTestingMode}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bulk Enable/Disable */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Power className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="text-sm sm:text-base">Bulk Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={enableAllAlerts}
                  disabled={saving}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Power className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Enable All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={disableAllAlerts}
                  disabled={saving}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <PowerOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Disable All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Overview */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span className="text-sm sm:text-base">Status Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span>Active Alerts:</span>
                  <Badge variant="default" className="text-xs">
                    {alertSettings.filter(s => s.isEnabled).length}/{alertSettings.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span>Testing Mode:</span>
                  <Badge variant={globalTestingMode ? "destructive" : "secondary"} className="text-xs">
                    {globalTestingMode ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Settings Tabs */}
        <Tabs defaultValue="registration" className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto p-1">
            <TabsTrigger value="registration" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Registration</span>
              <span className="sm:hidden">Reg</span>
            </TabsTrigger>
            <TabsTrigger value="approval" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Approvals</span>
              <span className="sm:hidden">App</span>
            </TabsTrigger>
            <TabsTrigger value="rejection" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Rejections</span>
              <span className="sm:hidden">Rej</span>
            </TabsTrigger>
            <TabsTrigger value="auction" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Auction</span>
              <span className="sm:hidden">Auc</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Not</span>
            </TabsTrigger>
          </TabsList>

          {/* Registration Alerts */}
          <TabsContent value="registration" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('registration').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>

          {/* Approval Alerts */}
          <TabsContent value="approval" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('approval').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>

          {/* Rejection Alerts */}
          <TabsContent value="rejection" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('rejection').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>

          {/* Auction Alerts */}
          <TabsContent value="auction" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('auction').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>

          {/* Payment Alerts */}
          <TabsContent value="payment" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('payment').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {getCategorySettings('notifications').map((setting) => (
                <AlertSettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Warning Alert */}
        <Alert className="mt-6 sm:mt-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200 text-sm sm:text-base">Important Notice</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
            Email alert settings changes take effect immediately. Use testing mode during development to prevent 
            sending emails to real users. Only SUPERADMIN users can modify these settings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
