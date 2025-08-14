"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Calendar, Trophy, Users, Clock } from "lucide-react";
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
import Image from "next/image";

interface Match {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  tournament: { name: string };
  scheduledDate: string;
  venue: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  type: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchMatches();
      }
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { variant: "outline" as const, label: "Scheduled" },
      ONGOING: { variant: "default" as const, label: "Ongoing" },
      COMPLETED: { variant: "default" as const, label: "Completed" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
      POSTPONED: { variant: "secondary" as const, label: "Postponed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match?.homeTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match?.awayTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match?.tournament?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match?.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <div className="flex items-center gap-4">
        <Image
          src="/logo.PNG"
          alt="Tunda Sports Club"
          width={60}
          height={60}
          className="rounded-lg"
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Match Management</h1>
            <p className="text-muted-foreground">
              Schedule, manage, and track tournament matches
            </p>
          </div>
          <Link href="/admin/matches/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search matches by team, tournament, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="POSTPONED">Postponed</option>
          </select>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "cards")}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => m.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => m.status === 'ONGOING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => m.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => {
                const matchDate = new Date(m.scheduledDate);
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return matchDate >= now && matchDate <= weekFromNow;
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
                  <TableHead>Teams</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{match.homeTeam.name}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span>{match.awayTeam.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{match.tournament.name}</TableCell>
                    <TableCell>
                      {new Date(match.scheduledDate).toLocaleDateString()} at{" "}
                      {new Date(match.scheduledDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{match.venue}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{match.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    <TableCell>
                      {match.status === 'COMPLETED' && match.homeScore !== undefined && match.awayScore !== undefined ? (
                        <span className="text-sm">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/matches/${match.id}/edit`}>
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
                              <AlertDialogTitle>Delete Match</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this match? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMatch(match.id)}
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
            {filteredMatches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{match.homeTeam.name}</span>
                        <span className="text-sm text-muted-foreground">vs</span>
                        <span>{match.awayTeam.name}</span>
                      </CardTitle>
                      <CardDescription>{match.tournament.name}</CardDescription>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(match.scheduledDate).toLocaleDateString()} at{" "}
                      {new Date(match.scheduledDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{match.venue}</span>
                  </div>
                  <div className="text-sm">
                    <Badge variant="outline">{match.type}</Badge>
                  </div>
                  {match.status === 'COMPLETED' && match.homeScore !== undefined && match.awayScore !== undefined && (
                    <div className="text-sm font-medium">
                      Score: {match.homeScore} - {match.awayScore}
                      {match.winner && (
                        <div className="text-xs text-muted-foreground">
                          Winner: {match.winner}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/admin/matches/${match.id}/edit`}>
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
                          <AlertDialogTitle>Delete Match</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this match? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMatch(match.id)}
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

      {filteredMatches.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No matches match your search criteria." : "Get started by scheduling your first match."}
            </p>
            <Link href="/admin/matches/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
