import {
  Pencil, Users, Shield, HardHat, Building2,
  LayoutDashboard, FileCheck, Archive, BarChart3, QrCode, Stamp,
  LogOut, Settings,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDialog } from '@/components/ProfileDialog';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  'designer': 'Designer',
  'line-manager': 'Line Manager',
  'dept-head': 'Dept Head',
  'site-engineer': 'Site Engineer',
  'vendor-client': 'Vendor / Client',
};

const roleIcons: Record<AppRole, typeof Pencil> = {
  'designer': Pencil,
  'line-manager': Users,
  'dept-head': Shield,
  'site-engineer': HardHat,
  'vendor-client': Building2,
};

const navByRole: Record<AppRole, { title: string; url: string; icon: typeof LayoutDashboard }[]> = {
  'designer': [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'My Drawings', url: '/drawings', icon: FileCheck },
    { title: 'Archive', url: '/archive', icon: Archive },
  ],
  'line-manager': [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Review Queue', url: '/review', icon: FileCheck },
    { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  ],
  'dept-head': [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Approvals', url: '/approvals', icon: FileCheck },
    { title: 'Stamping', url: '/stamping', icon: Stamp },
    { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  ],
  'site-engineer': [
    { title: 'Approved Docs', url: '/', icon: FileCheck },
    { title: 'QR Verify', url: '/qr-verify', icon: QrCode },
  ],
  'vendor-client': [
    { title: 'Final Documents', url: '/', icon: FileCheck },
  ],
};

interface AppSidebarProps {
  currentRole: AppRole;
}

export function AppSidebar({ currentRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, signOut } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const RoleIcon = roleIcons[currentRole];
  const items = navByRole[currentRole];

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <span className="text-sm font-bold text-sidebar-primary-foreground">KP</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">Kalpa Power</h2>
                <p className="text-[10px] text-sidebar-foreground/60">Solar Project Suite</p>
              </div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setProfileDialogOpen(true)}
            className="flex items-center gap-2 p-2 w-full rounded-lg hover:bg-sidebar-accent/50 transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent shrink-0">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-sidebar-foreground">{profile?.full_name ?? 'User'}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">{roleLabels[currentRole]}</p>
              </div>
            )}
            {!collapsed && (
              <Settings className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
            )}
          </button>

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground justify-start"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>

      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}
