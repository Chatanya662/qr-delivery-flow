
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Phone, MapPin, Package, Calendar, Clock, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import DeliveryTracker from './DeliveryTracker';
import ProfileSetupForm from './ProfileSetupForm';
import CustomerPaymentStatus from './CustomerPaymentStatus';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
  profile_id?: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  contact_number: string | null;
  address: string | null;
  role: string;
}

interface CustomerDashboardProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

const CustomerDashboard = ({ user, onSignOut }: CustomerDashboardProps) => {
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();

    // Set up real-time subscription for customer updates and deletions
    const subscription = supabase
      .channel('customer-dashboard-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customers',
        filter: `profile_id=eq.${user.id}`
      }, (payload) => {
        console.log('Customer data changed:', payload);
        if (payload.eventType === 'DELETE') {
          // Customer was deleted, clear the data
          setCustomerData(null);
          toast({
            title: "Account Removed",
            description: "Your customer account has been removed by the owner",
            variant: "destructive",
          });
        } else if (payload.eventType === 'UPDATE') {
          // Customer was updated
          setCustomerData(payload.new as Customer);
        } else if (payload.eventType === 'INSERT') {
          // New customer record created
          setCustomerData(payload.new as Customer);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // First, fetch the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Then, try to find a customer record linked to this profile
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (customerError && customerError.code !== 'PGRST116') {
        console.error('Error fetching customer data:', customerError);
      }

      if (customerData) {
        setCustomerData(customerData);
      } else {
        // If no customer record exists, show setup form for OAuth users
        console.log('No customer record found for this user');
        setCustomerData(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading your data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCreated = () => {
    setShowSetupForm(false);
    fetchUserData(); // Refresh data after profile is created
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="font-semibold">Welcome back!</h1>
              <p className="text-sm text-gray-600">{profile?.full_name || user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {customerData ? (
          <div className="space-y-6">
            {/* Customer Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <User className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-semibold">{customerData.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Package className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Daily Quantity</p>
                      <p className="font-semibold">{customerData.quantity}L</p>
                    </div>
                  </div>

                  {customerData.contact_number && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Phone className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-semibold">{customerData.contact_number}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <MapPin className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-sm">{customerData.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <CustomerPaymentStatus customerId={customerData.id} />

            {/* Delivery Tracker */}
            <DeliveryTracker 
              customerId={customerData.id}
              customerName={customerData.name}
              userRole="customer"
            />
          </div>
        ) : showSetupForm ? (
          <ProfileSetupForm
            userId={user.id}
            userEmail={user.email || ''}
            onProfileCreated={handleProfileCreated}
          />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600">
                  <strong>Name:</strong> {profile?.full_name || 'Not provided'}
                </p>
                <p className="text-gray-600">
                  <strong>Email:</strong> {profile?.email}
                </p>
                {profile?.contact_number && (
                  <p className="text-gray-600">
                    <strong>Contact:</strong> {profile.contact_number}
                  </p>
                )}
                {profile?.address && (
                  <p className="text-gray-600">
                    <strong>Address:</strong> {profile.address}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                To start receiving milk deliveries, please complete your delivery profile with your address and preferences.
              </p>
              <Button onClick={() => setShowSetupForm(true)} size="lg">
                <User className="w-4 h-4 mr-2" />
                Complete Profile Setup
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
