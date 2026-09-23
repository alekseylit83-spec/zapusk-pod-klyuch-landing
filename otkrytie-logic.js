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
  if (stepId === 'placeDetails') return answers.hasPlace !== 'Нет';
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
