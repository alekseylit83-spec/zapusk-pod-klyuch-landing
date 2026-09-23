// diagnostika-logic.js
// Чистые функции для диагностики действующего заведения. Не переиспользует
// код otkrytie-logic.js — независимая пара файлов по решению из спеки.

var TELEGRAM_USERNAME = 'AlekseyResto';

var SCALE_QUESTION = 'Насколько это под контролем без вашего личного участия?';

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
  { id: 'hours', label: 'Режим работы', type: 'text', group: 'snapshot', placeholder: 'Например: Пн–Вс, 11:00–00:00' },
  { id: 'menuFormat', label: 'Формат меню', type: 'multi', group: 'snapshot', options: ['Завтраки', 'Бранчи', 'Бизнес-ланч (обеды)', 'Основное меню', 'Бар и напитки', 'Десерты', 'Другое'] },
  { id: 'strongDays', label: 'Сильные дни недели', type: 'multi', group: 'snapshot', options: DAYS },
  { id: 'weakDays', label: 'Слабые дни недели', type: 'multi', group: 'snapshot', options: DAYS },
  { id: 'hourlyLoad', label: 'Заполняемость по часам', type: 'text', group: 'snapshot', placeholder: 'Например: полно Пт–Сб 19:00–22:00, пусто днём в будни' }
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
