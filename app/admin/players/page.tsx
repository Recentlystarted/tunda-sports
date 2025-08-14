"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Grid,
  Table,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Player {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  dateOfBirth: string | null;
  position: string | null;
  age: number | null;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  jerseyNumber: number | null;
  isSubstitute: boolean;
  experience: string | null;
  fatherName: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlayersResponse {
  players: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ViewMode = 'cards' | 'table';

export default function PlayersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchPlayers = async (searchQuery = "", resetPage = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.length >= 2) {
        params.append('q', searchQuery);
      }
      params.append('limit', pagination.limit.toString());
      params.append('page', resetPage ? '1' : pagination.page.toString());

      const response = await fetch(`/api/players?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }

      const data: PlayersResponse = await response.json();
      setPlayers(data.players);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchPlayers(searchTerm, true); // Reset to page 1 when searching
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    setPlayerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;

    try {
      const response = await fetch(`/api/players/${playerToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
      
      // Refresh the players list
      fetchPlayers(searchTerm);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getPlayerAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return "N/A";
    try {
      return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    } catch {
      return "N/A";
    }
  };

  const getPlayerName = (player: Player) => {
    return player.name || "N/A";
  };

  const formatPosition = (position: string | null) => {
    if (!position) return "N/A";
    return position.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatExperience = (experience: string | null) => {
    if (!experience) return "N/A";
    return experience.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Page Header with Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="/logo.PNG"
            alt="Tunda Sports Club"
            width={60}
            height={60}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground">
              Manage cricket players and registrations ({pagination.total} total)
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/admin/players/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'cards' ? (
        <PlayersCardView 
          players={players} 
          onEdit={(id) => router.push(`/admin/players/${id}`)}
          onDelete={handleDelete}
          getStatusBadge={getStatusBadge}
          getPlayerAge={getPlayerAge}
          getPlayerName={getPlayerName}
          formatPosition={formatPosition}
        />
      ) : (
        <PlayersTableView 
          players={players} 
          onEdit={(id) => router.push(`/admin/players/${id}`)}
          onDelete={handleDelete}
          getStatusBadge={getStatusBadge}
          getPlayerAge={getPlayerAge}
          formatPosition={formatPosition}
          formatExperience={formatExperience}
        />
      )}

      {/* Empty State */}
      {players.length === 0 && !loading && (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No players found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first player"}
            </p>
            <Button onClick={() => router.push("/admin/players/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate the player account. The player will be marked as inactive 
              but their data will be preserved for record keeping. This action can be reversed by 
              reactivating the player.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Card View Component
function PlayersCardView({ 
  players, 
  onEdit, 
  onDelete, 
  getStatusBadge, 
  getPlayerAge, 
  getPlayerName, 
  formatPosition 
}: {
  players: Player[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusBadge: (isActive: boolean) => JSX.Element;
  getPlayerAge: (dateOfBirth: string | null) => string | number;
  getPlayerName: (player: Player) => string;
  formatPosition: (position: string | null) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {players.map((player) => (
        <Card key={player.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <Users className="h-8 w-8 text-primary" />
              <div className="flex space-x-2">
                {getStatusBadge(player.isActive)}
              </div>
            </div>
            <CardTitle className="line-clamp-1">
              {getPlayerName(player)}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {formatPosition(player.position)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              {player.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{player.email}</span>
                </div>
              )}
              {player.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{player.phone}</span>
                </div>
              )}
              {(player.address || player.city) && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{player.address || player.city}</span>
                </div>
              )}
              {player.team && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{player.team.name}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Age</p>
                <p className="font-medium">{getPlayerAge(player.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jersey #</p>
                <p className="font-medium">{player.jerseyNumber || "N/A"}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(player.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(player.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Table View Component
function PlayersTableView({ 
  players, 
  onEdit, 
  onDelete, 
  getStatusBadge, 
  getPlayerAge, 
  formatPosition, 
  formatExperience 
}: {
  players: Player[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusBadge: (isActive: boolean) => JSX.Element;
  getPlayerAge: (dateOfBirth: string | null) => string | number;
  formatPosition: (position: string | null) => string;
  formatExperience: (experience: string | null) => string;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <TableComponent>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Jersey #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{player.name}</div>
                    {player.email && (
                      <div className="text-sm text-muted-foreground">{player.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatPosition(player.position)}</TableCell>
                <TableCell>{getPlayerAge(player.dateOfBirth)}</TableCell>
                <TableCell>{player.phone || "N/A"}</TableCell>
                <TableCell>{player.team?.name || "No Team"}</TableCell>
                <TableCell>{player.jerseyNumber || "N/A"}</TableCell>
                <TableCell>{getStatusBadge(player.isActive)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(player.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(player.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableComponent>
      </CardContent>
    </Card>
  );
}
