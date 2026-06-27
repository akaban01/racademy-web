# Online Payments — Status & How-To

This page is for **anyone at the school office**, not just developers. It explains
what's set up so far for online payments, what's still missing before it can go
live on the website, and how to create or change a fee amount yourself in Stripe
without needing a developer.

There are two separate kinds of "payments" on the website:

| Type | Where | Status |
|---|---|---|
| **Donations** (general giving) | `/donate/` page | Lists PayPal / Zelle / etc. A Zeffy donation form will be embedded here once the school provides the Zeffy embed code. Not started yet. |
| **Fee payments** (Stripe) | Application fee, transcript fees | Backend is built and connected to a **live** Stripe account. The "Pay" buttons are **not yet on the website** — see TODO below. |

---

## TODO before fee payments can go live

- [ ] Decide the actual dollar amount for each fee:
  - Application fee
  - Transcript — official sealed copy
  - Transcript — electronic delivery
  - Transcript — unofficial copy
- [ ] Create a Stripe Product + Price for each one (steps below)
- [ ] Send the resulting 4 Price IDs to whoever manages the website so they can
      be added to Netlify (or add them yourself — see "Where the Price ID goes" below)
- [ ] Decide who at the office gets notified when someone pays, and how —
      no notification email is wired up yet, so right now a payment would
      succeed in Stripe but nobody at the school gets told automatically
- [ ] Decide the refund policy for mistaken or duplicate requests
- [ ] Confirm whether Texas sales tax applies to these fees (Stripe can
      calculate this automatically — Stripe Tax — but it needs to be turned on)
- [ ] Once all of the above is settled, a developer adds the actual "Pay"
      buttons to the Application and Transcript pages and this list is done

**Heads up:** the Stripe account connected to this site is in **live mode**,
not test mode — meaning once Price IDs are added, real cards get really charged.
There's no sandbox safety net active right now, so double-check amounts before
publishing any "Pay" button.

---

## How to create or change a fee amount in Stripe (no coding needed)

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com).
2. Make sure the toggle in the top-right says **Live mode** (not "Test mode").
3. Go to **Product catalog** in the left menu.
4. Click **+ Add product**.
5. Fill in:
   - **Name** — e.g. `Application Fee` or `Transcript — Official Sealed Copy`
   - **Pricing model** — Standard pricing
   - **Price** — the dollar amount
   - **Billing period** — **One time** (not recurring)
6. Click **Save product**.
7. Open the product you just saved and click on its **Price** row. You'll see
   an ID that looks like `price_1AbCdEfGhIjKlMnO` — that's the **Price ID**.
8. Send that Price ID to whoever manages the website, or add it yourself
   (see below).

⚠️ **A Price's amount can't be edited after it's created.** To change a fee
later, add a *new* Price to the same product (repeat steps 4–7) and archive
the old one. Then update the Price ID wherever it's stored (next section).

---

## Where the Price ID goes after you create it

The website reads these Price IDs from environment variables in **Netlify**
(Site configuration → Environment variables), not from the website's code.
If you have access to the Netlify dashboard, you can update them yourself —
no code editing required:

| Fee | Netlify environment variable |
|---|---|
| Application fee | `STRIPE_PRICE_APPLICATION_FEE` |
| Transcript — official sealed copy | `STRIPE_PRICE_TRANSCRIPT_OFFICIAL` |
| Transcript — electronic delivery | `STRIPE_PRICE_TRANSCRIPT_ELECTRONIC` |
| Transcript — unofficial copy | `STRIPE_PRICE_TRANSCRIPT_UNOFFICIAL` |

If you don't have Netlify access, just send the Price ID to the developer —
it's not a secret, it's safe to paste into an email or chat.

---

## What's already done (for reference)

- A Stripe **secret key** and **publishable key** are configured (live mode).
- A Stripe **webhook** is set up so the site gets notified the instant someone
  pays.
- The backend code that creates the actual checkout/payment page for a
  customer already exists (`netlify/functions/create-checkout-session.js`
  and `netlify/functions/stripe-webhook.js`), it just isn't linked to any
  button on the website yet.

## Good to know / don't share these

- The Stripe **secret key** (starts with `sk_live_...`) is different from a
  Price ID. It should **never** be pasted into email, chat, or any document —
  it belongs only in Netlify's environment variables.
- A **Price ID** (starts with `price_...`) is not secret — safe to share.
