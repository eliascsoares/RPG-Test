
import React, { useState } from 'react';
import { Character, SKILLS, Attack, Culture, Calling, JourneyRole } from '../types';

interface Props {
  character: Character;
  onUpdate: (char: Character) => void;
  onRemove: (id: string) => void;
  isJustRolled?: boolean;
}

export const CharacterCard: React.FC<Props> = ({ character, onUpdate, onRemove, isJustRolled }) => {
  const [showFull, setShowFull] = useState(false);

  const handleChange = (field: string, value: any) => onUpdate({ ...character, [field]: value });

  const handleStatChange = (stat: keyof Character['stats'], value: number) => {
    onUpdate({ ...character, stats: { ...character.stats, [stat]: value } });
  };

  const isNPC = character.isNPC;

  return (
    <div className={`parchment p-3 lg:p-4 rounded-lg relative border-double border-2 lg:border-4 transition-all duration-300 ${
      isJustRolled ? 'animate-dice-roll scale-[1.02]' : (isNPC ? 'border-gray-400 opacity-90' : 'border-emerald-800 shadow-xl')
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={character.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="bg-transparent text-base lg:text-lg font-cinzel font-bold outline-none text-emerald-950 w-full truncate"
          />
          <div className="flex flex-wrap gap-x-2 gap-y-0 text-[8px] lg:text-[10px] uppercase font-bold text-emerald-800/70">
            <span className="truncate max-w-[100px]">{character.culture}</span>
            <span>•</span>
            <span className="truncate max-w-[100px]">{character.calling}</span>
          </div>
        </div>
        <button onClick={() => onRemove(character.id)} className="text-red-800 hover:text-red-600 font-bold ml-2">✕</button>
      </div>

      {!isNPC && (
        <div className="grid grid-cols-2 gap-2 mb-2 lg:mb-3">
          <div className="bg-emerald-900/10 p-1 rounded text-center border border-emerald-900/20">
            <label className="block text-[7px] lg:text-[8px] uppercase font-bold text-emerald-900">Hope</label>
            <div className="flex items-center justify-center gap-1">
              <input type="number" value={character.hope.current} onChange={e => handleChange('hope', {...character.hope, current: parseInt(e.target.value) || 0})} className="bg-transparent w-4 lg:w-6 text-center font-bold text-xs lg:text-sm text-emerald-950 outline-none" />
              <span className="text-[10px] opacity-30">/</span>
              <input type="number" value={character.hope.max} onChange={e => handleChange('hope', {...character.hope, max: parseInt(e.target.value) || 0})} className="bg-transparent w-4 lg:w-6 text-center text-[10px] lg:text-xs text-emerald-800/50 outline-none" />
            </div>
          </div>
          <div className="bg-blue-900/10 p-1 rounded text-center border border-blue-900/20">
            <label className="block text-[7px] lg:text-[8px] uppercase font-bold text-blue-900">Papel</label>
            <select value={character.journeyRole} onChange={e => handleChange('journeyRole', e.target.value)} className="bg-transparent text-[8px] lg:text-[10px] font-bold outline-none text-blue-950 text-center w-full cursor-pointer">
              {Object.values(JourneyRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-1 mb-2 lg:mb-3">
        {Object.entries(character.stats).map(([stat, val]) => (
          <div key={stat} className="flex flex-col items-center bg-white/40 rounded p-1 border border-emerald-900/5">
            <span className="text-[7px] lg:text-[8px] uppercase font-bold text-emerald-900">{stat.slice(0, 3)}</span>
            <input type="number" value={val} onChange={e => handleStatChange(stat as any, parseInt(e.target.value) || 0)} className="bg-transparent text-center w-full font-bold text-[10px] lg:text-xs outline-none" />
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <label className="flex items-center gap-1 cursor-pointer group">
          <input type="checkbox" checked={character.isWeary} onChange={e => handleChange('isWeary', e.target.checked)} className="accent-red-800 w-3 h-3" />
          <span className={`text-[8px] lg:text-[10px] font-bold uppercase ${character.isWeary ? 'text-red-700' : 'text-emerald-900/40'}`}>Weary</span>
        </label>
        <div className="flex-1 bg-emerald-900/20 h-[1px]"></div>
        <button onClick={() => setShowFull(!showFull)} className="text-[8px] lg:text-[10px] font-bold text-emerald-800 uppercase hover:underline">{showFull ? 'Recolher' : 'Detalhes'}</button>
      </div>

      {showFull && (
        <div className="mt-2 space-y-2 border-t border-emerald-900/10 pt-2 animate-in slide-in-from-top duration-300">
           <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
             <div className="flex justify-between">
               <span className="text-emerald-900 opacity-60">Shadow:</span>
               <span>{character.shadow.points}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-emerald-900 opacity-60">Miserable:</span>
               <span className={character.shadow.points >= Math.ceil(character.stats.wisdom/2) ? 'text-red-600' : 'text-emerald-700'}>
                 {character.shadow.points >= Math.ceil(character.stats.wisdom/2) ? 'SIM' : 'NÃO'}
               </span>
             </div>
           </div>
           <div className="text-[9px] italic text-emerald-900 leading-tight">
             Nível: {character.level} | Exp: {character.experience}
           </div>
        </div>
      )}
    </div>
  );
};
