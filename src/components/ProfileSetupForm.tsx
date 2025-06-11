
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, MapPin, Package, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileSetupFormProps {
  userId: string;
  userEmail: string;
  onProfileCreated: () => void;
}

const ProfileSetupForm = ({ userId, userEmail, onProfileCreated }: ProfileSetupFormProps) => {
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update the user's profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          contact_number: contactNumber.trim(),
          address: address.trim(),
        })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Create a customer record linked to the profile
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          address: address.trim(),
          quantity: parseInt(quantity),
          contact_number: contactNumber.trim(),
          profile_id: userId,
        });

      if (customerError) {
        throw customerError;
      }

      toast({
        title: "Success",
        description: "Your delivery profile has been set up successfully!",
      });

      onProfileCreated();
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast({
        title: "Error",
        description: "Failed to set up your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <User className="w-8 h-8 text-blue-500" />
        </div>
        <CardTitle className="text-xl">Complete Your Delivery Profile</CardTitle>
        <p className="text-gray-600">
          Please provide your delivery details to start receiving milk deliveries
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Contact Number
            </label>
            <Input
              type="tel"
              placeholder="Enter your contact number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Delivery Address *
            </label>
            <Input
              type="text"
              placeholder="Enter your complete delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Daily Milk Quantity (Liters) *
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              placeholder="Enter daily quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Account Information</h4>
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {userEmail}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              This information will be used to set up your daily milk delivery service.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Setting up profile...' : 'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetupForm;
