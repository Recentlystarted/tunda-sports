"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Smartphone, 
  QrCode, 
  CreditCard,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PaymentSettings {
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
}

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: '',
    upiMobile: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    qrCodeUrl: null
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageInfo, setImageInfo] = useState<{
    originalDimensions?: string;
    finalDimensions?: string;
    wasResized?: boolean;
  }>({});

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/settings/payment');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setPreviewUrl(data.qrCodeUrl);
      } else {
        // If no settings exist in database, show empty form
        console.log('No payment settings found in database');
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        processAndResizeImage(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file (PNG, JPG, JPEG)",
          variant: "destructive"
        });
      }
    }
  };

  const processAndResizeImage = (file: File) => {
    setProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const originalDimensions = `${img.width}x${img.height}`;
        // Check if image needs resizing
        const needsResize = img.width !== 300 || img.height !== 300;
        
        if (needsResize) {
          // Resize image to 300x300
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = 300;
          canvas.height = 300;
          
          if (ctx) {
            // Fill with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 300);
            
            // Calculate scaling to maintain aspect ratio while fitting in 300x300
            const scale = Math.min(300 / img.width, 300 / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Center the image
            const offsetX = (300 - scaledWidth) / 2;
            const offsetY = (300 - scaledHeight) / 2;
            
            // Draw the resized image
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            
            // Convert canvas to blob and create file
            canvas.toBlob((blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/png',
                  lastModified: Date.now()
                });
                
                setQrFile(resizedFile);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setImageInfo({
                  originalDimensions,
                  finalDimensions: '300x300',
                  wasResized: true
                });
                
                toast({
                  title: "Image Processed",
                  description: `Image automatically resized to 300x300 pixels (was ${originalDimensions})`,
                  variant: "default"
                });
              }
              setProcessingImage(false);
            }, 'image/png', 0.9);
          } else {
            setProcessingImage(false);
          }
        } else {
          // Image is already the correct size
          setQrFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setImageInfo({
            originalDimensions,
            finalDimensions: '300x300',
            wasResized: false
          });
          
          toast({
            title: "Image Ready",
            description: "Image is already the perfect size (300x300 pixels)",
            variant: "default"
          });
          setProcessingImage(false);
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  const uploadQrCode = async () => {
    if (!qrFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('qrImage', qrFile); // Changed from 'qrCode' to 'qrImage'

      const response = await fetch('/api/admin/upload-qr', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.fileUrl; // Changed from 'url' to 'fileUrl'
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload QR code');
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload QR code. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let qrCodeUrl = settings.qrCodeUrl;

      // Upload new QR code if selected
      if (qrFile) {
        const uploadedUrl = await uploadQrCode();
        if (uploadedUrl) {
          qrCodeUrl = uploadedUrl;
        } else {
          setSaving(false);
          return;
        }
      }

      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          qrCodeUrl
        })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, qrCodeUrl }));
        setQrFile(null);
        toast({
          title: "Settings Saved",
          description: "Payment settings have been updated successfully."
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save payment settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const removeQrCode = () => {
    setQrFile(null);
    setPreviewUrl(null);
    setSettings(prev => ({ ...prev, qrCodeUrl: null }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
            <p className="text-muted-foreground">
              Configure UPI, bank details, and QR code for tournament payments
            </p>
          </div>
        </div>

        {/* UPI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              UPI Payment Details
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure UPI details for digital payments. Both fields required if using UPI.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={settings.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  placeholder="example@paytm"
                />
              </div>
              <div>
                <Label htmlFor="upiMobile">UPI Mobile Number</Label>
                <Input
                  id="upiMobile"
                  value={settings.upiMobile}
                  onChange={(e) => handleInputChange('upiMobile', e.target.value)}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Transfer Details
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure bank account details for bank transfers. All fields required if using bank transfer.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankAccountName">Account Name</Label>
                <Input
                  id="bankAccountName"
                  value={settings.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                  placeholder="Tunda Sports Club"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={settings.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={settings.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="State Bank of India"
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={settings.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  placeholder="SBIN0001234"
                />
              </div>
              <div>
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={settings.branchName}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  placeholder="Tunda Branch"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Management
              <span className="text-sm font-normal text-muted-foreground">(Independent)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload a payment QR code. This can be used independently of UPI/bank details above.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current QR Code Display */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Current QR Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeQrCode}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Image
                      src={previewUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload New QR Code */}
            <div className="space-y-3">
              <Label htmlFor="qrUpload">
                {previewUrl ? 'Upload New QR Code' : 'Upload QR Code'}
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="qrUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileChange}
                  className="flex-1"
                  disabled={processingImage}
                />
                {qrFile && !processingImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQrFile(null);
                      setPreviewUrl(settings.qrCodeUrl);
                      setImageInfo({});
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Processing Indicator */}
              {processingImage && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing and resizing image...
                </div>
              )}

              {/* Image Information */}
              {imageInfo.originalDimensions && !processingImage && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Image Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Original Size:</span>
                      <span className="ml-2 font-medium">{imageInfo.originalDimensions} px</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Final Size:</span>
                      <span className="ml-2 font-medium">{imageInfo.finalDimensions} px</span>
                    </div>
                  </div>
                  {imageInfo.wasResized && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Automatically resized and centered with white background
                    </div>
                  )}
                  {!imageInfo.wasResized && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Perfect size - no resizing needed
                    </div>
                  )}
                </div>
              )}
            </div>

            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Upload any QR code image - it will be automatically processed and resized to 300x300 pixels if needed.
                The image will be centered with a white background. Supported formats: PNG, JPG, JPEG (max 5MB).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/settings">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving || uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Preview Section */}
        {(settings.upiId || settings.bankAccountNumber) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview: How Users Will See Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.upiId && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 space-y-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">UPI Payment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {settings.upiId && (
                        <div className="text-sm">
                          <strong>UPI ID:</strong> {settings.upiId}
                        </div>
                      )}
                      {settings.upiMobile && (
                        <div className="text-sm">
                          <strong>Mobile:</strong> {settings.upiMobile}
                        </div>
                      )}
                    </div>
                    {previewUrl && (
                      <div className="flex justify-center">
                        <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <Image
                            src={previewUrl}
                            alt="QR Code Preview"
                            width={128}
                            height={128}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {settings.bankAccountNumber && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 space-y-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Bank Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      {settings.bankAccountName && <div><strong>Account Name:</strong> {settings.bankAccountName}</div>}
                      {settings.bankAccountNumber && <div><strong>Account Number:</strong> {settings.bankAccountNumber}</div>}
                      {settings.bankName && <div><strong>Bank:</strong> {settings.bankName}</div>}
                    </div>
                    <div>
                      {settings.ifscCode && <div><strong>IFSC Code:</strong> {settings.ifscCode}</div>}
                      {settings.branchName && <div><strong>Branch:</strong> {settings.branchName}</div>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
