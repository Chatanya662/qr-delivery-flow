
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
  const [userActualRole, setUserActualRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, [user.id]);

  const checkUserRole = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Error",
          description: "Failed to verify user role",
          variant: "destructive",
        });
        return;
      }

      setUserActualRole(profile.role);

      // Check if user is trying to access wrong dashboard
      if (profile.role !== userRole) {
        toast({
          title: "Access Denied",
          description: `You are registered as a ${profile.role}. Redirecting you to the correct interface.`,
          variant: "destructive",
        });
        
        // Sign out user so they can access the correct interface
        setTimeout(async () => {
          await supabase.auth.signOut();
          onSignOut();
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      toast({
        title: "Error",
        description: "Something went wrong while verifying access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If user role doesn't match, show access denied
  if (userActualRole !== userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Access Denied!</strong>
            <span className="block sm:inline"> You don't have permission to access this dashboard.</span>
          </div>
          <p className="text-gray-600 mb-4">
            You are registered as a <strong>{userActualRole}</strong> but trying to access the <strong>{userRole}</strong> dashboard.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Go to Correct Interface
          </Button>
        </div>
      </div>
    );
  }

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
