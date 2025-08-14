"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Users, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  captain: string;
  contactNumber: string;
  village: string;
  playersCount: number;
  registrationDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tournaments: { name: string }[];
}

export default function TeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Team deleted successfully",
        });
        fetchTeams();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete team",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: "default" as const, label: "Active" },
      INACTIVE: { variant: "secondary" as const, label: "Inactive" },
      SUSPENDED: { variant: "destructive" as const, label: "Suspended" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTeams = teams.filter(team =>
    team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team?.captain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team?.village?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1>
          <p className="text-muted-foreground">
            Manage registered teams and their information
          </p>
        </div>
        <Link href="/admin/teams/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Team
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search teams by name, captain, or village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "cards")}>
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.filter(t => t.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((sum, team) => sum + (team.playersCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.filter(t => {
                const regDate = new Date(t.registrationDate);
                const now = new Date();
                return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      <Tabs value={viewMode} className="space-y-4">
        <TabsContent value="table" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.captain}</TableCell>
                    <TableCell>{team.village}</TableCell>
                    <TableCell>{team.playersCount || 0}</TableCell>
                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                    <TableCell>
                      {new Date(team.registrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/teams/${team.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Team</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {team.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTeam(team.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>Captain: {team.captain}</CardDescription>
                    </div>
                    {getStatusBadge(team.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.playersCount || 0} players</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Village: {team.village}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Registered: {new Date(team.registrationDate).toLocaleDateString()}
                  </div>
                  {team.tournaments?.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Tournaments:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {team.tournaments.map((tournament, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tournament.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/admin/teams/${team.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {team.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTeam(team.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTeams.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No teams match your search criteria." : "Get started by adding your first team."}
            </p>
            <Link href="/admin/teams/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
