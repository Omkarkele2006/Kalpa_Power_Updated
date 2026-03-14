import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  drawingId: string;
  drawingNo: string;
}

export function SubmitForReviewButton({ drawingId, drawingNo }: Props) {
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    const { error } = await supabase.from('drawings').update({
      status: 'under-review' as any,
      review_started: new Date().toISOString(),
    }).eq('id', drawingId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${drawingNo} submitted for Line Manager review`);
    queryClient.invalidateQueries({ queryKey: ['drawings'] });
  };

  return (
    <Button size="sm" variant="outline" onClick={handleSubmit}>
      <Send className="h-3.5 w-3.5 mr-1" /> Submit
    </Button>
  );
}
