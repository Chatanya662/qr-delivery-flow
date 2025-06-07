
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RoleSelector from '@/components/RoleSelector';
import DeliveryInterface from '@/components/DeliveryInterface';
import DeliveryHistory from '@/components/DeliveryHistory';
import OwnerDashboard from '@/components/OwnerDashboard';

type UserRole = 'customer' | 'delivery' | 'owner';
type AppState = 'role-selection' | 'main-interface' | 'history-view';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('role-selection');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setCurrentState('main-interface');
  };

  const handleDeliveryComplete = (customerId: string, status: string) => {
    setSelectedCustomerId(customerId);
    setCurrentState('history-view');
    console.log(`Delivery ${status} for customer ${customerId}`);
  };

  const handleStatusChange = (deliveryId: string, newStatus: string) => {
    console.log(`Changed delivery ${deliveryId} status to ${newStatus}`);
    // In a real app, this would update the backend
  };

  const handleBack = () => {
    if (currentState === 'history-view') {
      setCurrentState('main-interface');
      setSelectedCustomerId(null);
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
            {currentState === 'history-view' ? 'Back to Customer Selection' : 'Back to Role Selection'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {currentState === 'main-interface' && userRole && (
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
