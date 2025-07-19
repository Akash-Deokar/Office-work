function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
                   .setTitle('Leave Request Form')
                   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Auto-fill email and name
function getUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const name = email.split('@')[0].replace(/\./g, ' '); // crude guess
  return { email, name };
}

// Main form submission logic
function submitLeave(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  formData.leaveDates.forEach(date => {
    const leaveMonth = Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "MMMM yyyy"); // e.g., "July 2025"
    let sheet = ss.getSheetByName(leaveMonth);

    // Create new monthly sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(leaveMonth);
      sheet.appendRow(["Email", "Employee ID", "Name", "Leave Month", "Leave Date", "Reason", "Status"]);
    }

    sheet.appendRow([
      formData.email,
      formData.employeeId,
      formData.name,
      leaveMonth,
      date,
      formData.reason,
      "Pending"
    ]);
  });

  return "Leave request submitted successfully!";
}

// Trigger when manager updates status
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const editedRange = e.range;

  if (editedRange.getColumn() === 7 && editedRange.getRow() > 1) {
    const status = editedRange.getValue();
    const row = editedRange.getRow();

    if (status === "Approved" || status === "Rejected") {
      const email = sheet.getRange(row, 1).getValue();
      const name = sheet.getRange(row, 3).getValue();
      const date = sheet.getRange(row, 5).getValue();

      const subject = `Leave Request ${status}`;
      const body = `Hello ${name},

Your leave request for ${date} has been *${status}* by your manager.

Regards,  
HR Team`;

      MailApp.sendEmail(email, subject, body);
    }
  }
}
