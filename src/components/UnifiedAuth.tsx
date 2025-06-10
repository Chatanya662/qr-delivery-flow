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
  const [googleLoading, setGoogleLoading] = useState(false);
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
        // For Google auth users, create a profile if it doesn't exist
        if (error.code === 'PGRST116') {
          await createGoogleUserProfile(user);
          return;
        }
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

  const createGoogleUserProfile = async (user: SupabaseUser) => {
    try {
      console.log('Creating profile for Google user:', user.id);
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          role: userRole,
          contact_number: '',
          address: ''
        });

      if (error) {
        console.error('Error creating Google user profile:', error);
        toast({
          title: "Profile Creation Error",
          description: "Could not create user profile. Please contact support.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      } else {
        console.log('Google user profile created successfully');
        onAuthSuccess(user, userRole);
      }
    } catch (error) {
      console.error('Unexpected error creating Google user profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating your profile",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Attempting Google sign in for role:', userRole);
    setGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast({
          title: "Google Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected Google sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during Google sign in",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
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
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Sign In Failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        console.log('Sign in successful:', data);
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
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
      const currentUrl = window.location.origin;
      console.log('Using redirect URL:', currentUrl);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: currentUrl,
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
        
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please try signing in instead.",
            variant: "destructive",
          });
        } else if (error.message.includes('Password')) {
          toast({
            title: "Password Error",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
        } else if (error.message.includes('email')) {
          toast({
            title: "Email Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        console.log('Sign up successful:', data);
        if (data.user && !data.user.email_confirmed_at) {
          toast({
            title: "Check Your Email",
            description: "Please check your email and click the confirmation link to complete your registration.",
          });
        } else {
          toast({
            title: "Success",
            description: "Account created successfully!",
          });
        }
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
      const currentUrl = window.location.origin;
      console.log('Sending password reset with redirect URL:', currentUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: currentUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResetSent(true);
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions. The link will redirect you back to this application.",
        });
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending reset email",
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
                  We've sent a password reset link to {email}. Please check your email and click the link to reset your password.
                </p>
                <p className="text-sm text-gray-500">
                  The reset link will bring you back to this application.
                </p>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
              }}
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
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={googleLoading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedAuth;
