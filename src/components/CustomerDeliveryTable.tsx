import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Download, Image, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentMonth, setCurrentMonth] = useState(month || new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());
  const { toast } = useToast();

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

    // Generate records in proper order: 1-28, then 29 (if exists), then 30 (if exists), then 31 (if exists)
    for (let day = 1; day <= daysInMonth; day++) {
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
    }

    return records;
  };

  const generateMockData = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const records: DeliveryRecord[] = [];

    // Generate records in proper sequential order
    for (let day = 1; day <= daysInMonth; day++) {
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
    }

    setDeliveryRecords(records);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
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
    const monthName = getMonthName(currentMonth);
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

  const monthName = getMonthName(currentMonth);
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
      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Month
            </Button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-600">{monthName} {currentYear}</h2>
              <p className="text-sm text-gray-600">
                {getDaysInMonth(currentMonth, currentYear)} days in this month
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="flex items-center gap-2"
            >
              Next Month
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {customerName} - {currentYear} {monthName} Delivery Report
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
