
import React, { useState } from 'react';
import { Character, SKILLS } from '../types';

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

  const triggerRuleHelp = () => {
    onAskHelp(`Como "Mestre das Regras" (consultando o Rulebook 5E), explique como preencher a ficha do meu ${character.culture} ${character.calling}. Detalhe quais atributos priorizar, quais perícias escolher e como funcionam os testes de Sombra para ele.`);
  };

  return (
    <div className={`iron-plate p-4 md:p-5 rounded-xl border border-[#44403c] shadow-lg transition-all duration-300 hover:border-orange-500/30 ${character.isNPC ? 'opacity-80' : ''}`}>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={character.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-transparent text-base md:text-lg font-cinzel font-bold outline-none text-orange-500 w-full truncate focus:border-b border-[#57534e]"
              placeholder="Nome"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-[8px] uppercase font-bold text-[#78716c] tracking-wider">
            <span>{character.culture}</span>
            <span>•</span>
            <span>{character.calling} Lvl {character.level}</span>
          </div>
        </div>
        <button onClick={() => onRemove(character.id)} className="text-[#57534e] hover:text-red-900 transition-colors p-1">✕</button>
      </div>

      <div className="grid grid-cols-6 gap-1 mb-6">
        {(Object.entries(character.stats) as Array<[keyof Character['stats'], number]>).map(([stat, val]) => (
          <div key={stat} className="flex flex-col items-center bg-[#1c1917]/50 border border-[#44403c]/50 rounded-lg py-1 relative">
            <span className="text-[6px] font-bold uppercase text-[#78716c] mb-1">{stat.slice(0, 3)}</span>
            <input 
              type="number" 
              value={val} 
              onChange={e => handleStatChange(stat, +e.target.value)} 
              className="bg-transparent text-center w-full font-cinzel font-bold text-[10px] outline-none text-[#d6d3d1]"
            />
            <div className="text-[8px] font-bold bg-[#44403c] text-white w-4 h-4 flex items-center justify-center rounded-full -bottom-2 absolute shadow-lg border border-orange-500/20">
              {formatMod(val)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-5">
        <div className="relative">
          <div className="flex justify-between text-[8px] font-bold uppercase text-red-400/80 px-1 mb-1">
            <span>Vida (Hit Points)</span>
            <span>{character.hp.current} / {character.hp.max}</span>
          </div>
          <div className="h-2 w-full bg-[#1c1917] rounded-full overflow-hidden border border-[#450a0a] shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#450a0a] to-[#7f1d1d] transition-all duration-500" style={{ width: `${Math.min(100, (character.hp.current / character.hp.max) * 100)}%` }}></div>
          </div>
          <input 
            type="range" min="0" max={character.hp.max} value={character.hp.current} 
            onChange={e => handleChange('hp', {...character.hp, current: +e.target.value})}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="relative">
          <div className="flex justify-between text-[8px] font-bold uppercase text-orange-500/80 px-1 mb-1">
            <span>Sombra (Shadow)</span>
            <span>{character.shadow.score} pts</span>
          </div>
          <div className="h-2 w-full bg-[#1c1917] rounded-full overflow-hidden border border-[#44403c] shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#7c2d12] to-orange-600 transition-all duration-500" style={{ width: `${Math.min(100, (character.shadow.score / 20) * 100)}%` }}></div>
          </div>
          <input 
            type="range" min="0" max="20" value={character.shadow.score} 
            onChange={e => handleChange('shadow', {...character.shadow, score: +e.target.value})}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setShowFull(!showFull)} 
          className="flex-1 py-2 bg-[#1c1917] hover:bg-[#44403c] text-[9px] font-bold text-orange-500 uppercase tracking-widest transition-all border border-[#44403c] rounded-lg"
        >
          {showFull ? 'Fechar' : 'Perícias'}
        </button>
        <button 
          onClick={triggerRuleHelp} 
          className="px-3 py-2 bg-[#44403c] hover:bg-[#57534e] text-[9px] font-bold text-orange-200 uppercase tracking-widest transition-all border border-orange-500/20 rounded-lg fire-glow"
        >
          📜 Ajuda Regras
        </button>
      </div>

      {showFull && (
        <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {SKILLS.slice(0, 10).map(skill => (
              <div key={skill.name} className="flex justify-between border-b border-[#44403c]/30 pb-1">
                <span className="text-[#78716c]">{skill.name}</span>
                <span className="text-orange-500 font-bold">{formatMod(character.stats[skill.stat as keyof typeof character.stats] + (character.skillProficiencies.includes(skill.name) ? character.proficiencyBonus : 0))}</span>
              </div>
            ))}
          </div>
          <textarea 
            value={character.distinctiveFeatures} 
            onChange={e => handleChange('distinctiveFeatures', e.target.value)}
            className="w-full bg-[#1c1917] p-3 rounded-lg text-[10px] min-h-[60px] outline-none border border-[#44403c] text-[#a8a29e]"
            placeholder="Virtudes, Traços e Equipamentos..."
          />
        </div>
      )}
    </div>
  );
};
