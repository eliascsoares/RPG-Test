
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
      } catch (e) { console.error(e); }
    }

    if (savedState) {
      try { setGameState(JSON.parse(savedState)); } catch (e) { console.error(e); }
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history, loading]);

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
  };

  const updateCharacter = (updated: Character) => {
    setCharacters(characters.map(c => c.id === updated.id ? updated : c));
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleSend = async (customText?: string, isRoll = false) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now(), isRoll };
    const newHistory = [...gameState.history, userMsg];
    
    setGameState(prev => ({ ...prev, history: newHistory }));
    setInput('');
    setLoading(true);

    try {
      const response = await loremaster.current.sendMessage(
        textToSend, 
        characters, 
        gameState, 
        gameState.history // Enviamos o histórico antes da nova mensagem do usuário (ou a IA concatena)
      );
      
      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...prev.history, modelMsg] }));
    } catch (error: any) {
      console.error("Erro completo:", error);
      const errorMsg: Message = { 
        role: 'model', 
        text: `As vozes de Arnor silenciaram... (Erro: ${error.message || 'Falha na conexão'}). Verifique sua API Key no painel da Vercel.`, 
        timestamp: Date.now() 
      };
      setGameState(prev => ({ ...prev, history: [...prev.history, errorMsg] }));
    } finally {
      setLoading(false);
    }
  };

  const executeRoll = () => {
    const char = characters.find(c => c.id === selectedCharId);
    if (!char || diceValue === '') return;
    const skillInfo = SKILLS.find(s => s.name === selectedSkill);
    const total = (diceValue as number) + Math.floor((char.stats[skillInfo?.stat as keyof typeof char.stats] - 10) / 2);
    
    handleSend(`[TESTE] ${char.name} rolou ${selectedSkill}: d20(${diceValue}) = ${total}`, true);
    setDiceValue('');
    setShowRollPanel(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#050a05] text-sm lg:text-base overflow-hidden">
      
      {/* Mobile Sidebar Toggle & Header */}
      <header className="h-14 lg:h-20 border-b border-emerald-950 flex items-center px-4 justify-between bg-[#040804] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="lg:hidden text-2xl">📜</button>
          <div className="w-8 h-8 rounded-full bg-black border border-emerald-900 flex items-center justify-center text-red-600 text-lg">👁️</div>
          <h1 className="font-cinzel text-emerald-400 text-xs lg:text-xl tracking-tighter lg:tracking-widest uppercase">Sussurro de Arnor</h1>
        </div>
        <button onClick={() => setShowRollPanel(!showRollPanel)} className="bg-emerald-900/30 border border-emerald-500/50 px-3 py-1 rounded-full text-emerald-400 text-[10px] lg:text-sm font-medieval flex items-center gap-1">
          {DICE_SVG} <span>TESTE</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`
          absolute lg:relative inset-y-0 left-0 w-72 lg:w-96 bg-[#081108] border-r border-emerald-950 z-30 transform transition-transform duration-300
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col p-4
        `}>
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <span className="font-cinzel text-emerald-500">Companhia</span>
            <button onClick={() => setShowSidebar(false)} className="text-emerald-500">✕</button>
          </div>
          
          <div className="flex gap-2 mb-4">
             <button onClick={() => setSidebarTab('Heroes')} className={`flex-1 py-1 text-[10px] rounded border ${sidebarTab === 'Heroes' ? 'bg-emerald-900/40 border-emerald-500' : 'border-emerald-900/10'}`}>HERÓIS</button>
             <button onClick={() => setSidebarTab('NPCs')} className={`flex-1 py-1 text-[10px] rounded border ${sidebarTab === 'NPCs' ? 'bg-gray-900/40 border-gray-500' : 'border-emerald-900/10'}`}>NPCs</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
            {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
              <CharacterCard key={char.id} character={char} onUpdate={updateCharacter} onRemove={removeCharacter} />
            ))}
            <button onClick={() => addCharacter(sidebarTab === 'NPCs')} className="w-full py-2 border-2 border-dashed border-emerald-900/30 rounded-lg text-emerald-900 text-xs font-bold hover:bg-emerald-900/5 transition">
              + Adicionar {sidebarTab === 'Heroes' ? 'Herói' : 'NPC'}
            </button>
          </div>
          
          <div className="mt-4 p-2 bg-emerald-950/20 rounded border border-emerald-900/30 text-[10px]">
             <div className="flex justify-between text-emerald-500 mb-1"><span>FELLOWSHIP</span> <input type="number" className="bg-transparent w-8 text-right outline-none" value={gameState.fellowshipPool} onChange={e => setGameState({...gameState, fellowshipPool: +e.target.value})} /></div>
             <div className="flex justify-between text-red-500"><span>EYE AWARENESS</span> <input type="number" className="bg-transparent w-8 text-right outline-none" value={gameState.eyeAwareness} onChange={e => setGameState({...gameState, eyeAwareness: +e.target.value})} /></div>
          </div>
        </div>

        {/* Chat */}
        <main className="flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {gameState.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center pointer-events-none">
                <div className="text-6xl lg:text-9xl font-cinzel text-emerald-900 mb-4">ARNOR</div>
                <p className="italic text-emerald-800">"Nem tudo que é ouro brilha, nem todos os que vagam estão perdidos..."</p>
              </div>
            )}
            {gameState.history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] lg:max-w-[80%] p-3 lg:p-5 rounded-lg shadow-xl ${
                  msg.role === 'user' ? 'bg-[#0c1a0c] border border-emerald-900 text-emerald-100' : 'parchment border-2 border-emerald-800/30 text-emerald-950'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed font-serif text-sm lg:text-base">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && <div className="text-emerald-800 italic animate-pulse text-xs">O Loremaster consulta as estrelas...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-[#040804] border-t border-emerald-950">
            <div className="max-w-4xl mx-auto flex gap-2">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Narração ou ação..."
                className="flex-1 bg-[#0a140a] border border-emerald-900/40 rounded-xl p-3 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-800 resize-none h-14 lg:h-20 text-sm"
              />
              <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-emerald-800 text-white w-14 lg:w-20 rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all">
                <span className="text-xl">📜</span>
              </button>
            </div>
          </div>
        </main>

        {/* Modal Rolar Dados */}
        {showRollPanel && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="parchment w-full max-w-sm p-6 rounded-lg border-4 border-double border-emerald-900">
              <h3 className="font-cinzel text-center border-b border-emerald-900/20 mb-4 font-bold">LANÇAR DESAFIO</h3>
              <div className="space-y-4">
                <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                  {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="w-full bg-white/50 border border-emerald-900/30 rounded p-2" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                  {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <div className="flex gap-4">
                  <input type="number" placeholder="D20" className="flex-1 bg-white border border-emerald-900/30 rounded p-3 text-center text-xl font-bold" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                  <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-900 text-white px-6 rounded font-cinzel disabled:opacity-30">ROLAR</button>
                </div>
                <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-800 font-bold uppercase mt-4">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
