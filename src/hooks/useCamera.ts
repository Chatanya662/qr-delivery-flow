
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
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
      
      if (!isSecureContext) {
        setError('Camera access requires HTTPS. Please use HTTPS or localhost to access the camera.');
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported in this browser.');
        return;
      }

      // Try different camera configurations for better mobile support
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      let mediaStream;
      
      try {
        // First try with preferred settings
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log('Failed with preferred settings, trying basic video');
        try {
          // Fallback to basic video if environment camera fails
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
          });
        } catch (err2) {
          console.log('Failed with environment camera, trying any camera');
          // Final fallback to any available camera
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => {
          console.error('Error playing video:', e);
        });
      }
      setError('');
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera is not supported in this browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }
      
      setError(errorMessage);
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
