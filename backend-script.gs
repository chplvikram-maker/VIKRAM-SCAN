/**
 * GOOGLE APPS SCRIPT BACKEND
 * Paste this into Extensions > Apps Script in your Google Sheet
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'get_product') {
    return getProduct(e.parameter.barcode);
  }
  
  if (action === 'get_history') {
    return getHistory(e.parameter.username);
  }

  return response({ error: 'Invalid action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'submit_entry') {
    return submitEntry(data);
  }

  if (action === 'update_last_entry') {
    return updateLastEntry(data);
  }

  return response({ error: 'Invalid action' });
}

function getProduct(barcode) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MASTER');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master');
  }
  if (!sheet) {
    const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    if (sheets.length > 0) sheet = sheets[0]; // Fallback to first sheet if MASTER is missing
  }
  
  if (!sheet) return response({ success: false, error: 'No sheets found in spreadsheet' });
  
  const values = sheet.getDataRange().getValues();
  const searchBarcode = String(barcode).trim().toLowerCase();
  
  // Skip header row
  for (let i = 1; i < values.length; i++) {
    const cellValue = values[i][0];
    if (cellValue === undefined || cellValue === null || cellValue === '') continue;
    
    const rowBarcode = String(cellValue).trim().toLowerCase();
    if (rowBarcode === searchBarcode) {
      return response({
        success: true,
        product: {
          barcode: values[i][0],
          name: values[i][1] || 'Unnamed Product',
          category: values[i][2] || 'Default',
          uom: values[i][3] || 'PCS'
        }
      });
    }
  }
  
  return response({ success: false, error: `Barcode ${barcode} not found in sheet "${sheet.getName()}"` });
}

function submitEntry(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STOCK_ENTRY');
  const timestamp = new Date();
  
  sheet.appendRow([
    timestamp,
    data.barcode,
    data.name,
    data.category,
    data.quantity,
    data.uom,
    data.type || 'IN',
    data.username,
    data.remarks || '',
    data.deviceInfo || ''
  ]);
  
  return response({ success: true });
}

function getHistory(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STOCK_ENTRY');
  if (!sheet) return response({ success: true, history: [] });
  
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return response({ success: true, history: [] });
  
  const history = values
    .slice(1) // Skip header
    .filter(row => row[7] === username)
    .reverse()
    .slice(0, 5)
    .map(row => ({
      date: row[0],
      barcode: row[1],
      name: row[2],
      category: row[3],
      quantity: row[4],
      uom: row[5],
      type: row[6] || 'IN',
      remarks: row[8] || '',
      deviceInfo: row[9] || ''
    }));
    
  return response({ success: true, history });
}

function updateLastEntry(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STOCK_ENTRY');
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return response({ success: false, error: 'No entries to update' });
  
  // Verify it's the right user's entry (Username is now in column 8)
  const lastUsername = sheet.getRange(lastRow, 8).getValue();
  if (lastUsername !== data.username) {
    return response({ success: false, error: 'Cannot update: Last entry belongs to another user' });
  }

  // Update quantity (col 5), type (col 7), remarks (col 9) and deviceInfo (col 10)
  sheet.getRange(lastRow, 5).setValue(data.quantity);
  sheet.getRange(lastRow, 7).setValue(data.type || 'IN');
  sheet.getRange(lastRow, 9).setValue(data.remarks || '');
  sheet.getRange(lastRow, 10).setValue(data.deviceInfo || '');
  return response({ success: true });
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
