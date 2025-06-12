
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
      console.log('Starting camera...');
      console.log('Location protocol:', window.location.protocol);
      console.log('Location hostname:', window.location.hostname);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Check for secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'https:';
      
      if (!isSecureContext) {
        setError('Camera access requires HTTPS. Please ensure you are using a secure connection (https://) to access the camera.');
        return;
      }

      let mediaStream;
      
      // Try multiple camera configurations for better compatibility
      const cameraConfigs = [
        // First try with environment camera (back camera)
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Fallback to environment camera with basic settings
        {
          video: { facingMode: 'environment' }
        },
        // Fallback to any camera
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Final fallback - basic video
        {
          video: true
        }
      ];

      let lastError;
      for (const config of cameraConfigs) {
        try {
          console.log('Trying camera config:', config);
          mediaStream = await navigator.mediaDevices.getUserMedia(config);
          console.log('Camera started successfully with config:', config);
          break;
        } catch (err: any) {
          console.log('Failed with config:', config, 'Error:', err);
          lastError = err;
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError;
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Ensure video plays
        try {
          await videoRef.current.play();
          console.log('Video started playing');
        } catch (playError) {
          console.error('Error playing video:', playError);
          // Try to play again after a short delay
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.error('Retry play failed:', e));
            }
          }, 100);
        }
      }
      
      setError('');
      console.log('Camera setup completed successfully');
      
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device. Please ensure your device has a camera.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera is not supported in this browser. Please use Chrome, Firefox, or Safari.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application. Please close other camera apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera settings are not supported. Trying with basic settings...';
      } else {
        errorMessage += 'Please check camera permissions and try again. Make sure you are using HTTPS.';
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped camera track:', track.kind);
      });
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
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
