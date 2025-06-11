
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Calendar, DollarSign, Search, Edit, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

interface PaymentRecord {
  id: string;
  customer_id: string;
  month: number;
  year: number;
  amount_due: number;
  amount_paid: number;
  payment_date: string | null;
  notes: string | null;
}

interface CustomerPaymentManagerProps {
  customers: Customer[];
}

const CustomerPaymentManager = ({ customers }: CustomerPaymentManagerProps) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { toast } = useToast();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchPayments();
    generateMissingPaymentRecords();
  }, [selectedYear, selectedMonth, customers]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('amount_due', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error",
          description: "Failed to load payment records",
          variant: "destructive",
        });
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMissingPaymentRecords = async () => {
    try {
      for (const customer of customers) {
        // Check if payment record exists for this customer, month, and year
        const { data: existingPayment } = await supabase
          .from('customer_payments')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('month', selectedMonth)
          .eq('year', selectedYear)
          .single();

        if (!existingPayment) {
          // Calculate amount due using the database function
          const { data: amountDue, error: calcError } = await supabase
            .rpc('calculate_monthly_amount_due', {
              p_customer_id: customer.id,
              p_month: selectedMonth,
              p_year: selectedYear
            });

          if (calcError) {
            console.error('Error calculating amount due:', calcError);
            continue;
          }

          // Create new payment record
          const { error: insertError } = await supabase
            .from('customer_payments')
            .insert({
              customer_id: customer.id,
              month: selectedMonth,
              year: selectedYear,
              amount_due: amountDue || 0,
              amount_paid: 0
            });

          if (insertError) {
            console.error('Error creating payment record:', insertError);
          }
        }
      }
      // Refresh payments after generating missing records
      fetchPayments();
    } catch (error) {
      console.error('Error generating payment records:', error);
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({
          amount_paid: parseFloat(newPaymentAmount),
          payment_date: paymentDate || null,
          notes: paymentNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPayment.id);

      if (error) {
        console.error('Error updating payment:', error);
        toast({
          title: "Error",
          description: "Failed to update payment",
          variant: "destructive",
        });
        return;
      }

      setEditingPayment(null);
      setNewPaymentAmount('');
      setPaymentDate('');
      setPaymentNotes('');
      fetchPayments();
      
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while updating payment",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setNewPaymentAmount(payment.amount_paid.toString());
    setPaymentDate(payment.payment_date || '');
    setPaymentNotes(payment.notes || '');
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const filteredPayments = payments.filter(payment => {
    const customerName = getCustomerName(payment.customer_id);
    return customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalAmountDue = payments.reduce((sum, p) => sum + p.amount_due, 0);
  const totalAmountPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalOutstanding = totalAmountDue - totalAmountPaid;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Amount Due</p>
                <p className="text-3xl font-bold text-blue-600">₹{totalAmountDue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">₹{totalAmountPaid.toLocaleString()}</p>
              </div>
              <Check className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Outstanding</p>
                <p className="text-3xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</p>
              </div>
              <X className="w-12 h-12 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Customer Payment Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                min="2020"
                max="2030"
                className="border border-gray-300 rounded px-3 py-2 w-20"
              />
            </div>
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading payment records...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500">No payment records found</p>
                <p className="text-sm text-gray-400">
                  Try selecting a different month/year or check if customers have delivery records
                </p>
              </div>
            ) : (
              filteredPayments.map((payment) => {
                const customer = customers.find(c => c.id === payment.customer_id);
                const isPaid = payment.amount_paid >= payment.amount_due;
                const isPartiallyPaid = payment.amount_paid > 0 && payment.amount_paid < payment.amount_due;

                return (
                  <div key={payment.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{customer?.name || 'Unknown Customer'}</h3>
                          <Badge variant={isPaid ? "default" : isPartiallyPaid ? "secondary" : "destructive"}>
                            {isPaid ? 'Paid' : isPartiallyPaid ? 'Partial' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <p><span className="font-medium">Amount Due:</span> ₹{payment.amount_due}</p>
                          <p><span className="font-medium">Amount Paid:</span> ₹{payment.amount_paid}</p>
                          <p><span className="font-medium">Outstanding:</span> ₹{payment.amount_due - payment.amount_paid}</p>
                          <p><span className="font-medium">Payment Date:</span> {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Not paid'}</p>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Notes:</span> {payment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(payment)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment for {editingPayment && getCustomerName(editingPayment.customer_id)}</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount Due</label>
                <Input
                  value={`₹${editingPayment.amount_due}`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount Paid</label>
                <Input
                  type="number"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  placeholder="Enter paid amount"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Date</label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Payment notes (optional)"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdatePayment} className="flex-1">
                  Update Payment
                </Button>
                <Button variant="outline" onClick={() => setEditingPayment(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPaymentManager;
