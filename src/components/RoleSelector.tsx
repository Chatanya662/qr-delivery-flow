
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Truck, Crown } from 'lucide-react';

type UserRole = 'customer' | 'delivery' | 'owner';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  const roles = [
    {
      id: 'customer' as UserRole,
      title: 'Customer',
      description: 'Order and track your milk deliveries',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'delivery' as UserRole,
      title: 'Delivery Person',
      description: 'Manage delivery routes and customer orders',
      icon: Truck,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'owner' as UserRole,
      title: 'Business Owner',
      description: 'Oversee operations and view analytics',
      icon: Crown,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl mx-auto text-center">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-4 px-4">
            Milk Delivery System
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center px-4 sm:px-6">
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">{role.description}</p>
                  <Button
                    onClick={() => onRoleSelect(role.id)}
                    className={`w-full ${role.color} text-white text-sm sm:text-base py-2 sm:py-3`}
                  >
                    Continue as {role.title}
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
