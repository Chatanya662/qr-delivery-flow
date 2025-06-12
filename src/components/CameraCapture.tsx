
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import CustomerDetails from './camera/CustomerDetails';
import CameraView from './camera/CameraView';
import PhotoConfirmation from './camera/PhotoConfirmation';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photoData: string, status: 'delivered' | 'missed') => void;
  deliveryDate: string;
  customerName: string;
  customerAddress: string;
  customerId?: string;
}

const CameraCapture = ({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  deliveryDate, 
  customerName, 
  customerAddress, 
  customerId 
}: CameraCaptureProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { videoRef, error, startCamera } = useCamera(isOpen);
  
  const {
    canvasRef,
    capturedPhoto,
    isUploading,
    setIsUploading,
    takePhoto,
    retakePhoto,
    uploadPhotoToSupabase,
    saveDeliveryRecord
  } = usePhotoCapture(customerId, deliveryDate);

  const handleTakePhoto = () => {
    takePhoto(videoRef);
    setShowConfirmation(true);
  };

  const handleRetakePhoto = () => {
    retakePhoto();
    setShowConfirmation(false);
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
    } finally {
      setIsUploading(false);
      retakePhoto();
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
          <CustomerDetails 
            customerName={customerName}
            customerAddress={customerAddress}
            deliveryDate={deliveryDate}
          />

          {!showConfirmation ? (
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              capturedPhoto={capturedPhoto}
              error={error}
              isUploading={isUploading}
              onTakePhoto={handleTakePhoto}
              onRetakePhoto={handleRetakePhoto}
              onStartCamera={startCamera}
            />
          ) : (
            <PhotoConfirmation
              isUploading={isUploading}
              onDeliveryStatus={handleDeliveryStatus}
              onRetakePhoto={handleRetakePhoto}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
