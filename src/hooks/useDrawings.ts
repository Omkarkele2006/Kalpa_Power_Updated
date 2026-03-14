import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDrawings() {
  return useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drawings')
        .select('*, profiles:designer_id(full_name), approved_profile:approved_by(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDrawingComments(drawingId: string) {
  return useQuery({
    queryKey: ['drawing-comments', drawingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drawing_comments')
        .select('*, profiles:author_id(full_name)')
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!drawingId,
  });
}
