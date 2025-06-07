
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, User, MapPin, Camera, Eye } from 'lucide-react';
import CameraCapture from './CameraCapture';
import CustomerBilling from './CustomerBilling';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
}

interface DeliveryNavigationProps {
  customers: Customer[];
  userRole: 'delivery' | 'customer' | 'owner';
}

const DeliveryNavigation = ({ customers, userRole }: DeliveryNavigationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, 'delivered' | 'missed'>>({});

  const currentCustomer = customers[currentIndex];
  const today = new Date().toISOString().split('T')[0];

  const handleNext = () => {
    if (currentIndex < customers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePhotoTaken = (photoData: string, status: 'delivered' | 'missed') => {
    console.log(`Photo taken for ${currentCustomer.name}:`, photoData);
    console.log(`Delivery status: ${status}`);
    setDeliveryStatus(prev => ({ ...prev, [currentCustomer.id]: status }));
    setShowCamera(false);
    
    // Auto-navigate to next customer after delivery
    if (currentIndex < customers.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
    }
  };

  const generateBillingData = () => {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    
    // Mock delivery data
    const deliveredDays = Math.floor(Math.random() * 25) + 20; // 20-25 days
    const missedDays = daysInMonth - deliveredDays;
    const pricePerLiter = 100;
    const totalAmount = deliveredDays * pricePerLiter * currentCustomer.quantity;

    return {
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      month,
      year,
      pricePerLiter,
      deliveredDays,
      missedDays,
      totalDays: daysInMonth,
      totalAmount,
      quantity: currentCustomer.quantity
    };
  };

  if (!currentCustomer) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No customers available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Customer Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer {currentIndex + 1} of {customers.length}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                disabled={currentIndex === customers.length - 1}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800">{currentCustomer.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{currentCustomer.address}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Daily Quantity:</span> {currentCustomer.quantity} Liter(s)
            </div>
          </div>

          {/* Delivery Status */}
          {deliveryStatus[currentCustomer.id] && (
            <div className={`p-3 rounded-lg ${
              deliveryStatus[currentCustomer.id] === 'delivered' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <span className={`font-medium ${
                deliveryStatus[currentCustomer.id] === 'delivered' 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                Status: {deliveryStatus[currentCustomer.id] === 'delivered' ? 'Delivered ✓' : 'Missed ✗'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {userRole === 'delivery' && (
              <Button 
                onClick={() => setShowCamera(true)}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            )}
            <Button 
              onClick={() => setShowBilling(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onPhotoTaken={handlePhotoTaken}
          deliveryDate={today}
          customerName={currentCustomer.name}
          customerAddress={currentCustomer.address}
        />
      )}

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBilling(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg z-10"
            >
              ×
            </Button>
            <CustomerBilling billingData={generateBillingData()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNavigation;
