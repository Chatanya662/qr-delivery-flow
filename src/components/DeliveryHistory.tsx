
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Package, Search, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryRecord {
  id: string;
  delivery_date: string;
  delivery_time: string | null;
  status: string;
  quantity_delivered: number;
  notes: string | null;
  photo_url: string | null;
  delivered_by: string | null;
}

interface DeliveryHistoryProps {
  customerId: string;
}

const DeliveryHistory = ({ customerId }: DeliveryHistoryProps) => {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
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
    fetchDeliveries();
  }, [customerId]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('customer_id', customerId)
        .order('delivery_date', { ascending: false });

      if (error) {
        console.error('Error fetching deliveries:', error);
        toast({
          title: "Error",
          description: "Failed to load delivery history",
          variant: "destructive",
        });
        return;
      }

      setDeliveries(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading delivery history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group deliveries by month and year
  const groupedDeliveries = deliveries.reduce((groups, delivery) => {
    const date = new Date(delivery.delivery_date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    
    if (!groups[key]) {
      groups[key] = {
        month,
        year,
        deliveries: [],
        delivered: 0,
        missed: 0
      };
    }
    
    groups[key].deliveries.push(delivery);
    if (delivery.status === 'delivered') {
      groups[key].delivered++;
    } else {
      groups[key].missed++;
    }
    
    return groups;
  }, {} as Record<string, { month: number; year: number; deliveries: DeliveryRecord[]; delivered: number; missed: number }>);

  // Sort months by year and month (newest first)
  const sortedMonths = Object.keys(groupedDeliveries).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    
    if (yearA !== yearB) {
      return yearB - yearA; // Newer year first
    }
    return monthB - monthA; // Newer month first
  });

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.delivery_date.includes(searchTerm) ||
    delivery.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (delivery.notes && delivery.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (delivery.delivered_by && delivery.delivered_by.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading delivery history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Delivery History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by date, status, notes, or delivery person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <div className="space-y-4">
        {sortedMonths.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500">No delivery records found</p>
                <p className="text-sm text-gray-400">Delivery history will appear here once deliveries are made</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedMonths.map((monthKey) => {
            const monthData = groupedDeliveries[monthKey];
            const monthFormatted = formatMonthWithDays(monthData.month, monthData.year);
            const isExpanded = expandedMonth === monthKey;
            const successRate = ((monthData.delivered / (monthData.delivered + monthData.missed)) * 100).toFixed(1);

            return (
              <Card key={monthKey}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{monthFormatted}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {monthData.delivered} delivered • {monthData.missed} missed • {successRate}% success rate
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                    >
                      {isExpanded ? (
                        <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Show <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      {monthData.deliveries
                        .sort((a, b) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime())
                        .map((delivery) => (
                        <div key={delivery.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-medium">
                                  {new Date(delivery.delivery_date).toLocaleDateString()}
                                </p>
                                {delivery.delivery_time && (
                                  <p className="text-sm text-gray-600">
                                    {delivery.delivery_time}
                                  </p>
                                )}
                                <Badge variant={delivery.status === 'delivered' ? 'default' : 'destructive'}>
                                  {delivery.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-medium ml-1">{delivery.quantity_delivered}L</span>
                                </div>
                                {delivery.delivered_by && (
                                  <div>
                                    <span className="text-gray-600">Delivered by:</span>
                                    <span className="font-medium ml-1">{delivery.delivered_by}</span>
                                  </div>
                                )}
                              </div>
                              {delivery.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Notes:</span> {delivery.notes}
                                </p>
                              )}
                            </div>
                            {delivery.photo_url && (
                              <div className="ml-4">
                                <Button variant="outline" size="sm">
                                  <Image className="w-4 h-4 mr-1" />
                                  Photo
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory;
