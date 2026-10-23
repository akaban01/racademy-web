# Banquet pledge spreadsheet setup

The Banquet pledge form submits directly to a Google Apps Script web app. The
script validates the submission and appends it to the `Pledges` tab. Netlify
Forms and Netlify Functions are not involved.

## 1. Add or update the Apps Script

1. Open the banquet pledge spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor contents with `BanquetPledges.gs` from this directory.
4. Save the project and name it **Banquet Pledge Sync**.

## 2. Deploy the script

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

## 3. Verify

After deploying the latest Apps Script version and publishing the website,
submit one test pledge. Confirm that:

1. The page displays “Thank you. Your pledge has been recorded.”
2. A `Pledges` tab exists in the spreadsheet.
3. The test pledge appears as a new row with the correct values.

If the row does not appear, open **Executions** in Apps Script and review the
latest `doPost` execution.
