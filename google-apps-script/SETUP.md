# Banquet pledge spreadsheet setup

The Banquet pledge form submits directly to a Google Apps Script web app. The
script validates the submission and appends it to the `Pledges` tab. Netlify
Forms and Netlify Functions are not involved.

## 1. Add or update the Apps Script

1. Open the banquet pledge spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor contents with `BanquetPledges.gs` from this directory.
4. Save the project and name it **Banquet Pledge Sync**.

## 2. Configure the sender address

The Google account that owns and deploys the Apps Script must have
`Gifts@racademy.org` configured as a verified Gmail **Send mail as** address.

1. Sign in to Gmail as the Apps Script owner.
2. Open **Settings → See all settings → Accounts**.
3. Under **Send mail as**, add and verify `Gifts@racademy.org` if it is not
   already present.
4. Confirm that the address appears as an available sender in Gmail.

The script deliberately rejects submissions before writing to the spreadsheet
if this sender alias is missing, preventing pledges from being recorded without
the requested confirmation email.

## 3. Deploy the script

For a new deployment:

1. Select **Deploy → New deployment**.
2. Select **Web app** as the deployment type.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Select **Deploy** and approve the requested spreadsheet permissions.

For the existing deployment:

1. Select **Deploy → Manage deployments**.
2. Edit the web app deployment.
3. Select **New version** and deploy it.

The sheet itself can remain Restricted. “Anyone” applies only to submitting to
the web app; it does not grant visitors access to view or edit the spreadsheet.

The Banquet page is configured to use this deployment URL:

`https://script.google.com/macros/s/AKfycbzmxaSpniM3fCgi4S_-Lakai1TDfGLFeoxs9N4wUYFfd6rpY87vzTYebsG_X5XYb1cK/exec`

The updated script requests Gmail permission in addition to spreadsheet
permission. Approve both permissions when prompted.

## 4. Verify

After deploying the latest Apps Script version and publishing the website,
submit one test pledge. Confirm that:

1. The page displays “Thank you. Your pledge has been recorded.”
2. A `Pledges` tab exists in the spreadsheet.
3. The test pledge appears as a new row with the correct values.
4. The donor receives an email containing their pledge details, sent from
   `Gifts@racademy.org`.

If the row does not appear, open **Executions** in Apps Script and review the
latest `doPost` execution.
