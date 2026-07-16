const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' });

const SITE_URL = process.env.SITE_URL || 'https://racademy.org';

// One Stripe Price per item - created in the Stripe Dashboard so amounts
// can change without a code deploy. See .env.example for the env var names.
const PRICE_IDS = {
  'application-fee': process.env.STRIPE_PRICE_APPLICATION_FEE,
  'transcript-official': process.env.STRIPE_PRICE_TRANSCRIPT_OFFICIAL,
  'transcript-electronic': process.env.STRIPE_PRICE_TRANSCRIPT_ELECTRONIC,
  'transcript-unofficial': process.env.STRIPE_PRICE_TRANSCRIPT_UNOFFICIAL,
};

const SUCCESS_PATHS = {
  'application-fee': '/admissions/how-to-apply/?paid=1',
  'transcript-official': '/parent-resources/?tab=transcript&paid=1',
  'transcript-electronic': '/parent-resources/?tab=transcript&paid=1',
  'transcript-unofficial': '/parent-resources/?tab=transcript&paid=1',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { item, quantity = 1, customerEmail, metadata = {} } = body;

  const priceId = PRICE_IDS[item];
  if (!priceId) {
    return { statusCode: 400, body: `Unknown item: ${item}` };
  }

  const successPath = SUCCESS_PATHS[item] || '/';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity }],
      customer_email: customerEmail,
      metadata: { item, ...metadata },
      success_url: `${SITE_URL}${successPath}`,
      cancel_url: `${SITE_URL}${successPath.split('?')[0]}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
