
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TodayDeliveryStatusProps {
  customerId: string;
  customerName: string;
}

interface TodayDelivery {
  status: 'delivered' | 'missed';
  quantity_delivered: number;
  delivery_time: string;
  notes: string;
}

const TodayDeliveryStatus = ({ customerId, customerName }: TodayDeliveryStatusProps) => {
  const [todayDelivery, setTodayDelivery] = useState<TodayDelivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayDelivery();

    // Set up real-time subscription for delivery record updates
    const subscription = supabase
      .channel('delivery-records-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'delivery_records',
        filter: `customer_id=eq.${customerId}`
      }, (payload) => {
        console.log('Real-time delivery update:', payload);
        const today = new Date().toISOString().split('T')[0];
        if (payload.new && (payload.new as any).delivery_date === today) {
          const newRecord = payload.new as any;
          setTodayDelivery({
            status: newRecord.status as 'delivered' | 'missed',
            quantity_delivered: newRecord.quantity_delivered,
            delivery_time: newRecord.delivery_time || '',
            notes: newRecord.notes || ''
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [customerId]);

  const fetchTodayDelivery = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('delivery_records')
        .select('status, quantity_delivered, delivery_time, notes')
        .eq('customer_id', customerId)
        .eq('delivery_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today delivery:', error);
        return;
      }

      if (data) {
        setTodayDelivery({
          status: data.status as 'delivered' | 'missed',
          quantity_delivered: data.quantity_delivered,
          delivery_time: data.delivery_time || '',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading today's delivery status...</div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const pricePerLiter = 100;
  const totalAmount = todayDelivery?.quantity_delivered ? todayDelivery.quantity_delivered * pricePerLiter : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Delivery Status
        </CardTitle>
        <p className="text-sm text-gray-600">{today}</p>
      </CardHeader>
      <CardContent>
        {todayDelivery ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <Badge 
                className={`text-lg px-4 py-2 ${
                  todayDelivery.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {todayDelivery.status === 'delivered' ? '✓ Delivered' : '✗ Missed'}
              </Badge>
              {todayDelivery.delivery_time && (
                <span className="text-sm text-gray-600">
                  at {todayDelivery.delivery_time}
                </span>
              )}
            </div>

            {/* Quantity and Amount */}
            {todayDelivery.status === 'delivered' && todayDelivery.quantity_delivered > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {todayDelivery.quantity_delivered}L
                  </div>
                  <div className="text-xs text-gray-600">Quantity Delivered</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <IndianRupee className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    ₹{totalAmount}
                  </div>
                  <div className="text-xs text-gray-600">Amount (₹{pricePerLiter}/L)</div>
                </div>
              </div>
            )}

            {/* Notes */}
            {todayDelivery.notes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Note:</span> {todayDelivery.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">No delivery record for today</p>
            <p className="text-xs text-gray-400 mt-1">
              Delivery status will appear here once updated by delivery person
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayDeliveryStatus;
