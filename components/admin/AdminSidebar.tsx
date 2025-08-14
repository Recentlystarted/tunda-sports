"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  UserCheck,
  Image,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Mail,
  Crown,
  Target,
  UsersRound,
  Gavel,
  DollarSign,
  Timer,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Tournaments",
    href: "/admin/tournaments",
    icon: Calendar,
    children: [
      {
        title: "All Tournaments",
        href: "/admin/tournaments",
        icon: Calendar,
      },
      {
        title: "Create Tournament",
        href: "/admin/tournaments/create",
        icon: Calendar,
      },
      {
        title: "Registrations",
        href: "/admin/registrations-new",
        icon: UserCheck,
      },
      {
        title: "Payment Management",
        href: "/admin/tournaments",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Auction Management",
    href: "/admin/auction-management",
    icon: Gavel,
    children: [
      {
        title: "🔴 Live Auction",
        href: "/admin/auction-live",
        icon: Timer,
      },
      {
        title: "⚙️ Setup & Management",
        href: "/admin/auction-management-enhanced",
        icon: Settings,
      },
      {
        title: "Team Owners",
        href: "/admin/auction-team-owners",
        icon: Shield,
      },
      {
        title: "Player Registration",
        href: "/admin/auction-players",
        icon: Crown,
      },
      {
        title: "Basic Management",
        href: "/admin/auction-management",
        icon: Target,
      },
    ],
  },
  {
    title: "Teams",
    href: "/admin/teams",
    icon: Users,
  },
  {
    title: "Players",
    href: "/admin/players",
    icon: UserCheck,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "Matches",
    href: "/admin/matches",
    icon: Calendar,
  },  {
    title: "Media",
    href: "/admin/gallery",
    icon: Image,
    children: [
      {
        title: "Gallery",
        href: "/admin/gallery",
        icon: Image,
      },
      {
        title: "Tournament Photos",
        href: "/admin/tournament-photos",
        icon: Image,
      },
    ],
  },
  {
    title: "Statistics",
    href: "/admin/statistics",
    icon: BarChart3,
  },  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      {
        title: "Email Management", 
        href: "/admin/settings/email",
        icon: Mail,
      },
      {
        title: "Email Alerts", 
        href: "/admin/settings/email-alerts",
        icon: Shield,
      },
      {
        title: "Payment Settings", 
        href: "/admin/settings/payment",
        icon: DollarSign,
      },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function AdminSidebar({ isOpen = true, onClose, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/verify");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.admin?.role || null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleItemClick = () => {
    // Close sidebar on mobile when item is clicked
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  // Filter sidebar items based on user role
  const getFilteredSidebarItems = () => {
    return sidebarItems.filter(item => {
      // Show User Management only for SUPERADMIN
      if (item.title === "User Management" && userRole !== "SUPERADMIN") {
        return false;
      }
      // Show Settings only for SUPERADMIN
      if (item.title === "Settings" && userRole !== "SUPERADMIN") {
        return false;
      }
      return true;
    });
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.href);

    return (
      <div key={item.title} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center">
          <Link
            href={item.href}
            onClick={handleItemClick}
            className={cn(
              "flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="mr-3 h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => toggleExpanded(item.title)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-sidebar-background border-r border-sidebar-border h-full transition-transform duration-300 ease-in-out z-50",
        "w-64 fixed md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className
      )}>
        {/* Mobile close button */}
        {onClose && (
          <div className="flex justify-end p-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center" onClick={handleItemClick}>
            <img 
              src="/logo.PNG" 
              alt="Tunda Sports Club" 
              className="h-8 w-8 object-contain mr-2 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-sidebar-foreground truncate">Tunda Sports</h2>
              <p className="text-sm text-sidebar-foreground/70 truncate">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-1">
            {getFilteredSidebarItems().map(item => renderSidebarItem(item))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            className="w-full justify-start border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
}
