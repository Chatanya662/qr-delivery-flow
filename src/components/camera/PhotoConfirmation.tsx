
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, RotateCcw } from 'lucide-react';

interface PhotoConfirmationProps {
  isUploading: boolean;
  onDeliveryStatus: (status: 'delivered' | 'missed') => void;
  onRetakePhoto: () => void;
}

const PhotoConfirmation = ({ isUploading, onDeliveryStatus, onRetakePhoto }: PhotoConfirmationProps) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="font-medium text-gray-800 mb-1">Confirm Delivery Status</p>
        <p className="text-sm text-gray-600">Was the milk delivered successfully?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => onDeliveryStatus('delivered')}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isUploading}
        >
          <Check className="w-4 h-4 mr-2" />
          {isUploading ? 'Saving...' : 'Delivered'}
        </Button>
        <Button 
          onClick={() => onDeliveryStatus('missed')}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
          disabled={isUploading}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Missed
        </Button>
      </div>
      <Button onClick={onRetakePhoto} variant="ghost" className="w-full" disabled={isUploading}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Retake Photo
      </Button>
    </div>
  );
};

export default PhotoConfirmation;
