
import React, { useState, useEffect } from 'react';
import UnifiedAuth from './UnifiedAuth';
import RoleDashboard from './RoleDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface DeliveryInterfaceProps {
  onBack: () => void;
}

const DeliveryInterface = ({ onBack }: DeliveryInterfaceProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (authenticatedUser: SupabaseUser) => {
    setUser(authenticatedUser);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <UnifiedAuth 
        userRole="delivery" 
        onAuthSuccess={handleAuthSuccess} 
        onBack={onBack}
      />
    );
  }

  return (
    <RoleDashboard 
      user={user} 
      userRole="delivery" 
      onSignOut={handleSignOut} 
    />
  );
};

export default DeliveryInterface;
