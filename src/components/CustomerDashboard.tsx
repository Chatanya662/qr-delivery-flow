
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Package, TrendingUp, Bell, User, CreditCard, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CustomerBilling from './CustomerBilling';
import CustomerPaymentStatus from './CustomerPaymentStatus';
import DeliveryHistory from './DeliveryHistory';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

interface CustomerDashboardProps {
  customerId?: string;
  user?: SupabaseUser;
  onSignOut?: () => void;
}

const CustomerDashboard = ({ customerId, user, onSignOut }: CustomerDashboardProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  // Determine the actual customer ID to use
  const actualCustomerId = customerId || user?.id;

  // Helper function to get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to format month with day range
  const formatMonthWithDays = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1];
    const daysInMonth = getDaysInMonth(month, year);
    return `${monthName} ${year} (1 to ${daysInMonth} days)`;
  };

  useEffect(() => {
    if (actualCustomerId) {
      fetchCustomer();
    }
  }, [actualCustomerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      let data, error;

      if (customerId) {
        // If customerId is provided, fetch by customer ID
        const result = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();
        data = result.data;
        error = result.error;
      } else if (user?.id) {
        // If user is provided, try to fetch by profile_id first, then by id
        let result = await supabase
          .from('customers')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (!result.data && !result.error) {
          // If no customer found by profile_id, try by id
          result = await supabase
            .from('customers')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        }
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: "Error",
          description: "Failed to load customer information",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        console.log('No customer record found for user');
        toast({
          title: "No Customer Record",
          description: "No customer profile found. Please contact support to set up your account.",
          variant: "destructive",
        });
        return;
      }

      setCustomer(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <span className="ml-2 text-gray-500">Loading customer dashboard...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">Customer not found</p>
        </div>
      </div>
    );
  }

  const currentMonthFormatted = formatMonthWithDays(currentMonth, currentYear);

  // Mock billing data - this would come from your billing calculations
  const billingData = {
    customerId: customer.id,
    customerName: customer.name,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: currentYear,
    pricePerLiter: 60, // This would come from your pricing configuration
    deliveredDays: 25, // This would be calculated from delivery records
    missedDays: 5,
    totalDays: getDaysInMonth(currentMonth, currentYear),
    totalAmount: 25 * customer.quantity * 60, // delivered_days * quantity * price_per_liter
    quantity: customer.quantity
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {customer.name}!</h1>
            <p className="text-gray-600">Your KC Farms milk delivery dashboard</p>
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Current Period: {currentMonthFormatted}
              </Badge>
            </div>
          </div>
          {onSignOut && (
            <Button variant="outline" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Daily Quantity</p>
                  <p className="text-3xl font-bold text-blue-600">{customer.quantity}L</p>
                </div>
                <Package className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">This Month</p>
                  <p className="text-3xl font-bold text-green-600">{billingData.deliveredDays}</p>
                  <p className="text-xs text-gray-500">Deliveries</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {((billingData.deliveredDays / billingData.totalDays) * 100).toFixed(1)}%
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Amount Due</p>
                  <p className="text-2xl font-bold text-purple-600">₹{billingData.totalAmount}</p>
                </div>
                <CreditCard className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="billing">Monthly Bill</TabsTrigger>
            <TabsTrigger value="payments">Payment Status</TabsTrigger>
            <TabsTrigger value="history">Delivery History</TabsTrigger>
          </TabsList>

          <TabsContent value="billing">
            <div className="flex justify-center">
              <CustomerBilling billingData={billingData} />
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <CustomerPaymentStatus customerId={customer.id} />
          </TabsContent>

          <TabsContent value="history">
            <DeliveryHistory customerId={customer.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;
