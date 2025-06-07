
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Save, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  quantity: number;
  pricePerLiter: number;
}

interface QuantityManagerProps {
  customers: Customer[];
  onUpdateQuantity: (customerId: string, newQuantity: number) => void;
  onUpdatePrice: (customerId: string, newPrice: number) => void;
}

const QuantityManager = ({ customers, onUpdateQuantity, onUpdatePrice }: QuantityManagerProps) => {
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer.id);
    setTempQuantity(customer.quantity);
    setTempPrice(customer.pricePerLiter);
  };

  const handleSave = async (customerId: string) => {
    setSaving(true);
    try {
      // Update quantity in database
      const { error } = await supabase
        .from('customers')
        .update({ quantity: tempQuantity })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      // Update local state
      onUpdateQuantity(customerId, tempQuantity);
      onUpdatePrice(customerId, tempPrice);
      setEditingCustomer(null);
      
      toast({
        title: "Success",
        description: "Customer details updated successfully",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingCustomer(null);
    setTempQuantity(0);
    setTempPrice(0);
  };

  const adjustQuantity = (change: number) => {
    const newQuantity = Math.max(0, tempQuantity + change);
    setTempQuantity(newQuantity);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Quantity & Price Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{customer.name}</h3>
                  {editingCustomer === customer.id ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Daily Quantity (Liters)
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustQuantity(-0.5)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            className="w-20 text-center"
                            step="0.5"
                            min="0"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustQuantity(0.5)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Price per Liter (₹)
                        </label>
                        <Input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(Number(e.target.value))}
                          className="w-24"
                          min="0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(customer.id)}
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Quantity: {customer.quantity} Liter(s) per day</p>
                      <p>Rate: ₹{customer.pricePerLiter} per liter</p>
                      <p className="font-medium text-gray-800">
                        Daily Total: ₹{customer.quantity * customer.pricePerLiter}
                      </p>
                    </div>
                  )}
                </div>
                {editingCustomer !== customer.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityManager;
