'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, TrendingUp, Plus, UserPlus, Image, BarChart3 } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalTournaments: number;
  activeMatches: number;
  registeredTeams: number;
  totalPlayers: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  totalTeams: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activeMatches: 0,
    registeredTeams: 0,
    totalPlayers: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [statsResponse, tournamentsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/tournaments?limit=5')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (tournamentsResponse.ok) {
        const tournamentsData = await tournamentsResponse.json();
        setRecentTournaments(tournamentsData.tournaments || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Create New Tournament",
      description: "Set up a new cricket tournament",
      icon: Plus,
      href: "/admin/tournaments/create",
      color: "bg-blue-500 text-white"
    },
    {
      title: "Manage Landing Content",
      description: "Update landing page sections and content",
      icon: Image,
      href: "/admin/landing-content",
      color: "bg-green-500 text-white"
    },
    {
      title: "Upload Gallery Images",
      description: "Add photos to the gallery",
      icon: Image,
      href: "/admin/gallery",
      color: "bg-purple-500 text-white"
    },
    {
      title: "View Statistics",
      description: "Analyze tournament data",
      icon: BarChart3,
      href: "/admin/statistics",
      color: "bg-orange-500 text-white"
    }
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-full overflow-hidden">      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Welcome to Tunda Sports Club Admin Panel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tournaments/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Tournament
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalTournaments}</div>
            <p className="text-xs text-muted-foreground">Active tournaments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Active Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.activeMatches}</div>
            <p className="text-xs text-muted-foreground">Happening now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Registered Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.registeredTeams}</div>
            <p className="text-xs text-muted-foreground">+4 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">+12 new players</p>
          </CardContent>
        </Card>
      </div>      {/* Recent Tournaments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Tournaments</CardTitle>
            <CardDescription className="text-sm md:text-base">Latest tournament activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTournaments.map((tournament) => (
                <div key={tournament.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">{tournament.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{tournament.totalTeams} teams registered</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${
                    tournament.status === "Ongoing" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : tournament.status === "Registration Open"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {tournament.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm md:text-base">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href} className="block">
                    <Button 
                      variant="outline" 
                      className="w-full h-auto p-3 md:p-4 text-left justify-start hover:bg-accent/50 transition-colors border-border"
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${action.color} flex items-center justify-center mr-3 shrink-0`}>
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-medium text-sm md:text-base truncate">{action.title}</div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">{action.description}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
