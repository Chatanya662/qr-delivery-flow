
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Camera, Eye, DollarSign } from 'lucide-react';
import CameraCapture from './CameraCapture';
import DeliveryPhotos from './DeliveryPhotos';
import CustomerBilling from './CustomerBilling';

interface DeliveryRecord {
  date: string;
  status: 'delivered' | 'missed' | 'holiday';
  time?: string;
  photoId?: string;
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

  // Generate current month data (June 2025)
  const generateMonthData = (): DeliveryRecord[] => {
    const daysInMonth = 30; // June has 30 days
    const records: DeliveryRecord[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
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

  const deliveryData = generateMonthData();
  const deliveredDays = deliveryData.filter(record => record.status === 'delivered').length;
  const missedDays = deliveryData.filter(record => record.status === 'missed').length;

  // Mock customer data for billing
  const customerQuantity = 2; // liters per day
  const pricePerLiter = 100;
  const totalAmount = deliveredDays * pricePerLiter * customerQuantity;

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

  const handlePhotoTaken = (photoData: string, status: 'delivered' | 'missed') => {
    console.log(`Photo taken for ${selectedDate}:`, photoData);
    console.log(`Delivery status: ${status}`);
    setShowCamera(false);
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
      ['Days Delivered', deliveredDays],
      ['Days Missed', missedDays],
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{deliveredDays}</div>
              <div className="text-sm text-gray-600">Days Delivered</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{missedDays}</div>
              <div className="text-sm text-gray-600">Days Missed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {((deliveredDays / 30) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{totalAmount}</div>
              <div className="text-sm text-gray-600">Monthly Bill</div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  const dailyAmount = record.status === 'delivered' ? pricePerLiter * customerQuantity : 0;
                  
                  return (
                    <TableRow key={record.date} className={isToday ? 'bg-blue-50' : ''}>
                      <TableCell className="font-medium">
                        {date.getDate()}
                        {isToday && <span className="ml-2 text-xs text-blue-600">(Today)</span>}
                      </TableCell>
                      <TableCell>{dayName}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
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
                          {record.status === 'delivered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTakePhoto(record.date)}
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          )}
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
