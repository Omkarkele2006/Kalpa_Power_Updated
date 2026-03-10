import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { mockNotifications } from '@/data/mockData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const unread = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-rejected text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="border-b p-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {mockNotifications.map(n => (
              <div key={n.id} className={`border-b last:border-0 p-3 text-sm ${n.read ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.type === 'approval' ? 'bg-status-approved' :
                    n.type === 'rejection' ? 'bg-status-rejected' :
                    n.type === 'submission' ? 'bg-status-wip' : 'bg-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-xs">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}
