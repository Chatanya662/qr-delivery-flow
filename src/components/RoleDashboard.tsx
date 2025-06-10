
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import CustomerDashboard from './CustomerDashboard';
import DeliveryNavigation from './DeliveryNavigation';
import OwnerDashboard from './OwnerDashboard';

interface RoleDashboardProps {
  user: SupabaseUser;
  userRole: 'customer' | 'delivery' | 'owner';
  onSignOut: () => void;
}

const RoleDashboard = ({ user, userRole, onSignOut }: RoleDashboardProps) => {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
      toast({
        title: "Success",
        description: "Successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (userRole === 'customer') {
    return <CustomerDashboard user={user} onSignOut={handleSignOut} />;
  }

  if (userRole === 'delivery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div>
              <h1 className="font-semibold">Delivery Dashboard</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <DeliveryNavigation customers={[]} userRole={userRole} />
        </div>
      </div>
    );
  }

  if (userRole === 'owner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div>
              <h1 className="font-semibold">Owner Dashboard</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <OwnerDashboard />
        </div>
      </div>
    );
  }

  return null;
};

export default RoleDashboard;
