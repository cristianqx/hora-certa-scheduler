
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type SubscriptionStatus = 'free' | 'pro' | 'trialing';

interface SubscriptionContextType {
  isLoading: boolean;
  plan: SubscriptionStatus;
  isSubscribed: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  checkEligibility: (feature: string) => { allowed: boolean; requiresUpgrade: boolean };
  reloadSubscription: () => Promise<void>;
}

// Interface para a tabela user_subscriptions
interface UserSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionStatus>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);

  const isPro = plan === 'pro' || plan === 'trialing';

  const loadSubscription = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setPlan('free');
        setIsLoading(false);
        return;
      }
      
      try {
        // Use a raw query since the table might not exist in TypeScript types
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .rpc('get_user_subscription', { user_id: session.user.id });
          
        if (subscriptionError) {
          // If there's an error with the RPC function, fallback to free plan
          console.log('No subscription found, defaulting to free plan');
          setPlan('free');
          setTrialEndsAt(null);
          setCurrentPeriodEnd(null);
        } else if (subscriptionData) {
          // Process subscription data if available
          setPlan(subscriptionData.status === 'trialing' ? 'trialing' : subscriptionData.plan as SubscriptionStatus);
          
          if (subscriptionData.trial_ends_at) {
            setTrialEndsAt(new Date(subscriptionData.trial_ends_at));
          }
          
          if (subscriptionData.current_period_end) {
            setCurrentPeriodEnd(new Date(subscriptionData.current_period_end));
          }
        } else {
          // Default to free plan if no subscription is found
          setPlan('free');
          setTrialEndsAt(null);
          setCurrentPeriodEnd(null);
        }
      } catch (error) {
        console.error('Error in subscription check:', error);
        setPlan('free'); // Default to free plan on error
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setPlan('free'); // Default to free plan on any error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
    
    const authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadSubscription();
      }
    });
    
    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const checkEligibility = (feature: string) => {
    // Lógica para verificar se o recurso está disponível para o plano atual
    switch (feature) {
      case 'multiple_services':
      case 'multiple_links':
      case 'advanced_customization':
      case 'reminders':
      case 'auto_cancellation':
      case 'custom_slug':
        return { 
          allowed: isPro, 
          requiresUpgrade: !isPro 
        };
      default:
        // Recursos disponíveis para todos os planos
        return { allowed: true, requiresUpgrade: false };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        plan,
        isSubscribed: isPro,
        trialEndsAt,
        currentPeriodEnd,
        checkEligibility,
        reloadSubscription: loadSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
