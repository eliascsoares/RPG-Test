
export enum Culture {
  BARDING = 'Barding',
  DWARF = 'Dwarf of Durin\'s Folk',
  ELF = 'Elf of Lindon',
  HOBBIT = 'Hobbit of the Shire',
  MEN_BREE = 'Men of Bree',
  RANGER = 'Ranger of the North',
  OTHER = 'Other / NPC'
}

export enum Calling {
  CAPTAIN = 'Captain',
  CHAMPION = 'Champion',
  MESSENGER = 'Messenger',
  SCHOLAR = 'Scholar',
  TREASURE_HUNTER = 'Treasure Hunter',
  WARDEN = 'Warden',
  NPC = 'NPC / Ally'
}

export enum JourneyRole {
  NONE = 'Nenhum',
  GUIDE = 'Guia',
  SCOUT = 'Batedor',
  HUNTER = 'Caçador',
  LOOKOUT = 'Vigia'
}

export interface StoryModule {
  id: string;
  title: string;
  description: string;
  context: string;
}

export interface Attack {
  id: string;
  name: string;
  bonus: number;
  damage: string;
  type: string;
}

export interface Character {
  id: string;
  name: string;
  culture: Culture;
  calling: Calling;
  level: number;
  isNPC?: boolean;
  isWeary?: boolean;
  journeyRole: JourneyRole;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp: { current: number; max: number };
  hope: { current: number; max: number };
  shadow: { points: number; scars: number };
  fatigue: number;
  experience: number;
  features: string[];
  equipment: string[];
  proficiencies: string[];
  attacks: Attack[];
}

export interface GameState {
  currentYear: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  location: string;
  fellowshipPool: number;
  eyeAwareness: number;
  history: Message[];
  activeStoryId?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isRoll?: boolean;
}

export const SKILLS = [
  { name: 'Acrobatics', stat: 'dexterity' },
  { name: 'Animal Handling', stat: 'wisdom' },
  { name: 'Athletics', stat: 'strength' },
  { name: 'Deception', stat: 'charisma' },
  { name: 'History', stat: 'intelligence' },
  { name: 'Insight', stat: 'wisdom' },
  { name: 'Intimidation', stat: 'charisma' },
  { name: 'Investigation', stat: 'intelligence' },
  { name: 'Medicine', stat: 'wisdom' },
  { name: 'Nature', stat: 'intelligence' },
  { name: 'Perception', stat: 'wisdom' },
  { name: 'Performance', stat: 'charisma' },
  { name: 'Persuasion', stat: 'charisma' },
  { name: 'Religion', stat: 'intelligence' },
  { name: 'Sleight of Hand', stat: 'dexterity' },
  { name: 'Stealth', stat: 'dexterity' },
  { name: 'Survival', stat: 'wisdom' },
  { name: 'Riddle', stat: 'intelligence' },
  { name: 'Old Lore', stat: 'intelligence' },
  { name: 'Battle', stat: 'wisdom' }
];
