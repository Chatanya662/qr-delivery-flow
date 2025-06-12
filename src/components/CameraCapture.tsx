
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check, AlertTriangle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photoData: string, status: 'delivered' | 'missed') => void;
  deliveryDate: string;
  customerName: string;
  customerAddress: string;
  customerId?: string;
}

const CameraCapture = ({ isOpen, onClose, onPhotoTaken, deliveryDate, customerName, customerAddress, customerId }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      // Try different camera configurations for better mobile support
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let mediaStream;
      
      try {
        // First try with preferred settings
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log('Failed with preferred settings, trying basic video');
        // Fallback to basic video if environment camera fails
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => {
          console.error('Error playing video:', e);
        });
      }
      setError('');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions and ensure you are using HTTPS.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
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
        setShowConfirmation(true);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setShowConfirmation(false);
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
    if (!customerId) {
      console.error('No customer ID provided');
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

  const handleDeliveryStatus = async (status: 'delivered' | 'missed') => {
    if (!capturedPhoto) return;

    setIsUploading(true);
    
    try {
      let photoUrl = null;
      
      // Always upload photo for both delivered and missed deliveries
      photoUrl = await uploadPhotoToSupabase(capturedPhoto);
      if (!photoUrl) {
        setIsUploading(false);
        return;
      }

      // Save delivery record with photo URL
      await saveDeliveryRecord(status, photoUrl);
      
      // Call the callback with the photo URL instead of base64 data
      onPhotoTaken(photoUrl, status);
      
    } catch (error) {
      console.error('Error handling delivery status:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCapturedPhoto(null);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Delivery Confirmation
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Customer Details</h3>
            </div>
            <p className="font-medium text-gray-800">{customerName}</p>
            <p className="text-sm text-gray-600">{customerAddress}</p>
            <p className="text-sm text-gray-600 mt-1">Date: {deliveryDate}</p>
          </div>

          {error ? (
            <div className="text-center p-4">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={startCamera}>Try Again</Button>
            </div>
          ) : (
            <>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {!capturedPhoto ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <img
                    src={capturedPhoto}
                    alt="Captured delivery"
                    className="w-full h-64 object-cover"
                  />
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {!showConfirmation ? (
                <div className="flex gap-2 justify-center">
                  {!capturedPhoto ? (
                    <Button onClick={takePhoto} className="flex-1" disabled={isUploading}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  ) : (
                    <Button onClick={retakePhoto} variant="outline" className="flex-1" disabled={isUploading}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake Photo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="font-medium text-gray-800 mb-1">Confirm Delivery Status</p>
                    <p className="text-sm text-gray-600">Was the milk delivered successfully?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleDeliveryStatus('delivered')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isUploading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isUploading ? 'Saving...' : 'Delivered'}
                    </Button>
                    <Button 
                      onClick={() => handleDeliveryStatus('missed')}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={isUploading}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Missed
                    </Button>
                  </div>
                  <Button onClick={retakePhoto} variant="ghost" className="w-full" disabled={isUploading}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
