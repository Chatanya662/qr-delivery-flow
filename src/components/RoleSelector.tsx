
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Truck, ShieldCheck } from 'lucide-react';

interface RoleSelectorProps {
  onRoleSelect: (role: 'customer' | 'delivery' | 'owner') => void;
}

const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  const roles = [
    {
      id: 'customer' as const,
      title: 'Customer',
      description: 'View your delivery history',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'delivery' as const,
      title: 'Delivery Boy',
      description: 'Mark deliveries as complete',
      icon: Truck,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'owner' as const,
      title: 'Owner/Admin',
      description: 'Manage deliveries and customers',
      icon: ShieldCheck,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">KC Farms</h1>
          <p className="text-xl text-gray-600">Milk Delivery Tracking System</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">{role.description}</p>
                  <Button 
                    onClick={() => onRoleSelect(role.id)}
                    className={`w-full ${role.color} text-white transition-colors duration-300`}
                  >
                    Login as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
