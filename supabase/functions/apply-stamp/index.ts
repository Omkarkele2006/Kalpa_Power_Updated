import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";
import { createClient } from "npm:@supabase/supabase-js@2";

// Add this CORS headers object at the top
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle the preflight OPTIONS request — this is what was missing
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { drawingId, filePath, approvedBy, date } = await req.json();

  console.log('=== apply-stamp called ===');
  console.log('drawingId:', drawingId);
  console.log('filePath:', filePath);

  const storagePath = filePath.split('/drawing-files/')[1];
  console.log('storagePath extracted:', storagePath);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("drawing-files")
    .download(storagePath);

  console.log('download error:', downloadError);
  console.log('fileData exists:', !!fileData);

  if (downloadError || !fileData) {
    return new Response(
      JSON.stringify({ error: "Download failed", detail: downloadError?.message, storagePath }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const pdfBytes = await fileData.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  firstPage.drawRectangle({
    x: width - 185,
    y: height - 90,
    width: 170,
    height: 75,
    borderColor: rgb(0, 0.55, 0.27),
    borderWidth: 2,
  });
  firstPage.drawText('APPROVED', {
    x: width - 173,
    y: height - 35,
    size: 22,
    font,
    color: rgb(0, 0.55, 0.27),
  });
  firstPage.drawText(`By: ${approvedBy}`, {
    x: width - 173,
    y: height - 55,
    size: 9,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });
  firstPage.drawText(`Date: ${date}`, {
    x: width - 173,
    y: height - 70,
    size: 9,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });

  const fileName = storagePath.split('/').pop();
  const userId = storagePath.split('/')[0];
  const stampedPath = `${userId}/approved/${fileName}`;

  const stampedBytes = await pdfDoc.save();

  const { error: uploadError } = await supabase.storage
    .from("drawing-files")
    .upload(stampedPath, stampedBytes, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (uploadError) {
    return new Response(
      JSON.stringify({ error: "Upload failed", detail: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: urlData } = supabase.storage
    .from("drawing-files")
    .getPublicUrl(stampedPath);

  await supabase.from("drawings").update({
    stamp_applied: true,
    file_url: urlData.publicUrl,
    approved_date: new Date().toISOString(),
  }).eq("id", drawingId);

  return new Response(
    JSON.stringify({ success: true, stampedUrl: urlData.publicUrl }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }  // corsHeaders on success too
  );
});