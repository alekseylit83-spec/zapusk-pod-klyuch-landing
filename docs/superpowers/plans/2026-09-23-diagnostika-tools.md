# Два опросника-демо: бриф для открытия и диагностика для действующего — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить на лендинг два самостоятельных статических инструмента —
`otkrytie.html` (сокращённый бриф для тех, кто открывает заведение) и
`diagnostika.html` (диагностика для тех, у кого заведение уже работает) — с
шаг-визардом, сохранением прогресса в браузере и отправкой результата в
Telegram через deep link, плюс новый блок с двумя кнопками на `index.html`.

**Architecture:** Два независимых HTML-файла, каждый — сам себе движок:
файл с чистыми функциями (`*-logic.js`, конфигурация шагов, сборка текста,
работа с `localStorage`) плюс сам HTML-файл со встроенным `<style>` и
`<script>`, который рисует шаг-визард и вызывает функции из `*-logic.js`.
Между `otkrytie.*` и `diagnostika.*` код не шарится — это осознанное решение
из спеки. `index.html` получает один новый блок с двумя кнопками.

**Tech Stack:** Чистый HTML/CSS/JS (ES5-совместимый синтаксис, без
модулей/сборки), `localStorage`, Telegram deep link. Никаких внешних
библиотек, шрифтов или запросов.

**Spec:** `docs/superpowers/specs/2026-09-23-diagnostika-tools-design.md`

## Важно про тестирование в этом окружении

В этом окружении **нет Node.js, npm и браузерного автоматизатора**
(проверено: `node`, `npm`, `npx`, `deno`, `bun` не найдены). Это не
отступление от спеки, а причина, по которой спека изначально фиксирует
«Ручная проверка… автоматических тестов не пишем» — здесь физически нечем
их запускать. Поэтому вместо шагов «написать тест → запустить → увидеть
red → реализовать → увидеть green» каждая задача заканчивается **шагом
ручной проверки в реальном браузере** — конкретным пронумерованным
чек-листом. Тот, кто выполняет план (включая меня в этой же сессии), не
может сам открыть браузер и прогнать чек-лист — это должен сделать человек
на своей машине. После реализации каждой задачи нужно явно попросить
Алексея открыть файл и пройти чек-лист, и зафиксировать результат, а не
заявлять «работает» без этого шага.

## Global Constraints

- Только статика: HTML, CSS, JS в браузере — никакого сервера, backend, БД.
- Никаких API-ключей и обращений к платным сервисам.
- Никаких библиотек и шрифтов, подгружаемых из интернета.
- Никакой сборки — файл открывается напрямую (`file://`) и работает, в том
  числе офлайн.
- Должно работать с телефона: один вопрос на экран, прогресс-бар, крупные
  кнопки.
- `otkrytie.*` и `diagnostika.*` — независимые пары файлов, механика
  (визард, `localStorage`, копирование, deep link) не шарится между ними.
- Отправка результата — только через Telegram deep link
  `https://t.me/AlekseyResto?text=<encodeURIComponent(текст)>`, без
  бот-токена и без backend-прокси (см. спеку, раздел «Отправка в Telegram»).
- Ни один шаг визарда не обязателен — «Далее» никогда не блокируется
  пустым полем.

## Review Focus

- Пустой прогон (на каждом шаге сразу жмут «Далее», ничего не выбирая) —
  итоговый текст не должен содержать «undefined» или пустые строки вида
  «Формат: ».
- `localStorage` недоступен (приватное окно / заблокирован) — форма должна
  продолжать работать, без падения в консоли, просто без восстановления
  прогресса при повторном визите.
- Несколько «красных» пунктов диагностики одновременно — «Главный риск»
  должен детерминированно показывать один и тот же (первый по списку)
  пункт при одинаковых ответах, а не случайный/последний.
- Спецсимволы в свободном тексте (кавычки, амперсанд, тире — их вводят в
  полях адреса, режима работы, заполняемости по часам) не должны ломать
  разметку страницы при повторном рендере поля.
- Возврат назад к вопросу «Есть ли уже помещение» и смена ответа с «Да» на
  «Нет» (или обратно) должны корректно переключать следующий шаг
  (параметры помещения ↔ приоритеты локации), без зависания на скрытом шаге.

---

## Файловая структура

- Создать: `otkrytie-logic.js` — конфигурация шагов брифа, сборка текста,
  `localStorage`-обёртки, сборка Telegram-ссылки.
- Создать: `otkrytie.html` — разметка, стили (токены как в `index.html`),
  шаг-визард, подключает `otkrytie-logic.js`.
- Создать: `diagnostika-logic.js` — конфигурация шагов диагностики, шкала
  цветов, сборка сводки и текста, те же `localStorage`-обёртки и
  Telegram-ссылка (код не шарится с `otkrytie-logic.js`).
- Создать: `diagnostika.html` — разметка, стили, шаг-визард, подключает
  `diagnostika-logic.js`.
- Изменить: `index.html` — новый блок с двумя кнопками перед секцией
  `#contact` (после строки 478), плюс несколько правил CSS перед
  `/* CTA */` (строка 305).

---

### Task 1: Бриф для открытия — `otkrytie-logic.js` + `otkrytie.html`

**Files:**
- Create: `otkrytie-logic.js`
- Create: `otkrytie.html`

**Interfaces:**
- Produces (глобальные имена, объявленные в `otkrytie-logic.js` через
  `const`/`function` на верхнем уровне классического `<script>` — такие
  объявления видны последующим `<script>`-тегам на той же странице, это
  стандартное поведение, не требует `window.x = …`):
  - `OTKRYTIE_STEPS` — массив шагов `{ id, label, type, options? }`, где
    `type` ∈ `'single' | 'multi' | 'yesno' | 'concept' | 'placeDetails'`.
  - `isStepVisible(stepId, answers) -> boolean`
  - `buildBriefText(answers) -> string`
  - `buildTelegramLink(text) -> string`
  - `saveAnswers(storage, key, answers) -> boolean`
  - `loadAnswers(storage, key) -> object`

- [ ] **Step 1: Написать `otkrytie-logic.js`**

```js
// otkrytie-logic.js
// Чистые функции для брифа "открытие заведения". Без обращения к DOM —
// otkrytie.html подключает этот файл через <script src>, объявления верхнего
// уровня (const/function) видны следующему <script> на той же странице.

var TELEGRAM_USERNAME = 'AlekseyResto';

var OTKRYTIE_STEPS = [
  {
    id: 'goal',
    label: 'Зачем открываете',
    type: 'single',
    options: [
      'Инвестиционный проект',
      'Бизнес, которым хочу заниматься лично',
      'Создание своего бренда',
      'Проект для последующей продажи',
      'Имиджевый проект',
      'Семейный бизнес',
      'Другое'
    ]
  },
  {
    id: 'format',
    label: 'Что хотите открыть',
    type: 'single',
    options: ['Ресторан', 'Бар', 'Паб', 'Кафе', 'Бистро', 'Ночной клуб', 'Ресторан + бар', 'Другое']
  },
  {
    id: 'concept',
    label: 'Концепция одной фразой',
    type: 'concept'
  },
  {
    id: 'hasPlace',
    label: 'Есть ли уже помещение',
    type: 'yesno'
  },
  {
    id: 'placeDetails',
    label: 'Параметры помещения',
    type: 'placeDetails'
  },
  {
    id: 'locationPriorities',
    label: 'Что важно при выборе локации',
    type: 'multi',
    options: ['Пешеходный трафик', 'Автомобильный трафик', 'Туристический поток', 'Офисный кластер', 'Жилой район', 'Ночная жизнь', 'Торговый центр']
  },
  {
    id: 'involvement',
    label: 'Насколько лично готовы участвовать в операционке',
    type: 'single',
    options: ['Полностью управляю сам', 'Участвую стратегически', 'Не участвую в операционке', 'Пока не определился']
  },
  {
    id: 'breakEven',
    label: 'Желаемый срок выхода на операционную прибыль',
    type: 'single',
    options: ['До 6 месяцев', '6–12 месяцев', '12–24 месяца', 'Пока не знаю']
  },
  {
    id: 'network',
    label: 'Планируется сеть',
    type: 'single',
    options: ['Одна самостоятельная точка', 'Несколько собственных заведений', 'Сеть', 'Франшиза в дальнейшем', 'Пока не определено']
  }
];

function isStepVisible(stepId, answers) {
  if (stepId === 'placeDetails') return answers.hasPlace === 'Да';
  if (stepId === 'locationPriorities') return answers.hasPlace === 'Нет';
  return true;
}

function buildBriefText(answers) {
  var lines = ['Бриф по проекту (с сайта, направление «открытие»)', ''];

  if (answers.goal) {
    var goalText = (answers.goal === 'Другое' && answers.goalCustom) ? ('Другое: ' + answers.goalCustom) : answers.goal;
    lines.push('Зачем открывает: ' + goalText);
  }
  if (answers.format) {
    var formatText = (answers.format === 'Другое' && answers.formatCustom) ? ('Другое: ' + answers.formatCustom) : answers.format;
    lines.push('Формат: ' + formatText);
  }

  var c = answers.concept || {};
  if (c.forWhom || c.audience || c.result) {
    lines.push('Концепция: Мы создаём ' + (c.forWhom || '___') + ' для ' +
      (c.audience || '___') + ', где гости получают ' + (c.result || '___'));
  }

  if (answers.hasPlace === 'Да') {
    var d = answers.placeDetails || {};
    var parts = [];
    if (d.address) parts.push(d.address);
    if (d.area) parts.push(d.area + ' м²');
    if (d.seats) parts.push(d.seats + ' посадочных мест');
    lines.push('Помещение: есть' + (parts.length ? ' — ' + parts.join(', ') : ''));
  } else if (answers.hasPlace === 'Нет') {
    lines.push('Помещение: ещё не выбрано');
    if (answers.locationPriorities && answers.locationPriorities.length) {
      lines.push('Важно при выборе локации: ' + answers.locationPriorities.join(', '));
    }
  }

  if (answers.involvement) lines.push('Участие в операционке: ' + answers.involvement);
  if (answers.breakEven) lines.push('Срок выхода на операционную прибыль: ' + answers.breakEven);
  if (answers.network) lines.push('Сеть: ' + answers.network);

  return lines.join('\n');
}

function buildTelegramLink(text) {
  return 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + encodeURIComponent(text);
}

function saveAnswers(storage, key, answers) {
  try {
    storage.setItem(key, JSON.stringify(answers));
    return true;
  } catch (e) {
    return false;
  }
}

function loadAnswers(storage, key) {
  try {
    var raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
```

- [ ] **Step 2: Написать `otkrytie.html`**

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Бриф для открытия заведения — Минск</title>
<style>
  :root {
    --bg-dark: #1c1a17;
    --text-dark: #f4f1ec;
    --text-muted-dark: #b8b1a8;
    --accent: #b5502d;
    --accent-light: #d97a52;
    --radius: 14px;
    --max-width: 640px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg-dark);
    color: var(--text-dark);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: var(--max-width); margin: 0 auto; padding: 32px 20px 64px; }
  .back-link { display: inline-block; color: var(--text-muted-dark); text-decoration: none; font-size: 14px; margin-bottom: 24px; }
  .back-link:hover { color: var(--text-dark); }
  .progress-track { height: 6px; background: rgba(255,255,255,0.12); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
  .progress-fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .progress-label { font-size: 13px; color: var(--text-muted-dark); margin-bottom: 28px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius); padding: 28px; }
  .card h2 { margin: 0 0 20px; font-size: 22px; }
  .options { display: grid; gap: 10px; }
  .option {
    display: block; width: 100%; text-align: left; background: transparent;
    border: 1px solid rgba(255,255,255,0.16); color: var(--text-dark);
    border-radius: 10px; padding: 14px 16px; font-size: 15px; cursor: pointer; font-family: inherit;
  }
  .option.selected { border-color: var(--accent); background: rgba(181,80,45,0.18); }
  .field { display: block; margin-bottom: 16px; }
  .field label { display: block; font-size: 13px; color: var(--text-muted-dark); margin-bottom: 6px; }
  .field input {
    width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px; padding: 12px 14px; color: var(--text-dark); font-size: 15px; font-family: inherit;
  }
  .nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; gap: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #fff; border: none;
    padding: 13px 24px; border-radius: 999px; font-size: 15px; font-weight: 600; text-decoration: none; cursor: pointer; font-family: inherit; }
  .btn:hover { background: var(--accent-light); }
  .btn[disabled] { opacity: 0.4; cursor: default; pointer-events: none; }
  .btn-ghost { background: transparent; color: var(--text-muted-dark); border: 1px solid rgba(255,255,255,0.16); }
  .btn-ghost:hover { color: var(--text-dark); border-color: rgba(255,255,255,0.3); }
  .result-text { white-space: pre-wrap; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--radius); padding: 20px; font-size: 14.5px; margin: 20px 0; }
  .note { font-size: 13px; color: var(--text-muted-dark); margin-top: 16px; }
</style>
</head>
<body>
<div class="wrap">
  <a class="back-link" href="index.html">‹ На главную</a>
  <div id="app"></div>
</div>
<script src="otkrytie-logic.js"></script>
<script>
(function () {
  var STORAGE_KEY = 'otkrytie-answers-v1';
  var app = document.getElementById('app');
  var answers = loadAnswers(window.localStorage, STORAGE_KEY);
  var currentIndex = 0;

  function visibleSteps() {
    return OTKRYTIE_STEPS.filter(function (s) { return isStepVisible(s.id, answers); });
  }

  function persist() { saveAnswers(window.localStorage, STORAGE_KEY, answers); }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function optionsFor(step) {
    return step.type === 'yesno' ? ['Да', 'Нет'] : step.options;
  }

  function renderOptionsHtml(step) {
    var current = answers[step.id];
    var multi = step.type === 'multi';
    var opts = optionsFor(step);
    var html = '<div class="options">';
    opts.forEach(function (opt) {
      var selected = multi ? (current || []).indexOf(opt) !== -1 : current === opt;
      html += '<button type="button" class="option' + (selected ? ' selected' : '') +
        '" data-value="' + escapeAttr(opt) + '">' + opt + '</button>';
    });
    html += '</div>';
    if (step.type === 'single' && current === 'Другое') {
      html += '<div class="field"><label>Уточните</label>' +
        '<input type="text" id="f-other" value="' + escapeAttr(answers[step.id + 'Custom'] || '') + '"></div>';
    }
    return html;
  }

  function renderConceptHtml() {
    var c = answers.concept || {};
    return (
      '<div class="field"><label>Мы создаём</label>' +
      '<input type="text" id="f-forWhom" value="' + escapeAttr(c.forWhom || '') + '"></div>' +
      '<div class="field"><label>для</label>' +
      '<input type="text" id="f-audience" value="' + escapeAttr(c.audience || '') + '"></div>' +
      '<div class="field"><label>где гости получают</label>' +
      '<input type="text" id="f-result" value="' + escapeAttr(c.result || '') + '"></div>'
    );
  }

  function renderPlaceDetailsHtml() {
    var d = answers.placeDetails || {};
    return (
      '<div class="field"><label>Адрес / район</label>' +
      '<input type="text" id="f-address" value="' + escapeAttr(d.address || '') + '"></div>' +
      '<div class="field"><label>Площадь, м²</label>' +
      '<input type="text" id="f-area" value="' + escapeAttr(d.area || '') + '"></div>' +
      '<div class="field"><label>Посадочных мест</label>' +
      '<input type="text" id="f-seats" value="' + escapeAttr(d.seats || '') + '"></div>'
    );
  }

  function bindOptionClicks(step) {
    var multi = step.type === 'multi';
    var buttons = app.querySelectorAll('.option');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var value = e.currentTarget.getAttribute('data-value');
        if (multi) {
          var list = (answers[step.id] || []).slice();
          var idx = list.indexOf(value);
          if (idx === -1) list.push(value); else list.splice(idx, 1);
          answers[step.id] = list;
          persist();
          renderCurrent();
        } else if (step.type === 'single' && value === 'Другое') {
          // "Другое" на одиночном выборе не продвигает визард дальше —
          // сперва нужно показать поле свободного текста и дождаться "Далее".
          answers[step.id] = value;
          persist();
          renderCurrent();
        } else {
          answers[step.id] = value;
          persist();
          goNext();
        }
      });
    }
  }

  function bindOtherInput(step) {
    var input = document.getElementById('f-other');
    if (!input) return;
    input.addEventListener('input', function (e) {
      answers[step.id + 'Custom'] = e.target.value;
      persist();
    });
  }

  function bindConceptInputs() {
    ['forWhom', 'audience', 'result'].forEach(function (key) {
      document.getElementById('f-' + key).addEventListener('input', function (e) {
        answers.concept = answers.concept || {};
        answers.concept[key] = e.target.value;
        persist();
      });
    });
  }

  function bindPlaceDetailsInputs() {
    ['address', 'area', 'seats'].forEach(function (key) {
      document.getElementById('f-' + key).addEventListener('input', function (e) {
        answers.placeDetails = answers.placeDetails || {};
        answers.placeDetails[key] = e.target.value;
        persist();
      });
    });
  }

  function copyText(text, button) {
    var original = button.textContent;
    function done() {
      button.textContent = 'Скопировано';
      setTimeout(function () { button.textContent = original; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  function renderResult() {
    var text = buildBriefText(answers);
    var link = buildTelegramLink(text);
    app.innerHTML =
      '<div class="card"><h2>Ваш бриф готов</h2>' +
      '<div class="result-text" id="result-text"></div>' +
      '<a class="btn" href="' + link + '" target="_blank" rel="noopener">Отправить вам в Telegram →</a> ' +
      '<button type="button" class="btn btn-ghost" id="btn-copy">Скопировать текст</button>' +
      '<div class="note">Ответы остаются в этом окне, пока вы не нажмёте «Отправить» — тогда откроется Telegram с готовым текстом, и уходит только то, что вы подтвердите.</div>' +
      '</div>' +
      '<div class="nav-row"><button type="button" class="btn btn-ghost" id="btn-back">Назад</button><span></span></div>';
    document.getElementById('result-text').textContent = text;
    document.getElementById('btn-copy').addEventListener('click', function () {
      copyText(text, document.getElementById('btn-copy'));
    });
    document.getElementById('btn-back').addEventListener('click', function () {
      currentIndex = visibleSteps().length - 1;
      renderCurrent();
    });
  }

  function goNext() {
    var steps = visibleSteps();
    if (currentIndex < steps.length - 1) currentIndex++;
    else currentIndex = steps.length;
    renderCurrent();
  }

  function goBack() {
    if (currentIndex > 0) { currentIndex--; renderCurrent(); }
  }

  function renderCurrent() {
    var steps = visibleSteps();
    if (currentIndex > steps.length) currentIndex = steps.length;
    if (currentIndex >= steps.length) { renderResult(); return; }

    var step = steps[currentIndex];
    var body;
    if (step.type === 'single' || step.type === 'multi' || step.type === 'yesno') body = renderOptionsHtml(step);
    else if (step.type === 'concept') body = renderConceptHtml();
    else if (step.type === 'placeDetails') body = renderPlaceDetailsHtml();

    var pct = Math.round((currentIndex / steps.length) * 100);
    app.innerHTML =
      '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="progress-label">Шаг ' + (currentIndex + 1) + ' из ' + steps.length + '</div>' +
      '<div class="card"><h2>' + step.label + '</h2>' + body + '</div>' +
      '<div class="nav-row">' +
        '<button type="button" class="btn btn-ghost" id="btn-back"' + (currentIndex === 0 ? ' disabled' : '') + '>Назад</button>' +
        (step.type === 'multi' || step.type === 'concept' || step.type === 'placeDetails' ||
          (step.type === 'single' && answers[step.id] === 'Другое')
          ? '<button type="button" class="btn" id="btn-next">Далее</button>'
          : '<span></span>') +
      '</div>';

    if (step.type === 'single' || step.type === 'multi' || step.type === 'yesno') bindOptionClicks(step);
    if (step.type === 'concept') bindConceptInputs();
    if (step.type === 'placeDetails') bindPlaceDetailsInputs();
    if (step.type === 'single' && answers[step.id] === 'Другое') bindOtherInput(step);

    document.getElementById('btn-back').addEventListener('click', goBack);
    var nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.addEventListener('click', goNext);
  }

  renderCurrent();
})();
</script>
</body>
</html>
```

- [ ] **Step 3: Ручная проверка в браузере (попросить Алексея выполнить и подтвердить результат)**

Открыть `otkrytie.html` напрямую с диска (двойным кликом или `file://…`) и
проверить:

1. Страница открывается без ошибок в консоли (DevTools → Console).
2. Прогресс-бар и подпись «Шаг N из 8» двигаются при переходах вперёд/назад.
3. На шаге «Есть ли уже помещение» выбор «Да» ведёт на шаг «Параметры
   помещения», выбор «Нет» — на шаг «Что важно при выборе локации» (шаг 5
   из Review Focus).
4. Нажать «Назад» на шаге параметров помещения и переключить ответ на
   предыдущем шаге с «Да» на «Нет» — следующий шаг должен смениться
   корректно, без зависания.
5. Пройти визард до конца, ничего не выбирая (везде сразу «Далее» —
   недоступно для одиночного выбора, поэтому просто проверить шаги
   concept/placeDetails/multi пустыми) — итоговый текст не должен содержать
   «undefined» (Review Focus, пункт 1).
6. В поле «Адрес / район» ввести текст с кавычками и амперсандом (например
   `«У Речки» & сыновья`) — убедиться, что страница не ломается визуально
   при возврате на этот шаг (Review Focus, пункт 4).
6a. На шаге «Зачем открываете» выбрать «Другое» — визард не должен сразу
   перейти дальше, должно появиться поле «Уточните» и кнопка «Далее».
   Ввести текст, нажать «Далее», на финальном экране должна быть строка
   «Зачем открывает: Другое: <ваш текст>».
7. Заполнить все шаги реальными значениями, на финальном экране сверить
   текст с примером из спеки.
8. Нажать «Отправить вам в Telegram →» — должен открыться Telegram
   (приложение или веб) с предзаполненным текстом.
9. Нажать «Скопировать текст» и вставить в любое поле — текст должен
   совпасть с тем, что показан на экране.
10. Закрыть вкладку на середине прохождения и открыть файл заново — форма
    должна восстановить сохранённые ответы (открыть DevTools → Application
    → Local Storage, убедиться, что ключ `otkrytie-answers-v1` есть).
11. Открыть DevTools → Application → Local Storage → заблокировать (или
    открыть страницу в приватном окне) — форма должна работать, просто без
    восстановления прогресса, без ошибок в консоли (Review Focus, пункт 2).
12. Проверить на экране шириной 375px (DevTools → Toggle device toolbar →
    iPhone SE) — кнопки и текст не должны обрезаться.

- [ ] **Step 4: Commit**

```bash
git add otkrytie-logic.js otkrytie.html
git commit -m "Добавить бриф-опросник для открытия заведения

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Диагностика для действующего заведения — `diagnostika-logic.js` + `diagnostika.html`

**Files:**
- Create: `diagnostika-logic.js`
- Create: `diagnostika.html`

**Interfaces:**
- Produces (глобальные имена по тому же принципу, что в Task 1):
  - `PRACTICE_ITEMS` — массив `{ id, label }`, 7 пунктов раздела А.
  - `SCALE_OPTIONS` — массив `{ value, label }`, 4 варианта шкалы.
  - `DIAGNOSTIKA_STEPS` — массив шагов `{ id, label, type, options?, group }`,
    где `type` ∈ `'scale' | 'multi' | 'text' | 'number'`,
    `group` ∈ `'practices' | 'snapshot' | 'root'`.
  - `getAnswer(answers, step) -> any`
  - `setAnswer(answers, step, value) -> void` (мутирует `answers`)
  - `colorForAnswer(scaleValue) -> 'green' | 'yellow' | 'red' | null`
  - `buildSummary(answers) -> { green, yellow, red, mainRisk }`
  - `formatRevenueDeviation(value) -> string | null`
  - `buildDiagnosticText(answers) -> string`
  - `buildTelegramLink(text) -> string`
  - `saveAnswers(storage, key, answers) -> boolean`
  - `loadAnswers(storage, key) -> object`
- Не использует и не переиспользует ничего из `otkrytie-logic.js` (сознательно
  независимый код, см. спеку).

- [ ] **Step 1: Написать `diagnostika-logic.js`**

```js
// diagnostika-logic.js
// Чистые функции для диагностики действующего заведения. Не переиспользует
// код otkrytie-logic.js — независимая пара файлов по решению из спеки.

var TELEGRAM_USERNAME = 'AlekseyResto';

var PRACTICE_ITEMS = [
  { id: 'foodcost', label: 'Фудкост и маржинальность меню' },
  { id: 'shifts', label: 'Планирование смен и текучка персонала' },
  { id: 'standards', label: 'Стандарты и чек-листы открытия/закрытия смены' },
  { id: 'reporting', label: 'Финансовая отчётность перед вами (P&L, кассовые разрывы)' },
  { id: 'hiring', label: 'Найм и обучение новых сотрудников' },
  { id: 'marketing', label: 'Маркетинг и заполняемость / повторные визиты' },
  { id: 'abc', label: 'Меню разбирается по ABC-анализу' }
];

var SCALE_OPTIONS = [
  { value: 'green', label: 'Под контролем без меня' },
  { value: 'yellow-self', label: 'Держится, пока слежу лично' },
  { value: 'yellow-unknown', label: 'Не измеряю / не слежу' },
  { value: 'red', label: 'Не под контролем' }
];

var DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

var DIAGNOSTIKA_STEPS = PRACTICE_ITEMS.map(function (item) {
  return { id: item.id, label: item.label, type: 'scale', group: 'practices' };
}).concat([
  { id: 'revenueDeviation', label: 'На сколько процентов факт по выручке отличается от плана в последнем завершённом месяце?', type: 'number', group: 'root' },
  { id: 'hours', label: 'Режим работы', type: 'text', group: 'snapshot' },
  { id: 'menuFormat', label: 'Формат меню', type: 'multi', group: 'snapshot', options: ['Завтраки', 'Бранчи', 'Бизнес-ланч (обеды)', 'Основное меню', 'Бар и напитки', 'Десерты', 'Другое'] },
  { id: 'strongDays', label: 'Сильные дни недели', type: 'multi', group: 'snapshot', options: DAYS },
  { id: 'weakDays', label: 'Слабые дни недели', type: 'multi', group: 'snapshot', options: DAYS },
  { id: 'hourlyLoad', label: 'Заполняемость по часам', type: 'text', group: 'snapshot' }
]);

function getAnswer(answers, step) {
  if (step.group === 'practices') return (answers.practices || {})[step.id];
  if (step.group === 'snapshot') return (answers.snapshot || {})[step.id];
  return answers[step.id];
}

function setAnswer(answers, step, value) {
  if (step.group === 'practices') {
    answers.practices = answers.practices || {};
    answers.practices[step.id] = value;
  } else if (step.group === 'snapshot') {
    answers.snapshot = answers.snapshot || {};
    answers.snapshot[step.id] = value;
  } else {
    answers[step.id] = value;
  }
}

function colorForAnswer(scaleValue) {
  if (scaleValue === 'green') return 'green';
  if (scaleValue === 'red') return 'red';
  if (scaleValue === 'yellow-self' || scaleValue === 'yellow-unknown') return 'yellow';
  return null;
}

function buildSummary(answers) {
  var practices = answers.practices || {};
  var green = 0, yellow = 0, red = 0;
  var firstRed = null, firstYellow = null;

  for (var i = 0; i < PRACTICE_ITEMS.length; i++) {
    var item = PRACTICE_ITEMS[i];
    var color = colorForAnswer(practices[item.id]);
    if (color === 'green') green++;
    else if (color === 'yellow') { yellow++; if (!firstYellow) firstYellow = item; }
    else if (color === 'red') { red++; if (!firstRed) firstRed = item; }
  }

  var mainRisk = null;
  if (firstRed) {
    mainRisk = firstRed.label + ' — не под контролем';
  } else if (firstYellow) {
    mainRisk = firstYellow.label + ' — то, что развалится в ваш первый отпуск';
  } else if (green > 0) {
    mainRisk = 'Явных слабых мест по этим семи пунктам не видно';
  }

  return { green: green, yellow: yellow, red: red, mainRisk: mainRisk };
}

function formatRevenueDeviation(value) {
  if (value === undefined || value === null || value === '') return null;
  var num = Number(value);
  if (isNaN(num)) return null;
  var sign = num > 0 ? '+' : '';
  return sign + num + '%';
}

function buildDiagnosticText(answers) {
  var summary = buildSummary(answers);
  var practices = answers.practices || {};
  var lines = ['Диагностика заведения (с сайта, направление «действующее»)', ''];

  var answeredCount = summary.green + summary.yellow + summary.red;
  if (answeredCount > 0) {
    lines.push('Под контролем без меня: ' + summary.green + ' из ' + answeredCount);
    lines.push('Держится на мне / не измеряю: ' + summary.yellow);
    lines.push('Не под контролем: ' + summary.red);
    lines.push('');
  }

  if (summary.mainRisk) {
    lines.push('Главный риск: ' + summary.mainRisk);
    lines.push('');
  }

  for (var i = 0; i < PRACTICE_ITEMS.length; i++) {
    var item = PRACTICE_ITEMS[i];
    var scaleValue = practices[item.id];
    if (!scaleValue) continue;
    var option = null;
    for (var j = 0; j < SCALE_OPTIONS.length; j++) {
      if (SCALE_OPTIONS[j].value === scaleValue) { option = SCALE_OPTIONS[j]; break; }
    }
    lines.push(item.label + ': ' + (option ? option.label : scaleValue));
  }

  var revenue = formatRevenueDeviation(answers.revenueDeviation);
  if (revenue) {
    lines.push('');
    lines.push('План-факт по выручке: ' + revenue);
  }

  var snapshot = answers.snapshot || {};
  var snapshotLines = [];
  if (snapshot.hours) snapshotLines.push('Режим работы: ' + snapshot.hours);
  if (snapshot.menuFormat && snapshot.menuFormat.length) snapshotLines.push('Формат меню: ' + snapshot.menuFormat.join(', '));
  if (snapshot.strongDays && snapshot.strongDays.length) snapshotLines.push('Сильные дни: ' + snapshot.strongDays.join(', '));
  if (snapshot.weakDays && snapshot.weakDays.length) snapshotLines.push('Слабые дни: ' + snapshot.weakDays.join(', '));
  if (snapshot.hourlyLoad) snapshotLines.push('Заполняемость по часам: ' + snapshot.hourlyLoad);

  if (snapshotLines.length) {
    lines.push('');
    for (var k = 0; k < snapshotLines.length; k++) lines.push(snapshotLines[k]);
  }

  return lines.join('\n');
}

function buildTelegramLink(text) {
  return 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + encodeURIComponent(text);
}

function saveAnswers(storage, key, answers) {
  try {
    storage.setItem(key, JSON.stringify(answers));
    return true;
  } catch (e) {
    return false;
  }
}

function loadAnswers(storage, key) {
  try {
    var raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
```

- [ ] **Step 2: Написать `diagnostika.html`**

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Диагностика заведения — Минск</title>
<style>
  :root {
    --bg-dark: #1c1a17;
    --text-dark: #f4f1ec;
    --text-muted-dark: #b8b1a8;
    --accent: #b5502d;
    --accent-light: #d97a52;
    --radius: 14px;
    --max-width: 640px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg-dark);
    color: var(--text-dark);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: var(--max-width); margin: 0 auto; padding: 32px 20px 64px; }
  .back-link { display: inline-block; color: var(--text-muted-dark); text-decoration: none; font-size: 14px; margin-bottom: 24px; }
  .back-link:hover { color: var(--text-dark); }
  .progress-track { height: 6px; background: rgba(255,255,255,0.12); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
  .progress-fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .progress-label { font-size: 13px; color: var(--text-muted-dark); margin-bottom: 28px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius); padding: 28px; }
  .card h2 { margin: 0 0 20px; font-size: 20px; }
  .options { display: grid; gap: 10px; }
  .option {
    display: block; width: 100%; text-align: left; background: transparent;
    border: 1px solid rgba(255,255,255,0.16); color: var(--text-dark);
    border-radius: 10px; padding: 14px 16px; font-size: 15px; cursor: pointer; font-family: inherit;
  }
  .option.selected { border-color: var(--accent); background: rgba(181,80,45,0.18); }
  .field { display: block; margin-bottom: 8px; }
  .field input {
    width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px; padding: 12px 14px; color: var(--text-dark); font-size: 15px; font-family: inherit;
  }
  .nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; gap: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #fff; border: none;
    padding: 13px 24px; border-radius: 999px; font-size: 15px; font-weight: 600; text-decoration: none; cursor: pointer; font-family: inherit; }
  .btn:hover { background: var(--accent-light); }
  .btn[disabled] { opacity: 0.4; cursor: default; pointer-events: none; }
  .btn-ghost { background: transparent; color: var(--text-muted-dark); border: 1px solid rgba(255,255,255,0.16); }
  .btn-ghost:hover { color: var(--text-dark); border-color: rgba(255,255,255,0.3); }
  .result-text { white-space: pre-wrap; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--radius); padding: 20px; font-size: 14.5px; margin: 20px 0; }
  .note { font-size: 13px; color: var(--text-muted-dark); margin-top: 8px; }
</style>
</head>
<body>
<div class="wrap">
  <a class="back-link" href="index.html">‹ На главную</a>
  <div id="app"></div>
</div>
<script src="diagnostika-logic.js"></script>
<script>
(function () {
  var STORAGE_KEY = 'diagnostika-answers-v1';
  var app = document.getElementById('app');
  var answers = loadAnswers(window.localStorage, STORAGE_KEY);
  var currentIndex = 0;

  function persist() { saveAnswers(window.localStorage, STORAGE_KEY, answers); }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function optionsFor(step) {
    return step.type === 'scale' ? SCALE_OPTIONS.map(function (o) { return o.label; }) : step.options;
  }

  function currentScaleLabel(step) {
    var raw = getAnswer(answers, step);
    if (!raw) return null;
    for (var i = 0; i < SCALE_OPTIONS.length; i++) {
      if (SCALE_OPTIONS[i].value === raw) return SCALE_OPTIONS[i].label;
    }
    return null;
  }

  function renderOptionsHtml(step) {
    var multi = step.type === 'multi';
    var current = multi ? (getAnswer(answers, step) || []) : (step.type === 'scale' ? currentScaleLabel(step) : getAnswer(answers, step));
    var opts = optionsFor(step);
    var html = '<div class="options">';
    opts.forEach(function (opt) {
      var selected = multi ? current.indexOf(opt) !== -1 : current === opt;
      html += '<button type="button" class="option' + (selected ? ' selected' : '') +
        '" data-value="' + escapeAttr(opt) + '">' + opt + '</button>';
    });
    html += '</div>';
    return html;
  }

  function renderTextHtml() {
    var value = getAnswer(answers, DIAGNOSTIKA_STEPS[currentIndex]) || '';
    return '<div class="field"><input type="text" id="f-input" value="' + escapeAttr(value) + '" placeholder="Например: Пн–Вс, 11:00–00:00"></div>';
  }

  function renderNumberHtml() {
    var value = getAnswer(answers, DIAGNOSTIKA_STEPS[currentIndex]);
    return '<div class="field"><input type="number" id="f-input" value="' + (value === undefined || value === null ? '' : value) + '" placeholder="Например: -15"></div>' +
      '<div class="note">Введите со знаком: минус — отстаём от плана, плюс — опережаем</div>';
  }

  function bindOptionClicks(step) {
    var multi = step.type === 'multi';
    var buttons = app.querySelectorAll('.option');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var label = e.currentTarget.getAttribute('data-value');
        if (multi) {
          var list = (getAnswer(answers, step) || []).slice();
          var idx = list.indexOf(label);
          if (idx === -1) list.push(label); else list.splice(idx, 1);
          setAnswer(answers, step, list);
          persist();
          renderCurrent();
        } else if (step.type === 'scale') {
          var found = null;
          for (var j = 0; j < SCALE_OPTIONS.length; j++) {
            if (SCALE_OPTIONS[j].label === label) { found = SCALE_OPTIONS[j]; break; }
          }
          setAnswer(answers, step, found.value);
          persist();
          goNext();
        } else {
          setAnswer(answers, step, label);
          persist();
          goNext();
        }
      });
    }
  }

  function bindTextInput(step) {
    document.getElementById('f-input').addEventListener('input', function (e) {
      setAnswer(answers, step, e.target.value);
      persist();
    });
  }

  function copyText(text, button) {
    var original = button.textContent;
    function done() {
      button.textContent = 'Скопировано';
      setTimeout(function () { button.textContent = original; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  function renderResult() {
    var text = buildDiagnosticText(answers);
    var link = buildTelegramLink(text);
    app.innerHTML =
      '<div class="card"><h2>Ваша диагностика готова</h2>' +
      '<div class="result-text" id="result-text"></div>' +
      '<a class="btn" href="' + link + '" target="_blank" rel="noopener">Отправить вам в Telegram →</a> ' +
      '<button type="button" class="btn btn-ghost" id="btn-copy">Скопировать текст</button>' +
      '<div class="note">Ответы остаются в этом окне, пока вы не нажмёте «Отправить» — тогда откроется Telegram с готовым текстом, и уходит только то, что вы подтвердите.</div>' +
      '</div>' +
      '<div class="nav-row"><button type="button" class="btn btn-ghost" id="btn-back">Назад</button><span></span></div>';
    document.getElementById('result-text').textContent = text;
    document.getElementById('btn-copy').addEventListener('click', function () {
      copyText(text, document.getElementById('btn-copy'));
    });
    document.getElementById('btn-back').addEventListener('click', function () {
      currentIndex = DIAGNOSTIKA_STEPS.length - 1;
      renderCurrent();
    });
  }

  function goNext() {
    if (currentIndex < DIAGNOSTIKA_STEPS.length - 1) currentIndex++;
    else currentIndex = DIAGNOSTIKA_STEPS.length;
    renderCurrent();
  }

  function goBack() {
    if (currentIndex > 0) { currentIndex--; renderCurrent(); }
  }

  function renderCurrent() {
    if (currentIndex >= DIAGNOSTIKA_STEPS.length) { renderResult(); return; }
    var step = DIAGNOSTIKA_STEPS[currentIndex];
    var body;
    if (step.type === 'scale' || step.type === 'multi') body = renderOptionsHtml(step);
    else if (step.type === 'text') body = renderTextHtml();
    else if (step.type === 'number') body = renderNumberHtml();

    var pct = Math.round((currentIndex / DIAGNOSTIKA_STEPS.length) * 100);
    app.innerHTML =
      '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="progress-label">Шаг ' + (currentIndex + 1) + ' из ' + DIAGNOSTIKA_STEPS.length + '</div>' +
      '<div class="card"><h2>' + step.label + '</h2>' + body + '</div>' +
      '<div class="nav-row">' +
        '<button type="button" class="btn btn-ghost" id="btn-back"' + (currentIndex === 0 ? ' disabled' : '') + '>Назад</button>' +
        (step.type === 'multi' || step.type === 'text' || step.type === 'number'
          ? '<button type="button" class="btn" id="btn-next">Далее</button>' : '<span></span>') +
      '</div>';

    if (step.type === 'scale' || step.type === 'multi') bindOptionClicks(step);
    if (step.type === 'text' || step.type === 'number') bindTextInput(step);

    document.getElementById('btn-back').addEventListener('click', goBack);
    var nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.addEventListener('click', goNext);
  }

  renderCurrent();
})();
</script>
</body>
</html>
```

- [ ] **Step 3: Ручная проверка в браузере (попросить Алексея выполнить и подтвердить результат)**

Открыть `diagnostika.html` напрямую с диска и проверить:

1. Страница открывается без ошибок в консоли.
2. Ответить «Не под контролем» на два-три пункта раздела А (например,
   пункты 1 и 5) — на финальном экране «Главный риск» должен показать
   **первый** из отвеченных красных пунктов по порядку списка (пункт 1,
   «Фудкост»), а не последний нажатый (Review Focus, пункт 3). Повторить
   с теми же ответами после перезагрузки страницы — риск должен остаться
   тем же.
3. Оставить все 7 пунктов раздела А без ответа, заполнить только план-факт
   и снимок объекта — на финальном экране не должно быть строки «Главный
   риск» и строк подсчёта (Review Focus, пункт 1: пустые разделы не должны
   печататься как «undefined» или нули).
4. В поле «План-факт по выручке» ввести `-15`, затем на другом прогоне —
   `0`, затем оставить поле пустым — на финальном экране должно быть
   соответственно «-15%», «0%» и полное отсутствие строки «План-факт».
5. В поле «Режим работы» ввести текст с кавычками и амперсандом (например
   `«Бар & Кухня», Пн–Вс`) — вернуться на этот шаг назад и убедиться, что
   разметка страницы не ломается (Review Focus, пункт 4).
6. Пройти мультивыбор «Формат меню» и «Сильные/слабые дни» — убедиться,
   что можно снять выбранный пункт повторным нажатием.
7. На финальном экране сверить собранный текст с примером из спеки.
8. Нажать «Отправить вам в Telegram →» — открывается Telegram с текстом.
9. Нажать «Скопировать текст» — текст в буфере совпадает с показанным.
10. Закрыть и переоткрыть страницу — прогресс восстанавливается из
    `localStorage` (ключ `diagnostika-answers-v1`).
11. Открыть в приватном окне — форма работает без ошибок, просто без
    восстановления прогресса (Review Focus, пункт 2).
12. Проверить на ширине экрана 375px.

- [ ] **Step 4: Commit**

```bash
git add diagnostika-logic.js diagnostika.html
git commit -m "Добавить диагностику для действующего заведения

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Вход с лендинга — новый блок в `index.html`

**Files:**
- Modify: `index.html:305` (добавить CSS перед `/* CTA */`)
- Modify: `index.html:478-480` (добавить новую секцию между `</section>`
  блока «Чем это отличается» и `<section class="cta" id="contact">`)

**Interfaces:**
- Не вводит новых функций — только разметка и ссылки на `otkrytie.html` и
  `diagnostika.html`, которые уже существуют после Task 1 и Task 2.

- [ ] **Step 1: Добавить CSS для нового блока**

В `index.html` перед строкой `/* CTA */` (сейчас строка 305) добавить:

```css
  /* Tools */
  .tools-grid {
    margin-top: 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .btn-outline {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-outline:hover { background: var(--card-bg); border-color: var(--accent); color: var(--accent); }

```

И внутри существующего блока `@media (max-width: 720px) { ... }` (строки
322–329) добавить правило `.tools-grid { flex-direction: column; align-items: flex-start; }`
рядом с `.hero-actions { flex-direction: column; align-items: flex-start; gap: 14px; }`.

- [ ] **Step 2: Добавить секцию между «Чем это отличается» и «Что дальше»**

В `index.html` после строки `  </section>` (строка 478, закрывающей секцию
`class="diff"`) и перед `  <section class="cta" id="contact">` (строка 480)
вставить:

```html
  <section class="tools">
    <div class="wrap">
      <span class="kicker">Проверьте свой случай</span>
      <h2>Пройдите короткую диагностику — 5–7 минут</h2>
      <p class="lead">Ответы уходят напрямую в Telegram, без регистрации и без отправки на сервер.</p>
      <div class="tools-grid">
        <a class="btn" href="otkrytie.html">Я открываю заведение →</a>
        <a class="btn btn-outline" href="diagnostika.html">У меня уже работает заведение →</a>
      </div>
    </div>
  </section>

```

- [ ] **Step 3: Ручная проверка в браузере (попросить Алексея выполнить и подтвердить результат)**

1. Открыть `index.html`, долистать до нового блока между «Чем это
   отличается» и «Что дальше» — убедиться, что он визуально в стиле
   остального лендинга (светлый фон, те же отступы).
2. Нажать «Я открываю заведение →» — должен открыться `otkrytie.html`.
   Вернуться назад, нажать «У меня уже работает заведение →» — должен
   открыться `diagnostika.html`.
3. На каждой из новых страниц нажать «‹ На главную» — должен открыться
   `index.html`.
4. Проверить блок на ширине экрана 375px — кнопки должны встать друг под
   другом, не обрезаться.
5. Убедиться, что финальная секция «Что дальше» с прямой ссылкой на
   Telegram осталась без изменений.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Лендинг: добавить вход в бриф и диагностику

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
