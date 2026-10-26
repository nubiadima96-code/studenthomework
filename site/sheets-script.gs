/**
 * Вставити в Google Таблицю відомості:
 * https://docs.google.com/spreadsheets/d/1Fyrgxv9SJ2vYa4z3rNbfqGSTgKzXPg4himX-G67CqPI/edit
 *
 * Розширення → Apps Script → вставити цей код → Зберегти.
 * Ввести в дію → оновити розгортання (тип: вебзастосунок)
 *   Виконувати від: мене
 *   Хто має доступ: усі
 *
 * Прогрес пишеться на окрему вкладку для кожної групи:
 *   «Прогрес 11-П», «Прогрес 30-ФІЗ»
 */

var SHEET_ID = "1Fyrgxv9SJ2vYa4z3rNbfqGSTgKzXPg4himX-G67CqPI";
var GROUPS = [
  "11-П",
  "22-ДО",
  "23-ПО",
  "24-КІ",
  "24-КІ-З",
  "25-ІПЗ",
  "25-ІПЗ-З",
  "26-СОС",
  "26-СОС-З",
  "30-ФІЗ",
  "32-ДО-К",
  "33-ПО",
  "35-ІПЗ",
  "35-ІПЗ-З",
  "36-Ю",
  "36-СОС",
  "37-СР",
  "43-ПО",
  "45-ІПЗ-К",
  "46-Ю-З-К",
];

function tabNameForGroup_(group) {
  var g = String(group || "").trim();
  if (!g) return "Прогрес";
  return "Прогрес " + g;
}

function ensureSheet_(group) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var tab = tabNameForGroup_(group);
  var sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
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
    var sheet = ensureSheet_(data.group);
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
    return ContentService.createTextOutput(JSON.stringify({ ok: true, tab: sheet.getName() })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  for (var i = 0; i < GROUPS.length; i++) {
    ensureSheet_(GROUPS[i]);
  }
  return ContentService.createTextOutput(
    "Кабінет РЕГІК: прогрес по групах — " + GROUPS.map(tabNameForGroup_).join(", ")
  );
}
