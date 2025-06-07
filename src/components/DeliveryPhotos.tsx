
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Eye, Download } from 'lucide-react';

interface DeliveryPhoto {
  id: string;
  date: string;
  photoUrl: string;
  takenBy: string;
  time: string;
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

  // Mock photos data
  const mockPhotos: DeliveryPhoto[] = [
    {
      id: '1',
      date: '2025-06-07',
      photoUrl: '/api/placeholder/300/200',
      takenBy: 'Raj Kumar',
      time: '08:30 AM'
    },
    {
      id: '2',
      date: '2025-06-06',
      photoUrl: '/api/placeholder/300/200',
      takenBy: 'Raj Kumar',
      time: '08:25 AM'
    },
    {
      id: '3',
      date: '2025-06-04',
      photoUrl: '/api/placeholder/300/200',
      takenBy: 'Raj Kumar',
      time: '08:35 AM'
    }
  ];

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
              {mockPhotos.map((photo) => (
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
                      src={photo.photoUrl}
                      alt={`Delivery ${photo.date}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{photo.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">By: {photo.takenBy}</p>
                      <p className="text-sm text-gray-600">Time: {photo.time}</p>
                    </div>
                    <Badge variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Badge>
                  </div>
                </div>
              ))}
              
              {mockPhotos.length === 0 && (
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
                      <p className="text-gray-600">{selectedPhoto.date} at {selectedPhoto.time}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={selectedPhoto.photoUrl}
                      alt={`Delivery ${selectedPhoto.date}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Taken by:</strong> {selectedPhoto.takenBy}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Customer:</strong> {customerName}
                    </p>
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
