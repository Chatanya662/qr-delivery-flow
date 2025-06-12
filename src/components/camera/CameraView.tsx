
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, AlertTriangle } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  capturedPhoto: string | null;
  error: string;
  isUploading: boolean;
  onTakePhoto: () => void;
  onRetakePhoto: () => void;
  onStartCamera: () => void;
}

const CameraView = ({ 
  videoRef, 
  canvasRef, 
  capturedPhoto, 
  error, 
  isUploading,
  onTakePhoto, 
  onRetakePhoto, 
  onStartCamera 
}: CameraViewProps) => {
  if (error) {
    return (
      <div className="text-center p-4 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <div className="space-y-2">
          <p className="text-red-600 font-medium">Camera Access Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        
        <div className="space-y-2 text-xs text-gray-500">
          <p><strong>For mobile users:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure you're using HTTPS (not HTTP)</li>
            <li>Allow camera permissions when prompted</li>
            <li>Close other camera apps</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
        
        <Button onClick={onStartCamera} className="mt-4">
          <Camera className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
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
      
      <div className="flex gap-2 justify-center">
        {!capturedPhoto ? (
          <Button onClick={onTakePhoto} className="flex-1" disabled={isUploading}>
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        ) : (
          <Button onClick={onRetakePhoto} variant="outline" className="flex-1" disabled={isUploading}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Photo
          </Button>
        )}
      </div>
    </>
  );
};

export default CameraView;
