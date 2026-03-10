import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserRole } from '@/data/mockData';
import DesignerDashboard from './DesignerDashboard';
import LineManagerDashboard from './LineManagerDashboard';
import DeptHeadDashboard from './DeptHeadDashboard';
import SiteEngineerDashboard from './SiteEngineerDashboard';
import VendorClientDashboard from './VendorClientDashboard';
import AnalyticsPage from './AnalyticsPage';
import ArchivePage from './ArchivePage';
import StampingPage from './StampingPage';

const homeDashboard: Record<UserRole, React.ComponentType> = {
  'designer': DesignerDashboard,
  'line-manager': LineManagerDashboard,
  'dept-head': DeptHeadDashboard,
  'site-engineer': SiteEngineerDashboard,
  'vendor-client': VendorClientDashboard,
};

export default function Index() {
  const [role, setRole] = useState<UserRole>('designer');
  const HomeDash = homeDashboard[role];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentRole={role} onRoleChange={setRole} />
        <div className="flex-1 flex flex-col min-w-0">
          <HomeDash />
        </div>
      </div>
    </SidebarProvider>
  );
}
