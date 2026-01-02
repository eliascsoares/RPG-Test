
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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const loremaster = useRef(new LoremasterService());

  useEffect(() => {
    const savedChars = localStorage.getItem(STORAGE_KEY_CHARACTERS);
    const savedState = localStorage.getItem(STORAGE_KEY_GAMESTATE);
    if (savedChars) try { setCharacters(JSON.parse(savedChars)); } catch (e) {}
    if (savedState) try { setGameState(JSON.parse(savedState)); } catch (e) {}
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
      localStorage.setItem(STORAGE_KEY_GAMESTATE, JSON.stringify(gameState));
    }
  }, [characters, gameState, isInitialized]);

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

  const updateCharacter = (updated: Character) => setCharacters(characters.map(c => c.id === updated.id ? updated : c));
  const removeCharacter = (id: string) => setCharacters(characters.filter(c => c.id !== id));

  const handleSend = async (customText?: string, isRoll = false) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now(), isRoll };
    const updatedHistory = [...gameState.history, userMsg];
    
    setGameState(prev => ({ ...prev, history: updatedHistory }));
    setInput('');
    setLoading(true);

    try {
      const response = await loremaster.current.sendMessage(
        textToSend, 
        characters, 
        gameState, 
        updatedHistory
      );
      
      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...prev.history, modelMsg] }));
    } catch (error: any) {
      const errorMsg: Message = { 
        role: 'model', 
        text: `⚠️ MENSAGEM DO SISTEMA: ${error.message || 'Falha na conexão com Arnor.'}`, 
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
    const skill = SKILLS.find(s => s.name === selectedSkill);
    const mod = Math.floor((char.stats[skill?.stat as keyof typeof char.stats] - 10) / 2);
    handleSend(`[TESTE] ${char.name} rolou ${selectedSkill}: ${diceValue} + ${mod} = ${(diceValue as number) + mod}`, true);
    setDiceValue('');
    setShowRollPanel(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#050a05] text-sm lg:text-base overflow-hidden">
      
      {/* Header Mobile */}
      <header className="h-14 lg:h-20 border-b border-emerald-950 flex items-center px-4 justify-between bg-[#040804] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="lg:hidden p-1 text-xl">📜</button>
          <div className="w-8 h-8 rounded-full bg-black border border-emerald-900 flex items-center justify-center text-red-600 text-lg shadow-[0_0_10px_rgba(220,38,38,0.2)]">👁️</div>
          <h1 className="font-cinzel text-emerald-400 text-xs lg:text-lg tracking-widest font-bold">ARNOR</h1>
        </div>
        <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/30 border border-emerald-500/50 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-bold flex items-center gap-1">
          {DICE_SVG} TESTE
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Backdrop Mobile */}
        {showSidebar && <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setShowSidebar(false)} />}

        {/* Sidebar */}
        <div className={`
          absolute lg:relative inset-y-0 left-0 w-72 lg:w-96 bg-[#081108] border-r border-emerald-950 z-40 transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col p-4
        `}>
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <span className="font-cinzel text-emerald-500 font-bold">Companhia</span>
            <button onClick={() => setShowSidebar(false)} className="text-emerald-500 text-xl">✕</button>
          </div>
          
          <div className="flex gap-1 mb-4">
             <button onClick={() => setSidebarTab('Heroes')} className={`flex-1 py-1.5 text-[9px] font-bold rounded ${sidebarTab === 'Heroes' ? 'bg-emerald-900 text-emerald-100 border border-emerald-500' : 'bg-transparent border border-emerald-900/40 text-emerald-900'}`}>HERÓIS</button>
             <button onClick={() => setSidebarTab('NPCs')} className={`flex-1 py-1.5 text-[9px] font-bold rounded ${sidebarTab === 'NPCs' ? 'bg-gray-800 text-gray-100 border border-gray-500' : 'bg-transparent border border-emerald-900/40 text-emerald-900'}`}>NPCs</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
              <CharacterCard key={char.id} character={char} onUpdate={updateCharacter} onRemove={removeCharacter} />
            ))}
            <button onClick={() => addCharacter(sidebarTab === 'NPCs')} className="w-full py-2 border-2 border-dashed border-emerald-900/20 rounded-lg text-emerald-900 text-[10px] font-bold hover:bg-emerald-900/5">+ NOVO {sidebarTab === 'Heroes' ? 'HERÓI' : 'NPC'}</button>
          </div>
          
          <div className="mt-4 p-3 bg-black/40 rounded border border-emerald-900/30 text-[9px] space-y-2">
             <div className="flex justify-between items-center">
               <span className="text-emerald-600 font-bold uppercase tracking-wider">Fellowship</span>
               <input type="number" className="bg-transparent w-8 text-right font-bold outline-none text-emerald-400" value={gameState.fellowshipPool} onChange={e => setGameState({...gameState, fellowshipPool: +e.target.value})} />
             </div>
             <div className="flex justify-between items-center">
               <span className="text-red-700 font-bold uppercase tracking-wider">Eye Awareness</span>
               <input type="number" className="bg-transparent w-8 text-right font-bold outline-none text-red-500" value={gameState.eyeAwareness} onChange={e => setGameState({...gameState, eyeAwareness: +e.target.value})} />
             </div>
          </div>
        </div>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative bg-[#050805]">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 scrollbar-hide">
            {gameState.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center select-none">
                <div className="text-7xl lg:text-9xl font-cinzel text-emerald-900">ARNOR</div>
                <p className="max-w-xs italic text-emerald-800 text-sm lg:text-base mt-2">"Onde agora estão o cavalo e o cavaleiro? Onde está a buzina que soprava?"</p>
              </div>
            )}
            {gameState.history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[92%] lg:max-w-[80%] p-4 rounded-xl shadow-2xl ${
                  msg.role === 'user' 
                    ? (msg.isRoll ? 'bg-[#0a200a] border-2 border-emerald-500/30 text-emerald-200' : 'bg-[#0c140c] border border-emerald-900 text-emerald-100') 
                    : 'parchment border-2 border-emerald-800/40 text-emerald-950'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed font-serif text-sm lg:text-base">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-800/30 text-emerald-700 italic text-xs animate-pulse">
                  O Loremaster tece o destino...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 lg:p-5 bg-[#040804] border-t border-emerald-950">
            <div className="max-w-4xl mx-auto flex gap-2 items-end">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Narração ou ação..."
                rows={1}
                className="flex-1 bg-[#0a140a] border border-emerald-900/40 rounded-2xl p-3 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none min-h-[50px] max-h-[150px] text-sm lg:text-base"
              />
              <button 
                onClick={() => handleSend()} 
                disabled={loading || !input.trim()} 
                className="bg-emerald-800 text-white w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-10 transition-all shrink-0 shadow-lg"
              >
                <span className="text-xl">📜</span>
              </button>
            </div>
          </div>
        </main>

        {/* Modal Dados Mobile-First */}
        {showRollPanel && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="parchment w-full max-w-sm p-6 rounded-2xl border-4 border-double border-emerald-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h3 className="font-cinzel text-center border-b border-emerald-900/20 pb-2 mb-6 font-bold text-lg uppercase tracking-widest text-emerald-950">Lançar Desafio</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1">Herói</label>
                  <select className="w-full bg-white/60 border border-emerald-900/30 rounded-lg p-2.5 text-sm" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1">Perícia</label>
                  <select className="w-full bg-white/60 border border-emerald-900/30 rounded-lg p-2.5 text-sm" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                    {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1">Resultado D20</label>
                    <input type="number" placeholder="0" className="w-full bg-white border-2 border-emerald-900/30 rounded-lg p-3 text-center text-2xl font-bold text-emerald-950 focus:border-emerald-600 outline-none" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                  </div>
                  <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-900 text-white px-8 rounded-lg font-cinzel font-bold hover:bg-emerald-800 disabled:opacity-30 transition-all mt-5">ROLAR</button>
                </div>
                <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-800 font-bold uppercase mt-2 hover:underline">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
