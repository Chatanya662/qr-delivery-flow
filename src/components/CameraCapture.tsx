
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check, AlertTriangle, User } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photoData: string, status: 'delivered' | 'missed') => void;
  deliveryDate: string;
  customerName: string;
  customerAddress: string;
}

const CameraCapture = ({ isOpen, onClose, onPhotoTaken, deliveryDate, customerName, customerAddress }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
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

  const handleDeliveryStatus = (status: 'delivered' | 'missed') => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto, status);
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
            <Button variant="ghost" size="sm" onClick={onClose}>
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
                    <Button onClick={takePhoto} className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  ) : (
                    <Button onClick={retakePhoto} variant="outline" className="flex-1">
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
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Delivered
                    </Button>
                    <Button 
                      onClick={() => handleDeliveryStatus('missed')}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Missed
                    </Button>
                  </div>
                  <Button onClick={retakePhoto} variant="ghost" className="w-full">
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
