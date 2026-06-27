const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const signature = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    // TODO: notify the registrar/office (item + metadata + customer_email)
    // and record the request as paid. No email-sending service is wired up
    // yet — see parent-resources/index.html TODO for the fulfillment plan.
    console.log('Checkout completed:', session.metadata?.item, session.customer_email);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
