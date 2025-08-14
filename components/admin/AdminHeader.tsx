"use client";

import { useState, useEffect } from "react";
import { Bell, Search, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminData {
  name?: string;
  username: string;
  role: string;
  email: string;
}

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch admin data
    const fetchAdminData = async () => {
      try {
        const res = await fetch("/api/auth/verify");
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    fetchAdminData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };  return (
    <header className="bg-background border-b border-border px-3 py-2 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        {/* Left: Mobile menu + Search */}
        <div className="flex items-center flex-1 max-w-xs md:max-w-md gap-2 md:gap-3">
          {/* Mobile menu button */}
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1"
              onClick={onMenuToggle}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-7 md:pl-10 text-xs md:text-sm h-8 md:h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 md:space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-1 md:p-2">
            <Bell className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
            <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 h-1.5 w-1.5 md:h-2 md:w-2 lg:h-3 lg:w-3 bg-destructive rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 md:space-x-2 p-1 md:p-2 h-8 md:h-auto">
                <Avatar className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {(admin?.name || admin?.username)?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block lg:block text-left">
                  <p className="text-xs md:text-sm font-medium truncate max-w-20 lg:max-w-none">{admin?.name || admin?.username || "Admin"}</p>
                  <p className="text-xs text-muted-foreground hidden lg:block">{admin?.role || "ADMIN"}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{admin?.name || admin?.username || "Admin"}</p>
                  <p className="text-sm text-muted-foreground">{admin?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
