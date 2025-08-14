"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  IndianRupee,
  Loader2,
  Edit
} from 'lucide-react';

interface Registration {
  id: string;
  status: string;
  registrationDate: string;
  contactEmail: string;
  contactPhone?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentStatus: string;
  registrationType?: string;
  specialRequests?: string;
  notes?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  team: {
    name: string;
    captainName: string;
    captainPhone?: string;
    captainEmail: string;
    playersCount: number;
  };
  tournament: {
    name: string;
    venue: string;
    startDate: string;
    entryFee: number;
  };
}

interface RegistrationDetails extends Registration {
  team: Registration['team'] & {
    id: string;
    homeGround?: string;
    description?: string;
    players: Array<{
      id: string;
      name: string;
      position: string;
      experience: string;
      jerseyNumber?: number;
      isSubstitute?: boolean;
      city?: string;
      fatherName?: string;
      phone?: string;
    }>;
  };
}

const RegistrationManagement = () => {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [selectedTournament, setSelectedTournament] = useState<string>('ALL');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditPlayers, setShowEditPlayers] = useState(false);
  const [processingId, setProcessingId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Get tournament filter from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');
    if (tournamentId) {
      setSelectedTournament(tournamentId);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedStatus, selectedTournament]);
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }
      if (selectedTournament !== 'ALL') {
        params.append('tournamentId', selectedTournament);
      }
      
      const response = await fetch(`/api/registrations?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRegistrations(data.registrations);
      } else {
        console.error('Error fetching registrations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationDetails = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedRegistration(data);
        setAdminNotes(data.notes || '');
        setShowDetails(true);
      } else {
        console.error('Error fetching registration details:', data.error);
        toast({
          title: "Error",
          description: "Failed to fetch registration details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching registration details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registration details",
        variant: "destructive",
      });
    }
  };
  const handleApproval = async (registrationId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingId(registrationId);
      
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          notes: adminNotes,
          adminId: 'current-admin-id' // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the registrations list
        await fetchRegistrations();
        
        // Close dialogs and reset state
        setShowDetails(false);
        setRejectionReason('');
        setAdminNotes('');
        
        toast({
          title: "Success",
          description: `Registration ${action}d successfully!`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} registration`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing registration:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} registration`,
        variant: "destructive",
      });
    } finally {
      setProcessingId('');
    }  };

  const handlePaymentStatusUpdate = async (registrationId: string, paymentStatus: string) => {
    try {
      setProcessingId(registrationId);
      
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePayment',
          paymentStatus,
          adminId: 'current-admin-id' // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the selected registration
        setSelectedRegistration(prev => prev ? { ...prev, paymentStatus } : null);
        await fetchRegistrations();
        
        toast({
          title: "Success",
          description: "Payment status updated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update payment status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setProcessingId('');
    }
  };

  const handlePaymentMethodUpdate = async (registrationId: string, paymentMethod: string) => {
    try {
      console.log('💳 Updating payment method for registration:', registrationId, 'to:', paymentMethod);
      setProcessingId(registrationId);
      
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePayment',
          paymentMethod,
          adminId: 'current-admin-id' // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      console.log('💳 Payment method update response:', data);
      
      if (response.ok) {
        // Update the selected registration
        setSelectedRegistration(prev => prev ? { ...prev, paymentMethod } : null);
        await fetchRegistrations();
        
        toast({
          title: "Success",
          description: "Payment method updated successfully!",
        });
      } else {
        console.error('💳 Payment method update failed:', data);
        toast({
          title: "Error",
          description: data.error || "Failed to update payment method",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💳 Error updating payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    } finally {
      setProcessingId('');
    }
  };

  const updateNotes = async (registrationId: string) => {
    try {
      setProcessingId(registrationId);
      
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateNotes',
          notes: adminNotes,
          adminId: 'current-admin-id' // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the selected registration
        setSelectedRegistration(prev => prev ? { ...prev, notes: adminNotes } : null);
        await fetchRegistrations();
        
        toast({
          title: "Success",
          description: "Notes updated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    } finally {
      setProcessingId('');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Clock className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Payment Failed</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><IndianRupee className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const formatDate = (dateString: string | null | undefined) => {
    // Handle null, undefined, or empty strings
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      console.log('📅 Date is null/undefined:', dateString);
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('📅 Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      // Additional check for reasonable date ranges
      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();
      
      if (dateYear < 2020 || dateYear > currentYear + 10) {
        console.log('📅 Date out of reasonable range:', dateString, dateYear);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('📅 Date formatting error:', error, 'for string:', dateString);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading registrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="/logo.PNG"
            alt="Tunda Sports Club"
            width={60}
            height={60}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-2xl font-bold">Team Registration Management</h1>
            <p className="text-muted-foreground">Approve or reject team registrations for tournaments</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Registrations</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedTournament !== 'ALL' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTournament('ALL')}
              className="whitespace-nowrap"
            >
              Clear Tournament Filter
            </Button>
          )}
        </div>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No registrations found</h3>
            <p className="text-muted-foreground">
              {selectedStatus === 'PENDING' 
                ? 'There are no pending registrations at the moment.' 
                : `No registrations with status "${selectedStatus}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((registration) => (
            <Card key={registration.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Team Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                      <h3 className="text-lg font-semibold">{registration.team.name}</h3>
                      {getStatusBadge(registration.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.team.captainName} (Captain)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.contactEmail}</span>
                      </div>
                      {registration.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{registration.contactPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.team.playersCount} players</span>
                      </div>
                    </div>

                    {/* Tournament Info */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-sm">{registration.tournament.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{registration.tournament.venue}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(registration.tournament.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          <span>₹{registration.tournament.entryFee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Registered: {formatDate(registration.registrationDate)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-auto w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchRegistrationDetails(registration.id)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {registration.status === 'PENDING' && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(registration.id, 'approve')}
                          disabled={processingId === registration.id}
                          className="w-full lg:w-auto bg-green-600 hover:bg-green-700"
                        >
                          {processingId === registration.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processingId === registration.id}
                              className="w-full lg:w-auto"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mobile-dialog sm:tablet-dialog max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Reject Registration</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting this team registration.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert>
                                <AlertDescription>
                                  Are you sure you want to reject the registration for <strong>{registration.team.name}</strong>?
                                </AlertDescription>
                              </Alert>
                              
                              <div>
                                <Label htmlFor="rejectionReason">Reason for rejection *</Label>
                                <Textarea
                                  id="rejectionReason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Please provide a reason for rejection..."
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setRejectionReason('')}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleApproval(registration.id, 'reject')}
                                  disabled={!rejectionReason.trim() || processingId === registration.id}
                                >
                                  {processingId === registration.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Reject Registration
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      {/* Registration Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden rounded-lg sm:rounded-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Registration Details</DialogTitle>
            <DialogDescription>
              View complete team registration information and manage approval status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {selectedRegistration && (
              <div className="space-y-6 pb-4">
              {/* Team Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Team Name</Label>
                      <p className="font-semibold">{selectedRegistration.team.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Captain</Label>
                      <p>{selectedRegistration.team.captainName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p>{selectedRegistration.team.captainEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p>{selectedRegistration.team.captainPhone || 'Not provided'}</p>
                    </div>
                    {selectedRegistration.team.homeGround && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Home Ground</Label>
                        <p>{selectedRegistration.team.homeGround}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedRegistration.team.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm">{selectedRegistration.team.description}</p>
                    </div>
                  )}

                  {/* Players List */}
                  {selectedRegistration.team.players && selectedRegistration.team.players.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Players ({selectedRegistration.team.players.length})
                        </Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => setShowEditPlayers(true)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Players
                        </Button>
                      </div>
                      
                      {/* Desktop/Tablet View */}
                      <div className="hidden md:block border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 grid grid-cols-6 gap-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <span>Name</span>
                          <span>Position</span>
                          <span>Experience</span>
                          <span>Jersey #</span>
                          <span>Phone</span>
                          <span>Status</span>
                        </div>
                        {selectedRegistration.team.players.map((player: any, index) => (
                          <div key={player.id} className="px-4 py-3 border-t grid grid-cols-6 gap-4 text-sm hover:bg-muted/30 transition-colors">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                                {player.name?.charAt(0)?.toUpperCase() || (index + 1)}
                              </div>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                {player.city && (
                                  <div className="text-xs text-muted-foreground">{player.city}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {player.position?.replace('_', ' ') || 'Not Set'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{player.experience || 'N/A'}</span>
                              {player.age && (
                                <div className="text-xs text-muted-foreground">Age: {player.age}</div>
                              )}
                            </div>
                            <div className="font-mono font-medium">
                              #{player.jerseyNumber || (index + 1)}
                            </div>
                            <div className="text-xs">
                              {player.phone ? (
                                <a href={`tel:${player.phone}`} className="text-blue-600 hover:underline">
                                  {player.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No phone</span>
                              )}
                            </div>
                            <div>
                              {player.isSubstitute ? (
                                <Badge variant="secondary" className="text-xs">Substitute</Badge>
                              ) : (
                                <Badge variant="default" className="text-xs">Regular</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden space-y-3">
                        {selectedRegistration.team.players.map((player: any, index) => (
                          <div key={player.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                  {player.name?.charAt(0)?.toUpperCase() || (index + 1)}
                                </div>
                                <div>
                                  <div className="font-medium text-base">{player.name}</div>
                                  {player.city && (
                                    <div className="text-sm text-muted-foreground">{player.city}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium text-lg">#{player.jerseyNumber || (index + 1)}</div>
                                {player.isSubstitute ? (
                                  <Badge variant="secondary" className="text-xs mt-1">SUB</Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs mt-1">REG</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Position</Label>
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {player.position?.replace('_', ' ') || 'Not Set'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Experience</Label>
                                <div className="mt-1 text-sm">{player.experience || 'N/A'}</div>
                              </div>
                            </div>
                            
                            {(player.phone || player.age || player.fatherName) && (
                              <div className="pt-2 border-t border-muted space-y-2">
                                {player.phone && (
                                  <div className="flex justify-between">
                                    <Label className="text-xs text-muted-foreground">Phone</Label>
                                    <a href={`tel:${player.phone}`} className="text-sm text-blue-600 hover:underline">
                                      {player.phone}
                                    </a>
                                  </div>
                                )}
                                {player.age && (
                                  <div className="flex justify-between">
                                    <Label className="text-xs text-muted-foreground">Age</Label>
                                    <span className="text-sm">{player.age}</span>
                                  </div>
                                )}
                                {player.fatherName && (
                                  <div className="flex justify-between">
                                    <Label className="text-xs text-muted-foreground">Father's Name</Label>
                                    <span className="text-sm">{player.fatherName}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Registration Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Registration Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedRegistration.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                      <p>{selectedRegistration.registrationDate ? formatDate(selectedRegistration.registrationDate) : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                      <div className="mt-1">{selectedRegistration.paymentStatus ? getPaymentStatusBadge(selectedRegistration.paymentStatus) : <Badge variant="outline">Not Set</Badge>}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Amount</Label>
                      <p>₹{selectedRegistration.paymentAmount ? selectedRegistration.paymentAmount.toLocaleString() : '0'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                      <p>{selectedRegistration.paymentMethod ? selectedRegistration.paymentMethod.replace('_', ' ') : 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Type</Label>
                      <p>{selectedRegistration.registrationType === 'ADMIN' ? 'Admin Registration' : 'Public Registration'}</p>
                    </div>
                  </div>
                  
                  {selectedRegistration.specialRequests && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Special Requests</Label>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRegistration.specialRequests}</p>
                    </div>
                  )}

                  {selectedRegistration.rejectionReason && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Rejection Reason</Label>
                      <p className="text-sm bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">{selectedRegistration.rejectionReason}</p>
                    </div>
                  )}                  {/* Admin Notes */}
                  <div>
                    <Label htmlFor="adminNotes" className="text-sm font-medium">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this registration..."
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Payment Status</Label>
                      <Select 
                        value={selectedRegistration.paymentStatus || 'PENDING'} 
                        onValueChange={(value) => handlePaymentStatusUpdate(selectedRegistration.id, value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="REFUNDED">Refunded</SelectItem>
                          <SelectItem value="PARTIAL">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Payment Method</Label>
                      <Select 
                        value={selectedRegistration.paymentMethod || ''} 
                        onValueChange={(value) => handlePaymentMethodUpdate(selectedRegistration.id, value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                          <SelectItem value="ONLINE">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateNotes(selectedRegistration.id)}
                      disabled={processingId === selectedRegistration.id}
                      variant="outline"
                    >
                      {processingId === selectedRegistration.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Update Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selectedRegistration.status === 'PENDING' && (
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mobile-dialog sm:tablet-dialog max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Reject Registration</DialogTitle>
                        <DialogDescription>
                          Provide a reason for rejecting this team registration.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert>
                          <AlertDescription>
                            Are you sure you want to reject the registration for <strong>{selectedRegistration.team.name}</strong>?
                          </AlertDescription>
                        </Alert>
                        
                        <div>
                          <Label htmlFor="rejectionReason">Reason for rejection *</Label>
                          <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setRejectionReason('')}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleApproval(selectedRegistration.id, 'reject')}
                            disabled={!rejectionReason.trim() || processingId === selectedRegistration.id}
                          >
                            {processingId === selectedRegistration.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject Registration
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    onClick={() => handleApproval(selectedRegistration.id, 'approve')}
                    disabled={processingId === selectedRegistration.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === selectedRegistration.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Registration
                  </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Players Dialog */}
      <Dialog open={showEditPlayers} onOpenChange={setShowEditPlayers}>
        <DialogContent className="w-[95vw] max-w-3xl h-[80vh] max-h-[80vh] overflow-hidden rounded-lg sm:rounded-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Edit Players</DialogTitle>
            <DialogDescription>
              Modify team player information and manage player roster.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-4 pb-4">
              <Alert>
                <AlertDescription>
                  Player editing functionality is coming soon. For now, you can view and manage player information here.
                </AlertDescription>
              </Alert>
              
              {selectedRegistration?.team.players && (
                <div className="space-y-3">
                  {selectedRegistration.team.players.map((player: any, index) => (
                    <Card key={player.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {player.name?.charAt(0)?.toUpperCase() || (index + 1)}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position?.replace('_', ' ') || 'Position not set'} • Jersey #{player.jerseyNumber || (index + 1)}
                            </div>
                          </div>
                        </div>
                        {player.isSubstitute ? (
                          <Badge variant="secondary">Substitute</Badge>
                        ) : (
                          <Badge variant="default">Regular</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {player.city && (
                          <div>
                            <Label className="text-xs text-muted-foreground">City</Label>
                            <div className="mt-1">{player.city}</div>
                          </div>
                        )}
                        {player.age && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Age</Label>
                            <div className="mt-1">{player.age} years</div>
                          </div>
                        )}
                        {player.experience && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Experience</Label>
                            <div className="mt-1">{player.experience}</div>
                          </div>
                        )}
                        {player.phone && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <div className="mt-1">
                              <a href={`tel:${player.phone}`} className="text-blue-600 hover:underline">
                                {player.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {player.fatherName && (
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-muted-foreground">Father's Name</Label>
                            <div className="mt-1">{player.fatherName}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditPlayers(false)}>
                  Close
                </Button>
                <Button disabled>
                  Save Changes (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationManagement;
