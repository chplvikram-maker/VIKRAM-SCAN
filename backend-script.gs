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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MASTER');
  const values = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(barcode)) {
      return response({
        success: true,
        product: {
          barcode: values[i][0],
          name: values[i][1],
          category: values[i][2],
          uom: values[i][3]
        }
      });
    }
  }
  
  return response({ success: false, error: 'Product Not Found' });
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
    data.username
  ]);
  
  return response({ success: true });
}

function getHistory(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STOCK_ENTRY');
  const values = sheet.getDataRange().getValues();
  
  const history = values
    .slice(1) // Skip header
    .filter(row => row[6] === username)
    .reverse()
    .slice(0, 5)
    .map(row => ({
      date: row[0],
      barcode: row[1],
      name: row[2],
      category: row[3],
      quantity: row[4],
      uom: row[5]
    }));
    
  return response({ success: true, history });
}

function updateLastEntry(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STOCK_ENTRY');
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return response({ success: false, error: 'No entries to update' });
  
  // Verify it's the right user's entry (optional but safe)
  const lastUsername = sheet.getRange(lastRow, 7).getValue();
  if (lastUsername !== data.username) {
    return response({ success: false, error: 'Cannot update: Last entry belongs to another user' });
  }

  sheet.getRange(lastRow, 5).setValue(data.quantity);
  return response({ success: true });
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
