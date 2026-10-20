const PLEDGE_FORM_NAME = "banquet-pledge";

export default {
  async formSubmitted(event) {
    const data = event.data || {};

    // This event runs for every Netlify form on the site.
    if (data["form-name"] !== PLEDGE_FORM_NAME) return;

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      console.error("Google Sheets pledge sync is missing its Netlify environment variables.");
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: webhookSecret,
        submittedAt: new Date().toISOString(),
        pledge: data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets pledge sync failed with HTTP ${response.status}.`);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Google Sheets pledge sync failed: ${result.error || "unknown error"}`);
    }
  },
};
