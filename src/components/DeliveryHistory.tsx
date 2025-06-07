
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import DeliveryTracker from './DeliveryTracker';

interface DeliveryHistoryProps {
  customerId: string;
  userRole: 'customer' | 'delivery' | 'owner';
  onStatusChange?: (deliveryId: string, newStatus: string) => void;
}

const DeliveryHistory = ({ customerId, userRole, onStatusChange }: DeliveryHistoryProps) => {
  // Mock customer data to get the name
  const customers = [
    { id: '101', name: 'Rajesh Kumar', address: 'House 45, Sector 12' },
    { id: '102', name: 'Priya Sharma', address: 'Flat 23, Green Valley' },
    { id: '103', name: 'Amit Singh', address: 'Villa 78, Rose Garden' },
    { id: '104', name: 'Sunita Devi', address: 'House 12, Main Street' },
    { id: '105', name: 'Vikram Gupta', address: 'Apt 567, Hill View' },
  ];

  const customer = customers.find(c => c.id === customerId);
  const customerName = customer?.name || `Customer ${customerId}`;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Delivery Tracking Dashboard</h1>
        </div>
        <p className="text-gray-600">Track your daily milk delivery status and photos</p>
      </div>

      <DeliveryTracker 
        customerId={customerId}
        customerName={customerName}
        userRole={userRole}
      />
    </div>
  );
};

export default DeliveryHistory;
