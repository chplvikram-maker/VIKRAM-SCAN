# VIKRAM SCAN - Setup Guide

## 1. Google Sheets Setup
1. Create a new Google Sheet.
2. Rename the first tab to `MASTER`.
3. Add the following headers in the first row of `MASTER`:
   `Barcode` | `Product Name` | `Category` | `UOM`
4. Add some sample data to `MASTER`.
5. Create a second tab and rename it to `STOCK_ENTRY`.
6. Add the following headers in the first row of `STOCK_ENTRY`:
   `Date` | `Barcode` | `Product Name` | `Category` | `Quantity` | `UOM` | `Username`

## 2. Google Apps Script Setup
1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code and paste the content of the `backend-script.gs` file provided by this app.
3. Click **Deploy > New Deployment**.
4. Select **Type: Web App**.
5. Set **Execute as: Me**.
6. Set **Who has access: Anyone** (this allows the app to communicate without complex OAuth).
7. Copy the **Web App URL**.

## 3. App Configuration
1. In AI Studio, open the **Secrets** (Environment Variables) panel.
2. Add a new variable: `VITE_SHEETS_API_URL` and paste the Apps Script Web App URL.
3. Refresh the app.
