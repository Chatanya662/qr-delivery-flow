
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Milk Delivery System
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">{role.description}</p>
                  <Button
                    onClick={() => onRoleSelect(role.id)}
                    className={`w-full ${role.color} text-white`}
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
