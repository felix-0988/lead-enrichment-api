const express = require('express');
const router = express.Router();

// Initialize stripe only if key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Webhook secret for Leads product
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_IldFyJgblCW7N2o8LS4fNmz6euTZIIP8';

// Price IDs - should be set in environment variables
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_leads_monthly'; // $4/month

// Create checkout session - mounted at /create-checkout-session so use /
const createCheckoutHandler = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, error: 'Stripe not configured' });
    }
    
    const { customerEmail, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Leads - Lead Enrichment API',
              description: 'Lead Enrichment API Service - $4/month'
            },
            unit_amount: 400, // $4.00 in cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/cancel`,
      customer_email: customerEmail
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/create-checkout-session', createCheckoutHandler);

// Stripe webhook handler - exported separately for raw body parsing
const webhookHandler = async (req, res) => {
  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('✅ Checkout completed:', session.id);
      console.log('Customer:', session.customer_email);
      // TODO: Activate subscription in database
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      console.log('✅ Invoice paid:', invoice.id);
      console.log('Customer:', invoice.customer_email);
      // TODO: Update subscription status to active
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('❌ Invoice payment failed:', invoice.id);
      console.log('Customer:', invoice.customer_email);
      // TODO: Mark subscription as past due, notify customer
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('🗑️ Subscription deleted:', subscription.id);
      console.log('Customer:', subscription.customer);
      // TODO: Deactivate subscription in database
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log('📝 Subscription updated:', subscription.id);
      console.log('Status:', subscription.status);
      // TODO: Update subscription status in database
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Export router with handlers attached
router.webhookHandler = webhookHandler;
router.createCheckoutHandler = createCheckoutHandler;
module.exports = router;
