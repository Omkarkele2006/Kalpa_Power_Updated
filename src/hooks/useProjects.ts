/**
 * useProjects.ts
 *
 * React-Query hook to fetch available projects from Supabase.
 * Used by UploadDrawingDialog to populate the project selector
 * and auto-fill the XXXX segment of the document number.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  project_number: string; // the 'XXXX' segment in GM-RT-DWG-aa-XXXX-YYYY
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_number')
        .order('name');

      if (error) throw error;
      return data as Project[];
    },
    staleTime: 5 * 60 * 1000, // projects rarely change — cache for 5 min
  });
}
