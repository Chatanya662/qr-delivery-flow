
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePhotoCapture = (customerId?: string, deliveryDate?: string) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const takePhoto = (videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const uploadPhotoToSupabase = async (photoData: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      
      // Create unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `delivery-${customerId}-${deliveryDate}-${timestamp}.jpg`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('delivery-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload photo to storage",
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(fileName);

      console.log('Photo uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Error",
        description: "Something went wrong while uploading the photo",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveDeliveryRecord = async (status: 'delivered' | 'missed', photoUrl?: string) => {
    if (!customerId || !deliveryDate) {
      console.error('No customer ID or delivery date provided');
      return;
    }

    try {
      const deliveryTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      console.log('Saving delivery record:', {
        customer_id: customerId,
        delivery_date: deliveryDate,
        status,
        delivery_time: deliveryTime,
        photo_url: photoUrl,
        delivered_by: 'Delivery Person',
        notes: status === 'delivered' ? 'Successfully delivered with photo' : 'Delivery missed - photo taken'
      });

      const { error } = await supabase
        .from('delivery_records')
        .upsert({
          customer_id: customerId,
          delivery_date: deliveryDate,
          status,
          delivery_time: deliveryTime,
          photo_url: photoUrl,
          delivered_by: 'Delivery Person',
          notes: status === 'delivered' ? 'Successfully delivered with photo' : 'Delivery missed - photo taken',
          quantity_delivered: status === 'delivered' ? 1 : 0
        }, {
          onConflict: 'customer_id,delivery_date'
        });

      if (error) {
        console.error('Error saving delivery record:', error);
        toast({
          title: "Database Error",
          description: "Failed to save delivery record to database",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Delivery ${status} recorded successfully with photo`,
      });

    } catch (error) {
      console.error('Database error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while saving to database",
        variant: "destructive",
      });
    }
  };

  return {
    canvasRef,
    capturedPhoto,
    isUploading,
    setIsUploading,
    takePhoto,
    retakePhoto,
    uploadPhotoToSupabase,
    saveDeliveryRecord
  };
};
