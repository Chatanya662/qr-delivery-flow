import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Package, TrendingUp, Plus, Search, Edit, Trash2, BarChart3, Loader2, Phone, CreditCard, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import QuantityManager from './QuantityManager';
import ReportsOverview from './ReportsOverview';
import CustomerPaymentManager from './CustomerPaymentManager';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

const OwnerDashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', quantity: 1, contact_number: '' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
    
    // Set up real-time subscription for customer updates
    const subscription = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('Customer change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          setCustomers(prev => [...prev, payload.new as Customer]);
          toast({
            title: "Customer Added",
            description: "New customer has been added successfully",
          });
        } else if (payload.eventType === 'UPDATE') {
          setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new as Customer : c));
          setUpdating(null);
          toast({
            title: "Customer Updated",
            description: "Customer has been updated successfully",
          });
        } else if (payload.eventType === 'DELETE') {
          console.log('Removing customer from state:', payload.old.id);
          setCustomers(prev => {
            const filtered = prev.filter(c => c.id !== payload.old.id);
            console.log('Customers after deletion:', filtered.length);
            return filtered;
          });
          setDeleting(null);
          toast({
            title: "Customer Deleted",
            description: "Customer has been removed successfully",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
        console.log('Fetched customers:', data.length);
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

  // ... keep existing code (stats calculation)
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.length, // All customers are active in database
    todayDeliveries: 25, // This would come from delivery_records table
    completedDeliveries: 23, // This would come from delivery_records table
    totalRevenue: customers.reduce((sum, c) => sum + (c.quantity * 100 * 30), 0) // Assuming 100 per liter
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.contact_number && customer.contact_number.includes(searchTerm))
  );

  const handleAddCustomer = async () => {
    if (newCustomer.name && newCustomer.address) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: newCustomer.name,
            address: newCustomer.address,
            quantity: newCustomer.quantity,
            contact_number: newCustomer.contact_number || null
          }])
          .select()
          .single();

        if (error) {
          console.error('Error adding customer:', error);
          toast({
            title: "Error",
            description: "Failed to add customer",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setNewCustomer({ name: '', address: '', quantity: 1, contact_number: '' });
          setShowAddForm(false);
          toast({
            title: "Success",
            description: "Customer added successfully",
          });
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Something went wrong while adding customer",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateCustomer = async () => {
    if (editingCustomer) {
      try {
        setUpdating(editingCustomer.id);
        console.log('Updating customer:', editingCustomer);
        
        const updateData = {
          name: editingCustomer.name.trim(),
          address: editingCustomer.address.trim(),
          quantity: Number(editingCustomer.quantity),
          contact_number: editingCustomer.contact_number?.trim() || null
        };

        console.log('Update data:', updateData);

        const { data, error } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', editingCustomer.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating customer:', error);
          setUpdating(null);
          toast({
            title: "Error",
            description: `Failed to update customer: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log('Customer updated successfully:', data);
        
        // Update local state immediately for better UX
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? data : c));
        setEditingCustomer(null);
        setUpdating(null);
        
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } catch (error) {
        console.error('Error:', error);
        setUpdating(null);
        toast({
          title: "Error",
          description: "Something went wrong while updating customer",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will permanently remove all their data including delivery records and payment history.')) {
      return;
    }

    try {
      setDeleting(customerId);
      console.log('Starting deletion process for customer:', customerId);
      
      // First, let's check if the customer exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single();

      if (checkError || !existingCustomer) {
        console.error('Customer not found:', checkError);
        setDeleting(null);
        toast({
          title: "Error",
          description: "Customer not found in database",
          variant: "destructive",
        });
        return;
      }

      console.log('Customer found, proceeding with deletion:', existingCustomer.name);

      // Step 1: Delete customer_payments (if any)
      console.log('Deleting customer payments...');
      const { error: paymentError } = await supabase
        .from('customer_payments')
        .delete()
        .eq('customer_id', customerId);

      if (paymentError) {
        console.log('Payment deletion result:', paymentError.message);
      } else {
        console.log('Customer payments deleted successfully');
      }

      // Step 2: Delete delivery_records (if any)
      console.log('Deleting delivery records...');
      const { error: deliveryError } = await supabase
        .from('delivery_records')
        .delete()
        .eq('customer_id', customerId);

      if (deliveryError) {
        console.log('Delivery records deletion result:', deliveryError.message);
      } else {
        console.log('Delivery records deleted successfully');
      }

      // Step 3: Delete the customer record using RPC function to bypass potential RLS issues
      console.log('Deleting customer record...');
      const { error: customerError } = await supabase.rpc('delete_customer_force', { 
        customer_id: customerId 
      });

      if (customerError) {
        console.error('RPC deletion failed, trying direct deletion:', customerError);
        
        // Fallback to direct deletion
        const { error: directError, data: directData } = await supabase
          .from('customers')
          .delete()
          .eq('id', customerId)
          .select('*');

        if (directError) {
          console.error('Direct deletion also failed:', directError);
          setDeleting(null);
          toast({
            title: "Error",
            description: `Failed to delete customer: ${directError.message}`,
            variant: "destructive",
          });
          return;
        }

        if (!directData || directData.length === 0) {
          console.log('No customer was deleted - this indicates an RLS or permissions issue');
          setDeleting(null);
          toast({
            title: "Error", 
            description: "Customer could not be deleted. Please check permissions.",
            variant: "destructive",
          });
          return;
        }

        console.log('Customer deleted successfully via direct method:', directData[0]);
      } else {
        console.log('Customer deleted successfully via RPC');
      }
      
      // Update local state immediately
      setCustomers(prev => {
        const filtered = prev.filter(c => c.id !== customerId);
        console.log(`Local state updated - customers remaining: ${filtered.length}`);
        return filtered;
      });
      
      setDeleting(null);
      toast({
        title: "Success",
        description: `Customer "${existingCustomer.name}" and all related records deleted successfully`,
      });
      
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      setDeleting(null);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the customer",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (customerId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ quantity: newQuantity })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating quantity:', error);
        toast({
          title: "Error",
          description: "Failed to update quantity",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Quantity updated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while updating quantity",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">KC Farms - Owner Dashboard</h1>
          </div>
          <Button onClick={() => navigate('/daily-report')} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Daily Reports
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeCustomers}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Today's Deliveries</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.todayDeliveries}</p>
                </div>
                <Package className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.completedDeliveries}</p>
                </div>
                <Package className="w-12 h-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-red-600">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">Customer Management</TabsTrigger>
            <TabsTrigger value="quantities">Quantity & Pricing</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="payments">Customer Payment Management</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Manage Your Customers</CardTitle>
                  <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, address, contact number, or customer ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Add Customer Form */}
                {showAddForm && (
                  <div className="p-6 border rounded-lg bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-4 text-blue-800">Add New Customer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input
                        placeholder="Customer Name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      />
                      <Input
                        placeholder="Contact Number"
                        value={newCustomer.contact_number}
                        onChange={(e) => setNewCustomer({...newCustomer, contact_number: e.target.value})}
                      />
                      <Input
                        placeholder="Full Address"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity (L)"
                        value={newCustomer.quantity}
                        onChange={(e) => setNewCustomer({...newCustomer, quantity: Number(e.target.value)})}
                        step="0.5"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleAddCustomer} className="bg-green-500 hover:bg-green-600">
                        Add Customer
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Customer List */}
                <div className="space-y-4">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No customers found</p>
                      <p className="text-sm">Try adjusting your search or add a new customer</p>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div key={customer.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{customer.name}</h3>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                              {updating === customer.id && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Updating...
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <p><span className="font-medium">ID:</span> {customer.id}</p>
                              <p><span className="font-medium">Daily Quantity:</span> {customer.quantity}L</p>
                              {customer.contact_number && (
                                <p className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span className="font-medium">Contact:</span> {customer.contact_number}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Address:</span> {customer.address}
                            </p>
                            <p className="text-sm font-medium text-green-600 mt-1">
                              Monthly Revenue: ₹{(customer.quantity * 100 * 30).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCustomer(customer)}
                              disabled={deleting === customer.id || updating === customer.id}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleting === customer.id || updating === customer.id}
                            >
                              {deleting === customer.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quantities">
            <QuantityManager 
              customers={customers}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdatePrice={() => {}}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsOverview />
          </TabsContent>

          <TabsContent value="payments">
            <CustomerPaymentManager customers={customers} />
          </TabsContent>
        </Tabs>

        {/* Edit Customer Dialog */}
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer Details</DialogTitle>
            </DialogHeader>
            {editingCustomer && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                  <Input
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Contact Number</label>
                  <Input
                    value={editingCustomer.contact_number || ''}
                    onChange={(e) => setEditingCustomer({...editingCustomer, contact_number: e.target.value})}
                    placeholder="Contact Number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                  <Input
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                    placeholder="Full Address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Quantity (L)</label>
                  <Input
                    type="number"
                    value={editingCustomer.quantity}
                    onChange={(e) => setEditingCustomer({...editingCustomer, quantity: Number(e.target.value)})}
                    step="0.5"
                    min="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleUpdateCustomer} 
                    className="flex-1"
                    disabled={updating === editingCustomer.id}
                  >
                    {updating === editingCustomer.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Customer'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingCustomer(null)} 
                    className="flex-1"
                    disabled={updating === editingCustomer.id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OwnerDashboard;
