# Banquet pledge spreadsheet setup

The website keeps Netlify Forms as the primary submission record. After Netlify
verifies a `banquet-pledge` submission, a server-side function forwards it to a
protected Google Apps Script web app, which appends it to the `Pledges` tab.

## 1. Add the Apps Script to the spreadsheet

1. Open the banquet pledge spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor contents with `BanquetPledges.gs` from this directory.
4. Save the project and name it **Banquet Pledge Sync**.

## 2. Create the shared secret

Generate a long random value (at least 32 characters). Do not put it in this
repository or in the HTML page.

In Apps Script:

1. Open **Project Settings**.
2. Under **Script Properties**, select **Add script property**.
3. Set the property name to `WEBHOOK_SECRET`.
4. Set its value to the random secret and save it.

## 3. Deploy the script

1. Select **Deploy → New deployment**.
2. Select **Web app** as the deployment type.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Select **Deploy**, approve the requested spreadsheet permissions, and copy
   the `/exec` web app URL (not the `/dev` test URL).

The sheet itself can remain Restricted. “Anyone” applies only to calling the
web app; requests without the shared secret are rejected.

## 4. Add Netlify environment variables

In the Netlify dashboard, open the site and go to **Project configuration →
Environment variables**. Add:

- `GOOGLE_SHEETS_WEBHOOK_URL`: the Apps Script `/exec` URL
- `GOOGLE_SHEETS_WEBHOOK_SECRET`: the exact same secret saved in Apps Script

Make both variables available to Functions, then redeploy the site.

## 5. Verify

Submit one test pledge on the deployed Banquet page. Confirm that:

1. The submission appears under **Netlify → Forms → banquet-pledge**.
2. A new `Pledges` tab is created in the spreadsheet.
3. The pledge appears as a new row with the correct values.

If the Netlify submission exists but the spreadsheet row does not, review the
`sync-banquet-pledge` function log in Netlify and the execution log in Apps
Script.
