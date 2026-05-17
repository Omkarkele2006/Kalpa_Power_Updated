import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DashboardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Notification fetch error:', error);
        return;
      }

      setNotifications(data || []);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)

      // INSERT realtime
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const exists = prev.some(
              (n) => n.id === (payload.new as any).id
            );

            if (exists) return prev;

            return [payload.new as any, ...prev];
          });
        }
      )

      // UPDATE realtime
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id
                ? (payload.new as any)
                : n
            )
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = notifications.filter(
    (n) => !n.read
  ).length;

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />

        <div>
          <h1 className="text-lg font-semibold">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <Popover
        open={popoverOpen}
        onOpenChange={async (open) => {
          setPopoverOpen(open);

          if (open && unread > 0 && user?.id) {
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('user_id', user.id)
              .eq('read', false);

            setNotifications((prev) =>
              prev.map((n) => ({
                ...n,
                read: true,
              }))
            );
          }
        }}
      >
        <PopoverTrigger asChild>
          <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />

            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-0"
          align="end"
        >
          <div className="border-b p-3">
            <h3 className="font-semibold text-sm">
              Notifications
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b last:border-0 p-3 text-sm ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.type === 'approved'
                          ? 'bg-green-500'
                          : n.type === 'rejected'
                          ? 'bg-red-500'
                          : n.type === 'pending-dept-head'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />

                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {n.title}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.message}
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(
                          n.created_at
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}