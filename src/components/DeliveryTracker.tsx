import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Camera, Eye, DollarSign, Loader2 } from 'lucide-react';
import CameraCapture from './CameraCapture';
import DeliveryPhotos from './DeliveryPhotos';
import CustomerBilling from './CustomerBilling';
import AttendanceStats from './AttendanceStats';
import TodayDeliveryStatus from './TodayDeliveryStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryRecord {
  date: string;
  status: 'delivered' | 'missed' | 'holiday';
  time?: string;
  photoId?: string;
  quantity?: number;
}

interface DeliveryTrackerProps {
  customerId: string;
  customerName: string;
  userRole: 'customer' | 'delivery' | 'owner';
}

const DeliveryTracker = ({ customerId, customerName, userRole }: DeliveryTrackerProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [deliveryData, setDeliveryData] = useState<DeliveryRecord[]>([]);
  const [customerQuantity, setCustomerQuantity] = useState(2);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomerData();
    fetchDeliveryRecords();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('quantity')
        .eq('id', customerId)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        return;
      }

      if (data) {
        setCustomerQuantity(data.quantity);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDeliveryRecords = async () => {
    try {
      setLoading(true);
      
      // Get current month data
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('customer_id', customerId)
        .gte('delivery_date', startOfMonth)
        .lte('delivery_date', endOfMonth)
        .order('delivery_date', { ascending: false }); // Order by date descending (newest first)

      if (error) {
        console.error('Error fetching delivery records:', error);
        // Generate mock data if database fetch fails
        setDeliveryData(generateMonthData());
        return;
      }

      // Convert database records to DeliveryRecord format
      const records: DeliveryRecord[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = daysInMonth; day >= 1; day--) { // Start from last day and go backwards
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dbRecord = data.find(record => record.delivery_date === dateStr);
        
        if (dbRecord) {
          records.push({
            date: dateStr,
            status: dbRecord.status as 'delivered' | 'missed' | 'holiday',
            time: dbRecord.delivery_time || undefined,
            photoId: dbRecord.photo_url ? dbRecord.id : undefined,
            quantity: dbRecord.quantity_delivered || 0
          });
        } else {
          // Default to missed for days without records (except future dates)
          const today = new Date().toISOString().split('T')[0];
          const status = dateStr > today ? 'missed' : 'missed';
          records.push({
            date: dateStr,
            status,
            time: undefined,
            quantity: 0
          });
        }
      }

      setDeliveryData(records);
    } catch (error) {
      console.error('Error:', error);
      // Fallback to mock data
      setDeliveryData(generateMonthData());
      toast({
        title: "Note",
        description: "Showing sample data. Connect to database for real records.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate current month data (fallback for demo) - sorted by date descending
  const generateMonthData = (): DeliveryRecord[] => {
    const daysInMonth = 30; // June has 30 days
    const records: DeliveryRecord[] = [];
    
    for (let day = daysInMonth; day >= 1; day--) { // Start from last day
      const date = `2025-06-${day.toString().padStart(2, '0')}`;
      let status: DeliveryRecord['status'] = 'missed';
      let time: string | undefined;
      
      // Mock some delivered days
      if (day <= 7) { // First week mostly delivered
        status = day === 5 ? 'missed' : 'delivered';
        time = status === 'delivered' ? '08:30 AM' : undefined;
      } else if (day === 15) { // Holiday
        status = 'holiday';
      } else if (day % 3 === 0) { // Some random deliveries
        status = 'delivered';
        time = '08:25 AM';
      }
      
      records.push({ date, status, time });
    }
    
    return records;
  };

  const deliveredDays = deliveryData.filter(record => record.status === 'delivered').length;
  const missedDays = deliveryData.filter(record => record.status === 'missed').length;

  const pricePerLiter = 100;
  const totalAmount = deliveryData
    .filter(record => record.status === 'delivered')
    .reduce((sum, record) => sum + (record.quantity || customerQuantity) * pricePerLiter, 0);

  const billingData = {
    customerId,
    customerName,
    month: 'June',
    year: 2025,
    pricePerLiter,
    deliveredDays,
    missedDays,
    totalDays: 30,
    totalAmount,
    quantity: customerQuantity
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">✓</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-800">✗</Badge>;
      case 'holiday':
        return <Badge className="bg-gray-100 text-gray-800">H</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">-</Badge>;
    }
  };

  const handleTakePhoto = (date: string) => {
    setSelectedDate(date);
    setShowCamera(true);
  };

  const handlePhotoTaken = async (photoData: string, status: 'delivered' | 'missed') => {
    console.log(`Photo taken for ${selectedDate}:`, photoData);
    console.log(`Delivery status: ${status}`);
    
    // Save delivery record to database
    try {
      const deliveryTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      const { error } = await supabase
        .from('delivery_records')
        .upsert({
          customer_id: customerId,
          delivery_date: selectedDate,
          status,
          delivery_time: deliveryTime,
          photo_url: photoData,
          delivered_by: 'Delivery Person',
          notes: status === 'delivered' ? 'Successfully delivered' : 'Delivery missed'
        }, {
          onConflict: 'customer_id,delivery_date'
        });

      if (error) {
        throw error;
      }

      setShowCamera(false);
      
      // Refresh delivery records to show updated data
      fetchDeliveryRecords();
      
      toast({
        title: "Success",
        description: `Delivery ${status} recorded successfully`,
      });

    } catch (error) {
      console.error('Error saving delivery record:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery record",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const headers = ['Date', 'Day', 'Status', 'Time', 'Notes'];
    const csvData = deliveryData.map(record => {
      const date = new Date(record.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return [
        record.date,
        dayName,
        record.status,
        record.time || '-',
        record.status === 'holiday' ? 'Public Holiday' : ''
      ];
    });

    // Add billing summary at the end
    csvData.push(
      [''],
      ['BILLING SUMMARY'],
      ['Customer Name', customerName],
      ['Quantity per Day', `${customerQuantity} Liter(s)`],
      ['Price per Liter', `₹${pricePerLiter}`],
      ['Days Delivered', deliveredDays.toString()],
      ['Days Missed', missedDays.toString()],
      ['Total Amount', `₹${totalAmount}`]
    );

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-report-${customerName}-June2025.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading delivery data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Delivery Status */}
      <TodayDeliveryStatus 
        customerId={customerId}
        customerName={customerName}
      />

      {/* Attendance Statistics */}
      <AttendanceStats 
        customerId={customerId}
        customerName={customerName}
      />

      {/* Main Delivery Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {customerName} - June 2025 Delivery Report
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button 
                onClick={() => setShowPhotos(true)} 
                variant="outline" 
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Photos
              </Button>
              <Button 
                onClick={() => setShowBilling(true)} 
                variant="outline" 
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Monthly Bill
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Amount</TableHead>
                  {userRole === 'delivery' && <TableHead>Photo</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryData.map((record) => {
                  const date = new Date(record.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const isToday = record.date === '2025-06-07';
                  const quantity = record.quantity || (record.status === 'delivered' ? customerQuantity : 0);
                  const dailyAmount = record.status === 'delivered' ? pricePerLiter * quantity : 0;
                  
                  return (
                    <TableRow key={record.date} className={isToday ? 'bg-blue-50' : ''}>
                      <TableCell className="font-medium">
                        {date.getDate()}
                        {isToday && <span className="ml-2 text-xs text-blue-600">(Today)</span>}
                      </TableCell>
                      <TableCell>{dayName}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.status === 'delivered' ? (
                          <span className="font-medium text-green-600">{quantity}L</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{record.time || '-'}</TableCell>
                      <TableCell>
                        {dailyAmount > 0 ? (
                          <span className="font-medium text-green-600">₹{dailyAmount}</span>
                        ) : (
                          <span className="text-gray-400">₹0</span>
                        )}
                      </TableCell>
                      {userRole === 'delivery' && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTakePhoto(record.date)}
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onPhotoTaken={handlePhotoTaken}
          deliveryDate={selectedDate}
          customerName={customerName}
          customerAddress="Mock address for camera capture"
          customerId={customerId}
        />
      )}

      {/* Photos Modal */}
      {showPhotos && (
        <DeliveryPhotos
          isOpen={showPhotos}
          onClose={() => setShowPhotos(false)}
          customerId={customerId}
          customerName={customerName}
          userRole={userRole}
        />
      )}

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBilling(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg z-10"
            >
              ×
            </Button>
            <CustomerBilling billingData={billingData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracker;
