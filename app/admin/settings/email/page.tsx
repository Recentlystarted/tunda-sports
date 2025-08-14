"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Mail, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Server,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'registration' | 'approval' | 'rejection' | 'notification' | 'auction_sold' | 'auction_unsold' | 'team_assignment';
  enabled: boolean;
}

interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'organizer';
  notifications: string[];
  recipientType: 'to' | 'cc';
}

// Transform database config to admin panel format
const dbToAdminFormat = (dbConfig: any): SMTPSettings => {
  return {
    host: dbConfig?.smtpHost || '',
    port: dbConfig?.smtpPort || 587,
    secure: dbConfig?.smtpSecure ?? false,
    username: dbConfig?.smtpUser || '',
    password: dbConfig?.smtpPassword ? '••••••••' : '',
    fromEmail: dbConfig?.fromEmail || '',
    fromName: dbConfig?.fromName || 'Tunda Sports Club',
    enabled: !!dbConfig?.smtpHost
  };
};

// Transform admin panel format to database format
const adminToDbFormat = (adminConfig: SMTPSettings) => {
  const dbConfig: any = {
    fromName: adminConfig.fromName,
    fromEmail: adminConfig.fromEmail,
    replyTo: adminConfig.fromEmail,
    smtpHost: adminConfig.host,
    smtpPort: adminConfig.port,
    smtpUser: adminConfig.username,
    smtpSecure: adminConfig.secure,
    includeFooter: true,
    footerText: 'Tunda Sports Club - Building Champions Together',
    logoUrl: '/logo.PNG'
  };
  
  // Only include password if it's not masked
  if (adminConfig.password && adminConfig.password !== '••••••••') {
    dbConfig.smtpPassword = adminConfig.password;
  }
  
  return dbConfig;
};

export default function EmailManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: 'Tunda Sports Club',
    enabled: false
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<EmailRecipient | null>(null);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      console.log('Fetching email settings...');
      
      // Use single unified endpoint for all email settings
      const response = await fetch('/api/admin/email-settings');

      if (response.ok) {
        const data = await response.json();
        console.log('Email Settings Response:', data);
        
        // Handle SMTP configuration
        if (data.success && data.configuration) {
          const newSettings = dbToAdminFormat(data.configuration);
          setSMTPSettings(newSettings);
          console.log('Updated SMTP settings from fetch:', newSettings);
        } else {
          // Fallback for empty database
          console.log('No configuration found, using defaults');
          setSMTPSettings({
            host: '',
            port: 587,
            secure: false,
            username: '',
            password: '',
            fromEmail: '',
            fromName: 'Tunda Sports Club',
            enabled: false
          });
        }

        // Handle recipients
        if (data.recipients) {
          setRecipients(data.recipients);
        }
      } else {
        console.error('Failed to fetch email settings:', response.status);
        toast({
          title: "Load Failed",
          description: "Failed to load email settings. Please refresh the page.",
          variant: "destructive"
        });
      }

      // Email templates - kept separate for now as they might have different structure
      const templatesResponse = await fetch('/api/admin/email/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setEmailTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast({
        title: "Load Error",
        description: "Failed to load email settings. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSMTPInputChange = (field: keyof SMTPSettings, value: any) => {
    setSMTPSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSMTPSettings = async () => {
    setSaving(true);
    try {
      // Transform admin panel format to database format
      const dbConfig = adminToDbFormat(smtpSettings);
      console.log('Saving to database:', dbConfig); // Debug log
      
      const response = await fetch('/api/admin/email-settings/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });

      const result = await response.json();
      console.log('Save response:', result); // Debug log

      if (response.ok) {
        const operationType = result.operationType || 'saved';
        
        // Update local state immediately with the saved configuration
        if (result.configuration) {
          const updatedSettings = dbToAdminFormat(result.configuration);
          setSMTPSettings(updatedSettings);
          console.log('Updated SMTP settings state:', updatedSettings);
        }
        
        toast({
          title: "Settings Saved",
          description: `SMTP configuration ${operationType} successfully. Single active configuration maintained.`
        });
        
        // Also refresh from database to ensure consistency
        setTimeout(async () => {
          await fetchEmailSettings();
        }, 100);
        
      } else {
        throw new Error(result.error || 'Failed to save SMTP settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save SMTP settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: smtpSettings.fromEmail })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Test Successful",
          description: "Email test completed successfully!"
        });
      } else {
        throw new Error(result.error || 'Email test failed');
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test email.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const saveTemplate = async (template: Omit<EmailTemplate, 'id'>) => {
    try {
      const response = await fetch('/api/admin/email/templates', {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate ? { ...template, id: editingTemplate.id } : template)
      });

      if (response.ok) {
        await fetchEmailSettings();
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        toast({
          title: "Template Saved",
          description: "Email template updated successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save email template.",
        variant: "destructive"
      });
    }
  };

  const saveRecipient = async (recipient: Omit<EmailRecipient, 'id'>) => {
    try {
      const response = await fetch('/api/admin/email/recipients', {
        method: editingRecipient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecipient ? { ...recipient, id: editingRecipient.id } : recipient)
      });

      if (response.ok) {
        await fetchEmailSettings();
        setIsRecipientDialogOpen(false);
        setEditingRecipient(null);
        toast({
          title: "Recipient Saved",
          description: "Email recipient updated successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save email recipient.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Email Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Configure SMTP settings, email templates, and notification recipients
            </p>
          </div>
        </div>

        <Tabs defaultValue="smtp" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="smtp" className="flex items-center gap-1 sm:gap-2">
              <Server className="h-4 w-4" />
              <span className="text-xs sm:text-sm">SMTP</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="recipients" className="flex items-center gap-1 sm:gap-2">
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Recipients</span>
            </TabsTrigger>
          </TabsList>

          {/* SMTP Settings Tab */}
          <TabsContent value="smtp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure email server settings for sending notifications
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable email notifications system-wide
                    </p>
                  </div>
                  <Switch
                    checked={smtpSettings.enabled}
                    onCheckedChange={(checked) => handleSMTPInputChange('enabled', checked)}
                  />
                </div>

                {/* SMTP Settings Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smtp-host">SMTP Host *</Label>
                      <Input
                        id="smtp-host"
                        value={smtpSettings.host}
                        onChange={(e) => handleSMTPInputChange('host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        disabled={!smtpSettings.enabled}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port">SMTP Port *</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) => handleSMTPInputChange('port', parseInt(e.target.value))}
                        placeholder="587"
                        disabled={!smtpSettings.enabled}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp-secure"
                        checked={smtpSettings.secure}
                        onCheckedChange={(checked) => handleSMTPInputChange('secure', checked)}
                        disabled={!smtpSettings.enabled}
                      />
                      <Label htmlFor="smtp-secure">Use SSL/TLS</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smtp-username">Username/Email *</Label>
                      <Input
                        id="smtp-username"
                        value={smtpSettings.username}
                        onChange={(e) => handleSMTPInputChange('username', e.target.value)}
                        placeholder="your-email@gmail.com"
                        disabled={!smtpSettings.enabled}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-password">Password/App Password *</Label>
                      <div className="relative">
                        <Input
                          id="smtp-password"
                          type={showPassword ? "text" : "password"}
                          value={smtpSettings.password}
                          onChange={(e) => handleSMTPInputChange('password', e.target.value)}
                          placeholder={smtpSettings.password === '••••••••' ? 'Password is saved' : 'Enter password'}
                          disabled={!smtpSettings.enabled}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        For Gmail, use App Password instead of your regular password
                      </p>
                    </div>
                  </div>
                </div>

                {/* From Email Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-email">From Email *</Label>
                    <Input
                      id="from-email"
                      value={smtpSettings.fromEmail}
                      onChange={(e) => handleSMTPInputChange('fromEmail', e.target.value)}
                      placeholder="noreply@tundasports.com"
                      disabled={!smtpSettings.enabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={smtpSettings.fromName}
                      onChange={(e) => handleSMTPInputChange('fromName', e.target.value)}
                      placeholder="Tunda Sports Club"
                      disabled={!smtpSettings.enabled}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={saveSMTPSettings} 
                    disabled={saving || !smtpSettings.enabled}
                    className="flex-1 sm:flex-none"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={testEmailConnection}
                    disabled={testing || !smtpSettings.enabled || !smtpSettings.host}
                    className="flex-1 sm:flex-none"
                  >
                    {testing ? "Testing..." : "Test Email"}
                  </Button>
                </div>

                {/* SMTP Status */}
                <Alert>
                  {smtpSettings.enabled ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {smtpSettings.enabled 
                      ? "Email notifications are enabled. Users will receive email confirmations and admins will get notification emails."
                      : "Email notifications are disabled. No emails will be sent by the system."
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Email Templates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customize email templates for different notifications
                    </p>
                  </div>
                  <Button onClick={() => setIsTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailTemplates.length > 0 ? (
                    emailTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium truncate">{template.name}</h4>
                              <Badge variant={template.enabled ? "default" : "secondary"}>
                                {template.enabled ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 truncate">
                              Subject: {template.subject}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.content.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setIsTemplateDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No email templates configured</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsTemplateDialogOpen(true)}
                      >
                        Create First Template
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Email Recipients
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage admin and organizer email addresses for notifications
                    </p>
                  </div>
                  <Button onClick={() => setIsRecipientDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipients.length > 0 ? (
                    <div className="grid gap-4">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium">{recipient.name}</h4>
                                <Badge variant={recipient.role === 'admin' ? "default" : "secondary"}>
                                  {recipient.role}
                                </Badge>
                                <Badge variant={recipient.recipientType === 'to' ? "default" : "outline"}>
                                  {recipient.recipientType?.toUpperCase() || 'TO'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground break-all">
                                {recipient.email}
                              </p>
                              {recipient.notifications.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {recipient.notifications.map((notification) => (
                                    <Badge key={notification} variant="outline" className="text-xs">
                                      {notification}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 self-start">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingRecipient(recipient);
                                  setIsRecipientDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No email recipients configured</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsRecipientDialogOpen(true)}
                      >
                        Add First Recipient
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <EmailTemplateDialog
          isOpen={isTemplateDialogOpen}
          onClose={() => {
            setIsTemplateDialogOpen(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSave={saveTemplate}
        />

        {/* Recipient Dialog */}
        <EmailRecipientDialog
          isOpen={isRecipientDialogOpen}
          onClose={() => {
            setIsRecipientDialogOpen(false);
            setEditingRecipient(null);
          }}
          recipient={editingRecipient}
          onSave={saveRecipient}
        />
      </div>
    </div>
  );
}

// Template Dialog Component
function EmailTemplateDialog({ 
  isOpen, 
  onClose, 
  template, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (template: Omit<EmailTemplate, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'registration' as EmailTemplate['type'],
    enabled: true
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type,
        enabled: template.enabled
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        content: '',
        type: 'registration',
        enabled: true
      });
    }
  }, [template, isOpen]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
          <DialogDescription>
            Configure email template settings for automated notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Registration Confirmation"
                />
              </div>
              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as EmailTemplate['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="rejection">Rejection</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="auction_sold">Auction - Player Sold</SelectItem>
                    <SelectItem value="auction_unsold">Auction - Player Unsold</SelectItem>
                    <SelectItem value="team_assignment">Team Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Team Registration Confirmation"
              />
            </div>
            <div>
              <Label htmlFor="template-content">Email Content</Label>
              <Textarea
                id="template-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter email content here..."
                rows={10}
                className="min-h-[200px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="template-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="template-enabled">Enable this template</Label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Recipient Dialog Component
function EmailRecipientDialog({ 
  isOpen, 
  onClose, 
  recipient, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  recipient: EmailRecipient | null;
  onSave: (recipient: Omit<EmailRecipient, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin' as EmailRecipient['role'],
    notifications: [] as string[],
    recipientType: 'to' as 'to' | 'cc'
  });

  useEffect(() => {
    if (recipient) {
      setFormData({
        email: recipient.email,
        name: recipient.name,
        role: recipient.role,
        notifications: recipient.notifications,
        recipientType: recipient.recipientType || 'to'
      });
    } else {
      setFormData({
        email: '',
        name: '',
        role: 'admin',
        notifications: [],
        recipientType: 'to'
      });
    }
  }, [recipient, isOpen]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {recipient ? 'Edit Recipient' : 'Add Recipient'}
          </DialogTitle>
          <DialogDescription>
            Add or edit email recipients for tournament notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipient-name">Name</Label>
                <Input
                  id="recipient-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Admin Name"
                />
              </div>
              <div>
                <Label htmlFor="recipient-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as EmailRecipient['role'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="recipient-email">Email Address</Label>
              <Input
                id="recipient-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@tundasports.com"
              />
            </div>
            
            <div>
              <Label htmlFor="recipient-type">Recipient Type</Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recipientType: value as 'to' | 'cc' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to">To (Primary Recipient)</SelectItem>
                  <SelectItem value="cc">CC (Carbon Copy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notification Types</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which types of emails this recipient should receive
              </p>
              <div className="space-y-2">
                {[
                  { value: 'registration', label: 'New Registrations' },
                  { value: 'approval', label: 'Registration Approvals' },
                  { value: 'rejection', label: 'Registration Rejections' },
                  { value: 'payment', label: 'Payment Updates' },
                  { value: 'system', label: 'System Alerts' },
                  { value: 'tournament', label: 'Tournament Updates' },
                  { value: 'auction_sold', label: 'Auction - Player Sold' },
                  { value: 'auction_unsold', label: 'Auction - Player Unsold' },
                  { value: 'team_assignment', label: 'Team Assignment Notifications' }
                ].map((notificationType) => (
                  <div key={notificationType.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`notification-${notificationType.value}`}
                      checked={formData.notifications.includes(notificationType.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            notifications: [...prev.notifications, notificationType.value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            notifications: prev.notifications.filter(n => n !== notificationType.value)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`notification-${notificationType.value}`} className="text-sm">
                      {notificationType.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.email || !formData.name}
            className="w-full sm:w-auto"
          >
            {recipient ? 'Update' : 'Add'} Recipient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
