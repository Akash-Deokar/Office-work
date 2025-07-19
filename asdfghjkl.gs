/**
 * Serves the HTML form
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('form')
      .setTitle('Leave Request Form')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Retrieves logged‑in user info
 */
function getUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const name = email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  return { email, name };
}

/**
 * Saves leave entries into a single sheet
 */
function submitLeave(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Leave Requests');
  if (!sheet) {
    sheet = ss.insertSheet('Leave Requests');
    sheet.appendRow(['Timestamp', 'Email', 'Employee ID', 'Name', 'Leave Date', 'Reason', 'Status']);
  }
  
  const now = new Date();
  formData.leaves.forEach(e => {
    sheet.appendRow([now, formData.email, formData.employeeId, formData.name, e.date, e.reason, 'Pending']);
  });
  return '✅ Leave request submitted successfully!';
}

/**
 * Monitors Status column edits and emails the user
 */
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Leave Requests') return;
  
  const col = e.range.getColumn();
  const row = e.range.getRow();
  // Trigger only if Status column (7) is edited below header row
  if (col === 7 && row > 1) {
    const status = e.range.getValue();
    if (status === 'Accepted' || status === 'Rejected') {
      const email = sheet.getRange(row, 2).getValue();       // Email
      const date = sheet.getRange(row, 5).getValue();        // Leave Date
      const name = sheet.getRange(row, 4).getValue();        // Name
      MailApp.sendEmail(email,
        `Leave Request ${status}`,
        `Hello ${name},\n\nYour leave request for ${date} has been ${status}.\n\nRegards,\nHR Team`);
    }
  }
}
