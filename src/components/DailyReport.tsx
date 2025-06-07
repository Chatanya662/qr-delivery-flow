
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Package, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyDelivery {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_address: string;
  status: 'delivered' | 'missed';
  quantity_delivered: number;
  delivery_time: string;
  notes: string;
}

interface DailySummary {
  totalCustomers: number;
  deliveredCount: number;
  missedCount: number;
  totalQuantity: number;
  totalRevenue: number;
  deliveryRate: number;
}

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyDeliveries, setDailyDeliveries] = useState<DailyDelivery[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    totalCustomers: 0,
    deliveredCount: 0,
    missedCount: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    deliveryRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const pricePerLiter = 100;

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Fetch delivery records with customer data
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_records')
        .select(`
          id,
          customer_id,
          status,
          quantity_delivered,
          delivery_time,
          notes,
          customers!inner (
            name,
            address
          )
        `)
        .eq('delivery_date', dateStr)
        .order('delivery_time', { ascending: true });

      if (deliveryError) {
        console.error('Error fetching delivery records:', deliveryError);
        toast({
          title: "Error",
          description: "Failed to load daily report",
          variant: "destructive",
        });
        return;
      }

      // Transform data
      const deliveries: DailyDelivery[] = deliveryData?.map(record => ({
        id: record.id,
        customer_id: record.customer_id,
        customer_name: record.customers?.name || 'Unknown',
        customer_address: record.customers?.address || 'Unknown',
        status: record.status as 'delivered' | 'missed',
        quantity_delivered: record.quantity_delivered,
        delivery_time: record.delivery_time || '',
        notes: record.notes || ''
      })) || [];

      setDailyDeliveries(deliveries);

      // Calculate summary
      const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
      const missedCount = deliveries.filter(d => d.status === 'missed').length;
      const totalQuantity = deliveries.reduce((sum, d) => sum + (d.status === 'delivered' ? d.quantity_delivered : 0), 0);
      const totalRevenue = totalQuantity * pricePerLiter;
      const deliveryRate = deliveries.length > 0 ? (deliveredCount / deliveries.length) * 100 : 0;

      setDailySummary({
        totalCustomers: deliveries.length,
        deliveredCount,
        missedCount,
        totalQuantity,
        totalRevenue,
        deliveryRate
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load daily report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isFuture = selectedDate > new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not recorded';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Date Navigation Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Daily Delivery Report</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{formatDate(selectedDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              {!isToday && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateDate('next')}
                disabled={isFuture}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {isToday && (
            <Badge className="bg-blue-100 text-blue-800 w-fit">Today's Report</Badge>
          )}
          {isFuture && (
            <Badge className="bg-gray-100 text-gray-600 w-fit">Future Date</Badge>
          )}
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{dailySummary.totalCustomers}</div>
            <div className="text-xs text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{dailySummary.deliveredCount}</div>
            <div className="text-xs text-gray-600">Delivered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{dailySummary.missedCount}</div>
            <div className="text-xs text-gray-600">Missed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{dailySummary.totalQuantity}L</div>
            <div className="text-xs text-gray-600">Total Quantity</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">₹{dailySummary.totalRevenue}</div>
            <div className="text-xs text-gray-600">Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Delivery Success Rate</h3>
              <p className="text-sm text-gray-600">Percentage of successful deliveries</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                dailySummary.deliveryRate >= 90 ? 'text-green-600' :
                dailySummary.deliveryRate >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {dailySummary.deliveryRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {dailySummary.deliveredCount}/{dailySummary.totalCustomers} delivered
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Delivery List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading delivery data...</div>
          ) : dailyDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No delivery records found for this date</p>
              <p className="text-xs text-gray-400 mt-1">
                {isFuture ? 'This is a future date' : 'No deliveries were scheduled'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyDeliveries.map((delivery) => (
                <div 
                  key={delivery.id} 
                  className={`p-4 border rounded-lg ${
                    delivery.status === 'delivered' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{delivery.customer_name}</h3>
                        <Badge className={`${
                          delivery.status === 'delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {delivery.status === 'delivered' ? '✓ Delivered' : '✗ Missed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{delivery.customer_address}</p>
                      {delivery.notes && (
                        <p className="text-sm text-gray-700 italic">Note: {delivery.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {formatTime(delivery.delivery_time)}
                      </div>
                      {delivery.status === 'delivered' && delivery.quantity_delivered > 0 && (
                        <div className="mt-1">
                          <div className="text-lg font-bold text-green-600">
                            {delivery.quantity_delivered}L
                          </div>
                          <div className="text-sm text-green-600">
                            ₹{delivery.quantity_delivered * pricePerLiter}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReport;
