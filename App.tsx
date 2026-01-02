
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
  const [showSidebar, setShowSidebar] = useState(false);
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
TOTAL: ${total}`;

    handleSend(rollMessage, true);
    setDiceValue('');
    setShowRollPanel(false);
  };

  const filteredCharacters = characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC);

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden bg-[#050a05] text-sm lg:text-base">
      
      {/* Mobile Backdrop */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - Mobile: Off-canvas / Desktop: Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-80 z-40 lg:static lg:z-0 lg:w-96 p-4 
        border-r border-emerald-950 overflow-y-auto scrollbar-hide flex flex-col bg-[#081108]
        transition-transform duration-300 transform
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex justify-between items-center mb-4 lg:hidden">
          <span className="font-cinzel text-emerald-600 font-bold">Menu Arnor</span>
          <button onClick={() => setShowSidebar(false)} className="text-emerald-500 text-xl">✕</button>
        </div>

        <h2 className="text-xl lg:text-2xl font-cinzel text-emerald-600 mb-4 border-b border-emerald-900/30 pb-2 flex justify-between items-center">
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

        <div className="mt-8 parchment p-3 rounded text-sm space-y-3 bg-[#e8eee8] mb-4">
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
             <label className="font-bold text-emerald-950 text-xs">Fellowship</label>
             <input type="number" value={gameState.fellowshipPool} onChange={e => setGameState({...gameState, fellowshipPool: parseInt(e.target.value) || 0})} className="bg-transparent text-right w-10 border-b border-emerald-900 outline-none font-bold text-emerald-800" />
          </div>
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
            <label className="font-bold text-emerald-950 text-xs">Ano</label>
            <input type="number" value={gameState.currentYear} onChange={e => setGameState({...gameState, currentYear: parseInt(e.target.value) || 2965})} className="bg-transparent text-right w-12 outline-none" />
          </div>
          <div className="flex justify-between border-b border-emerald-900/10 pb-1">
            <label className="font-bold text-red-950 uppercase text-[8px]">Eye Awareness</label>
            <input type="number" value={gameState.eyeAwareness} onChange={e => setGameState({...gameState, eyeAwareness: parseInt(e.target.value) || 0})} className="bg-transparent text-right w-10 border-b border-red-900 outline-none font-bold text-red-800" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 lg:h-20 border-b border-emerald-950 flex items-center px-4 lg:px-6 justify-between bg-[#040804]/90 backdrop-blur-md z-10 shadow-2xl">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setShowSidebar(true)}
              className="lg:hidden text-emerald-500 p-2"
            >
              📜
            </button>
            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-black border-2 border-emerald-900 flex items-center justify-center text-red-600 font-cinzel text-lg lg:text-2xl shadow-[0_0_15px_rgba(255,0,0,0.2)]">
              👁️
            </div>
            <div className="overflow-hidden">
              <h1 className="font-cinzel text-emerald-400 text-xs lg:text-xl tracking-widest uppercase truncate max-w-[150px] lg:max-w-none">Sussurro de Arnor</h1>
              <p className="text-[8px] lg:text-[10px] text-emerald-900 uppercase tracking-tighter lg:tracking-[0.4em] font-bold">Relíquias Esquecidas</p>
            </div>
          </div>
          
          <button onClick={() => setShowRollPanel(!showRollPanel)} className={`flex items-center gap-1 lg:gap-2 px-3 py-1 lg:px-4 lg:py-2 rounded-full border transition-all ${showRollPanel ? 'bg-emerald-600 text-white border-emerald-400' : 'text-emerald-500 border-emerald-900'}`}>
            {DICE_SVG} <span className="font-medieval text-[10px] lg:text-sm uppercase">Sorte</span>
          </button>
        </header>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {gameState.history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 text-emerald-900 text-center px-4">
              <div className="text-5xl lg:text-8xl mb-4 lg:mb-6 font-cinzel">ᛒᛖᚱᛖᚾ</div>
              <p className="text-lg lg:text-2xl italic">As estrelas se apagam sobre as Colinas de Evendim...</p>
            </div>
          )}
          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] lg:max-w-[80%] p-4 lg:p-6 rounded-lg shadow-2xl transition-all ${
                msg.role === 'user' 
                  ? (msg.isRoll ? 'bg-[#0a1a0a] border-2 border-emerald-500/40 text-emerald-100' : 'bg-[#0c140c] border border-emerald-900/50 text-emerald-200') 
                  : 'parchment relative border-2 lg:border-4 border-double border-emerald-900/30'
              }`}>
                {msg.role === 'model' && <div className="text-[8px] lg:text-[10px] uppercase font-bold mb-2 lg:mb-3 text-emerald-900 tracking-widest border-b border-emerald-900/10 pb-1">O Observador</div>}
                <div className="whitespace-pre-wrap leading-relaxed text-sm lg:text-lg font-serif">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="parchment p-3 lg:p-4 rounded-lg italic text-emerald-900 text-xs lg:text-base">Consultando os presságios...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dice Panel - Mobile optimized */}
        {showRollPanel && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 lg:top-24 lg:right-8 w-[90%] lg:w-80 parchment p-4 lg:p-5 rounded-lg shadow-2xl border-4 border-double border-emerald-800 z-50 animate-in fade-in zoom-in duration-300">
            <h3 className="font-cinzel font-bold text-center border-b border-emerald-900/20 mb-4 text-emerald-950 text-sm lg:text-base">ADJUDICAR TESTE</h3>
            <div className="space-y-3 lg:space-y-4">
              <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2 text-xs lg:text-sm" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} {c.isNPC ? '(NPC)' : ''}</option>)}
              </select>
              <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2 text-xs lg:text-sm" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 lg:gap-4">
                <input type="number" placeholder="D20" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : parseInt(e.target.value))} className="flex-1 bg-white border border-emerald-900/30 rounded p-2 lg:p-3 text-center font-bold text-lg lg:text-xl" />
                <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-900 text-white px-4 lg:px-6 rounded font-cinzel hover:bg-emerald-800 disabled:opacity-30 text-xs lg:text-sm">ROLAR</button>
              </div>
              <button onClick={() => setShowRollPanel(false)} className="w-full text-[10px] text-red-800 font-bold uppercase lg:hidden mt-2">Fechar</button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 lg:p-6 bg-[#040804] border-t border-emerald-950">
          <div className="max-w-5xl mx-auto flex gap-2 lg:gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Descreva suas ações..."
              className="flex-1 bg-[#0a150a] border border-emerald-900/40 rounded-xl p-3 lg:p-4 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none h-16 lg:h-24 text-sm lg:text-base font-serif transition-all"
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-emerald-800 text-white w-16 lg:w-24 rounded-xl font-cinzel hover:bg-emerald-700 transition-all shadow-lg flex flex-col items-center justify-center gap-1">
              <span className="text-lg">📜</span>
              <span className="text-[8px] lg:text-[10px] font-bold uppercase">Ir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
