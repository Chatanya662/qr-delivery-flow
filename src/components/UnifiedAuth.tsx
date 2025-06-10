import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Lock, LogIn, UserPlus, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UnifiedAuthProps {
  userRole: 'customer' | 'delivery' | 'owner';
  onAuthSuccess: (user: SupabaseUser, role: string) => void;
  onBack: () => void;
}

const UnifiedAuth = ({ userRole, onAuthSuccess, onBack }: UnifiedAuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserRole(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkUserRole(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [userRole]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const checkUserRole = async (user: SupabaseUser) => {
    try {
      console.log('Checking user role for:', user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Profile Error",
          description: "Could not fetch user profile. Please try signing up again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      if (profile?.role === userRole) {
        console.log('User role matches:', profile.role);
        onAuthSuccess(user, profile.role);
      } else {
        console.log('User role mismatch. Expected:', userRole, 'Got:', profile?.role);
        toast({
          title: "Access Denied",
          description: `You don't have ${userRole} permissions`,
          variant: "destructive",
        });
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while checking permissions",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async () => {
    console.log('Attempting sign in with:', { email, userRole });
    
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign in successful:', data);
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    console.log('Attempting sign up with:', { email, fullName, userRole });
    
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName.trim(),
            role: userRole,
            contact_number: contactNumber.trim(),
            address: address.trim(),
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        let errorMessage = error.message;
        
        // Provide more helpful error messages
        if (error.message.includes('user_role')) {
          errorMessage = "Database configuration error. Please contact support.";
        } else if (error.message.includes('email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes('password')) {
          errorMessage = "Password must be at least 6 characters long.";
        }
        
        toast({
          title: "Sign Up Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('Sign up successful:', data);
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
        });
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResetSent(true);
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions",
        });
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'customer': return 'Customer Portal';
      case 'delivery': return 'Delivery Portal';
      case 'owner': return 'Owner Portal';
      default: return 'Portal';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'customer': return <User className="w-8 h-8 text-blue-500" />;
      case 'delivery': return <User className="w-8 h-8 text-green-500" />;
      case 'owner': return <User className="w-8 h-8 text-purple-500" />;
      default: return <User className="w-8 h-8 text-gray-500" />;
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <KeyRound className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <p className="text-gray-600">Enter your email to reset your password</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!resetSent ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {emailError}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleForgotPassword} 
                  disabled={loading || !!emailError} 
                  className="w-full"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Sent!</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to {email}
                </p>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowForgotPassword(false)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button variant="outline" onClick={onBack} className="absolute top-4 left-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center mb-2">
            {getRoleIcon()}
          </div>
          <CardTitle className="text-2xl">{getRoleTitle()}</CardTitle>
          <p className="text-gray-600">
            {userRole === 'customer' 
              ? 'Access your delivery dashboard'
              : userRole === 'delivery'
              ? 'Manage your deliveries'
              : 'Admin access to manage operations'
            }
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {emailError}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      className={`pl-10 ${passwordError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {passwordError && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSignIn} 
                  disabled={loading || !!emailError || !!passwordError} 
                  className="w-full"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm"
                >
                  Forgot your password?
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {emailError}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Create a password (minimum 6 characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      className={`pl-10 ${passwordError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {passwordError && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}
                </div>
                {userRole === 'customer' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Contact Number</label>
                      <Input
                        type="tel"
                        placeholder="Enter your contact number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <Input
                        type="text"
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button 
                  onClick={handleSignUp} 
                  disabled={loading || !!emailError || !!passwordError} 
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedAuth;
