
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Truck } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import DeliveryHistory from './DeliveryHistory';

interface DeliveryInterfaceProps {
  userRole: 'delivery' | 'owner';
  onDeliveryComplete: (customerId: string, status: string) => void;
}

const DeliveryInterface = ({ userRole, onDeliveryComplete }: DeliveryInterfaceProps) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleBack = () => {
    setSelectedCustomerId(null);
  };

  // For delivery and owner roles, show a different interface
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-6 h-6" />
            {userRole === 'delivery' ? 'Delivery Dashboard' : 'Owner Dashboard'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {userRole === 'delivery' 
              ? 'Use the delivery navigation to manage your deliveries.'
              : 'Access the owner dashboard to manage customers and view reports.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryInterface;
