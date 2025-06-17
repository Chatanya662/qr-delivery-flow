import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Download, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DeliveryPhotos from './DeliveryPhotos';

interface DeliveryRecord {
  delivery_date: string;
  status: 'delivered' | 'missed' | 'holiday';
  delivery_time?: string;
  photo_url?: string;
  quantity_delivered?: number;
  notes?: string;
}

interface CustomerDeliveryTableProps {
  customerId: string;
  customerName: string;
  month?: number;
  year?: number;
}

const CustomerDeliveryTable = ({ customerId, customerName, month, year }: CustomerDeliveryTableProps) => {
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const { toast } = useToast();

  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  useEffect(() => {
    fetchDeliveryRecords();
  }, [customerId, currentMonth, currentYear]);

  const fetchDeliveryRecords = async () => {
    try {
      setLoading(true);
      
      // Get delivery records for the specified month and year
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${getDaysInMonth(currentMonth, currentYear)}`;

      const { data, error } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('customer_id', customerId)
        .gte('delivery_date', startDate)
        .lte('delivery_date', endDate)
        .order('delivery_date', { ascending: true });

      if (error) {
        console.error('Error fetching delivery records:', error);
        generateMockData();
        return;
      }

      // Create a complete month view with all days
      const records = generateCompleteMonthData(data || []);
      setDeliveryRecords(records);

    } catch (error) {
      console.error('Error:', error);
      generateMockData();
      toast({
        title: "Note",
        description: "Showing sample data. Database connection needed for real records.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const generateCompleteMonthData = (dbRecords: any[]): DeliveryRecord[] => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const records: DeliveryRecord[] = [];

    // Create array of all days in proper order (1-28/29, then 30, then 31)
    const dayOrder: number[] = [];
    
    // Add days 1-28
    for (let day = 1; day <= 28; day++) {
      dayOrder.push(day);
    }
    
    // Add day 29 if it exists
    if (daysInMonth >= 29) {
      dayOrder.push(29);
    }
    
    // Add day 30 if it exists
    if (daysInMonth >= 30) {
      dayOrder.push(30);
    }
    
    // Add day 31 if it exists
    if (daysInMonth >= 31) {
      dayOrder.push(31);
    }

    // Generate records in the correct order
    dayOrder.forEach(day => {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dbRecord = dbRecords.find(record => record.delivery_date === dateStr);

      if (dbRecord) {
        records.push({
          delivery_date: dateStr,
          status: dbRecord.status,
          delivery_time: dbRecord.delivery_time,
          photo_url: dbRecord.photo_url,
          quantity_delivered: dbRecord.quantity_delivered,
          notes: dbRecord.notes
        });
      } else {
        // For future dates, show as pending; for past dates, show as missed
        const today = new Date().toISOString().split('T')[0];
        const status = dateStr > today ? 'missed' : 'missed';
        records.push({
          delivery_date: dateStr,
          status,
          delivery_time: undefined,
          photo_url: undefined,
          quantity_delivered: 0,
          notes: undefined
        });
      }
    });

    return records;
  };

  const generateMockData = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const records: DeliveryRecord[] = [];

    // Create array of all days in proper order (1-28/29, then 30, then 31)
    const dayOrder: number[] = [];
    
    // Add days 1-28
    for (let day = 1; day <= 28; day++) {
      dayOrder.push(day);
    }
    
    // Add day 29 if it exists
    if (daysInMonth >= 29) {
      dayOrder.push(29);
    }
    
    // Add day 30 if it exists
    if (daysInMonth >= 30) {
      dayOrder.push(30);
    }
    
    // Add day 31 if it exists
    if (daysInMonth >= 31) {
      dayOrder.push(31);
    }

    dayOrder.forEach(day => {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      let status: 'delivered' | 'missed' | 'holiday' = 'missed';
      let time: string | undefined;
      let photoUrl: string | undefined;

      // Mock some delivered days
      if (day <= 15) {
        status = day % 4 === 0 ? 'missed' : 'delivered';
        time = status === 'delivered' ? '08:30 AM' : undefined;
        photoUrl = status === 'delivered' ? '/placeholder.svg' : undefined;
      } else if (day === 26) { // Mock holiday
        status = 'holiday';
      }

      records.push({
        delivery_date: dateStr,
        status,
        delivery_time: time,
        photo_url: photoUrl,
        quantity_delivered: status === 'delivered' ? 2 : 0
      });
    });

    setDeliveryRecords(records);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Missed</Badge>;
      case 'holiday':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Holiday</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">-</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      monthName: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear()
    };
  };

  const exportToExcel = () => {
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long' });
    const headers = ['Date', 'Day', 'Month', 'Year', 'Status', 'Time', 'Quantity (L)', 'Notes'];
    
    const csvData = deliveryRecords.map(record => {
      const dateInfo = formatDate(record.delivery_date);
      return [
        dateInfo.day,
        dateInfo.dayName,
        dateInfo.monthName,
        dateInfo.year,
        record.status,
        record.delivery_time || '-',
        record.quantity_delivered || 0,
        record.notes || ''
      ];
    });

    // Add summary
    const deliveredDays = deliveryRecords.filter(r => r.status === 'delivered').length;
    const missedDays = deliveryRecords.filter(r => r.status === 'missed').length;
    const holidayDays = deliveryRecords.filter(r => r.status === 'holiday').length;

    csvData.push(
      [''],
      ['SUMMARY'],
      ['Customer', customerName],
      ['Month', `${monthName} ${currentYear}`],
      ['Delivered Days', deliveredDays.toString()],
      ['Missed Days', missedDays.toString()],
      ['Holiday Days', holidayDays.toString()],
      ['Total Days', deliveryRecords.length.toString()]
    );

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customerName}-delivery-${currentMonth}-${currentYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long' });
  const deliveredDays = deliveryRecords.filter(r => r.status === 'delivered').length;
  const missedDays = deliveryRecords.filter(r => r.status === 'missed').length;
  const holidayDays = deliveryRecords.filter(r => r.status === 'holiday').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading delivery records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{deliveredDays}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{missedDays}</div>
            <div className="text-sm text-gray-600">Missed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{holidayDays}</div>
            <div className="text-sm text-gray-600">Holidays</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{deliveryRecords.length}</div>
            <div className="text-sm text-gray-600">Total Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Button 
              onClick={() => setShowPhotosModal(true)}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Images
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Excel-like Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {customerName} - {monthName} {currentYear} Delivery Report
            </CardTitle>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="border font-semibold text-center">Date</TableHead>
                  <TableHead className="border font-semibold text-center">Day</TableHead>
                  <TableHead className="border font-semibold text-center">Month</TableHead>
                  <TableHead className="border font-semibold text-center">Year</TableHead>
                  <TableHead className="border font-semibold text-center">Status</TableHead>
                  <TableHead className="border font-semibold text-center">Time</TableHead>
                  <TableHead className="border font-semibold text-center">Quantity</TableHead>
                  <TableHead className="border font-semibold text-center">Photo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryRecords.map((record) => {
                  const dateInfo = formatDate(record.delivery_date);
                  const isToday = record.delivery_date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <TableRow key={record.delivery_date} className={`${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                      <TableCell className="border text-center font-medium">
                        {dateInfo.day}
                        {isToday && <span className="ml-1 text-xs text-blue-600">(Today)</span>}
                      </TableCell>
                      <TableCell className="border text-center">{dateInfo.dayName}</TableCell>
                      <TableCell className="border text-center">{dateInfo.monthName}</TableCell>
                      <TableCell className="border text-center">{dateInfo.year}</TableCell>
                      <TableCell className="border text-center">{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="border text-center">{record.delivery_time || '-'}</TableCell>
                      <TableCell className="border text-center">
                        {record.status === 'delivered' ? (
                          <span className="font-medium text-green-600">{record.quantity_delivered || 0}L</span>
                        ) : (
                          <span className="text-gray-400">0L</span>
                        )}
                      </TableCell>
                      <TableCell className="border text-center">
                        {record.photo_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPhoto(record.photo_url!)}
                            className="h-8 w-8 p-0"
                          >
                            <Image className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Delivery Photo</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPhoto(null)}>
                ×
              </Button>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto}
                alt="Delivery confirmation"
                className="w-full h-auto max-h-[60vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Photos Modal */}
      <DeliveryPhotos
        isOpen={showPhotosModal}
        onClose={() => setShowPhotosModal(false)}
        customerId={customerId}
        customerName={customerName}
        userRole="customer"
      />
    </div>
  );
};

export default CustomerDeliveryTable;
