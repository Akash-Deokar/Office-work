function doGet() {
  return HtmlService.createHtmlOutputFromFile('form').setTitle('Leave Request Form');
}

function getUserInfo() {
  const user = Session.getActiveUser();
  const email = user.getEmail();
  const name = email ? email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  return { email, name };
}

function submitLeave(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  formData.leaves.forEach(entry => {
    const dateObj = new Date(entry.date);
    dateObj.setHours(12); // to avoid timezone issues
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
      Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "MM/dd/yyyy"),
      entry.reason,
      "Pending"
    ]);
  });

  return "Leave request submitted successfully!";
}

// Send email when Status column is edited
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const col = range.getColumn();
  const row = range.getRow();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("Status") + 1;
  if (col !== statusCol || row === 1) return;

  const status = sheet.getRange(row, statusCol).getValue();
  const email = sheet.getRange(row, headers.indexOf("Email") + 1).getValue();
  const date = sheet.getRange(row, headers.indexOf("Leave Date") + 1).getValue();
  const reason = sheet.getRange(row, headers.indexOf("Reason") + 1).getValue();

  if (status.toLowerCase() === "approved" || status.toLowerCase() === "rejected") {
    const subject = `Leave Request ${status} for ${date}`;
    const body = `Hello,\n\nYour leave request for ${date} has been ${status}.\nReason: ${reason}\n\nRegards,\nHR/Manager`;

    MailApp.sendEmail(email, subject, body);
  }
}
