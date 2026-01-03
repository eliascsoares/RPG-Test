
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
  const formatMod = (val: number) => {
    const mod = getMod(val);
    return mod >= 0 ? `+${mod}` : mod;
  };

  return (
    <div className={`parchment p-5 rounded-2xl border-2 border-emerald-900/40 shadow-2xl transition-all duration-500 hover:border-emerald-700/60 ${character.isNPC ? 'opacity-80' : 'scale-100'}`}>
      
      {/* Header - Identity */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 group">
            <input
              type="text"
              value={character.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-transparent text-lg font-cinzel font-bold outline-none text-emerald-950 w-full truncate border-b border-transparent focus:border-emerald-800/30"
              placeholder="Nome do Herói"
            />
            <button onClick={() => onAskHelp('Cultura e Chamado (Criação de Personagem)')} className="bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-900 w-5 h-5 rounded-full text-[10px] font-bold transition-all shadow-sm">?</button>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] uppercase font-bold text-emerald-800/70 tracking-wider">
            <span>{character.culture}</span>
            <span>•</span>
            <span>{character.calling} Lvl {character.level}</span>
          </div>
        </div>
        <button onClick={() => onRemove(character.id)} className="text-red-900/20 hover:text-red-600 transition-colors p-1">✕</button>
      </div>

      {/* Stats Table */}
      <div className="relative mb-8">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[8px] font-bold text-emerald-900/40 uppercase tracking-widest">Atributos Primários</span>
          <button onClick={() => onAskHelp('Atributos (Força, Destreza, etc.) e como rolar os dados para gerá-los')} className="text-emerald-900/30 hover:text-emerald-900 text-[10px]">Ajuda (?)</button>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {(Object.entries(character.stats) as Array<[keyof Character['stats'], number]>).map(([stat, val]) => (
            <div key={stat} className="flex flex-col items-center bg-white/40 border border-emerald-900/10 rounded-lg py-1.5 px-1 relative">
              <span className="text-[7px] font-bold uppercase text-emerald-900/60 mb-1">{stat.slice(0, 3)}</span>
              <input 
                type="number" 
                value={val} 
                onChange={e => handleStatChange(stat, +e.target.value)} 
                className="bg-transparent text-center w-full font-cinzel font-bold text-xs outline-none text-emerald-950"
              />
              <div className="text-[10px] font-bold bg-emerald-900 text-white w-6 h-6 flex items-center justify-center rounded-full -bottom-3 absolute shadow-md border border-white/20">
                {formatMod(val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-6">
        <div className="bg-emerald-900/5 p-2 rounded-xl text-center border border-emerald-900/10">
          <label className="block text-[8px] font-bold uppercase text-emerald-900/70">Armor Class</label>
          <input type="number" value={character.armorClass} onChange={e => handleChange('armorClass', +e.target.value)} className="bg-transparent text-lg font-cinzel font-bold text-center w-full outline-none text-emerald-950" />
        </div>
        <div className="bg-emerald-900/5 p-2 rounded-xl text-center border border-emerald-900/10 relative group">
          <button onClick={() => onAskHelp('Iniciativa e Velocidade (Speed)')} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-900 text-white w-4 h-4 rounded-full text-[8px]">?</button>
          <label className="block text-[8px] font-bold uppercase text-emerald-900/70">Initiative</label>
          <input type="number" value={character.initiative} onChange={e => handleChange('initiative', +e.target.value)} className="bg-transparent text-lg font-cinzel font-bold text-center w-full outline-none text-emerald-950" />
        </div>
        <div className="bg-emerald-900/5 p-2 rounded-xl text-center border border-emerald-900/10">
          <label className="block text-[8px] font-bold uppercase text-emerald-900/70">Speed</label>
          <input type="text" value={character.speed} onChange={e => handleChange('speed', e.target.value)} className="bg-transparent text-sm font-bold text-center w-full outline-none text-emerald-950" />
        </div>
      </div>

      {/* Resource Bars */}
      <div className="space-y-4 mb-6">
        <div className="group relative">
          <div className="flex justify-between text-[9px] font-bold uppercase text-red-900/80 px-1 mb-1 items-center">
            <span>Hit Points</span>
            <div className="flex gap-3 items-center">
              <span>{character.hp.current} / {character.hp.max}</span>
              <button onClick={() => onAskHelp('Hit Points e Hit Dice (Dados de Vida)')} className="text-red-900/30 hover:text-red-900 text-[10px]">?</button>
            </div>
          </div>
          <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-red-900/20 shadow-inner">
            <div className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-700" style={{ width: `${Math.min(100, (character.hp.current / character.hp.max) * 100)}%` }}></div>
          </div>
          <input 
            type="range" min="0" max={character.hp.max} value={character.hp.current} 
            onChange={e => handleChange('hp', {...character.hp, current: +e.target.value})}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="group relative">
          <div className="flex justify-between text-[9px] font-bold uppercase text-blue-900/80 px-1 mb-1 items-center">
            <span>Esperança (Hope)</span>
            <div className="flex gap-3 items-center">
              <span>{character.hope.current} / {character.hope.max}</span>
              <button onClick={() => onAskHelp('Esperança (Hope) e Inspiração')} className="text-blue-900/30 hover:text-blue-900 text-[10px]">?</button>
            </div>
          </div>
          <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-blue-900/20 shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-700" style={{ width: `${Math.min(100, (character.hope.current / character.hope.max) * 100)}%` }}></div>
          </div>
          <input 
            type="range" min="0" max={character.hope.max} value={character.hope.current} 
            onChange={e => handleChange('hope', {...character.hope, current: +e.target.value})}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Shadow Section */}
      <div className="bg-stone-900/5 border border-stone-900/20 rounded-2xl p-3 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-[10px] font-cinzel font-bold text-stone-900 uppercase tracking-widest">A Sombra (Shadow)</h5>
          <button onClick={() => onAskHelp('Shadow Score, Scars e os estados Miserable/Weary')} className="bg-stone-900 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg">?</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center justify-between bg-white/40 rounded-lg p-2">
            <span className="text-[9px] font-bold text-stone-800/60 uppercase">Shadow Score</span>
            <input type="number" value={character.shadow.score} onChange={e => handleChange('shadow', {...character.shadow, score: +e.target.value})} className="bg-transparent w-8 text-center text-sm font-bold rounded outline-none text-red-900" />
          </div>
          <div className="flex items-center justify-between bg-white/40 rounded-lg p-2">
            <span className="text-[9px] font-bold text-stone-800/60 uppercase">Shadow Scars</span>
            <input type="number" value={character.shadow.scars} onChange={e => handleChange('shadow', {...character.shadow, scars: +e.target.value})} className="bg-transparent w-8 text-center text-sm font-bold rounded outline-none text-red-900" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={character.shadow.miserable} onChange={e => handleChange('shadow', {...character.shadow, miserable: e.target.checked})} className="accent-red-900 w-3 h-3" />
            <span className="text-[9px] font-bold uppercase text-stone-800">Miserável</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={character.isWeary} onChange={e => handleChange('isWeary', e.target.checked)} className="accent-red-900 w-3 h-3" />
            <span className="text-[9px] font-bold uppercase text-stone-800">Exausto (Weary)</span>
          </label>
        </div>
      </div>

      <button 
        onClick={() => setShowFull(!showFull)} 
        className="w-full py-3 bg-emerald-900/10 hover:bg-emerald-900 text-emerald-900 hover:text-white rounded-xl text-[10px] font-bold text-emerald-900 uppercase tracking-widest transition-all border border-emerald-900/20 shadow-md"
      >
        {showFull ? 'Recolher Ficha' : 'Ver Perícias e Salvaguardas'}
      </button>

      {showFull && (
        <div className="mt-6 space-y-8 animate-in slide-in-from-top-4 duration-500 overflow-hidden pb-4">
          {/* Salvaguardas (Saving Throws) */}
          <div className="border-t border-emerald-900/10 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-[10px] font-cinzel font-bold text-emerald-900 uppercase tracking-widest">Salvaguardas (Saving Throws)</h6>
              <button onClick={() => onAskHelp('Saving Throws (Salvaguardas) e quais dados usar em testes de resistência')} className="text-emerald-900/40 text-[10px] hover:text-emerald-900">Como funciona? (?)</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(st => (
                <label key={st} className="flex items-center gap-2 bg-white/30 p-2 rounded-lg cursor-pointer hover:bg-white/50 transition-all border border-emerald-900/5">
                   <input 
                    type="checkbox" 
                    checked={character.savingThrows.includes(st)} 
                    onChange={e => {
                      const newST = e.target.checked ? [...character.savingThrows, st] : character.savingThrows.filter(x => x !== st);
                      handleChange('savingThrows', newST);
                    }}
                    className="accent-emerald-900"
                   />
                   <span className="text-[10px] font-bold text-emerald-900/70">{st}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Perícias */}
          <div className="border-t border-emerald-900/10 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-[10px] font-cinzel font-bold text-emerald-900 uppercase tracking-widest">Perícias (Skills)</h6>
              <button onClick={() => onAskHelp('Perícias (Skills) e Proficiência. Como calcular o bônus final com o d20?')} className="text-emerald-900/40 text-[10px] hover:text-emerald-900">Socorro (?)</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              {SKILLS.map(skill => (
                <div key={skill.name} className="flex justify-between items-center text-[11px] group border-b border-emerald-900/5 pb-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={character.skillProficiencies.includes(skill.name)}
                      onChange={e => {
                        const newSkills = e.target.checked ? [...character.skillProficiencies, skill.name] : character.skillProficiencies.filter(x => x !== skill.name);
                        handleChange('skillProficiencies', newSkills);
                      }}
                      className="accent-emerald-900 w-3 h-3"
                    />
                    <span className="text-emerald-950/70 group-hover:text-emerald-950 transition-colors">{skill.name}</span>
                  </div>
                  <span className="font-bold text-emerald-900">{formatMod(character.stats[skill.stat as keyof typeof character.stats] + (character.skillProficiencies.includes(skill.name) ? character.proficiencyBonus : 0))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Características e Traços */}
          <div className="border-t border-emerald-900/10 pt-4">
            <h6 className="text-[10px] font-cinzel font-bold text-emerald-900 mb-2 uppercase tracking-widest">Características (Features & Virtues)</h6>
            <textarea 
              value={character.distinctiveFeatures} 
              onChange={e => handleChange('distinctiveFeatures', e.target.value)}
              className="w-full bg-white/30 p-4 rounded-xl text-xs font-serif min-h-[100px] outline-none focus:bg-white/50 transition-all border border-emerald-900/10 shadow-inner"
              placeholder="Ex: Hobbit-sense, Unobtrusive... Descreva suas Virtudes aqui."
            />
          </div>
        </div>
      )}
    </div>
  );
};
