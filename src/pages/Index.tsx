
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoleSelector from '@/components/RoleSelector';
import CustomerInterface from '@/components/CustomerInterface';
import DeliveryInterface from '@/components/DeliveryInterface';
import OwnerInterface from '@/components/OwnerInterface';

type UserRole = 'customer' | 'delivery' | 'owner';
type AppState = 'role-selection' | 'customer-interface' | 'delivery-interface' | 'owner-interface';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('role-selection');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    switch (role) {
      case 'customer':
        setCurrentState('customer-interface');
        break;
      case 'delivery':
        setCurrentState('delivery-interface');
        break;
      case 'owner':
        setCurrentState('owner-interface');
        break;
    }
  };

  const handleBack = () => {
    setCurrentState('role-selection');
    setUserRole(null);
  };

  if (currentState === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <RoleSelector onRoleSelect={handleRoleSelect} />
      </div>
    );
  }

  if (currentState === 'customer-interface') {
    return <CustomerInterface onBack={handleBack} />;
  }

  if (currentState === 'delivery-interface') {
    return <DeliveryInterface onBack={handleBack} />;
  }

  if (currentState === 'owner-interface') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Role Selection
            </Button>
          </div>
        </div>
        <OwnerInterface onBack={handleBack} />
      </div>
    );
  }

  return null;
};

export default Index;
