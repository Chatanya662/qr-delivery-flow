
import React from 'react';
import { User } from 'lucide-react';

interface CustomerDetailsProps {
  customerName: string;
  customerAddress: string;
  deliveryDate: string;
}

const CustomerDetails = ({ customerName, customerAddress, deliveryDate }: CustomerDetailsProps) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-800">Customer Details</h3>
      </div>
      <p className="font-medium text-gray-800">{customerName}</p>
      <p className="text-sm text-gray-600">{customerAddress}</p>
      <p className="text-sm text-gray-600 mt-1">Date: {deliveryDate}</p>
    </div>
  );
};

export default CustomerDetails;
