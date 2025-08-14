"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Users, 
  User, 
  QrCode,
  Wand2,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Smartphone
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface PaymentMethod {
  id?: string;
  methodName: string;
  methodType: 'PLAYER_REGISTRATION' | 'TEAM_OWNER_REGISTRATION' | 'GENERAL_REGISTRATION' | 'LATE_REGISTRATION';
  upiId?: string;
  upiMobile?: string;
  qrCodeUrl?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  amount: number;
  currency: string;
  displayOrder: number;
  description?: string;
  isActive: boolean;
}

interface Tournament {
  id: string;
  name: string;
  isAuctionBased: boolean;
  entryFee?: number; // Main entry fee for regular tournaments
  playerEntryFee?: number;
  teamEntryFee?: number;
  competitionType: string;
  format: string;
}

interface TournamentPaymentManagerProps {
  tournamentId: string;
  tournament?: Tournament;
  onPaymentMethodsChange?: (methods: PaymentMethod[]) => void;
}

export default function TournamentPaymentManager({ 
  tournamentId, 
  tournament,
  onPaymentMethodsChange 
}: TournamentPaymentManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [autoSetup, setAutoSetup] = useState(false);

  const methodTypeLabels = {
    'PLAYER_REGISTRATION': 'Player Registration',
    'TEAM_OWNER_REGISTRATION': 'Team Owner Registration', 
    'GENERAL_REGISTRATION': 'General Registration',
    'LATE_REGISTRATION': 'Late Registration'
  };

  const methodTypeIcons = {
    'PLAYER_REGISTRATION': User,
    'TEAM_OWNER_REGISTRATION': Users,
    'GENERAL_REGISTRATION': CreditCard,
    'LATE_REGISTRATION': AlertTriangle
  };

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament && globalSettings && paymentMethods.length === 0 && !loading) {
      // Auto-setup payment methods based on tournament type
      handleAutoSetup();
    }
  }, [tournament, globalSettings, paymentMethods, loading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch global settings
      const globalResponse = await fetch('/api/settings/payment');
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        setGlobalSettings(globalData);
      }

      // Fetch tournament-specific payment methods
      const methodsResponse = await fetch(`/api/tournaments/${tournamentId}/payment-methods`);
      if (methodsResponse.ok) {
        const methods = await methodsResponse.json();
        setPaymentMethods(methods);
        onPaymentMethodsChange?.(methods);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSetup = async () => {
    if (!tournament || !globalSettings || autoSetup) return;
    
    setAutoSetup(true);
    
    try {
      const methodsToCreate: Partial<PaymentMethod>[] = [];
      
      console.log('Auto-setup for tournament:', tournament.name, {
        isAuctionBased: tournament.isAuctionBased,
        competitionType: tournament.competitionType,
        entryFee: tournament.entryFee,
        playerEntryFee: tournament.playerEntryFee,
        teamEntryFee: tournament.teamEntryFee
      });
      
      if (tournament.isAuctionBased) {
        // Auction tournament - create both player and team owner methods
        if (tournament.playerEntryFee && tournament.playerEntryFee > 0) {
          methodsToCreate.push({
            methodName: `${tournament.name} - Player Registration`,
            methodType: 'PLAYER_REGISTRATION',
            amount: tournament.playerEntryFee,
            currency: 'INR',
            displayOrder: 1,
            description: `Registration fee for players in ${tournament.name}`,
            isActive: true,
            upiId: globalSettings.upiId,
            upiMobile: globalSettings.upiMobile
          });
        }
        
        if (tournament.teamEntryFee && tournament.teamEntryFee > 0) {
          methodsToCreate.push({
            methodName: `${tournament.name} - Team Owner Registration`,
            methodType: 'TEAM_OWNER_REGISTRATION',
            amount: tournament.teamEntryFee,
            currency: 'INR',
            displayOrder: 2,
            description: `Registration fee for team owners in ${tournament.name}`,
            isActive: true,
            upiId: globalSettings.upiId,
            upiMobile: globalSettings.upiMobile
          });
        }
      } else {
        // Regular tournament (knockout, etc.) - use entryFee first, then fallback to playerEntryFee
        const entryFee = tournament.entryFee || tournament.playerEntryFee || 1100; // Use tournament.entryFee first
        methodsToCreate.push({
          methodName: `${tournament.name} - Team Registration`,
          methodType: 'GENERAL_REGISTRATION',
          amount: entryFee,
          currency: 'INR',
          displayOrder: 1,
          description: `Team registration fee for ${tournament.name} (${tournament.competitionType?.toLowerCase()})`,
          isActive: true,
          upiId: globalSettings.upiId,
          upiMobile: globalSettings.upiMobile
        });
      }

      console.log('Creating payment methods:', methodsToCreate);

      // Create methods and generate QR codes
      for (const method of methodsToCreate) {
        await handleCreateMethodWithQR(method);
      }

      toast({
        title: "Auto-Setup Complete",
        description: `Created ${methodsToCreate.length} payment method(s) with QR codes`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Auto-setup error:', error);
      toast({
        title: "Auto-Setup Failed",
        description: "Could not automatically create payment methods",
        variant: "destructive"
      });
    }
  };

  const handleCreateMethodWithQR = async (methodData: Partial<PaymentMethod>) => {
    try {
      // Create the payment method first
      const response = await fetch(`/api/tournaments/${tournamentId}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodData)
      });

      if (response.ok) {
        const { paymentMethod } = await response.json();
        
        // Generate QR code if UPI details are available
        if (methodData.upiId && methodData.upiMobile && methodData.amount) {
          try {
            const qrCodeUrl = await generateQRCode({
              upiId: methodData.upiId,
              mobile: methodData.upiMobile,
              amount: methodData.amount,
              tournamentName: tournament?.name || 'Tournament',
              paymentType: methodTypeLabels[methodData.methodType || 'GENERAL_REGISTRATION']
            });

            if (qrCodeUrl) {
              // Update method with QR code
              const updatedMethod = await updateMethodQRCode(paymentMethod.id, qrCodeUrl);
              Object.assign(paymentMethod, updatedMethod);
            }
          } catch (qrError) {
            console.error('Error generating QR code during auto-setup:', qrError);
            // Continue with method creation even if QR generation fails
          }
        }
        
        setPaymentMethods(prev => [...prev, paymentMethod]);
        return paymentMethod;
      }
    } catch (error) {
      console.error('Error creating method with QR:', error);
      throw error;
    }
  };

  const generateQRCode = async (qrData: {
    upiId: string;
    mobile: string;
    amount: number;
    tournamentName: string;
    paymentType: string;
  }): Promise<string | null> => {
    try {
      console.log('Generating QR code with data:', qrData);
      
      const response = await fetch('/api/admin/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qrData,
          organizationName: 'Tunda Sports Club'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('QR generation response:', data);
        return data.qrCodeUrl;
      } else {
        const errorData = await response.json();
        console.error('QR generation failed:', errorData);
        return null;
      }
    } catch (error) {
      console.error('QR generation error:', error);
      return null;
    }
  };

  const updateMethodQRCode = async (methodId: string, qrCodeUrl: string) => {
    try {
      // Find the current method to get all its data
      const currentMethod = paymentMethods.find(m => m.id === methodId);
      if (!currentMethod) {
        throw new Error('Payment method not found');
      }

      console.log('Updating QR code for method:', methodId, 'with URL:', qrCodeUrl);
      console.log('Current method data:', currentMethod);

      const updateData = {
        ...currentMethod,
        qrCodeUrl
      };

      console.log('Sending update data:', updateData);

      const response = await fetch(`/api/tournaments/${tournamentId}/payment-methods/${methodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update response error:', errorData);
        throw new Error(errorData.error || 'Failed to update QR code');
      }

      const { paymentMethod } = await response.json();
      console.log('Updated payment method:', paymentMethod);
      return paymentMethod;
    } catch (error) {
      console.error('Error updating QR code:', error);
      throw error;
    }
  };

  const handleGenerateQR = async (method: PaymentMethod) => {
    if (!method.upiId || !method.upiMobile || !method.amount) {
      toast({
        title: "Missing Information",
        description: "UPI ID, mobile number, and amount are required to generate QR code",
        variant: "destructive"
      });
      return;
    }

    setGeneratingQR(method.id || 'new');
    
    try {
      const qrCodeUrl = await generateQRCode({
        upiId: method.upiId,
        mobile: method.upiMobile,
        amount: method.amount,
        tournamentName: tournament?.name || 'Tournament',
        paymentType: method.methodName
      });

      if (qrCodeUrl && method.id) {
        const updatedMethod = await updateMethodQRCode(method.id, qrCodeUrl);
        
        setPaymentMethods(prev => 
          prev.map(m => m.id === method.id ? updatedMethod : m)
        );

        toast({
          title: "QR Code Generated",
          description: "Custom QR code created and saved successfully",
          variant: "default"
        });
      } else if (!qrCodeUrl) {
        throw new Error('Failed to generate QR code');
      } else {
        throw new Error('Method ID missing');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate QR code",
        variant: "destructive"
      });
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/payment-methods/${methodId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
        toast({
          title: "Success",
          description: "Payment method deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };

  const handleSaveMethod = async (methodData: PaymentMethod) => {
    try {
      const url = methodData.id 
        ? `/api/tournaments/${tournamentId}/payment-methods/${methodData.id}`
        : `/api/tournaments/${tournamentId}/payment-methods`;
      
      const method = methodData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodData)
      });

      if (response.ok) {
        const { paymentMethod } = await response.json();
        
        if (methodData.id) {
          // Update existing method
          setPaymentMethods(prev => 
            prev.map(m => m.id === methodData.id ? paymentMethod : m)
          );
        } else {
          // Add new method
          setPaymentMethods(prev => [...prev, paymentMethod]);
        }

        toast({
          title: "Success",
          description: `Payment method ${methodData.id ? 'updated' : 'created'} successfully`,
        });

        setShowDialog(false);
        setEditingMethod(null);
        onPaymentMethodsChange?.(paymentMethods);
      } else {
        throw new Error('Failed to save payment method');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading payment methods...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      {tournament && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Tournament Payment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tournament:</span>
                <p className="font-medium">{tournament.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">
                  {tournament.isAuctionBased ? 'Auction Based' : 'Regular'} 
                  <span className="text-xs text-muted-foreground ml-1">
                    ({tournament.competitionType})
                  </span>
                </p>
              </div>
              {/* Show appropriate fee based on tournament type */}
              {tournament.isAuctionBased ? (
                <>
                  {tournament.playerEntryFee && (
                    <div>
                      <span className="text-muted-foreground">Player Fee:</span>
                      <p className="font-medium">₹{tournament.playerEntryFee}</p>
                    </div>
                  )}
                  {tournament.teamEntryFee && (
                    <div>
                      <span className="text-muted-foreground">Team Owner Fee:</span>
                      <p className="font-medium">₹{tournament.teamEntryFee}</p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <span className="text-muted-foreground">Team Entry Fee:</span>
                  <p className="font-medium">₹{tournament.entryFee || tournament.playerEntryFee || 0}</p>
                </div>
              )}
            </div>
            
            {/* Warning for missing tournament fees */}
            {tournament.isAuctionBased && (!tournament.playerEntryFee || !tournament.teamEntryFee) && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Missing Tournament Entry Fees</AlertTitle>
                <AlertDescription>
                  This auction tournament is missing entry fee settings. Please set Player Entry Fee (₹{tournament.playerEntryFee || 0}) and Team Owner Entry Fee (₹{tournament.teamEntryFee || 0}) in the tournament configuration before creating payment methods.
                </AlertDescription>
              </Alert>
            )}
            
            {!tournament.isAuctionBased && !tournament.entryFee && !tournament.playerEntryFee && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Missing Tournament Entry Fee</AlertTitle>
                <AlertDescription>
                  This tournament is missing entry fee settings. Please set the Entry Fee in the tournament configuration before creating payment methods.
                </AlertDescription>
              </Alert>
            )}
            
            {paymentMethods.length === 0 && (
              <Alert className="mt-4">
                <Wand2 className="h-4 w-4" />
                <AlertTitle>Auto-Setup Available</AlertTitle>
                <AlertDescription>
                  We can automatically create payment methods based on your tournament settings.
                  <Button 
                    size="sm" 
                    className="ml-3" 
                    onClick={handleAutoSetup}
                    disabled={
                      autoSetup || 
                      (tournament.isAuctionBased && (!tournament.playerEntryFee || !tournament.teamEntryFee)) || 
                      (!tournament.isAuctionBased && !tournament.entryFee && !tournament.playerEntryFee)
                    }
                  >
                    {autoSetup ? 'Setting up...' : 'Auto-Setup Payment Methods'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="grid gap-4">
        {paymentMethods.map((method) => {
          const IconComponent = methodTypeIcons[method.methodType];
          const isGenerating = generatingQR === method.id;
          
          return (
            <Card key={method.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{method.methodName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {methodTypeLabels[method.methodType]}
                        </Badge>
                        <Badge variant={method.isActive ? "default" : "secondary"} className="text-xs">
                          {method.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">₹{method.amount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMethod(method);
                        setShowDialog(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMethod(method.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Payment Details */}
                {method.upiId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground">UPI ID:</span>
                      <p className="text-sm font-medium">{method.upiId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Mobile:</span>
                      <p className="text-sm font-medium">{method.upiMobile}</p>
                    </div>
                  </div>
                )}

                {/* QR Code Section */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    {method.qrCodeUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">QR Code Ready</span>
                        </div>
                        <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
                          <img
                            src={method.qrCodeUrl}
                            alt="Payment QR Code"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error('QR image failed to load:', method.qrCodeUrl?.substring(0, 50) + '...');
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex flex-col items-center justify-center text-center p-2">
                                    <svg class="h-8 w-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01M12 12v.01" />
                                    </svg>
                                    <span class="text-xs text-muted-foreground">QR Code Generated</span>
                                    <button onclick="navigator.clipboard.writeText('${method.qrCodeUrl}')" class="text-xs text-blue-500 underline mt-1">
                                      Copy QR Data
                                    </button>
                                  </div>
                                `;
                              }
                            }}
                          />
                          {/* Tunda Sports Club Logo Overlay */}
                          <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center">
                            <img
                              src="/logo.PNG"
                              alt="TSC"
                              width={20}
                              height={20}
                              className="w-4 h-4 object-contain"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          Tunda Sports Club
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <QrCode className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs">No QR Code</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateQR(method)}
                      disabled={!method.upiId || !method.upiMobile || !method.amount || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          {method.qrCodeUrl ? 'Regenerate QR' : 'Generate QR'}
                        </>
                      )}
                    </Button>
                    
                    {method.qrCodeUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (method.qrCodeUrl?.startsWith('data:')) {
                            // For data URLs, open in new window
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head><title>QR Code - ${method.methodName}</title></head>
                                  <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5;">
                                    <div style="text-align:center; background:white; padding:20px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                                      <h3 style="margin-top:0; color:#333;">Tunda Sports Club</h3>
                                      <img src="${method.qrCodeUrl}" alt="QR Code" style="max-width:400px; height:auto;" />
                                      <p style="margin-bottom:0; color:#666; font-size:14px;">${method.methodName}</p>
                                    </div>
                                  </body>
                                </html>
                              `);
                            }
                          } else {
                            // For regular URLs, open directly
                            window.open(method.qrCodeUrl, '_blank');
                          }
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {method.description && (
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Method Button */}
      <Button
        onClick={() => {
          setEditingMethod({
            methodName: "",
            methodType: 'GENERAL_REGISTRATION',
            amount: 0,
            currency: 'INR',
            displayOrder: paymentMethods.length,
            isActive: true,
            upiId: globalSettings?.upiId || '',
            upiMobile: globalSettings?.upiMobile || ''
          });
          setShowDialog(true);
        }}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Payment Method
      </Button>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {editingMethod?.id ? 'Edit Payment Method' : 'Add New Payment Method'}
            </DialogTitle>
            <DialogDescription>
              Configure payment method details. QR codes will be auto-generated based on UPI information.
            </DialogDescription>
          </DialogHeader>

          {editingMethod && (
            <PaymentMethodForm
              method={editingMethod}
              globalSettings={globalSettings}
              tournament={tournament}
              onSave={handleSaveMethod}
              onCancel={() => setShowDialog(false)}
              onGenerateQR={handleGenerateQR}
              isGenerating={generatingQR === (editingMethod.id || 'new')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Payment Method Form Component
interface PaymentMethodFormProps {
  method: PaymentMethod;
  globalSettings: any;
  tournament?: Tournament;
  onSave: (method: PaymentMethod) => void;
  onCancel: () => void;
  onGenerateQR: (method: PaymentMethod) => void;
  isGenerating: boolean;
}

function PaymentMethodForm({ 
  method, 
  globalSettings, 
  tournament, 
  onSave, 
  onCancel, 
  onGenerateQR, 
  isGenerating 
}: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethod>(method);
  const [saving, setSaving] = useState(false);

  const methodTypeLabels = {
    'PLAYER_REGISTRATION': 'Player Registration',
    'TEAM_OWNER_REGISTRATION': 'Team Owner Registration', 
    'GENERAL_REGISTRATION': 'General Registration',
    'LATE_REGISTRATION': 'Late Registration'
  };

  // Check if amount should be read-only (when it comes from tournament data)
  const isAmountReadOnly = Boolean(tournament && (
    (formData.methodType === 'PLAYER_REGISTRATION' && tournament.playerEntryFee && formData.amount === tournament.playerEntryFee) ||
    (formData.methodType === 'TEAM_OWNER_REGISTRATION' && tournament.teamEntryFee && formData.amount === tournament.teamEntryFee) ||
    (formData.methodType === 'GENERAL_REGISTRATION' && (
      (tournament.entryFee && formData.amount === tournament.entryFee) ||
      (!tournament.entryFee && tournament.playerEntryFee && formData.amount === tournament.playerEntryFee)
    ))
  ));

  const getTournamentFeeForType = (methodType: PaymentMethod['methodType']) => {
    if (!tournament) return 0;
    
    switch (methodType) {
      case 'PLAYER_REGISTRATION':
        return tournament.playerEntryFee || 0;
      case 'TEAM_OWNER_REGISTRATION':
        return tournament.teamEntryFee || 0;
      case 'GENERAL_REGISTRATION':
        return tournament.entryFee || tournament.playerEntryFee || 0;
      default:
        return 0;
    }
  };

  // Update amount when method type changes
  useEffect(() => {
    if (tournament) {
      const expectedAmount = getTournamentFeeForType(formData.methodType);
      if (expectedAmount > 0 && formData.amount !== expectedAmount) {
        setFormData(prev => ({ ...prev, amount: expectedAmount }));
      }
    }
  }, [formData.methodType, tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.methodName || !formData.amount) {
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PaymentMethod, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tournament Info Display */}
      {tournament && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tournament Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">Name:</span>
              <p className="font-medium">{tournament.name}</p>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">Type:</span>
              <p className="font-medium">
                {tournament.isAuctionBased ? 'Auction' : 'Regular'} 
                <span className="text-xs text-blue-600 dark:text-blue-400 block">
                  {tournament.competitionType}
                </span>
              </p>
            </div>
            
            {/* Show appropriate fees based on tournament type */}
            {tournament.isAuctionBased ? (
              <>
                {tournament.playerEntryFee && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Player Fee:</span>
                    <p className="font-medium">₹{tournament.playerEntryFee}</p>
                  </div>
                )}
                {tournament.teamEntryFee && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Team Owner Fee:</span>
                    <p className="font-medium">₹{tournament.teamEntryFee}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <span className="text-blue-700 dark:text-blue-300">Entry Fee:</span>
                <p className="font-medium">₹{tournament.entryFee || tournament.playerEntryFee || 0}</p>
              </div>
            )}
            
            {/* Show current method type context */}
            <div className="col-span-2 mt-2 p-2 bg-blue-100 dark:bg-blue-800/50 rounded">
              <span className="text-blue-700 dark:text-blue-300 text-xs">For {methodTypeLabels[formData.methodType]}:</span>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                ₹{getTournamentFeeForType(formData.methodType)} 
                {isAmountReadOnly && <span className="text-xs ml-1">(auto-filled)</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="methodName">Method Name *</Label>
          <Input
            id="methodName"
            value={formData.methodName}
            onChange={(e) => updateField('methodName', e.target.value)}
            placeholder="e.g., Player Registration"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="methodType">Payment Type *</Label>
          <Select
            value={formData.methodType}
            onValueChange={(value) => updateField('methodType', value as PaymentMethod['methodType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLAYER_REGISTRATION">Player Registration</SelectItem>
              <SelectItem value="TEAM_OWNER_REGISTRATION">Team Owner Registration</SelectItem>
              <SelectItem value="GENERAL_REGISTRATION">General Registration</SelectItem>
              <SelectItem value="LATE_REGISTRATION">Late Registration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (₹) *
            {isAmountReadOnly && (
              <Badge variant="secondary" className="ml-2">Auto-filled from tournament</Badge>
            )}
          </Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            step="1"
            required
            readOnly={isAmountReadOnly}
            disabled={isAmountReadOnly}
            className={isAmountReadOnly ? "bg-muted cursor-not-allowed" : ""}
          />
          {isAmountReadOnly && (
            <p className="text-xs text-muted-foreground">
              This amount is automatically set from the tournament's entry fee and cannot be edited here. 
              To change this amount, edit the tournament settings.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      {/* UPI Information */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          UPI Payment Details
        </h4>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Auto-Fill from Global Settings</AlertTitle>
          <AlertDescription>
            UPI details are automatically filled from global payment settings. You can modify them for this specific payment method.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              value={formData.upiId || ''}
              onChange={(e) => updateField('upiId', e.target.value)}
              placeholder="example@upi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upiMobile">UPI Mobile</Label>
            <Input
              id="upiMobile"
              value={formData.upiMobile || ''}
              onChange={(e) => updateField('upiMobile', e.target.value)}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      {formData.upiId && formData.upiMobile && formData.amount > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code Generation
          </h4>
          
          <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex-1">
              <p className="text-green-700 dark:text-green-300 text-sm mb-2">
                Ready to generate custom QR code with:
              </p>
              <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                <li>• UPI ID: {formData.upiId}</li>
                <li>• Amount: ₹{formData.amount}</li>
                <li>• Tournament: {tournament?.name}</li>
                <li>• Purpose: {formData.methodName}</li>
              </ul>
            </div>
            
            <Button
              type="button"
              size="sm"
              onClick={() => onGenerateQR(formData)}
              disabled={isGenerating}
              className="shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate QR
                </>
              )}
            </Button>
          </div>

          {formData.qrCodeUrl && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="relative w-20 h-20 border rounded overflow-hidden bg-white">
                <img
                  src={formData.qrCodeUrl}
                  alt="Generated QR Code"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Tunda Sports Club Logo Overlay */}
                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full border shadow-sm flex items-center justify-center">
                  <img
                    src="/logo.PNG"
                    alt="TSC"
                    width={12}
                    height={12}
                    className="w-3 h-3 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  QR Code Generated Successfully
                </p>
                <p className="text-xs text-muted-foreground">
                  Tunda Sports Club payment QR with tournament details
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.open(formData.qrCodeUrl, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Additional details about this payment method..."
          rows={3}
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => updateField('isActive', checked)}
        />
        <Label htmlFor="isActive">Active (visible to users)</Label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !formData.methodName || !formData.amount}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
