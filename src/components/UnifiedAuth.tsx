
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UnifiedAuthProps {
  userRole: 'customer' | 'delivery' | 'owner';
  onAuthSuccess: (user: SupabaseUser) => void;
  onBack: () => void;
}

const UnifiedAuth = ({ userRole, onAuthSuccess, onBack }: UnifiedAuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        onAuthSuccess(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        // For customers, ensure customer record exists before proceeding
        if (userRole === 'customer') {
          createCustomerRecord(session.user).then(() => {
            onAuthSuccess(session.user);
          });
        } else {
          onAuthSuccess(session.user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess, userRole]);

  const createCustomerRecord = async (user: SupabaseUser) => {
    try {
      console.log('Creating customer record for user:', user.id);
      
      // Check if customer record already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (existingCustomer) {
        console.log('Customer record already exists');
        return;
      }

      // Create a new customer record
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          profile_id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || name || user.email || 'Customer',
          address: 'Please update your address',
          quantity: 1,
          contact_number: user.phone || ''
        });

      if (customerError) {
        console.error('Error creating customer record:', customerError);
        toast({
          title: "Warning",
          description: "Account created but customer profile needs to be set up. Please contact support.",
          variant: "destructive",
        });
      } else {
        console.log('Customer record created successfully');
      }
    } catch (error) {
      console.error('Error in createCustomerRecord:', error);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (userRole === 'customer' && !name)) {
      toast({
        title: "Error",
        description: userRole === 'customer' ? "Please fill in all fields" : "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`Attempting email signup for role: ${userRole}`);
      
      const signupData = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            role: userRole
          }
        }
      };

      const { data, error } = await supabase.auth.signUp(signupData);

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // For customer role, create customer record immediately
        if (userRole === 'customer') {
          await createCustomerRecord(data.user);
        }
        
        // Check if email confirmation is required
        if (!data.session) {
          toast({
            title: "Success", 
            description: "Account created successfully! Please check your email for verification.",
          });
        } else {
          toast({
            title: "Success", 
            description: "Account created successfully! You are now logged in.",
          });
          onAuthSuccess(data.user);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "Something went wrong during signup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error", 
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`Attempting email sign in for role: ${userRole}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log('User signed in successfully:', data.user.id);
        
        // For customer role, ensure customer record exists
        if (userRole === 'customer') {
          await createCustomerRecord(data.user);
        }
        
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
        onAuthSuccess(data.user);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "Something went wrong during sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log(`Attempting Google sign in for role: ${userRole}`);
      
      // Store the intended role in localStorage so we can assign it after OAuth callback
      localStorage.setItem('pendingUserRole', userRole);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: "Something went wrong with Google sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'customer': return 'Customer';
      case 'delivery': return 'Delivery Person';
      case 'owner': return 'Business Owner';
      default: return 'User';
    }
  };

  // Only show signup for customers
  const showSignup = userRole === 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-2 sm:space-y-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <Button variant="ghost" onClick={onBack} size="sm" className="text-sm">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 px-2">
            {getRoleDisplayName()} Portal
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-600 px-2 leading-relaxed">
            {showSignup ? 'Sign in or create your customer account' : 'Sign in to your account'}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {showSignup ? (
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="text-sm sm:text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      > 
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full text-sm sm:text-base py-2 sm:py-3">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="text-sm sm:text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full text-sm sm:text-base py-2 sm:py-3">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            // Sign-in only form for delivery and owner
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-sm sm:text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full text-sm sm:text-base py-2 sm:py-3">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full mt-4 text-sm sm:text-base py-2 sm:py-3"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="truncate">Continue with Google</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedAuth;
