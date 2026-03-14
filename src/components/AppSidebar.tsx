import {
  Pencil, Users, Shield, HardHat, Building2,
  LayoutDashboard, FileCheck, Archive, BarChart3, QrCode, Stamp,
  ChevronDown,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserRole, roleLabels, roleUsers } from '@/data/mockData';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleIcons: Record<UserRole, typeof Pencil> = {
  'designer': Pencil,
  'line-manager': Users,
  'dept-head': Shield,
  'site-engineer': HardHat,
  'vendor-client': Building2,
};

interface AppSidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const navByRole: Record<UserRole, { title: string; url: string; icon: typeof LayoutDashboard }[]> = {
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

export function AppSidebar({ currentRole, onRoleChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const RoleIcon = roleIcons[currentRole];
  const user = roleUsers[currentRole];
  const items = navByRole[currentRole];

  return (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-sidebar-accent transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                <RoleIcon className="h-4 w-4 text-sidebar-primary" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-sidebar-foreground">{user.name}</p>
                    <p className="truncate text-[10px] text-sidebar-foreground/50">{roleLabels[currentRole]}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            {(Object.keys(roleLabels) as UserRole[]).map((role) => {
              const Icon = roleIcons[role];
              return (
                <DropdownMenuItem key={role} onClick={() => onRoleChange(role)} className={role === currentRole ? 'bg-accent' : ''}>
                  <Icon className="mr-2 h-4 w-4" />
                  <div>
                    <p className="text-sm">{roleLabels[role]}</p>
                    <p className="text-[10px] text-muted-foreground">{roleUsers[role].name}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
