// Після публікації Apps Script встав сюди URL вебзастосунку.
// Поки порожньо — тести зберігаються на пристрої студента, у таблицю ще не летять.
const SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxJP98LTQO2sIZ1mig-9UmvryN-5OlekjU5XiS_atZeWEqkQHYYcy1saUSjDresJg6a/exec";

const PASS_SCORE = 7;

// Групи зі списків студентів РЕГІК 2026–2027.
const GROUPS = [
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

// Лише великі LFS-файли тягнемо з GitHub media. Менші PDF лежать прямо на Vercel.
const BOOK_CDN =
  "https://media.githubusercontent.com/media/nubiadima96-code/studenthomework/main/site/books/";
const BOOK_CDN_FILES = ["zahyst.pdf"];
