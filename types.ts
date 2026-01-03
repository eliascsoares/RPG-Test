
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

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
}

export interface StoryModule {
  id: string;
  title: string;
  description: string;
  context: string;
  chapters: StoryChapter[];
}

export interface Attack {
  id: string;
  name: string;
  bonus: number;
  damage: string;
  range: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isRoll?: boolean;
}

export interface GameState {
  currentYear: number;
  season: string;
  location: string;
  fellowshipPool: number;
  eyeAwareness: number;
  history: Message[];
  activeStoryId?: string;
  activeChapterId?: string;
}

export interface Character {
  id: string;
  name: string;
  culture: Culture;
  calling: Calling;
  level: number;
  playerNames?: string;
  experiencePoints: number;
  distinctiveFeatures: string;
  shadowPath: string;
  isNPC?: boolean;
  isWeary?: boolean;
  
  // Stats do PDF
  inspiration: boolean;
  proficiencyBonus: number;
  armorClass: number;
  initiative: number;
  speed: string;
  passiveWisdom: number;
  
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  savingThrows: string[]; 
  skillProficiencies: string[];
  
  hp: { current: number; max: number; temp: number };
  // Hope resource used for tracking player fellowship/hope points
  hope: { current: number; max: number };
  hitDice: { current: number; max: string };
  deathSaves: { successes: number; failures: number };
  
  shadow: { 
    score: number; 
    scars: number; 
    miserable: boolean; 
    anguished: boolean 
  };
  
  encumbrance: {
    carriedWeight: number;
    isEncumbered: boolean;
    isHeavilyEncumbered: boolean;
  };

  toolsAndLanguages: string;
  featuresTraitsVirtues: string;
  equipment: string;
  attacks: Attack[];
  journeyRole: JourneyRole;
  fellowshipPoints: number;
}

export const SKILLS = [
  { name: 'Acrobatics', stat: 'dexterity' },
  { name: 'Animal Handling', stat: 'wisdom' },
  { name: 'Athletics', stat: 'strength' },
  { name: 'Deception', stat: 'charisma' },
  { name: 'Explore', stat: 'wisdom' },
  { name: 'Hunting', stat: 'wisdom' },
  { name: 'Insight', stat: 'wisdom' },
  { name: 'Intimidation', stat: 'charisma' },
  { name: 'Investigation', stat: 'intelligence' },
  { name: 'Medicine', stat: 'wisdom' },
  { name: 'Nature', stat: 'intelligence' },
  { name: 'Old Lore', stat: 'intelligence' },
  { name: 'Perception', stat: 'wisdom' },
  { name: 'Performance', stat: 'charisma' },
  { name: 'Persuasion', stat: 'charisma' },
  { name: 'Riddle', stat: 'intelligence' },
  { name: 'Sleight of Hand', stat: 'dexterity' },
  { name: 'Stealth', stat: 'dexterity' },
  { name: 'Travel', stat: 'wisdom' }
];
