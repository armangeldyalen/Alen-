import { Career } from '../types/game';

const KEY = 'road-to-glory-career';

export function loadCareer(): Career | null {
  try {
    const value = localStorage.getItem(KEY);
    if (!value) return null;
    const career = JSON.parse(value) as Career;
    if (career.club === 'Каспий Юнайтед' || career.club === 'Брюссель Атлетик') career.club = 'Рос';
    return career;
  } catch { return null; }
}

export function saveCareer(career: Career) {
  localStorage.setItem(KEY, JSON.stringify(career));
}
