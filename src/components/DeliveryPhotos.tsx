
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Eye, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryPhoto {
  id: string;
  delivery_date: string;
  photo_url: string;
  delivered_by: string;
  delivery_time: string;
  status: string;
  notes?: string;
}

interface DeliveryPhotosProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  userRole: 'customer' | 'delivery' | 'owner';
}

const DeliveryPhotos = ({ isOpen, onClose, customerId, customerName, userRole }: DeliveryPhotosProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<DeliveryPhoto | null>(null);
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customerId) {
      fetchDeliveryPhotos();
    }
  }, [isOpen, customerId]);

  const fetchDeliveryPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'delivered')
        .not('photo_url', 'is', null)
        .order('delivery_date', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
        toast({
          title: "Error",
          description: "Failed to load delivery photos",
          variant: "destructive",
        });
        return;
      }

      const formattedPhotos: DeliveryPhoto[] = data.map(record => ({
        id: record.id,
        delivery_date: record.delivery_date,
        photo_url: record.photo_url,
        delivered_by: record.delivered_by || 'Delivery Person',
        delivery_time: record.delivery_time || '08:00',
        status: record.status,
        notes: record.notes
      }));

      setPhotos(formattedPhotos);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while loading photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (photoUrl: string, date: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-photo-${date}.jpg`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the photo",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Delivery Photos - {customerName}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[70vh]">
            {/* Photo List */}
            <div className="border-r overflow-y-auto p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-4">Recent Photos</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading photos...</span>
                </div>
              ) : photos.length > 0 ? (
                photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPhoto?.id === photo.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={photo.photo_url}
                        alt={`Delivery ${photo.delivery_date}`}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/64/64';
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {new Date(photo.delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">By: {photo.delivered_by}</p>
                        <p className="text-sm text-gray-600">Time: {photo.delivery_time}</p>
                        {photo.notes && (
                          <p className="text-xs text-gray-500 mt-1">{photo.notes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Eye className="w-3 h-3 mr-1" />
                        Delivered
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No delivery photos yet</p>
                  <p className="text-sm">Photos will appear here after deliveries</p>
                </div>
              )}
            </div>

            {/* Photo Viewer */}
            <div className="p-4 flex flex-col">
              {selectedPhoto ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Delivery Photo</h3>
                      <p className="text-gray-600">
                        {new Date(selectedPhoto.delivery_date).toLocaleDateString()} at {selectedPhoto.delivery_time}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadPhoto(selectedPhoto.photo_url, selectedPhoto.delivery_date)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={selectedPhoto.photo_url}
                      alt={`Delivery ${selectedPhoto.delivery_date}`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/400/300';
                      }}
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Taken by:</strong> {selectedPhoto.delivered_by}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Customer:</strong> {customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> <span className="text-green-600 font-medium">Delivered</span>
                    </p>
                    {selectedPhoto.notes && (
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {selectedPhoto.notes}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a photo to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryPhotos;
