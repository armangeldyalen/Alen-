import { MatchInfo } from '../types/game';

// The 48 officially qualified national teams for the 2026 World Cup.
export const countries = [
  'Казахстан 🇰🇿',
  'Канада 🇨🇦', 'Мексика 🇲🇽', 'США 🇺🇸',
  'Австралия 🇦🇺', 'Ирак 🇮🇶', 'Иран 🇮🇷', 'Япония 🇯🇵', 'Иордания 🇯🇴', 'Южная Корея 🇰🇷', 'Катар 🇶🇦', 'Саудовская Аравия 🇸🇦', 'Узбекистан 🇺🇿',
  'Алжир 🇩🇿', 'Кабо-Верде 🇨🇻', 'ДР Конго 🇨🇩', 'Кот-д’Ивуар 🇨🇮', 'Египет 🇪🇬', 'Гана 🇬🇭', 'Марокко 🇲🇦', 'Сенегал 🇸🇳', 'ЮАР 🇿🇦', 'Тунис 🇹🇳',
  'Кюрасао 🇨🇼', 'Гаити 🇭🇹', 'Панама 🇵🇦',
  'Аргентина 🇦🇷', 'Бразилия 🇧🇷', 'Колумбия 🇨🇴', 'Эквадор 🇪🇨', 'Парагвай 🇵🇾', 'Уругвай 🇺🇾',
  'Новая Зеландия 🇳🇿',
  'Австрия 🇦🇹', 'Бельгия 🇧🇪', 'Босния и Герцеговина 🇧🇦', 'Хорватия 🇭🇷', 'Чехия 🇨🇿', 'Англия 🏴', 'Франция 🇫🇷', 'Германия 🇩🇪', 'Нидерланды 🇳🇱', 'Норвегия 🇳🇴', 'Португалия 🇵🇹', 'Шотландия 🏴', 'Испания 🇪🇸', 'Швеция 🇸🇪', 'Швейцария 🇨🇭', 'Турция 🇹🇷',
];

export const teamStrength: Record<string, number> = Object.fromEntries(countries.map((team) => [team, 5]));
export const teamKitColors: Record<string, number> = Object.fromEntries(countries.map((team)=>[team,0xf2f2f2]));
teamKitColors['Казахстан 🇰🇿']=0x28a7df;
['Канада 🇨🇦','Южная Корея 🇰🇷','Катар 🇶🇦','Египет 🇪🇬','Гана 🇬🇭','Марокко 🇲🇦','Сенегал 🇸🇳','Тунис 🇹🇳','Гаити 🇭🇹','Панама 🇵🇦','Парагвай 🇵🇾','Швейцария 🇨🇭','Турция 🇹🇷','Австрия 🇦🇹','Бельгия 🇧🇪','Хорватия 🇭🇷','ДР Конго 🇨🇩','Португалия 🇵🇹','Испания 🇪🇸'].forEach((team)=>teamKitColors[team]=0xd92735);
['Япония 🇯🇵','США 🇺🇸','Франция 🇫🇷','Шотландия 🏴','Италия 🇮🇹','Босния и Герцеговина 🇧🇦','Кюрасао 🇨🇼'].forEach((team)=>teamKitColors[team]=0x1756a9);
['Мексика 🇲🇽','Ирак 🇮🇶','Саудовская Аравия 🇸🇦','Алжир 🇩🇿','ЮАР 🇿🇦'].forEach((team)=>teamKitColors[team]=0x16834b);
['Австралия 🇦🇺','Бразилия 🇧🇷','Колумбия 🇨🇴','Эквадор 🇪🇨','Швеция 🇸🇪'].forEach((team)=>teamKitColors[team]=0xf0c928);
['Аргентина 🇦🇷','Уругвай 🇺🇾'].forEach((team)=>teamKitColors[team]=0x75bce7);
['Нидерланды 🇳🇱','Кот-д’Ивуар 🇨🇮'].forEach((team)=>teamKitColors[team]=0xf07824);
export const teamAwayKitColors: Record<string,number>=Object.fromEntries(countries.map((team)=>[team,teamKitColors[team]>0xaaaaaa?0x172a55:0xf4f4f4]));
teamStrength['Казахстан 🇰🇿']=5;
['Аргентина 🇦🇷','Бразилия 🇧🇷','Франция 🇫🇷','Испания 🇪🇸','Англия 🏴','Португалия 🇵🇹','Германия 🇩🇪'].forEach((team)=>teamStrength[team]=10);
['Нидерланды 🇳🇱','Бельгия 🇧🇪','Хорватия 🇭🇷','Марокко 🇲🇦','Уругвай 🇺🇾','Колумбия 🇨🇴','Швейцария 🇨🇭'].forEach((team)=>teamStrength[team]=9);
['Япония 🇯🇵','Сенегал 🇸🇳','Эквадор 🇪🇨','Австрия 🇦🇹','Норвегия 🇳🇴','Мексика 🇲🇽','США 🇺🇸'].forEach((team)=>teamStrength[team]=8);
['Иран 🇮🇷','Южная Корея 🇰🇷','Австралия 🇦🇺','Шотландия 🏴','Швеция 🇸🇪','Турция 🇹🇷','Кот-д’Ивуар 🇨🇮','Алжир 🇩🇿'].forEach((team)=>teamStrength[team]=7);
['Канада 🇨🇦','Парагвай 🇵🇾','Египет 🇪🇬','Гана 🇬🇭','Тунис 🇹🇳','ЮАР 🇿🇦','Чехия 🇨🇿','Босния и Герцеговина 🇧🇦'].forEach((team)=>teamStrength[team]=6);
['Саудовская Аравия 🇸🇦','Катар 🇶🇦','Узбекистан 🇺🇿','Панама 🇵🇦','Ирак 🇮🇶','Иордания 🇯🇴','ДР Конго 🇨🇩','Кабо-Верде 🇨🇻'].forEach((team)=>teamStrength[team]=4);
['Новая Зеландия 🇳🇿','Гаити 🇭🇹','Кюрасао 🇨🇼'].forEach((team)=>teamStrength[team]=3);

export const celebrations = ['Скольжение на коленях', 'Прыжок с разворотом', 'Танец', 'Сальто', 'К болельщикам'];

const knockoutStages = ['1/16 финала', '1/8 финала', 'Четвертьфинал', 'Полуфинал', 'Финал'];

function shuffledTeams(playerCountry: string) {
  let seed = Array.from(playerCountry).reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 2026);
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const teams = [...countries];
  for (let index = teams.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [teams[index], teams[target]] = [teams[target], teams[index]];
  }
  return teams;
}

export function makeGroups(playerCountry: string) {
  const draw = shuffledTeams(playerCountry);
  return Array.from({ length: 12 }, (_, index) => draw.slice(index * 4, index * 4 + 4));
}

export function makeSchedule(level: number, playerCountry = ''): MatchInfo[] {
  void level;
  const groups = makeGroups(playerCountry);
  const draw = groups.flat();
  const playerIndex = Math.max(0, draw.indexOf(playerCountry));
  const groupIndex = Math.floor(playerIndex / 4);
  const group = draw.slice(groupIndex * 4, groupIndex * 4 + 4);
  const groupOpponents = group.filter((country) => country !== playerCountry);
  const knockoutOpponents = draw.filter((country) => country !== playerCountry && !groupOpponents.includes(country));
  return Array.from({ length: 8 }, (_, index) => {
    const current = index + 1;
    const opponent = index < 3 ? groupOpponents[index] : knockoutOpponents[(index * 7) % knockoutOpponents.length];
    const opponentParts = opponent.split(' ');
    const flag = opponentParts[opponentParts.length - 1] ?? '🌍';
    const stage = index < 3 ? `Группа ${String.fromCharCode(65 + groupIndex)} · матч ${index + 1}` : knockoutStages[index - 3];
    return {
      level: current,
      opponent,
      badge: flag,
      power: teamStrength[opponent] ?? 5,
      tournament: `Кубок мира 2026 · ${stage}`,
      kind: index < 3 ? 'international' : 'cup',
    };
  });
}
