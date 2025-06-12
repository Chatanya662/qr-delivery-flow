
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Eye, Loader2, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliveryPhotos from './DeliveryPhotos';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customerId: string) => void;
}

const CustomerSelector = ({ onCustomerSelect }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const { toast } = useToast();

  const formatQuantity = (quantity: number) => {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  };

  useEffect(() => {
    fetchCustomers();

    // Set up real-time subscription for customer updates and deletions
    const subscription = supabase
      .channel('customers-selector-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('Customer added:', payload);
        setCustomers(prev => [...prev, payload.new as Customer]);
        toast({
          title: "New Customer",
          description: "A new customer has been added",
        });
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('Customer updated:', payload);
        setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new as Customer : c));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('Customer deleted:', payload.old.id);
        setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
        toast({
          title: "Customer Removed",
          description: "A customer has been removed from the system",
        });
        // Close photo modal if the deleted customer was selected
        if (selectedCustomer && selectedCustomer.id === payload.old.id) {
          setShowPhotos(false);
          setSelectedCustomer(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onCustomerSelect(customer.id);
  };

  const handleViewPhotos = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPhotos(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Your Profile</h1>
        <p className="text-gray-600">Choose your name to view delivery history and photos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                {customer.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-1" />
                <span className="text-sm">{customer.address}</span>
              </div>
              {customer.contact_number && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{customer.contact_number}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Regular Quantity:</span> {formatQuantity(customer.quantity)} Liter(s)
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCustomerSelect(customer)}
                  className="flex-1"
                  size="sm"
                >
                  View History
                </Button>
                <Button 
                  onClick={() => handleViewPhotos(customer)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Photos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No customers found</p>
          <p className="text-sm">Please contact the owner to add your profile</p>
        </div>
      )}

      {/* Delivery Photos Modal */}
      {showPhotos && selectedCustomer && (
        <DeliveryPhotos
          isOpen={showPhotos}
          onClose={() => setShowPhotos(false)}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          userRole="customer"
        />
      )}
    </div>
  );
};

export default CustomerSelector;
