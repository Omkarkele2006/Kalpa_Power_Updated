import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DrawingStatus } from '@/data/mockData';

export function useDrawings() {
  return useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      // Excludes archived rows from live dashboards.
      // Use useArchivedDrawings() on the Archive page.
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch designer profiles separately
      const designerIds = [...new Set(data.map(d => d.designer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', designerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      return data?.map(d => ({
        ...d,
        profiles: profileMap.get(d.designer_id) ?? null,
        status: d.status as DrawingStatus,
      })) ?? [];
    },
  });
}

export function useArchivedDrawings() {
  return useQuery({
    queryKey: ['drawings', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });
      if (error) throw error;

      const designerIds = [...new Set(data.map(d => d.designer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', designerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      return data?.map(d => ({
        ...d,
        profiles: profileMap.get(d.designer_id) ?? null,
        status: d.status as DrawingStatus,
      })) ?? [];
    },
  });
}

export function useDrawingComments(drawingId: string) {
  return useQuery({
    queryKey: ['drawing-comments', drawingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drawing_comments')
        .select('*')
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const authorIds = [...new Set(data.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
      return data.map(c => ({
        ...c,
        profiles: profileMap.get(c.author_id) ?? null,
      }));
    },
    enabled: !!drawingId,
  });
}
