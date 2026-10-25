const SPREADSHEET_ID = "1FjX4iTmN1ZBYO7XsYwSmouIQWNQTD02oCM_vsRS98yA";
const SHEET_NAME = "Pledges";
const FROM_ADDRESS = "Gifts@racademy.org";
const SENDER_NAME = "Renaissance Academy Gifts";
const HEADERS = [
  "Submitted at",
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Street address",
  "Apartment / suite / unit",
  "City",
  "State",
  "ZIP code",
  "Pledge amount (USD)",
  "Frequency",
  "Number of months",
  "Notes",
];

function doPost(e) {
  try {
    const pledge = e && e.parameter ? e.parameter : {};
    if (pledge["bot-field"]) return htmlResponse_({ ok: true });
    if (pledge["form-name"] !== "banquet-pledge") {
      return htmlResponse_({ ok: false, error: "Invalid pledge form submission." });
    }

    validatePledge_(pledge);
    const fromAddress = getVerifiedFromAddress_();

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
        sheet.setFrozenRows(1);
      }

      sheet.appendRow([
        new Date(),
        safeCell_(pledge["first-name"]),
        safeCell_(pledge["last-name"]),
        safeCell_(pledge.email),
        safeCell_(pledge.phone),
        safeCell_(pledge["address-line-1"]),
        safeCell_(pledge["address-line-2"]),
        safeCell_(pledge.city),
        safeCell_(pledge.state),
        safeCell_(pledge["postal-code"]),
        safeCell_(pledge["pledge-amount"]),
        safeCell_(pledge.frequency),
        safeCell_(pledge["number-of-months"]),
        safeCell_(pledge.notes),
      ]);
    } finally {
      lock.releaseLock();
    }

    sendPledgeConfirmation_(pledge, fromAddress);

    return htmlResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return htmlResponse_({ ok: false, error: String(error.message || error) });
  }
}

function getVerifiedFromAddress_() {
  const alias = GmailApp.getAliases().find(function (address) {
    return address.toLowerCase() === FROM_ADDRESS.toLowerCase();
  });

  if (!alias) {
    throw new Error(FROM_ADDRESS + " must be configured as a verified Gmail Send mail as alias for the Apps Script owner.");
  }
  return alias;
}

/**
 * Run this function once from the Apps Script editor as the account that owns
 * the web-app deployment. Google will prompt that account to authorize Gmail
 * access, and the function will verify the required Send mail as alias.
 */
function authorizeGmailAccess() {
  const fromAddress = getVerifiedFromAddress_();
  console.log("Gmail access authorized. Confirmation emails will be sent from " + fromAddress + ".");
  return "Authorized: " + fromAddress;
}

function sendPledgeConfirmation_(pledge, fromAddress) {
  const fullName = (pledge["first-name"] + " " + pledge["last-name"]).trim();
  const address = [
    pledge["address-line-1"],
    pledge["address-line-2"],
    [pledge.city, pledge.state, pledge["postal-code"]].filter(Boolean).join(", "),
  ].filter(Boolean).join("\n");
  const months = pledge.frequency === "Monthly" ? pledge["number-of-months"] : "Not applicable";
  const notes = pledge.notes || "None";
  const subject = "Your Renaissance Academy Banquet pledge";
  const body = [
    "Jazakallahu khairan for your pledge, " + pledge["first-name"] + "!",
    "",
    "We received the following pledge details:",
    "Name: " + fullName,
    "Email: " + pledge.email,
    "Phone: " + pledge.phone,
    "Address: " + address.replace(/\n/g, ", "),
    "Pledge amount: $" + pledge["pledge-amount"],
    "Frequency: " + pledge.frequency,
    "Number of months: " + months,
    "Notes: " + notes,
    "",
    "To avoid double counting, submitting this form is not announced or counted in the tracker. Please raise your hand for Sh Abdulraoof to acknowledge your pledge amount, or text (512) 924-8350 to record it anonymously.",
    "",
    "Renaissance Academy",
  ].join("\n");

  const details = [
    ["Name", fullName],
    ["Email", pledge.email],
    ["Phone", pledge.phone],
    ["Address", address.replace(/\n/g, "<br>")],
    ["Pledge amount", "$" + pledge["pledge-amount"]],
    ["Frequency", pledge.frequency],
    ["Number of months", months],
    ["Notes", notes],
  ].map(function (item) {
    return "<tr><th style=\"padding:8px 12px;text-align:left;vertical-align:top;background:#f7f5fe;color:#2a1259;\">" +
      escapeHtml_(item[0]) + "</th><td style=\"padding:8px 12px;color:#1d1336;\">" +
      (item[0] === "Address" ? item[1].split("<br>").map(escapeHtml_).join("<br>") : escapeHtml_(item[1])) + "</td></tr>";
  }).join("");

  const htmlBody =
    "<div style=\"font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1d1336;line-height:1.6;\">" +
    "<h1 style=\"color:#6d28d9;font-size:26px;\">Jazakallahu khairan for your pledge!</h1>" +
    "<p>We received the following pledge details:</p>" +
    "<table style=\"width:100%;border-collapse:collapse;border:1px solid #ddd6fe;\">" + details + "</table>" +
    "<p style=\"margin-top:20px;padding:14px;background:#efeafd;border-left:4px solid #7c3aed;\"><strong>Important:</strong> To avoid double counting, submitting this form is not announced or counted in the tracker. Please raise your hand for Sh Abdulraoof to acknowledge your pledge amount, or text <a href=\"tel:5129248350\">(512) 924-8350</a> to record it anonymously.</p>" +
    "<p>Renaissance Academy</p></div>";

  GmailApp.sendEmail(pledge.email, subject, body, {
    from: fromAddress,
    replyTo: fromAddress,
    name: SENDER_NAME,
    htmlBody: htmlBody,
  });
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validatePledge_(pledge) {
  const required = ["first-name", "last-name", "email", "phone", "address-line-1", "city", "state", "postal-code", "pledge-amount", "frequency"];
  required.forEach(function (field) {
    if (!String(pledge[field] || "").trim()) throw new Error("Please complete all required fields.");
  });

  if (!/^\S+@\S+\.\S+$/.test(pledge.email)) throw new Error("Please enter a valid email address.");
  if (!(Number(pledge["pledge-amount"]) > 0)) throw new Error("Please enter a valid pledge amount.");
  if (["One-time", "Monthly"].indexOf(pledge.frequency) === -1) throw new Error("Please select a valid pledge frequency.");
  if (pledge.frequency === "Monthly" && !(Number(pledge["number-of-months"]) > 0)) {
    throw new Error("Please enter the number of months for your monthly pledge.");
  }
}

function safeCell_(value) {
  const text = value == null ? "" : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function htmlResponse_(value) {
  const message = JSON.stringify({
    source: "banquet-pledge",
    ok: Boolean(value.ok),
    error: value.error || "",
  }).replace(/</g, "\\u003c");

  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body><script>window.top.postMessage(" + message + ", '*');<\/script></body></html>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
