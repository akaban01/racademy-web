const SPREADSHEET_ID = "1FjX4iTmN1ZBYO7XsYwSmouIQWNQTD02oCM_vsRS98yA";
const SHEET_NAME = "Pledges";
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

    return htmlResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return htmlResponse_({ ok: false, error: String(error.message || error) });
  }
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
