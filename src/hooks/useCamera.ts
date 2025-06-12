
import { useRef, useState, useEffect } from 'react';

export const useCamera = (isOpen: boolean) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

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

  return {
    videoRef,
    stream,
    error,
    startCamera,
    stopCamera
  };
};
