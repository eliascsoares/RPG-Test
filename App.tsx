
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'Heroes' | 'NPCs' | 'Legends'>('Heroes');
  const [gameState, setGameState] = useState<GameState>({
    currentYear: 2965,
    season: 'Spring',
    location: 'Bree',
    fellowshipPool: 0,
    eyeAwareness: 0,
    history: [],
    activeStoryId: undefined
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [showRollPanel, setShowRollPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
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
  }, [gameState.history, loading, isSpeaking]);

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

  const startStory = async (story: StoryModule) => {
    setGameState(prev => ({ ...prev, activeStoryId: story.id, history: [] }));
    handleSend(`Por favor, inicie a narrativa da lenda: "${story.title}".`);
    setShowSidebar(false);
  };

  const handleManualSpeak = async (text: string, index: number) => {
    if (playingMessageIndex === index) {
      loremaster.current.stopSpeaking();
      setPlayingMessageIndex(null);
      setIsSpeaking(false);
      return;
    }
    
    loremaster.current.stopSpeaking();
    setPlayingMessageIndex(index);
    setIsSpeaking(true);
    
    await loremaster.current.speak(text, () => {
      setPlayingMessageIndex(null);
      setIsSpeaking(false);
    });
  };

  const handleSend = async (customText?: string, isRoll = false) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;
    
    loremaster.current.stopSpeaking();
    setIsSpeaking(false);
    setPlayingMessageIndex(null);

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
      const newHistory = [...updatedHistory, modelMsg];
      setGameState(prev => ({ ...prev, history: newHistory }));

      if (voiceEnabled) {
        const index = newHistory.length - 1;
        setPlayingMessageIndex(index);
        setIsSpeaking(true);
        await loremaster.current.speak(response, () => {
          setPlayingMessageIndex(null);
          setIsSpeaking(false);
        });
      }
    } catch (error: any) {
      const errorMsg: Message = { 
        role: 'model', 
        text: `⚠️ ERRO DE ARNOR: ${error.message || 'A conexão com os portões de Moria falhou.'}`, 
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
      
      {/* Header */}
      <header className="h-14 lg:h-20 border-b border-emerald-950 flex items-center px-4 justify-between bg-[#040804] z-20 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="lg:hidden p-1 text-xl">📜</button>
          <div className="w-8 h-8 rounded-full bg-black border border-emerald-900 flex items-center justify-center text-red-600 text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">👁️</div>
          <h1 className="font-cinzel text-emerald-400 text-xs lg:text-lg tracking-widest font-bold hidden sm:block">ARNOR LOREMASTER</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (voiceEnabled || isSpeaking) {
                loremaster.current.stopSpeaking();
                setIsSpeaking(false);
                setPlayingMessageIndex(null);
              }
              setVoiceEnabled(!voiceEnabled);
            }} 
            className={`p-2 rounded-full transition-all border ${voiceEnabled ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-transparent border-emerald-900 text-emerald-900'}`}
            title={voiceEnabled ? "Narração Automática: Ativada" : "Narração Automática: Desativada"}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/40 border border-emerald-500/50 px-3 py-1.5 rounded-full text-emerald-400 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-800 transition-colors">
            {DICE_SVG} TESTE
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Backdrop */}
        {showSidebar && <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setShowSidebar(false)} />}

        {/* Sidebar */}
        <div className={`
          absolute lg:relative inset-y-0 left-0 w-72 lg:w-96 bg-[#081108] border-r border-emerald-950 z-40 transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col p-4
        `}>
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <span className="font-cinzel text-emerald-500 font-bold">Menu</span>
            <button onClick={() => setShowSidebar(false)} className="text-emerald-500 text-xl">✕</button>
          </div>
          
          <div className="flex gap-1 mb-4">
             <button onClick={() => setSidebarTab('Heroes')} className={`flex-1 py-1.5 text-[8px] font-bold rounded ${sidebarTab === 'Heroes' ? 'bg-emerald-900 text-emerald-100 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-transparent border border-emerald-900/40 text-emerald-900'}`}>HERÓIS</button>
             <button onClick={() => setSidebarTab('NPCs')} className={`flex-1 py-1.5 text-[8px] font-bold rounded ${sidebarTab === 'NPCs' ? 'bg-gray-800 text-gray-100 border border-gray-500' : 'bg-transparent border border-emerald-900/40 text-emerald-900'}`}>NPCs</button>
             <button onClick={() => setSidebarTab('Legends')} className={`flex-1 py-1.5 text-[8px] font-bold rounded ${sidebarTab === 'Legends' ? 'bg-amber-900/80 text-amber-100 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-transparent border border-emerald-900/40 text-emerald-900'}`}>LENDAS</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            {sidebarTab === 'Legends' ? (
              <div className="space-y-3">
                {STORY_MODULES.map(story => (
                  <div key={story.id} className={`parchment p-3 rounded-lg border-2 border-amber-900/30 transition-all ${gameState.activeStoryId === story.id ? 'ring-2 ring-amber-500 shadow-xl scale-[1.02]' : 'hover:border-amber-700/50'}`}>
                    <h4 className="font-cinzel font-bold text-amber-950 text-sm">{story.title}</h4>
                    <p className="text-[10px] text-amber-900/80 mt-1 italic leading-tight">{story.description}</p>
                    <button 
                      onClick={() => startStory(story)}
                      className={`w-full mt-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        gameState.activeStoryId === story.id 
                        ? 'bg-amber-950 text-amber-200' 
                        : 'bg-amber-800/20 text-amber-900 hover:bg-amber-800/40 border border-amber-900/20'
                      }`}
                    >
                      {gameState.activeStoryId === story.id ? 'Lenda Ativa' : 'Iniciar Narração'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
                  <CharacterCard key={char.id} character={char} onUpdate={updateCharacter} onRemove={removeCharacter} />
                ))}
                <button onClick={() => addCharacter(sidebarTab === 'NPCs')} className="w-full py-2 border-2 border-dashed border-emerald-900/20 rounded-lg text-emerald-900 text-[10px] font-bold hover:bg-emerald-900/5 transition-all">+ NOVO {sidebarTab === 'Heroes' ? 'HERÓI' : 'NPC'}</button>
              </>
            )}
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
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 scrollbar-hide">
            {gameState.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center select-none animate-pulse">
                <div className="text-7xl lg:text-9xl font-cinzel text-emerald-900 tracking-tighter">ARNOR</div>
                <p className="max-w-md italic text-emerald-800 text-sm lg:text-xl mt-4 font-serif leading-relaxed">
                  {gameState.activeStoryId 
                    ? `Preparando a lenda: ${STORY_MODULES.find(s => s.id === gameState.activeStoryId)?.title}...`
                    : '"O mundo mudou. Eu sinto isso na água. Eu sinto na terra. Eu sinto no ar."'}
                </p>
              </div>
            )}
            {gameState.history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[95%] lg:max-w-[85%] p-5 lg:p-8 rounded-2xl shadow-2xl relative ${
                  msg.role === 'user' 
                    ? (msg.isRoll ? 'bg-[#0a200a] border-2 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#0c140c] border border-emerald-900 text-emerald-100') 
                    : 'parchment border-2 border-emerald-800/40 text-emerald-950 font-serif leading-relaxed text-lg'
                }`}>
                  {msg.role === 'model' && (
                    <div className="absolute -top-3 left-4 flex items-center gap-2">
                      <div className="bg-emerald-900 text-white text-[8px] px-2 py-0.5 rounded font-cinzel uppercase tracking-widest flex items-center gap-2">
                        <span>ESCRIBA DAS SOMBRAS</span>
                        <button 
                          onClick={() => handleManualSpeak(msg.text, i)}
                          className={`hover:scale-110 transition-transform ${playingMessageIndex === i ? 'text-emerald-400' : 'text-emerald-600'}`}
                          title="Narrar esta passagem"
                        >
                          {playingMessageIndex === i ? '⏹️' : '▶️'}
                        </button>
                      </div>
                      {playingMessageIndex === i && (
                        <div className="flex gap-0.5 items-end h-3 mb-1 animate-pulse">
                          <div className="w-0.5 bg-emerald-700 h-1 animate-voice-bar-1"></div>
                          <div className="w-0.5 bg-emerald-700 h-2 animate-voice-bar-2"></div>
                          <div className="w-0.5 bg-emerald-700 h-1.5 animate-voice-bar-3"></div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-emerald-950/40 px-6 py-3 rounded-full border border-emerald-800/20 text-emerald-600 italic text-sm animate-pulse flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                  O Loremaster consulta os fios do destino...
                </div>
              </div>
            )}
            {isSpeaking && (
              <div className="flex justify-center sticky bottom-4 z-10">
                <div className="bg-emerald-900 text-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-bold font-cinzel tracking-widest animate-pulse border border-emerald-500 shadow-2xl flex items-center gap-2">
                  <span>OUVINDO O ESCRIBA...</span>
                  <button onClick={() => { loremaster.current.stopSpeaking(); setIsSpeaking(false); setPlayingMessageIndex(null); }} className="hover:text-red-400">✕</button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 lg:p-8 bg-[#040804] border-t border-emerald-950/50">
            <div className="max-w-5xl mx-auto flex gap-3 items-end">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Narre sua próxima jornada..."
                rows={1}
                className="flex-1 bg-[#0a140a] border border-emerald-900/40 rounded-2xl p-4 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-900/50 resize-none min-h-[60px] max-h-[200px] text-base lg:text-lg font-serif"
              />
              <button 
                onClick={() => handleSend()} 
                disabled={loading || !input.trim()} 
                className="bg-emerald-900 text-white w-14 h-14 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center hover:bg-emerald-800 disabled:opacity-5 transition-all shrink-0 shadow-[0_0_25px_rgba(6,78,59,0.4)] group"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">📜</span>
              </button>
            </div>
          </div>
        </main>

        {/* Modal Dados */}
        {showRollPanel && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="parchment w-full max-w-sm p-8 rounded-3xl border-4 border-double border-emerald-900 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
              <h3 className="font-cinzel text-center border-b border-emerald-900/20 pb-3 mb-8 font-bold text-xl uppercase tracking-widest text-emerald-950">Lançar Desafio</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">Herói</label>
                  <select className="w-full bg-white/60 border border-emerald-900/20 rounded-xl p-3 text-sm focus:bg-white transition-all outline-none" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">Perícia</label>
                  <select className="w-full bg-white/60 border border-emerald-900/20 rounded-xl p-3 text-sm focus:bg-white transition-all outline-none" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                    {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">Resultado D20</label>
                    <input type="number" placeholder="0" className="w-full bg-white border-2 border-emerald-900/30 rounded-xl p-4 text-center text-3xl font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all shadow-inner" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                  </div>
                  <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-950 text-white px-10 rounded-xl font-cinzel font-bold hover:bg-emerald-900 disabled:opacity-20 transition-all mt-6 shadow-lg">ROLAR</button>
                </div>
                <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-900 font-bold uppercase mt-4 hover:tracking-widest transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
