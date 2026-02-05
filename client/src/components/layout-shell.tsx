import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Sparkles, History, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
        <AppSidebar location={location} user={user} logout={logout} />
        <main className="flex-1 overflow-auto">
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="md:hidden">
              {/* Mobile trigger would go here */}
              <span className="font-display font-bold text-xl">LogCraft</span>
            </div>
            <div className="hidden md:block">
              {/* Breadcrumbs or page title could go here */}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <UserMenu user={user} logout={logout} />
              ) : (
                <Button asChild size="sm" className="rounded-full px-6 font-medium bg-white text-black hover:bg-white/90">
                  <a href="/api/login">Sign In</a>
                </Button>
              )}
            </div>
          </header>
          <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ location, user, logout }: { location: string, user: any, logout: () => void }) {
  return (
    <Sidebar className="border-r border-white/5 bg-card">
      <SidebarHeader className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">LogCraft</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/"}
              className="h-12 px-4 rounded-xl text-base font-medium hover:bg-white/5 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <Link href="/">
                <Sparkles className="mr-3 w-5 h-5" />
                Generator
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/history"}
              className="h-12 px-4 rounded-xl text-base font-medium hover:bg-white/5 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
            >
              <Link href="/history">
                <History className="mr-3 w-5 h-5" />
                History
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        {!user && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-background border border-white/5 mb-2">
            <p className="text-xs text-muted-foreground mb-3">Sign in to save your changelogs and access history.</p>
            <Button asChild size="sm" variant="outline" className="w-full border-white/10 hover:bg-white/5">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu({ user, logout }: { user: any, logout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user.firstName?.[0] || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.firstName && <p className="font-medium">{user.firstName} {user.lastName}</p>}
            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
