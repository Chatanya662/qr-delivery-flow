
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

  const createCustomerRecordForOAuth = async (userId: string) => {
    try {
      // Check if customer record already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (existingCustomer) {
        console.log('Customer record already exists');
        return;
      }

      // Create a new customer record for OAuth users
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          profile_id: userId,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Customer',
          address: 'Please update your address',
          quantity: 1,
          contact_number: user.phone || ''
        });

      if (customerError) {
        console.error('Error creating customer record:', customerError);
        toast({
          title: "Profile Setup Needed",
          description: "Please contact support to complete your customer profile setup.",
          variant: "destructive",
        });
      } else {
        console.log('Customer record created successfully for OAuth user');
        toast({
          title: "Welcome!",
          description: "Your customer profile has been set up. You can update your details anytime.",
        });
      }
    } catch (error) {
      console.error('Error in createCustomerRecordForOAuth:', error);
    }
  };

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
        
        // If user doesn't have a profile yet (OAuth users), try to create one
        const pendingRole = localStorage.getItem('pendingUserRole');
        if (pendingRole && ['customer', 'delivery', 'owner'].includes(pendingRole)) {
          console.log(`Creating profile for OAuth user with role: ${pendingRole}`);
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              role: pendingRole as 'customer' | 'delivery' | 'owner'
            })
            .select('role')
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            toast({
              title: "Error",
              description: "Failed to create user profile",
              variant: "destructive",
            });
            return;
          }

          localStorage.removeItem('pendingUserRole');
          setUserActualRole(newProfile.role);
          
          // For customer role, create customer record
          if (pendingRole === 'customer') {
            await createCustomerRecordForOAuth(user.id);
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to verify user role",
            variant: "destructive",
          });
          return;
        }
      } else {
        setUserActualRole(profile.role);
        
        // For existing customer profiles, ensure customer record exists
        if (profile.role === 'customer') {
          await createCustomerRecordForOAuth(user.id);
        }
      }

      // Check if user is trying to access wrong dashboard
      const actualRole = profile?.role || localStorage.getItem('pendingUserRole');
      if (actualRole && actualRole !== userRole) {
        toast({
          title: "Access Denied",
          description: `You are registered as a ${actualRole}. Redirecting you to the correct interface.`,
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
      // Clear any pending role from localStorage
      localStorage.removeItem('pendingUserRole');
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
