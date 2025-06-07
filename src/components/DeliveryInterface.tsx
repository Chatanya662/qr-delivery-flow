
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, User, Truck } from 'lucide-react';

interface DeliveryInterfaceProps {
  userRole: 'customer' | 'delivery' | 'owner';
  onDeliveryComplete: (customerId: string, status: string) => void;
}

const DeliveryInterface = ({ userRole, onDeliveryComplete }: DeliveryInterfaceProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Mock customer data
  const customers = [
    { id: '101', name: 'Rajesh Kumar', address: 'House 45, Sector 12' },
    { id: '102', name: 'Priya Sharma', address: 'Flat 23, Green Valley' },
    { id: '103', name: 'Amit Singh', address: 'Villa 78, Rose Garden' },
    { id: '104', name: 'Sunita Devi', address: 'House 12, Main Street' },
    { id: '105', name: 'Vikram Gupta', address: 'Apt 567, Hill View' },
  ];

  const handleAction = () => {
    if (!selectedCustomer) {
      setResult({ success: false, message: 'Please select a customer' });
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    
    if (userRole === 'delivery') {
      onDeliveryComplete(selectedCustomer, 'delivered');
      setResult({ 
        success: true, 
        message: `Delivery marked as completed for ${customer?.name}` 
      });
    } else {
      setResult({ 
        success: true, 
        message: `Viewing delivery history for ${customer?.name}` 
      });
      onDeliveryComplete(selectedCustomer, 'view');
    }

    setTimeout(() => {
      setResult(null);
      setSelectedCustomer('');
    }, 3000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        {userRole === 'delivery' ? (
          <Truck className="w-12 h-12 mx-auto mb-2 text-green-500" />
        ) : (
          <User className="w-12 h-12 mx-auto mb-2 text-blue-500" />
        )}
        <CardTitle>
          {userRole === 'delivery' ? 'Mark Delivery Complete' : 'View Delivery History'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Customer</label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-sm text-gray-500">{customer.address}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleAction}
          className={`w-full text-white ${
            userRole === 'delivery' 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={!selectedCustomer}
        >
          {userRole === 'delivery' ? 'Mark as Delivered' : 'View History'}
        </Button>

        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryInterface;
