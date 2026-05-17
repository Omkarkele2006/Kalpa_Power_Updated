import { supabase } from "@/integrations/supabase/client";

export async function createNotification({
  userId,
  title,
  message,
  type,
  drawingId,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  drawingId?: string;
}) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      drawing_id: drawingId ?? null,
    });

  if (error) {
    console.error("[Notification Error]", error);
  }
}