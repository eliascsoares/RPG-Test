
import React, { useState } from 'react';
import { Character, SKILLS, JourneyRole } from '../types';

interface Props {
  character: Character;
  onUpdate: (char: Character) => void;
  onRemove: (id: string) => void;
  onAskHelp: (field: string) => void;
}

export const CharacterCard: React.FC<Props> = ({ character, onUpdate, onRemove, onAskHelp }) => {
  const [showFull, setShowFull] = useState(false);

  const handleChange = (field: string, value: any) => onUpdate({ ...character, [field]: value });
  const handleStatChange = (stat: keyof Character['stats'], value: number) => {
    onUpdate({ ...character, stats: { ...character.stats, [stat]: value } });
  };

  const getMod = (val: number) => Math.floor((val - 10) / 2);

  return (
    <div className={`parchment p-4 rounded-lg border-2 border-emerald-900/40 shadow-xl transition-all ${character.isNPC ? 'opacity-90' : 'scale-100'}`}>
      {/* Top Header - Identity */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={character.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-transparent text-base font-cinzel font-bold outline-none text-emerald-950 w-full"
              placeholder="Nome do Herói"
            />
            <button onClick={() => onAskHelp('Criação de Personagem: Nome e Contexto')} className="text-emerald-700/50 hover:text-emerald-700 text-xs">?</button>
          </div>
          <div className="flex gap-2 text-[8px] uppercase font-bold text-emerald-800/60">
             <span>{character.culture}</span>
             <span>•</span>
             <span>{character.calling}</span>
          </div>
        </div>
        <button onClick={() => onRemove(character.id)} className="text-red-900/30 hover:text-red-600">✕</button>
      </div>

      {/* Main Stats Block - D&D 5E Style */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Fix: Explicitly cast Object.entries to ensure keys and values are correctly typed as [keyof stats, number] */}
        {(Object.entries(character.stats) as Array<[keyof Character['stats'], number]>).map(([stat, val]) => (
          <div key={stat} className="bg-white/50 border border-emerald-900/10 rounded-lg p-1.5 flex flex-col items-center relative">
            <span className="text-[7px] font-bold uppercase text-emerald-900/70">{stat.slice(0, 3)}</span>
            <input 
              type="number" 
              value={val} 
              onChange={e => handleStatChange(stat, +e.target.value)} 
              className="bg-transparent text-center w-full font-cinzel font-bold text-sm outline-none"
            />
            <span className="text-[9px] font-bold bg-emerald-900 text-white px-1.5 rounded-full -bottom-1 absolute">
              {getMod(val) >= 0 ? `+${getMod(val)}` : getMod(val)}
            </span>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row (AC, Initiative, Speed) */}
      <div className="grid grid-cols-3 gap-2 mb-4">
         <div className="bg-emerald-900/5 p-2 rounded-lg text-center border border-emerald-900/10">
            <label className="block text-[7px] font-bold uppercase text-emerald-900">Armor Class</label>
            <input type="number" value={character.armorClass} onChange={e => handleChange('armorClass', +e.target.value)} className="bg-transparent text-sm font-bold text-center w-full outline-none" />
         </div>
         <div className="bg-emerald-900/5 p-2 rounded-lg text-center border border-emerald-900/10">
            <label className="block text-[7px] font-bold uppercase text-emerald-900">Initiative</label>
            <input type="number" value={character.initiative} onChange={e => handleChange('initiative', +e.target.value)} className="bg-transparent text-sm font-bold text-center w-full outline-none" />
         </div>
         <div className="bg-emerald-900/5 p-2 rounded-lg text-center border border-emerald-900/10">
            <label className="block text-[7px] font-bold uppercase text-emerald-900">Speed</label>
            <input type="text" value={character.speed} onChange={e => handleChange('speed', e.target.value)} className="bg-transparent text-[10px] font-bold text-center w-full outline-none" />
         </div>
      </div>

      {/* HP & Hope Bars */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-col">
          <div className="flex justify-between text-[8px] font-bold uppercase text-emerald-900 px-1">
            <span>Hit Points</span>
            <span>{character.hp.current} / {character.hp.max}</span>
          </div>
          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden border border-emerald-900/20">
            <div className="h-full bg-red-800 transition-all" style={{ width: `${(character.hp.current / character.hp.max) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex justify-between text-[8px] font-bold uppercase text-blue-900 px-1">
            <span>Hope</span>
            <span>{character.hope.current} / {character.hope.max}</span>
          </div>
          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden border border-blue-900/20">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${(character.hope.current / character.hope.max) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Shadow Section (Fiel à Ficha) */}
      <div className="bg-red-950/5 border border-red-900/20 rounded-lg p-2 mb-3">
         <div className="flex justify-between items-center mb-1">
            <h5 className="text-[9px] font-cinzel font-bold text-red-950 uppercase">Sombra (Shadow)</h5>
            <button onClick={() => onAskHelp('Como funciona a Sombra e o estado Miserável')} className="text-red-900/30 hover:text-red-600 text-[10px]">?</button>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-red-900/60">SCORE</span>
              <input type="number" value={character.shadow.score} onChange={e => handleChange('shadow', {...character.shadow, score: +e.target.value})} className="bg-white/40 w-8 text-center text-xs font-bold rounded outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-red-900/60">SCARS</span>
              <input type="number" value={character.shadow.scars} onChange={e => handleChange('shadow', {...character.shadow, scars: +e.target.value})} className="bg-white/40 w-8 text-center text-xs font-bold rounded outline-none" />
            </div>
         </div>
         <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={character.shadow.miserable} onChange={e => handleChange('shadow', {...character.shadow, miserable: e.target.checked})} className="accent-red-900 w-2.5 h-2.5" />
              <span className="text-[7px] font-bold uppercase text-red-900">Miserável</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={character.isWeary} onChange={e => handleChange('isWeary', e.target.checked)} className="accent-red-900 w-2.5 h-2.5" />
              <span className="text-[7px] font-bold uppercase text-red-900">Exausto</span>
            </label>
         </div>
      </div>

      <button 
        onClick={() => setShowFull(!showFull)} 
        className="w-full text-[9px] font-bold text-emerald-900/40 uppercase tracking-widest hover:text-emerald-900 transition-colors"
      >
        {showFull ? 'Recolher Perícias' : 'Ver Perícias e Equipamento'}
      </button>

      {showFull && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
           <div className="border-t border-emerald-900/10 pt-3">
              <h6 className="text-[9px] font-bold text-emerald-900 mb-2 uppercase">Perícias (Skills)</h6>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {SKILLS.map(skill => (
                  <div key={skill.name} className="flex justify-between items-center text-[10px]">
                    <span className="text-emerald-950/70">{skill.name}</span>
                    <span className="font-bold">+{getMod(character.stats[skill.stat as keyof typeof character.stats])}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
