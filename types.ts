
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

// Added Message interface for chat history
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isRoll?: boolean;
}

// Added GameState interface for session management
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
  isNPC?: boolean;
  isWeary?: boolean;
  journeyRole: JourneyRole;
  
  // Novos campos da ficha oficial
  inspiration: boolean;
  proficiencyBonus: number;
  armorClass: number;
  initiative: number;
  speed: string;
  passiveWisdom: number;
  shadowPath: string;
  
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  savingThrows: string[]; // Lista de stats com proficiência
  skillProficiencies: string[];
  
  hp: { current: number; max: number; temp: number };
  hope: { current: number; max: number };
  shadow: { score: number; scars: number; miserable: boolean; anguished: boolean };
  
  features: string[];
  equipment: string[];
  attacks: Attack[];
}

export const SKILLS = [
  { name: 'Acrobatics', stat: 'dexterity' },
  { name: 'Animal Handling', stat: 'wisdom' },
  { name: 'Athletics', stat: 'strength' },
  { name: 'Deception', stat: 'charisma' },
  { name: 'Explore', stat: 'wisdom' }, // Específico LotR
  { name: 'Hunting', stat: 'wisdom' },  // Específico LotR
  { name: 'Insight', stat: 'wisdom' },
  { name: 'Intimidation', stat: 'charisma' },
  { name: 'Investigation', stat: 'intelligence' },
  { name: 'Medicine', stat: 'intelligence' },
  { name: 'Nature', stat: 'intelligence' },
  { name: 'Old Lore', stat: 'intelligence' }, // Específico LotR
  { name: 'Perception', stat: 'wisdom' },
  { name: 'Performance', stat: 'charisma' },
  { name: 'Persuasion', stat: 'charisma' },
  { name: 'Riddle', stat: 'intelligence' },   // Específico LotR
  { name: 'Sleight of Hand', stat: 'dexterity' },
  { name: 'Stealth', stat: 'dexterity' },
  { name: 'Travel', stat: 'wisdom' }         // Específico LotR
];
