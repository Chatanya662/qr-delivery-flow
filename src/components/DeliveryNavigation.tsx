import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, User, MapPin, Eye, Loader2, Phone, Image } from 'lucide-react';
import CameraCapture from './CameraCapture';
import CustomerBilling from './CustomerBilling';
import AttendanceStats from './AttendanceStats';
import DeliveryActionButtons from './DeliveryActionButtons';
import DeliveryPhotos from './DeliveryPhotos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  address: string;
  quantity: number;
  contact_number?: string;
}

interface DeliveryNavigationProps {
  customers: Customer[];
  userRole: 'delivery' | 'customer' | 'owner';
}

const DeliveryNavigation = ({ customers: propCustomers, userRole }: DeliveryNavigationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, { status: 'delivered' | 'missed', quantity?: number, photoUrl?: string }>>({});
  const [customers, setCustomers] = useState<Customer[]>(propCustomers);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (propCustomers.length === 0) {
      fetchCustomers();
    } else {
      setCustomers(propCustomers);
    }
    fetchTodayDeliveries();

    // Set up real-time subscription for customer updates and deletions
    const subscription = supabase
      .channel('customers-delivery-realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('Customer updated:', payload);
        setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new as Customer : c));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('Customer deleted:', payload.old.id);
        setCustomers(prev => {
          const filtered = prev.filter(c => c.id !== payload.old.id);
          // Reset current index if we deleted the current customer
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(filtered.length - 1);
          } else if (filtered.length === 0) {
            setCurrentIndex(0);
          }
          return filtered;
        });
        toast({
          title: "Customer Removed",
          description: "Customer has been deleted from the system",
        });
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'customers' 
      }, (payload) => {
        console.log('New customer added:', payload);
        setCustomers(prev => [...prev, payload.new as Customer]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [propCustomers, currentIndex]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_records')
        .select('customer_id, status, quantity_delivered, photo_url')
        .eq('delivery_date', today);

      if (error) {
        console.error('Error fetching today deliveries:', error);
        return;
      }

      if (data) {
        const statusMap: Record<string, { status: 'delivered' | 'missed', quantity?: number, photoUrl?: string }> = {};
        data.forEach(record => {
          statusMap[record.customer_id] = {
            status: record.status as 'delivered' | 'missed',
            quantity: record.quantity_delivered,
            photoUrl: record.photo_url
          };
        });
        setDeliveryStatus(statusMap);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveDeliveryRecord = async (quantity: number, status: 'delivered' | 'missed') => {
    try {
      const deliveryTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      const { error } = await supabase
        .from('delivery_records')
        .upsert({
          customer_id: currentCustomer.id,
          delivery_date: today,
          status,
          delivery_time: deliveryTime,
          delivered_by: 'Delivery Person',
          notes: status === 'delivered' ? `Delivered ${quantity} liter(s)` : 'Delivery missed',
          quantity_delivered: quantity
        }, {
          onConflict: 'customer_id,delivery_date'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Delivery ${status} recorded successfully${status === 'delivered' ? ` (${quantity}L)` : ''}`,
      });

      setDeliveryStatus(prev => ({ ...prev, [currentCustomer.id]: { status, quantity } }));

      if (status === 'delivered' && quantity !== currentCustomer.quantity) {
        const shouldUpdateRegular = confirm(`Would you like to update ${currentCustomer.name}'s regular quantity from ${currentCustomer.quantity}L to ${quantity}L for future deliveries?`);
        
        if (shouldUpdateRegular) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ quantity })
            .eq('id', currentCustomer.id);

          if (updateError) {
            console.error('Error updating customer quantity:', updateError);
            toast({
              title: "Warning",
              description: "Delivery recorded but failed to update regular quantity",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Updated",
              description: `Regular quantity updated to ${quantity}L`,
            });
          }
        }
      }

    } catch (error) {
      console.error('Error saving delivery record:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelivered = async (quantity: number) => {
    console.log(`Delivered ${quantity} liters to ${currentCustomer.name}`);
    await saveDeliveryRecord(quantity, 'delivered');
    
    if (currentIndex < customers.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
    }
  };

  const handleMissed = async () => {
    console.log(`Missed delivery for ${currentCustomer.name}`);
    await saveDeliveryRecord(0, 'missed');
    
    if (currentIndex < customers.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
    }
  };

  const handlePhotoTaken = async (photoData: string, status: 'delivered' | 'missed') => {
    console.log(`Photo taken for ${currentCustomer.name}:`, photoData);
    console.log(`Delivery status: ${status}`);
    
    try {
      const deliveryTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      const { error } = await supabase
        .from('delivery_records')
        .upsert({
          customer_id: currentCustomer.id,
          delivery_date: today,
          status,
          delivery_time: deliveryTime,
          photo_url: photoData,
          delivered_by: 'Delivery Person',
          notes: status === 'delivered' ? 'Successfully delivered with photo' : 'Delivery missed - photo taken',
          quantity_delivered: status === 'delivered' ? currentCustomer.quantity : 0
        }, {
          onConflict: 'customer_id,delivery_date'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Delivery ${status} with photo recorded successfully`,
      });

    } catch (error) {
      console.error('Error saving delivery record:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery record",
        variant: "destructive",
      });
    }
    
    setDeliveryStatus(prev => ({ 
      ...prev, 
      [currentCustomer.id]: { 
        status, 
        quantity: status === 'delivered' ? currentCustomer.quantity : 0,
        photoUrl: photoData
      } 
    }));
    setShowCamera(false);
    
    if (currentIndex < customers.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
    }
  };

  const generateBillingData = () => {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    
    const deliveredDays = Math.floor(Math.random() * 25) + 20;
    const missedDays = daysInMonth - deliveredDays;
    const pricePerLiter = 100;
    const totalAmount = deliveredDays * pricePerLiter * currentCustomer.quantity;

    return {
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      month,
      year,
      pricePerLiter,
      deliveredDays,
      missedDays,
      totalDays: daysInMonth,
      totalAmount,
      quantity: currentCustomer.quantity
    };
  };

  const currentCustomer = customers[currentIndex];

  const handleNext = () => {
    if (currentIndex < customers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading customers...</span>
      </div>
    );
  }

  if (!currentCustomer || customers.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No customers available</p>
      </div>
    );
  }

  const customerStatus = deliveryStatus[currentCustomer.id];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Customer Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer {currentIndex + 1} of {customers.length}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                disabled={currentIndex === customers.length - 1}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800">{currentCustomer.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{currentCustomer.address}</span>
            </div>
            {currentCustomer.contact_number && (
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{currentCustomer.contact_number}</span>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Regular Quantity:</span> {currentCustomer.quantity} Liter(s)
            </div>
          </div>

          {/* Today's Delivery Status */}
          {customerStatus && (
            <div className={`p-3 rounded-lg ${
              customerStatus.status === 'delivered' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${
                customerStatus.status === 'delivered' 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div>Status: {customerStatus.status === 'delivered' 
                      ? `Delivered ✓` 
                      : 'Missed ✗'}
                    </div>
                    {customerStatus.status === 'delivered' && customerStatus.quantity && (
                      <div className="text-sm mt-1">
                        Today's Delivery: {customerStatus.quantity} Liter(s) 
                        <span className="ml-2 text-green-600">
                          (₹{customerStatus.quantity * 100})
                        </span>
                      </div>
                    )}
                  </div>
                  {customerStatus.photoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPhotos(true)}
                      className="ml-2"
                    >
                      <Image className="w-4 h-4 mr-1" />
                      View Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {userRole === 'delivery' && (
            <DeliveryActionButtons
              onDelivered={handleDelivered}
              onMissed={handleMissed}
              onTakePhoto={() => setShowCamera(true)}
              defaultQuantity={currentCustomer.quantity}
              isDelivered={customerStatus?.status === 'delivered'}
              isMissed={customerStatus?.status === 'missed'}
            />
          )}

          {/* View Options */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowBilling(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Bill
            </Button>
            <Button 
              onClick={() => setShowStats(true)}
              variant="outline"
              className="flex-1"
            >
              📊 Attendance
            </Button>
            <Button 
              onClick={() => setShowPhotos(true)}
              variant="outline"
              className="flex-1"
            >
              <Image className="w-4 h-4 mr-2" />
              Photos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onPhotoTaken={handlePhotoTaken}
          deliveryDate={today}
          customerName={currentCustomer.name}
          customerAddress={currentCustomer.address}
          customerId={currentCustomer.id}
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
            <CustomerBilling billingData={generateBillingData()} />
          </div>
        </div>
      )}

      {/* Attendance Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowStats(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg z-10"
            >
              ×
            </Button>
            <AttendanceStats 
              customerId={currentCustomer.id}
              customerName={currentCustomer.name}
            />
          </div>
        </div>
      )}

      {/* Delivery Photos Modal */}
      {showPhotos && (
        <DeliveryPhotos
          isOpen={showPhotos}
          onClose={() => setShowPhotos(false)}
          customerId={currentCustomer.id}
          customerName={currentCustomer.name}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default DeliveryNavigation;
