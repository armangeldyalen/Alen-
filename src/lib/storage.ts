import { Career } from '../types/game';
import { countries } from '../data/gameData';

const KEY = 'road-to-glory-career';

export function loadCareer(): Career | null {
  try {
    const value = localStorage.getItem(KEY);
    if (!value) return null;
    const career = JSON.parse(value) as Career;
    if (!countries.includes(career.player.country)) return null;
    career.club = career.player.country;
    return career;
  } catch { return null; }
}

export function saveCareer(career: Career) {
  localStorage.setItem(KEY, JSON.stringify(career));
}
