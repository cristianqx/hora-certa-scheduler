
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change:', event);
      
      // Update our state
      setSession(currentSession);
      setLoading(false);
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
      
      // Explicitly handle SIGNED_IN to ensure we redirect when a token comes in
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
    });
    
    // Then check for existing session
    const checkAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando...</span>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" />;
};
