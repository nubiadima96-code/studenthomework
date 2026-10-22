/**
 * Вставити в Google Таблицю відомості:
 * https://docs.google.com/spreadsheets/d/1fB_ANbRjxB45wj-WDUtWPEt4kGUw60Hd5JGVJPDlbX8eM/edit
 *
 * Розширення → Apps Script → вставити цей код → Зберегти.
 * Розгортання → Нове розгортання → Тип: вебзастосунок
 *   Виконувати від: мене
 *   Хто має доступ: усі
 * Скопіювати URL і вставити в сайт/config.js → SHEETS_WEBAPP_URL
 */

var SHEET_ID = "1fB_ANbRjxB45wj-WDUtWPEt4kGUw60Hd5JGVJPDlbX8eM";
var TAB = "Прогрес";

function ensureSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TAB);
  if (!sheet) {
    sheet = ss.insertSheet(TAB);
    sheet.appendRow([
      "Дата",
      "Група",
      "Ім’я",
      "Email",
      "Предмет",
      "Тема №",
      "Назва теми",
      "Бал",
      "З",
      "Письмова відповідь",
      "Статус",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var sheet = ensureSheet_();
    sheet.appendRow([
      new Date(),
      data.group || "",
      data.name || "",
      data.email || "",
      data.course || "",
      data.topicNum || "",
      data.topicTitle || "",
      data.score || "",
      data.total || "",
      data.write || "",
      data.status || "здано",
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  ensureSheet_();
  return ContentService.createTextOutput("Кабінет РЕГІК: прийом прогресу працює.");
}
