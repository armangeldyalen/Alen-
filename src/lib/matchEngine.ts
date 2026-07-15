import { MatchInfo } from '../types/game';

export type ChanceType = 'Атака с игры' | 'Один на один' | 'Штрафной удар' | 'Пенальти';

export function createChanceType(): ChanceType {
  const roll = Math.random();
  if (roll < .06) return 'Пенальти';
  if (roll < .14) return 'Штрафной удар';
  if (roll < .48) return 'Один на один';
  return 'Атака с игры';
}

export function opponentScore(match: MatchInfo) {
  const odds = Math.min(.78, .2 + match.power * .055);
  let goals = 0;
  for (let i = 0; i < 4; i += 1) if (Math.random() < odds * .55) goals += 1;
  return Math.min(4, goals);
}

export function isGoal(aim: number, power: number, type: ChanceType, difficulty: number) {
  const idealPower = type === 'Пенальти' ? 72 : type === 'Атака с игры' ? 60 : 64;
  const precision = 1 - Math.abs(power - idealPower) / 100;
  const cornerBonus = Math.abs(aim) > 45 ? .14 : 0;
  const chance = precision * .72 + cornerBonus - difficulty * .035;
  return Math.random() < Math.max(.18, chance);
}
