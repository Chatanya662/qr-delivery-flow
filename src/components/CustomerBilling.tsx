
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar, DollarSign, Package, Phone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingData {
  customerId: string;
  customerName: string;
  month: string;
  year: number;
  pricePerLiter: number;
  deliveredDays: number;
  missedDays: number;
  totalDays: number;
  totalAmount: number;
  quantity: number; // liters per day
}

interface CustomerBillingProps {
  billingData: BillingData;
}

const CustomerBilling = ({ billingData }: CustomerBillingProps) => {
  const { toast } = useToast();
  
  const {
    customerName,
    month,
    year,
    pricePerLiter,
    deliveredDays,
    missedDays,
    totalDays,
    totalAmount,
    quantity
  } = billingData;

  const successRate = ((deliveredDays / totalDays) * 100).toFixed(1);

  const phonePayNumbers = ['+919703775498', '+919700567383'];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    });
  };

  const exportBill = () => {
    const billData = [
      ['KC Farms - Monthly Bill'],
      [''],
      ['Customer Name', customerName],
      ['Month', `${month} ${year}`],
      ['Quantity per Day', `${quantity} Liter(s)`],
      ['Price per Liter', `₹${pricePerLiter}`],
      [''],
      ['Delivery Summary'],
      ['Total Days in Month', totalDays],
      ['Days Delivered', deliveredDays],
      ['Days Missed', missedDays],
      ['Success Rate', `${successRate}%`],
      [''],
      ['Billing Details'],
      ['Daily Rate', `₹${pricePerLiter * quantity}`],
      ['Total Amount', `₹${totalAmount}`],
      [''],
      ['Payment Information'],
      ['PhonePe Number 1', phonePayNumbers[0]],
      ['PhonePe Number 2', phonePayNumbers[1]],
      [''],
      ['Generated on', new Date().toLocaleDateString()]
    ];

    const csvContent = billData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customerName}-${month}-${year}-bill.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-green-600" />
          Monthly Bill - {month} {year}
        </CardTitle>
        <p className="text-gray-600">{customerName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantity & Price Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Daily Subscription</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium ml-1">{quantity} Liter(s)</span>
            </div>
            <div>
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium ml-1">₹{pricePerLiter}/L</span>
            </div>
          </div>
        </div>

        {/* Delivery Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{deliveredDays}</div>
            <div className="text-xs text-gray-600">Delivered</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{missedDays}</div>
            <div className="text-xs text-gray-600">Missed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{successRate}%</div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Daily Rate:</span>
            <span className="font-medium">₹{pricePerLiter * quantity}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-xl font-bold text-green-600">₹{totalAmount}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {deliveredDays} days × ₹{pricePerLiter * quantity}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">Payment via PhonePe</span>
          </div>
          <div className="space-y-2">
            {phonePayNumbers.map((number, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="font-mono text-sm">{number}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(number)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-700 mt-2">
            Pay ₹{totalAmount} to any of the above numbers and send screenshot as confirmation.
          </p>
        </div>

        {/* Export Button */}
        <Button onClick={exportBill} className="w-full" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Bill
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomerBilling;
