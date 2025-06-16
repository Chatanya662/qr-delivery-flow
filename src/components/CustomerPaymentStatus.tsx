
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecord {
  id: string;
  month: number;
  year: number;
  amount_due: number;
  amount_paid: number;
  payment_date: string | null;
  notes: string | null;
}

interface CustomerPaymentStatusProps {
  customerId: string;
}

const CustomerPaymentStatus = ({ customerId }: CustomerPaymentStatusProps) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to format month with day range
  const formatMonthWithDays = (month: number, year: number) => {
    const monthName = months[month - 1];
    const daysInMonth = getDaysInMonth(month, year);
    return `${monthName} ${year} (1 to ${daysInMonth} days)`;
  };

  useEffect(() => {
    fetchPayments();
  }, [customerId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error",
          description: "Failed to load payment information",
          variant: "destructive",
        });
        return;
      }

      // Sort payments by date descending (newest first)
      const sortedPayments = (data || []).sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // Newer year first
        }
        return b.month - a.month; // Newer month first
      });

      setPayments(sortedPayments);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const currentPayment = payments.find(p => p.month === currentMonth && p.year === currentYear);
  const recentPayments = payments.slice(0, 6); // Already sorted by newest first
  
  const totalOutstanding = payments.reduce((sum, p) => sum + (p.amount_due - p.amount_paid), 0);

  return (
    <div className="space-y-6">
      {/* Current Month Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Month Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPayment ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">
                  Payment Period: {formatMonthWithDays(currentMonth, currentYear)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Amount Due</p>
                    <p className="font-semibold text-lg">₹{currentPayment.amount_due}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-semibold text-lg">₹{currentPayment.amount_paid}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="font-semibold text-lg">₹{currentPayment.amount_due - currentPayment.amount_paid}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      currentPayment.amount_paid >= currentPayment.amount_due 
                        ? "default" 
                        : currentPayment.amount_paid > 0 
                          ? "secondary" 
                          : "destructive"
                    }
                  >
                    {currentPayment.amount_paid >= currentPayment.amount_due 
                      ? 'Fully Paid' 
                      : currentPayment.amount_paid > 0 
                        ? 'Partially Paid' 
                        : 'Pending Payment'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {months[currentMonth - 1]} {currentYear}
                  </span>
                </div>
                {currentPayment.payment_date && (
                  <p className="text-sm text-gray-600">
                    Last payment: {new Date(currentPayment.payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {currentPayment.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {currentPayment.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No payment record for current month</p>
              <p className="text-sm text-gray-400">
                Payment information will be available after deliveries ({formatMonthWithDays(currentMonth, currentYear)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Summary */}
      {totalOutstanding > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Outstanding Balance</p>
                <p className="text-3xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Across all months</p>
              </div>
              <FileText className="w-12 h-12 text-red-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payment History (Newest First)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? (
                <>Hide History <ChevronUp className="w-4 h-4 ml-1" /></>
              ) : (
                <>Show History <ChevronDown className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No payment history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => {
                  const isPaid = payment.amount_paid >= payment.amount_due;
                  const isPartiallyPaid = payment.amount_paid > 0 && payment.amount_paid < payment.amount_due;
                  const monthDays = formatMonthWithDays(payment.month, payment.year);

                  return (
                    <div key={payment.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{months[payment.month - 1]} {payment.year}</p>
                            <p className="text-xs text-gray-500">{monthDays}</p>
                            <p className="text-sm text-gray-600">
                              ₹{payment.amount_paid} / ₹{payment.amount_due}
                            </p>
                          </div>
                          <Badge variant={isPaid ? "default" : isPartiallyPaid ? "secondary" : "destructive"}>
                            {isPaid ? 'Paid' : isPartiallyPaid ? 'Partial' : 'Pending'}
                          </Badge>
                        </div>
                        {payment.payment_date && (
                          <p className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default CustomerPaymentStatus;
