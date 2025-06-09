
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Package, TrendingUp, Plus, Search, Edit, Trash2, BarChart3, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuantityManager from './QuantityManager';
import ReportsOverview from './ReportsOverview';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
}

const OwnerDashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', quantity: 1 });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
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
    customer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (newCustomer.name && newCustomer.address) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: newCustomer.name,
            address: newCustomer.address,
            quantity: newCustomer.quantity
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
          setCustomers([...customers, data]);
          setNewCustomer({ name: '', address: '', quantity: 1 });
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
        const { error } = await supabase
          .from('customers')
          .update({
            name: editingCustomer.name,
            address: editingCustomer.address,
            quantity: editingCustomer.quantity
          })
          .eq('id', editingCustomer.id);

        if (error) {
          console.error('Error updating customer:', error);
          toast({
            title: "Error",
            description: "Failed to update customer",
            variant: "destructive",
          });
          return;
        }

        setCustomers(customers.map(c => 
          c.id === editingCustomer.id ? editingCustomer : c
        ));
        setEditingCustomer(null);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Something went wrong while updating customer",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This will also delete all their delivery records.')) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', customerId);

        if (error) {
          console.error('Error deleting customer:', error);
          toast({
            title: "Error",
            description: "Failed to delete customer",
            variant: "destructive",
          });
          return;
        }

        setCustomers(customers.filter(c => c.id !== customerId));
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Something went wrong while deleting customer",
          variant: "destructive",
        });
      }
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

      setCustomers(customers.map(c => 
        c.id === customerId ? { ...c, quantity: newQuantity } : c
      ));
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">KC Farms - Owner Dashboard</h1>
          <p className="text-gray-600">Complete management of your milk delivery business</p>
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
            <TabsTrigger value="deliveries">Daily Operations</TabsTrigger>
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
                    placeholder="Search by name, address, or customer ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Add Customer Form */}
                {showAddForm && (
                  <div className="p-6 border rounded-lg bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-4 text-blue-800">Add New Customer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        placeholder="Customer Name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
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
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p><span className="font-medium">ID:</span> {customer.id}</p>
                              <p><span className="font-medium">Daily Quantity:</span> {customer.quantity}L</p>
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
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
              onUpdatePrice={() => {}} // Price is fixed at 100 per liter
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsOverview />
          </TabsContent>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Operations Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Real-time Delivery Tracking Coming Soon</p>
                  <p className="text-sm">Monitor live deliveries, assign routes, and track performance</p>
                </div>
              </CardContent>
            </Card>
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
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <Input
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                    placeholder="Full Address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity (L)</label>
                  <Input
                    type="number"
                    value={editingCustomer.quantity}
                    onChange={(e) => setEditingCustomer({...editingCustomer, quantity: Number(e.target.value)})}
                    step="0.5"
                    min="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleUpdateCustomer} className="flex-1">
                    Update Customer
                  </Button>
                  <Button variant="outline" onClick={() => setEditingCustomer(null)} className="flex-1">
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
