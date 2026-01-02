
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'Heroes' | 'NPCs'>('Heroes');
  const [gameState, setGameState] = useState<GameState>({
    currentYear: 2965,
    season: 'Spring',
    location: 'Bree',
    fellowshipPool: 0,
    eyeAwareness: 0,
    history: []
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRollPanel, setShowRollPanel] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [selectedCharId, setSelectedCharId] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(SKILLS[0].name);
  const [diceValue, setDiceValue] = useState<number | ''>('');
  const [lastRolledId, setLastRolledId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const loremaster = useRef(new LoremasterService());

  useEffect(() => {
    const savedChars = localStorage.getItem(STORAGE_KEY_CHARACTERS);
    const savedState = localStorage.getItem(STORAGE_KEY_GAMESTATE);

    if (savedChars) {
      try {
        const parsed = JSON.parse(savedChars);
        setCharacters(parsed);
        if (parsed.length > 0) setSelectedCharId(parsed[0].id);
      } catch (e) {
        console.error("Erro ao carregar personagens salvos", e);
      }
    }

    if (savedState) {
      try {
        setGameState(JSON.parse(savedState));
      } catch (e) {
        console.error("Erro ao carregar estado do jogo salvo", e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
    }
  }, [characters, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_GAMESTATE, JSON.stringify(gameState));
    }
  }, [gameState, isInitialized]);

  useEffect(() => {
    const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [gameState.history, showRollPanel, loading]);

  const addCharacter = (isNPC: boolean = false) => {
    const newChar: Character = {
      id: Date.now().toString(),
      name: isNPC ? 'Novo NPC' : 'Novo Herói',
      culture: isNPC ? Culture.OTHER : Culture.HOBBIT,
      calling: isNPC ? Calling.NPC : Calling.TREASURE_HUNTER,
      level: 1,
      isNPC,
      isWeary: false,
      journeyRole: JourneyRole.NONE,
      stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      hp: { current: 10, max: 10 },
      hope: { current: 10, max: 10 },
      shadow: { points: 0, scars: 0 },
      fatigue: 0,
      experience: 0,
      features: [],
      equipment: [],
      proficiencies: [],
      attacks: []
    };
    setCharacters([...characters, newChar]);
    if (!selectedCharId) setSelectedCharId(newChar.id);
    setSidebarTab(isNPC ? 'NPCs' : 'Heroes');
  };

  const updateCharacter = (updated: Character) => {
    setCharacters(characters.map(c => c.id === updated.id ? updated : c));
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
  const calculateProficiency = (level: number) => Math.floor((level - 1) / 4) + 2;

  const handleSend = async (customText?: string, isRoll = false) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now(), isRoll };
    setGameState(prev => ({ ...prev, history: [...prev.history, userMsg] }));
    setInput('');
    setLoading(true);

    try {
      const response = await loremaster.current.sendMessage(
        textToSend, 
        characters, 
        gameState, 
        gameState.history
      );
      
      const modelMsg: Message = { role: 'model', text: response || 'O Loremaster parece pensativo...', timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...prev.history, modelMsg] }));
    } catch (error) {
      const errorMsg: Message = { role: 'model', text: "Houve uma interrupção na conexão com o Noroeste...", timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...prev.history, errorMsg] }));
    } finally {
      setLoading(false);
    }
  };

  const executeRoll = () => {
    const char = characters.find(c => c.id === selectedCharId);
    if (!char || diceValue === '') return;

    const skillInfo = SKILLS.find(s => s.name === selectedSkill);
    const statName = skillInfo?.stat as keyof typeof char.stats;
    const statScore = char.stats[statName];
    const modifier = calculateModifier(statScore);
    const proficiency = char.proficiencies.includes(selectedSkill) ? calculateProficiency(char.level) : 0;
    
    const total = (diceValue as number) + modifier + proficiency;
    const modSign = modifier >= 0 ? '+' : '';
    
    setLastRolledId(char.id);
    setTimeout(() => setLastRolledId(null), 2000);

    const rollMessage = `[TESTE DE PERÍCIA]
Herói: ${char.name} (${char.journeyRole !== JourneyRole.NONE ? `Papel: ${char.journeyRole}` : 'Sem papel'})
Ação: ${selectedSkill} (${statName.toUpperCase()})
Resultado: ${diceValue} ${char.isWeary ? '(ESTADO EXAUSTO)' : ''}
Bônus: ${modSign}${modifier} (Atributo) ${proficiency > 0 ? `+ ${proficiency} (Proficiência)` : ''}
TOTAL: ${total}

Loremaster, narre o resultado considerando o Rulebook 5E e o estado do herói.`;

    handleSend(rollMessage, true);
    setDiceValue('');
    setShowRollPanel(false);
  };

  const filteredCharacters = characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#050a05]">
      {/* Sidebar */}
      <div className="w-full lg:w-96 p-4 border-r border-emerald-950 overflow-y-auto scrollbar-hide flex flex-col bg-[#081108]">
        <h2 className="text-2xl font-cinzel text-emerald-600 mb-4 border-b border-emerald-900/30 pb-2 flex justify-between items-center">
          Companhia
          <div className="flex gap-1">
            <button onClick={() => addCharacter(false)} className="text-[10px] bg-emerald-800 text-white px-2 py-1 rounded hover:bg-emerald-700 transition font-bold">+ PC</button>
            <button onClick={() => addCharacter(true)} className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition font-bold">+ NPC</button>
          </div>
        </h2>

        <div className="flex mb-4 gap-2">
          <button onClick={() => setSidebarTab('Heroes')} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded border ${sidebarTab === 'Heroes' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'border-emerald-900/30 text-emerald-900'}`}>Heróis</button>
          <button onClick={() => setSidebarTab('NPCs')} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded border ${sidebarTab === 'NPCs' ? 'bg-gray-900/40 border-gray-400 text-gray-300' : 'border-emerald-900/30 text-emerald-900'}`}>NPCs</button>
        </div>
        
        <div className="space-y-6 flex-1">
          {filteredCharacters.map(char => (
            <CharacterCard key={char.id} character={char} onUpdate={updateCharacter} onRemove={removeCharacter} isJustRolled={lastRolledId === char.id} />
          ))}
        </div>

        {/* Game State Panel */}
        <div className="mt-8 parchment p-3 rounded text-sm space-y-3 bg-[#e8eee8]">
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
             <label className="font-bold text-emerald-950">Reserva Fellowship</label>
             <input type="number" value={gameState.fellowshipPool} onChange={e => setGameState({...gameState, fellowshipPool: parseInt(e.target.value) || 0})} className="bg-transparent text-right w-12 border-b border-emerald-900 outline-none font-bold text-emerald-800" />
          </div>
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
            <label className="font-bold text-emerald-950">Ano T.E.</label>
            <input type="number" value={gameState.currentYear} onChange={e => setGameState({...gameState, currentYear: parseInt(e.target.value) || 2965})} className="bg-transparent text-right w-16 outline-none" />
          </div>
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
            <label className="font-bold text-emerald-950">Estação</label>
            <select value={gameState.season} onChange={e => setGameState({...gameState, season: e.target.value as any})} className="bg-transparent text-right outline-none">
              <option>Spring</option><option>Summer</option><option>Autumn</option><option>Winter</option>
            </select>
          </div>
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
            <label className="font-bold text-red-950 uppercase text-[10px]">Eye Awareness</label>
            <input type="number" value={gameState.eyeAwareness} onChange={e => setGameState({...gameState, eyeAwareness: parseInt(e.target.value) || 0})} className="bg-transparent text-right w-12 border-b border-red-900 outline-none font-bold text-red-800" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-emerald-950 flex items-center px-6 justify-between bg-[#040804]/90 backdrop-blur-md z-10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black border-2 border-emerald-900 flex items-center justify-center text-red-600 font-cinzel text-2xl shadow-[0_0_15px_rgba(255,0,0,0.2)]">
              👁️
            </div>
            <div>
              <h1 className="font-cinzel text-emerald-400 text-xl tracking-[0.3em] uppercase">O Sussurro da Sombra sobre Arnor</h1>
              <p className="text-[10px] text-emerald-900 uppercase tracking-[0.4em] font-bold">Relíquias de uma Era Esquecida</p>
            </div>
          </div>
          
          <button onClick={() => setShowRollPanel(!showRollPanel)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${showRollPanel ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-500 border-emerald-900 hover:border-emerald-600'}`}>
            {DICE_SVG} <span className="font-medieval text-sm uppercase">Lançar Sorte</span>
          </button>
        </header>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {gameState.history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 text-emerald-900">
              <div className="text-8xl mb-6 font-cinzel">ᛒᛖᚱᛖᚾ</div>
              <p className="text-2xl italic">As estrelas se apagam sobre as Colinas de Evendim...</p>
            </div>
          )}
          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-6 rounded-lg shadow-2xl transition-all ${
                msg.role === 'user' 
                  ? (msg.isRoll ? 'bg-[#0a1a0a] border-2 border-emerald-500/40 text-emerald-100' : 'bg-[#0c140c] border border-emerald-900/50 text-emerald-200') 
                  : 'parchment relative border-4 border-double border-emerald-900/30'
              }`}>
                {msg.role === 'model' && <div className="text-[10px] uppercase font-bold mb-3 text-emerald-900 tracking-widest border-b border-emerald-900/10 pb-1">O Observador das Sombras</div>}
                <div className="whitespace-pre-wrap leading-relaxed text-lg font-serif">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="parchment p-4 rounded-lg italic text-emerald-900">O Mestre consulta os presságios...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dice Panel */}
        {showRollPanel && (
          <div className="absolute top-24 right-8 w-80 parchment p-5 rounded-lg shadow-2xl border-4 border-double border-emerald-800 z-30 animate-in fade-in zoom-in duration-300">
            <h3 className="font-cinzel font-bold text-center border-b border-emerald-900/20 mb-4 text-emerald-950">ADJUDICAR TESTE</h3>
            <div className="space-y-4">
              <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2 text-sm" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} {c.isNPC ? '(NPC)' : ''}</option>)}
              </select>
              <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2 text-sm" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-4">
                <input type="number" placeholder="D20" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : parseInt(e.target.value))} className="flex-1 bg-white border border-emerald-900/30 rounded p-3 text-center font-bold text-xl" />
                <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-900 text-white px-6 rounded font-cinzel hover:bg-emerald-800 disabled:opacity-30">ROLAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 bg-[#040804] border-t border-emerald-950">
          <div className="max-w-5xl mx-auto flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Descreva suas ações ou peça orientações ao Mestre..."
              className="flex-1 bg-[#0a150a] border border-emerald-900/40 rounded-xl p-4 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none h-24 font-serif transition-all"
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-emerald-800 text-white w-24 rounded-xl font-cinzel hover:bg-emerald-700 transition-all shadow-lg flex flex-col items-center justify-center gap-2">
              <span className="text-xl">📜</span>
              <span className="text-[10px] font-bold uppercase">Narrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
