
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RoleSelector from '@/components/RoleSelector';
import DeliveryInterface from '@/components/DeliveryInterface';
import DeliveryHistory from '@/components/DeliveryHistory';
import OwnerDashboard from '@/components/OwnerDashboard';
import DeliveryNavigation from '@/components/DeliveryNavigation';

type UserRole = 'customer' | 'delivery' | 'owner';
type AppState = 'role-selection' | 'main-interface' | 'history-view' | 'delivery-navigation';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('role-selection');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Mock customers data with quantities
  const mockCustomers = [
    { id: '101', name: 'Rajesh Kumar', address: 'House 45, Sector 12, Green Valley', quantity: 2 },
    { id: '102', name: 'Priya Sharma', address: 'Flat 23, Block B, Green Valley', quantity: 1 },
    { id: '103', name: 'Amit Singh', address: 'Villa 78, Rose Garden Colony', quantity: 1.5 },
    { id: '104', name: 'Sunita Devi', address: 'House 12, Main Street, City Center', quantity: 1 },
    { id: '105', name: 'Vikram Gupta', address: 'Apt 567, Hill View Apartments', quantity: 2.5 },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    if (role === 'delivery') {
      setCurrentState('delivery-navigation');
    } else {
      setCurrentState('main-interface');
    }
  };

  const handleDeliveryComplete = (customerId: string, status: string) => {
    setSelectedCustomerId(customerId);
    setCurrentState('history-view');
    console.log(`Delivery ${status} for customer ${customerId}`);
  };

  const handleStatusChange = (deliveryId: string, newStatus: string) => {
    console.log(`Changed delivery ${deliveryId} status to ${newStatus}`);
  };

  const handleBack = () => {
    if (currentState === 'history-view') {
      if (userRole === 'delivery') {
        setCurrentState('delivery-navigation');
      } else {
        setCurrentState('main-interface');
      }
      setSelectedCustomerId(null);
    } else if (currentState === 'delivery-navigation') {
      setCurrentState('role-selection');
      setUserRole(null);
    } else {
      setCurrentState('role-selection');
      setUserRole(null);
    }
  };

  if (currentState === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <RoleSelector onRoleSelect={handleRoleSelect} />
      </div>
    );
  }

  if (userRole === 'owner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto p-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Role Selection
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <OwnerDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto p-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentState === 'history-view' ? 'Back to Delivery' : 'Back to Role Selection'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {currentState === 'delivery-navigation' && userRole === 'delivery' && (
          <DeliveryNavigation 
            customers={mockCustomers}
            userRole={userRole}
          />
        )}

        {currentState === 'main-interface' && userRole && userRole !== 'delivery' && (
          <div className="flex justify-center">
            <DeliveryInterface userRole={userRole} onDeliveryComplete={handleDeliveryComplete} />
          </div>
        )}

        {currentState === 'history-view' && selectedCustomerId && userRole && (
          <DeliveryHistory 
            customerId={selectedCustomerId} 
            userRole={userRole}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
