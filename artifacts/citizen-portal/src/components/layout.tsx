import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { useGetMyProfile } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  FileText,
  Users,
  History,
  LogOut,
  Shield,
  Loader2,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Chatbot } from "@/components/chatbot";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: profile, isLoading } = useGetMyProfile();

  const isAdmin = profile?.role === "admin";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Requests", href: "/requests", icon: FileText },
  ];

  const adminNavigation = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
    { name: "All Requests", href: "/admin/requests", icon: FileText },
    { name: "Citizens", href: "/admin/citizens", icon: Users },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
  ];

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const NavLinks = () => (
    <nav className="space-y-1">
      <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        Citizen Portal
      </div>
      {navigation.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.name} href={item.href}>
            <span
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                }`}
                aria-hidden="true"
              />
              {item.name}
            </span>
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Administration
          </div>
          {adminNavigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sidebar-primary/10 text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-sidebar">
            <Shield className="h-8 w-8 text-sidebar-primary" />
            <span className="ml-2 text-xl font-bold text-sidebar-foreground">CitizenConnect</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 px-2 py-4 space-y-1">
              <NavLinks />
            </div>
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {profile?.role === "admin" ? "Administrator" : "Citizen"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start mt-4 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-sidebar border-b border-sidebar-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-sidebar-primary" />
          <span className="ml-2 text-xl font-bold text-sidebar-foreground">CitizenConnect</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar border-sidebar-border p-0 flex flex-col">
            <div className="flex items-center h-16 flex-shrink-0 px-4">
              <Shield className="h-8 w-8 text-sidebar-primary" />
              <span className="ml-2 text-xl font-bold text-sidebar-foreground">CitizenConnect</span>
            </div>
            <div className="flex-1 px-2 py-4 overflow-y-auto">
              <NavLinks />
            </div>
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {profile?.role === "admin" ? "Administrator" : "Citizen"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start mt-4 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full md:pl-64 pt-16 md:pt-0 min-w-0">
        <main className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
      
      {!isAdmin && <Chatbot />}
    </div>
  );
}
