
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Phone, MapPin, Package, Calendar, Clock, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import DeliveryTracker from './DeliveryTracker';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

interface CustomerDashboardProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

const CustomerDashboard = ({ user, onSignOut }: CustomerDashboardProps) => {
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomerData();
  }, [user.email]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, we'll match customer by email domain or use a default customer
      // In a real app, you'd have a proper user-customer relationship
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customer data:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setCustomerData(data);
      } else {
        // If no customer data found, show a message
        toast({
          title: "No Customer Data",
          description: "Please contact the owner to set up your customer profile",
          variant: "destructive",
        });
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
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
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

            {/* Delivery Tracker */}
            <DeliveryTracker 
              customerId={customerData.id}
              customerName={customerData.name}
              userRole="customer"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">No Customer Profile Found</h2>
              <p className="text-gray-600 mb-4">
                It looks like your customer profile hasn't been set up yet.
              </p>
              <p className="text-sm text-gray-500">
                Please contact KC Farms to set up your delivery profile and start receiving fresh milk daily!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
