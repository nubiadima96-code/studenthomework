# Кабінет Гудими · РЕГІК

Студентський кабінет: вхід → предмети → теми по черзі → книжка → тест (мінімум 7/10).

## Локально

```bash
cd site
python3 -m http.server 8765
```

Або двічі клацни `site/Відкрити кабінет.command`.

Відкрий: http://127.0.0.1:8765/

## Vercel

Імпорт репозиторію на [vercel.com](https://vercel.com).

**Варіант А (найчистіший):** у Project Settings → General → **Root Directory** постав `site`. Framework: Other. Увімкни **Git LFS**.

**Варіант Б:** без Root Directory — у корені є `vercel.json`, який віддає папку `site` на `/`.

## Google Таблиця (прогрес)

Код: `site/sheets-script.gs`  
URL вебзастосунку встав у `site/config.js` → `SHEETS_WEBAPP_URL`.

## Предмети

- Захист України
- Лікувальна фізкультура
- Анатомія людини
