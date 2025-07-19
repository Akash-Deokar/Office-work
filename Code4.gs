function doGet() {
  return HtmlService.createHtmlOutputFromFile('form')
    .setTitle('Leave Request Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Get current user's email and name
function getUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const name = email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()); // Basic guess
  return { email, name };
}

// Submit leave data to a single sheet
function submitLeave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Leave Requests") || ss.insertSheet("Leave Requests");

  // Add header if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Employee ID", "Name", "Leave Date", "Reason"]);
  }

  data.leaves.forEach(leave => {
    sheet.appendRow([
      new Date(),
      data.email,
      data.employeeId,
      data.name,
      leave.date,
      leave.reason
    ]);
  });

  return "Leave request submitted successfully!";
}
