export type Screen = 'create' | 'home' | 'match' | 'lobby';
export type Skin = 'light' | 'tan' | 'dark';
export type Hair = 'short' | 'curly' | 'mohawk' | 'bald' | 'fade' | 'afro' | 'braids' | 'long';
export type Position = 'Нападающий' | 'Полузащитник' | 'Защитник';

export interface Player {
  name: string;
  country: string;
  skin: Skin;
  hair: Hair;
  height: number;
  number: number;
  foot: 'Левая' | 'Правая';
  position: Position;
  celebration: string;
  eyeColor?: 'brown' | 'blue' | 'green' | 'gray';
  accessory?: 'none' | 'headband' | 'glasses' | 'wristband';
}

export interface MatchInfo {
  level: number;
  opponent: string;
  badge: string;
  power: number;
  tournament: string;
  kind: 'league' | 'cup' | 'international';
}

export interface MatchResult extends MatchInfo {
  playerGoals: number;
  opponentGoals: number;
  won: boolean;
}

export interface Career {
  player: Player;
  club: string;
  level: number;
  season: number;
  goals: number;
  assists: number;
  rating: number;
  history: MatchResult[];
  trophies: string[];
}
