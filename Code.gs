function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setTitle('Leave Request Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const name = email.split('@')[0].replace(/\./g, ' ');
  return { email, name };
}

function submitLeave(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  formData.leaves.forEach(entry => {
    const dateObj = new Date(entry.date);
    const leaveMonth = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "MMMM yyyy");
    let sheet = ss.getSheetByName(leaveMonth);

    if (!sheet) {
      sheet = ss.insertSheet(leaveMonth);
      sheet.appendRow(["Email", "Employee ID", "Name", "Leave Month", "Leave Date", "Reason", "Status"]);
    }

    sheet.appendRow([
      formData.email,
      formData.employeeId,
      formData.name,
      leaveMonth,
      entry.date,
      entry.reason,
      "Pending"
    ]);
  });

  return "Leave request submitted successfully!";
}

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const editedRange = e.range;

  // Column G = 7 (Status)
  if (editedRange.getColumn() === 7 && editedRange.getRow() > 1) {
    const status = editedRange.getValue();
    const row = editedRange.getRow();
    const email = sheet.getRange(row, 1).getValue();
    const name = sheet.getRange(row, 3).getValue();
    const leaveDate = sheet.getRange(row, 5).getValue();

    if (status === "Approved" || status === "Rejected") {
      const subject = `Leave Request ${status}`;
      const body = `Hello ${name},

Your leave request for ${leaveDate} has been *${status}* by your manager.

Regards,  
HR Team`;

      MailApp.sendEmail(email, subject, body);
    }
  }
}
