'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, Mail, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailAlertStatusProps {
  showTestingToggle?: boolean;
  compact?: boolean;
}

export default function EmailAlertStatus({ showTestingToggle = false, compact = false }: EmailAlertStatusProps) {
  const { toast } = useToast();
  const [testingMode, setTestingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    fetchAlertStatus();
  }, []);

  const fetchAlertStatus = async () => {
    try {
      const response = await fetch('/api/admin/email-alert-settings');
      if (response.ok) {
        const data = await response.json();
        const settings = data.alertSettings || [];
        
        setTotalAlerts(settings.length);
        setActiveAlerts(settings.filter((s: any) => s.isEnabled).length);
        
        // Check if any settings are in testing mode
        const hasTestingMode = settings.some((s: any) => s.testingMode);
        setTestingMode(hasTestingMode);
      }
    } catch (error) {
      console.error('Error fetching alert status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTestingMode = async () => {
    try {
      setLoading(true);
      const action = testingMode ? 'disable_testing_mode' : 'enable_testing_mode';
      
      const response = await fetch('/api/admin/email-alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setTestingMode(!testingMode);
        toast({
          title: "Testing Mode Updated",
          description: `Testing mode ${!testingMode ? 'enabled' : 'disabled'} for all email alerts`,
          variant: "default"
        });
      } else {
        throw new Error('Failed to toggle testing mode');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to toggle testing mode",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-32"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {activeAlerts}/{totalAlerts} active
          </span>
        </div>
        
        {testingMode && (
          <Badge variant="destructive" className="text-xs">
            <TestTube className="w-3 h-3 mr-1" />
            Testing
          </Badge>
        )}
        
        {showTestingToggle && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Test Mode:</span>
            <Switch
              checked={testingMode}
              onCheckedChange={toggleTestingMode}
              disabled={loading}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-orange-500" />
          Email Alert Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Active Alerts:</span>
          <Badge variant="default" className="text-xs">
            {activeAlerts}/{totalAlerts}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={testingMode ? "destructive" : "secondary"} className="text-xs">
            {testingMode ? (
              <>
                <TestTube className="w-3 h-3 mr-1" />
                Testing
              </>
            ) : (
              <>
                <Mail className="w-3 h-3 mr-1" />
                Live
              </>
            )}
          </Badge>
        </div>

        {testingMode && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Emails are being logged but not sent</span>
          </div>
        )}
        
        {showTestingToggle && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Testing Mode:</span>
              <Switch
                checked={testingMode}
                onCheckedChange={toggleTestingMode}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Toggle testing mode for all email alerts
            </p>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.open('/admin/settings/email-alerts', '_blank')}
          >
            Manage Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
