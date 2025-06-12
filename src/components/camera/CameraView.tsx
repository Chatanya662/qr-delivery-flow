
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw } from 'lucide-react';

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
      <div className="text-center p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={onStartCamera}>Try Again</Button>
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
