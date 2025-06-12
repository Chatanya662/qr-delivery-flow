
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import DeliveryPhotos from './DeliveryPhotos';

interface QRScannerProps {
  userRole: 'customer' | 'delivery' | 'owner';
  onScanComplete: (customerId: string, status: string) => void;
}

const QRScanner = ({ userRole, onScanComplete }: QRScannerProps) => {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const handleScan = () => {
    if (!qrInput.trim()) {
      setScanResult({ success: false, message: 'Please enter a QR code' });
      return;
    }

    // Simulate QR scan processing
    const customerId = qrInput.trim();
    const customerName = `Customer ${customerId}`;
    
    if (userRole === 'delivery') {
      onScanComplete(customerId, 'delivered');
      setScanResult({ 
        success: true, 
        message: `Delivery marked as completed for ${customerName}` 
      });
    } else {
      onScanComplete(customerId, 'view');
      setScanResult({ 
        success: true, 
        message: `Viewing delivery history for ${customerName}` 
      });
    }

    setTimeout(() => {
      setScanResult(null);
      setQrInput('');
    }, 3000);
  };

  const handleViewPhotos = () => {
    if (qrInput.trim()) {
      setSelectedCustomerId(qrInput.trim());
      setShowPhotos(true);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <QrCode className="w-12 h-12 mx-auto mb-2 text-blue-500" />
          <CardTitle>
            {userRole === 'delivery' ? 'Scan to Mark Delivery' : 'Scan to View History'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter QR code or Customer ID"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="text-center text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleScan}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!qrInput.trim()}
            >
              {userRole === 'delivery' ? 'Mark as Delivered' : 'View History'}
            </Button>
            
            {userRole === 'owner' && (
              <Button 
                onClick={handleViewPhotos}
                variant="outline"
                className="w-full"
                disabled={!qrInput.trim()}
              >
                <Camera className="w-4 h-4 mr-2" />
                View Delivery Photos
              </Button>
            )}
          </div>

          {scanResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              scanResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{scanResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Photos Modal */}
      {showPhotos && selectedCustomerId && (
        <DeliveryPhotos
          isOpen={showPhotos}
          onClose={() => setShowPhotos(false)}
          customerId={selectedCustomerId}
          customerName={`Customer ${selectedCustomerId}`}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default QRScanner;
