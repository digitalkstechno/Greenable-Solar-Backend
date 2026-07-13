/**
 * Apply common header row styling (orange background, white bold text, borders)
 * @param {ExcelJS.Row} headerRow - The header row object (sheet.getRow(1))
 */
const applyHeaderStyle = (headerRow) => {
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "d87612" }, // orange
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF1E40AF" } },
    };
  });
  headerRow.height = 28;
};

/**
 * Apply text color to a status cell based on its value
 * @param {ExcelJS.Cell} cell - The status cell
 * @param {string} statusValue - The status text (e.g. "Won", "Lost", "New Lead")
 */
const applyStatusTextColor = (cell, statusValue) => {
  const val = (statusValue || "").trim().toLowerCase();

  let color = null;
  if (val === "won") {
    color = "FF4CAF50"; // light green
  } else if (val === "lost") {
    color = "FFE57373"; // light red
  } else if (val === "new lead") {
    color = "FFFFA726"; // light orange
  }

  if (color) {
    cell.font = { ...(cell.font || {}), color: { argb: color }, bold: true };
  }
};

/**
 * Apply common data row styling (alternate shading + borders + alignment)
 * @param {ExcelJS.Row} row - The data row object
 * @param {number} idx - Row index (used for alternate shading)
 */
const applyRowStyle = (row, idx) => {
  // Alternate row shading
  if (idx % 2 === 0) {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFAF5" },
      };
    });
  }

  row.eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });
  row.height = 22;
};

/**
 * Apply freeze header + auto-filter (common sheet-level settings)
 * @param {ExcelJS.Worksheet} sheet
 */
const applySheetDefaults = (sheet) => {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };
};

module.exports = {
  applyHeaderStyle,
  applyStatusTextColor,
  applyRowStyle,
  applySheetDefaults,
};