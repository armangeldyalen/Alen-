import { MatchInfo } from '../types/game';

export const countries = ['Казахстан 🇰🇿', 'Франция 🇫🇷', 'Аргентина 🇦🇷', 'Бразилия 🇧🇷', 'Испания 🇪🇸', 'Германия 🇩🇪', 'Италия 🇮🇹', 'Англия 🏴', 'Португалия 🇵🇹', 'Нидерланды 🇳🇱', 'Бельгия 🇧🇪', 'Хорватия 🇭🇷', 'Япония 🇯🇵', 'Марокко 🇲🇦', 'Сенегал 🇸🇳', 'США 🇺🇸', 'Мексика 🇲🇽', 'Турция 🇹🇷', 'Украина 🇺🇦', 'Грузия 🇬🇪'];
export const celebrations = ['Скольжение на коленях', 'Прыжок с разворотом', 'Танец', 'Сальто', 'К болельщикам'];

const opponents = [
  ['Льеж Спорт', 'ЛС'], ['Антверпен Норд', 'АН'], ['Гент Олимпик', 'ГО'], ['Шарлеруа Юнион', 'ШЮ'],
  ['Брюгге Академи', 'БА'], ['Лёвен Сити', 'ЛС'], ['Намюр Атлетик', 'НА'], ['Монс 04', 'М4'],
  ['Роял Мадрид', 'РМ'], ['Манчестер Блю', 'МБ'], ['Милан Россо', 'МР'], ['Париж Голд', 'ПГ'],
];

export function makeSchedule(level: number): MatchInfo[] {
  return Array.from({ length: 8 }, (_, index) => {
    const current = level + index;
    const opponent = opponents[Math.min(opponents.length - 1, Math.floor((current - 1) / 2))];
    const cup = current % 5 === 0;
    const international = current % 7 === 0;
    return {
      level: current,
      opponent: international ? 'Сборная соперника' : opponent[0],
      badge: international ? '🌍' : opponent[1],
      power: Math.min(10, 1 + Math.floor((current + 1) / 3)),
      tournament: international ? 'Отбор сборных' : cup ? 'Кубок Бельгии' : '3-й дивизион Бельгии',
      kind: international ? 'international' : cup ? 'cup' : 'league',
    };
  });
}
