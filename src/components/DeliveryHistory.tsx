
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Delivery {
  id: string;
  date: string;
  status: 'delivered' | 'pending' | 'missed';
  deliveryBoy?: string;
  time?: string;
}

interface DeliveryHistoryProps {
  customerId: string;
  userRole: 'customer' | 'delivery' | 'owner';
  onStatusChange?: (deliveryId: string, newStatus: string) => void;
}

const DeliveryHistory = ({ customerId, userRole, onStatusChange }: DeliveryHistoryProps) => {
  // Mock delivery data
  const deliveries: Delivery[] = [
    { id: '1', date: '2025-06-07', status: 'delivered', deliveryBoy: 'Raj Kumar', time: '08:30 AM' },
    { id: '2', date: '2025-06-06', status: 'delivered', deliveryBoy: 'Raj Kumar', time: '08:25 AM' },
    { id: '3', date: '2025-06-05', status: 'missed', deliveryBoy: 'Raj Kumar', time: '-' },
    { id: '4', date: '2025-06-04', status: 'delivered', deliveryBoy: 'Raj Kumar', time: '08:35 AM' },
    { id: '5', date: '2025-06-03', status: 'delivered', deliveryBoy: 'Raj Kumar', time: '08:20 AM' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'missed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Delivery History - Customer {customerId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(delivery.status)}
                <div>
                  <p className="font-medium">{delivery.date}</p>
                  {delivery.deliveryBoy && (
                    <p className="text-sm text-gray-600">By: {delivery.deliveryBoy}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Badge className={getStatusColor(delivery.status)}>
                  {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                </Badge>
                {delivery.time && (
                  <p className="text-sm text-gray-600 mt-1">{delivery.time}</p>
                )}
              </div>
              
              {userRole === 'owner' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange?.(delivery.id, 'delivered')}
                    className="text-green-600 hover:text-green-700"
                  >
                    Mark Delivered
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange?.(delivery.id, 'missed')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Mark Missed
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryHistory;
