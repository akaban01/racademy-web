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
    const request = JSON.parse(e.postData.contents);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");

    if (!expectedSecret || request.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    const pledge = request.pledge || {};
    if (pledge["form-name"] !== "banquet-pledge") {
      return jsonResponse_({ ok: false, error: "Unexpected form" });
    }

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
        safeCell_(request.submittedAt),
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

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  }
}

function safeCell_(value) {
  const text = value == null ? "" : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
