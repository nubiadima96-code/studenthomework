// Після публікації Apps Script встав сюди URL вебзастосунку.
// Поки порожньо — тести зберігаються на пристрої студента, у таблицю ще не летять.
const SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxJP98LTQO2sIZ1mig-9UmvryN-5OlekjU5XiS_atZeWEqkQHYYcy1saUSjDresJg6a/exec";

const PASS_SCORE = 7;
const GROUPS = ["11-П", "30-ФІЗ"];

// Лише великі LFS-файли тягнемо з GitHub media. Менші PDF лежать прямо на Vercel.
const BOOK_CDN =
  "https://media.githubusercontent.com/media/nubiadima96-code/studenthomework/main/site/books/";
const BOOK_CDN_FILES = ["zahyst.pdf"];
