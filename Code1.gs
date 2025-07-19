function doGet() {
  return HtmlService.createHtmlOutputFromFile("form").setTitle("Leave Request Form");
}

function getUserInfo() {
  const user = Session.getActiveUser();
  return {
    email: user.getEmail()
  };
}

function submitLeave(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  formData.leaves.forEach(entry => {
    const dateObj = new Date(entry.date);
    dateObj.setHours(12); // Fix timezone shift

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

// Send email when status is updated by manager
function onEdit(e) {
  const editedRange = e.range;
  const sheet = editedRange.getSheet();
  const column = editedRange.getColumn();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("Status") + 1;
  const emailCol = headers.indexOf("Email") + 1;
  const nameCol = headers.indexOf("Name") + 1;
  const dateCol = headers.indexOf("Leave Date") + 1;

  if (column === statusCol && editedRange.getRow() > 1) {
    const status = editedRange.getValue();
    const email = sheet.getRange(editedRange.getRow(), emailCol).getValue();
    const name = sheet.getRange(editedRange.getRow(), nameCol).getValue();
    const leaveDate = sheet.getRange(editedRange.getRow(), dateCol).getValue();

    if (email && status && (status === "Approved" || status === "Rejected")) {
      const subject = `Leave Request ${status} - ${leaveDate}`;
      const body = `Hello ${name},\n\nYour leave request for ${leaveDate} has been *${status}* by the manager.\n\nRegards,\nHR Team`;

      MailApp.sendEmail(email, subject, body);
    }
  }
}
