
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  // Criar cliente Supabase com a chave de serviço para poder escrever sem restrições RLS
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Assinatura Stripe ausente', { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return new Response('Secret do webhook não configurado', { status: 500 });
    }

    // Verificar assinatura do webhook
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Evento recebido: ${event.type}`);

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Verificar modo de pagamento
        if (session.mode !== 'subscription') {
          break;
        }
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        // Obter detalhes da assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Obter cliente
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.deleted) {
          break;
        }
        
        const userId = customer.metadata.user_id;
        
        if (!userId) {
          console.error('User ID não encontrado nos metadados do cliente');
          break;
        }
        
        // Registrar assinatura no banco de dados
        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          customer_id: customerId,
          status: subscription.status === 'trialing' ? 'trialing' : 'active',
          plan: 'pro',
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        
        console.log(`Assinatura ${subscriptionId} para o usuário ${userId} criada/atualizada`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) break;
        
        // Obter assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        
        // Obter cliente
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.deleted) break;
        
        const userId = customer.metadata.user_id;
        
        if (userId) {
          // Atualizar status da assinatura
          await supabaseAdmin.from('user_subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
          
          console.log(`Falha no pagamento para a assinatura ${subscriptionId} do usuário ${userId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Obter cliente
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.deleted) break;
        
        const userId = customer.metadata.user_id;
        
        if (userId) {
          // Atualizar ou excluir a assinatura
          await supabaseAdmin.from('user_subscriptions').update({
            status: 'canceled',
            plan: 'free',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
          
          console.log(`Assinatura ${subscription.id} do usuário ${userId} cancelada`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`Erro ao processar webhook: ${error.message}`);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});
