
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Check, X } from 'lucide-react';

interface DeliveryActionButtonsProps {
  onDelivered: (quantity: number) => void;
  onMissed: () => void;
  onTakePhoto: () => void;
  defaultQuantity: number;
  isDelivered?: boolean;
  isMissed?: boolean;
}

const DeliveryActionButtons = ({ 
  onDelivered, 
  onMissed, 
  onTakePhoto, 
  defaultQuantity,
  isDelivered = false,
  isMissed = false
}: DeliveryActionButtonsProps) => {
  const [selectedQuantity, setSelectedQuantity] = useState(defaultQuantity);

  const quantityOptions = [
    { value: 0.5, label: '0.5 Liter' },
    { value: 0.75, label: '3/4 Liter' },
    { value: 1, label: '1 Liter' },
    { value: 1.5, label: '1.5 Liter' },
    { value: 2, label: '2 Liter' }
  ];

  const pricePerLiter = 100; // ₹100 per liter for cow milk
  const totalPrice = selectedQuantity * pricePerLiter;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <label className="text-sm font-medium text-blue-800 block mb-2">
          Select Quantity to Deliver
        </label>
        <Select value={selectedQuantity.toString()} onValueChange={(value) => setSelectedQuantity(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select quantity" />
          </SelectTrigger>
          <SelectContent>
            {quantityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label} - ₹{option.value * pricePerLiter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 text-sm text-blue-700">
          <span className="font-medium">Total: ₹{totalPrice}</span>
          <span className="text-xs ml-2">(₹{pricePerLiter}/liter)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button 
          onClick={() => onDelivered(selectedQuantity)}
          className={`${isDelivered ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'}`}
          disabled={isDelivered}
        >
          <Check className="w-4 h-4 mr-1" />
          {isDelivered ? 'Delivered' : 'Deliver'}
        </Button>
        
        <Button 
          onClick={onMissed}
          variant="destructive"
          disabled={isMissed}
          className={isMissed ? 'bg-red-600' : ''}
        >
          <X className="w-4 h-4 mr-1" />
          {isMissed ? 'Missed' : 'Miss'}
        </Button>
        
        <Button 
          onClick={onTakePhoto}
          variant="outline"
        >
          <Camera className="w-4 h-4 mr-1" />
          Photo
        </Button>
      </div>
    </div>
  );
};

export default DeliveryActionButtons;
