
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule, StoryChapter } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'Heroes' | 'NPCs' | 'Legends'>('Heroes');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentYear: 2965,
    season: 'Spring',
    location: 'Bree',
    fellowshipPool: 0,
    eyeAwareness: 0,
    history: [],
    activeStoryId: undefined,
    activeChapterId: undefined
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
  }, [gameState.history, loading]);

  const startStoryChapter = async (story: StoryModule, chapter: StoryChapter) => {
    loremaster.current.stopSpeaking();
    setIsSpeaking(false);
    setPlayingMessageIndex(null);
    setGameState(prev => ({ 
      ...prev, 
      activeStoryId: story.id, 
      activeChapterId: chapter.id,
      history: [] 
    }));
    handleSend(`Escriba, narre o início do capítulo "${chapter.title}" da lenda "${story.title}". Contexto: ${chapter.description}`);
    setShowSidebar(false);
  };

  const handleManualSpeak = async (text: string, index: number) => {
    if (playingMessageIndex === index) {
      loremaster.current.stopSpeaking();
      setPlayingMessageIndex(null);
      setIsSpeaking(false);
      return;
    }
    
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
        text: `⚠️ A conexão com Arnor falhou. O destino está incerto.`, 
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
    handleSend(`[ROLAGEM] ${char.name} realiza teste de ${selectedSkill}: ${diceValue} + ${mod} = ${(diceValue as number) + mod}`, true);
    setDiceValue('');
    setShowRollPanel(false);
  };

  const addCharacter = (isNPC: boolean) => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: isNPC ? 'Novo NPC' : 'Novo Herói',
      culture: isNPC ? Culture.OTHER : Culture.MEN_BREE,
      calling: isNPC ? Calling.NPC : Calling.CHAMPION,
      level: 1,
      isNPC,
      isWeary: false,
      journeyRole: JourneyRole.NONE,
      stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      hp: { current: 20, max: 20 },
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
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#050a05] text-[#d1dbd1] overflow-hidden">
      
      {/* Header */}
      <header className="h-16 lg:h-20 border-b border-emerald-950/50 flex items-center px-4 justify-between bg-[#040804] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 text-xl hover:bg-emerald-900/20 rounded">📜</button>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-black border border-emerald-900 flex items-center justify-center text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">👁️</div>
          <h1 className="font-cinzel text-emerald-500 text-xs lg:text-base tracking-[0.2em] font-bold hidden sm:block uppercase">Arnor Loremaster</h1>
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
            className={`p-2.5 rounded-full transition-all border ${voiceEnabled ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-transparent border-emerald-900 text-emerald-900'}`}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/30 border border-emerald-500/30 px-3 py-2 rounded-lg text-emerald-400 text-[10px] lg:text-xs font-bold flex items-center gap-2 hover:bg-emerald-900/60 transition-colors">
            {DICE_SVG} TESTE
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Mobile Overlay */}
        {showSidebar && <div className="fixed inset-0 bg-black/90 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />}

        {/* Sidebar Content */}
        <aside className={`
          absolute lg:relative inset-y-0 left-0 w-[85%] max-w-[320px] lg:w-[380px] bg-[#081108] border-r border-emerald-950/30 z-50 transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-2xl
        `}>
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <span className="font-cinzel text-emerald-500 text-sm font-bold tracking-widest uppercase">Crônicas</span>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-emerald-700 p-1">✕</button>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mb-6">
               <button onClick={() => setSidebarTab('Heroes')} className={`py-2 text-[8px] font-bold rounded border transition-all ${sidebarTab === 'Heroes' ? 'bg-emerald-900 text-emerald-100 border-emerald-500 shadow-lg' : 'bg-transparent border-emerald-900/30 text-emerald-900'}`}>HERÓIS</button>
               <button onClick={() => setSidebarTab('NPCs')} className={`py-2 text-[8px] font-bold rounded border transition-all ${sidebarTab === 'NPCs' ? 'bg-gray-800 text-gray-100 border-gray-500 shadow-lg' : 'bg-transparent border-emerald-900/30 text-emerald-900'}`}>NPCs</button>
               <button onClick={() => setSidebarTab('Legends')} className={`py-2 text-[8px] font-bold rounded border transition-all ${sidebarTab === 'Legends' ? 'bg-amber-900 text-amber-100 border-amber-500 shadow-lg' : 'bg-transparent border-emerald-900/30 text-emerald-900'}`}>LENDAS</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-4">
              {sidebarTab === 'Legends' ? (
                <div className="space-y-4">
                  {STORY_MODULES.map(story => (
                    <div key={story.id} className={`parchment overflow-hidden rounded-xl border-2 transition-all group ${gameState.activeStoryId === story.id ? 'border-amber-600 shadow-lg' : 'border-amber-900/20 hover:border-amber-800/40'}`}>
                      <button 
                        onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)}
                        className="w-full p-4 text-left flex justify-between items-center"
                      >
                        <div>
                          <h4 className="font-cinzel font-bold text-amber-950 text-base leading-tight">{story.title}</h4>
                          <p className="text-[10px] text-amber-900/70 mt-1 italic leading-relaxed">{story.description}</p>
                        </div>
                        <span className="text-amber-900/40">{expandedStoryId === story.id ? '▲' : '▼'}</span>
                      </button>
                      
                      {expandedStoryId === story.id && (
                        <div className="bg-amber-950/5 border-t border-amber-900/10 p-3 space-y-2">
                          <p className="text-[9px] font-bold text-amber-900/60 uppercase tracking-widest mb-1 px-1">Índice da Lenda</p>
                          {story.chapters.map(chapter => (
                            <button
                              key={chapter.id}
                              onClick={() => startStoryChapter(story, chapter)}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                gameState.activeChapterId === chapter.id
                                ? 'bg-amber-900 text-amber-100 border-amber-500'
                                : 'bg-white/40 border-amber-900/10 hover:border-amber-900/40'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[11px] font-cinzel">{chapter.title}</span>
                                {gameState.activeChapterId === chapter.id && <span className="text-[10px] animate-pulse">●</span>}
                              </div>
                              <p className="text-[9px] opacity-70 leading-tight mt-1">{chapter.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
                    <CharacterCard key={char.id} character={char} onUpdate={(u) => setCharacters(characters.map(c => c.id === u.id ? u : c))} onRemove={(id) => setCharacters(characters.filter(c => c.id !== id))} />
                  ))}
                  <button onClick={() => addCharacter(sidebarTab === 'NPCs')} className="w-full py-4 border-2 border-dashed border-emerald-900/20 rounded-xl text-emerald-900 text-xs font-bold hover:bg-emerald-900/5 transition-all active:scale-95">
                    + ADICIONAR {sidebarTab === 'Heroes' ? 'HERÓI' : 'NPC'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 border-t border-emerald-950/20 text-[10px] space-y-3">
               <div className="flex justify-between items-center text-emerald-600 uppercase font-bold tracking-widest">
                 <span>Fellowship</span>
                 <input type="number" className="bg-transparent w-10 text-right outline-none text-emerald-400" value={gameState.fellowshipPool} onChange={e => setGameState({...gameState, fellowshipPool: +e.target.value})} />
               </div>
               <div className="flex justify-between items-center text-red-700 uppercase font-bold tracking-widest">
                 <span>Eye Awareness</span>
                 <input type="number" className="bg-transparent w-10 text-right outline-none text-red-500" value={gameState.eyeAwareness} onChange={e => setGameState({...gameState, eyeAwareness: +e.target.value})} />
               </div>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-[#050805] relative w-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-10 scrollbar-hide pb-32">
            {gameState.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center select-none animate-pulse px-6">
                <div className="text-6xl lg:text-9xl font-cinzel text-emerald-900 tracking-tighter">ARNOR</div>
                <p className="max-w-md italic text-emerald-800 text-sm lg:text-xl mt-6 font-serif leading-relaxed">
                  {gameState.activeChapterId 
                    ? `Preparando o capítulo "${STORY_MODULES.find(s => s.id === gameState.activeStoryId)?.chapters.find(c => c.id === gameState.activeChapterId)?.title}"...`
                    : '"O mundo mudou. Eu sinto isso na água. Eu sinto na terra. Eu sinto no ar."'}
                </p>
              </div>
            )}
            
            {gameState.history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-700 px-2 lg:px-4`}>
                <div className={`max-w-[92%] lg:max-w-[80%] p-6 lg:p-10 rounded-3xl shadow-2xl relative ${
                  msg.role === 'user' 
                    ? (msg.isRoll ? 'bg-[#0a200a] border border-emerald-500/30 text-emerald-200' : 'bg-[#0c140c] border border-emerald-900/40 text-emerald-100') 
                    : 'parchment border-2 border-emerald-800/40 text-[#1a261a] font-serif leading-relaxed text-lg lg:text-xl'
                }`}>
                  {msg.role === 'model' && (
                    <div className="absolute -top-4 left-6 flex items-center gap-2">
                      <div className="bg-emerald-900 text-white text-[9px] px-3 py-1 rounded-full font-cinzel uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg">
                        <span>Escriba das Sombras</span>
                        <button 
                          onClick={() => handleManualSpeak(msg.text, i)}
                          className={`hover:scale-125 transition-transform text-xs ${playingMessageIndex === i ? 'text-amber-400' : 'text-emerald-500'}`}
                        >
                          {playingMessageIndex === i ? '⏹' : '▶'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start px-6">
                <div className="bg-emerald-950/20 px-8 py-4 rounded-full border border-emerald-800/10 text-emerald-700 italic text-sm animate-pulse">
                  O Escriba consulta os fios do destino...
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Player Feedback / Audio Status Overlay */}
          {isSpeaking && (
            <div className="absolute bottom-28 left-0 right-0 flex justify-center z-20 pointer-events-none px-4">
              <div className="bg-emerald-900/90 text-emerald-100 px-6 py-2 rounded-full text-[10px] font-bold font-cinzel tracking-widest animate-pulse border border-emerald-500/50 shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="flex gap-1 items-end h-4">
                  <div className="w-1 bg-emerald-400 h-2 animate-voice-bar-1"></div>
                  <div className="w-1 bg-emerald-400 h-4 animate-voice-bar-2"></div>
                  <div className="w-1 bg-emerald-400 h-3 animate-voice-bar-3"></div>
                </div>
                <span>OUVINDO A LENDA...</span>
                <button 
                  onClick={() => { loremaster.current.stopSpeaking(); setIsSpeaking(false); setPlayingMessageIndex(null); }} 
                  className="bg-red-900/50 hover:bg-red-800 p-1.5 rounded-full text-white transition-colors"
                >✕</button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8 bg-gradient-to-t from-[#040804] to-transparent z-30">
            <div className="max-w-4xl mx-auto flex gap-3 items-end">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Declare sua ação..."
                rows={1}
                className="flex-1 bg-[#0a140a]/90 backdrop-blur-sm border border-emerald-900/50 rounded-2xl p-4 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none min-h-[56px] max-h-[160px] text-base font-serif shadow-2xl"
              />
              <button 
                onClick={() => handleSend()} 
                disabled={loading || !input.trim()} 
                className="bg-emerald-900 text-white w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center hover:bg-emerald-800 disabled:opacity-20 transition-all shrink-0 shadow-xl active:scale-95"
              >
                <span className="text-2xl">📜</span>
              </button>
            </div>
          </div>
        </main>

        {/* Modal Dados */}
        {showRollPanel && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-lg">
            <div className="parchment w-full max-w-sm p-10 rounded-[2.5rem] border-2 border-emerald-900 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="font-cinzel text-center border-b border-emerald-900/20 pb-4 mb-8 font-bold text-lg uppercase tracking-[0.3em] text-emerald-950">Lançar Desafio</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">Personagem</label>
                  <select className="w-full bg-white/50 border border-emerald-900/10 rounded-xl p-3 text-sm focus:bg-white transition-all outline-none" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">Perícia</label>
                  <select className="w-full bg-white/50 border border-emerald-900/10 rounded-xl p-3 text-sm focus:bg-white transition-all outline-none" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                    {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-emerald-900 uppercase ml-1 tracking-widest">D20</label>
                    <input type="number" className="w-full bg-white border-2 border-emerald-900/20 rounded-xl p-4 text-center text-4xl font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                  </div>
                  <button onClick={executeRoll} disabled={!selectedCharId || diceValue === ''} className="bg-emerald-950 text-white px-8 rounded-xl font-cinzel font-bold hover:bg-emerald-800 disabled:opacity-20 transition-all mt-6 shadow-xl active:scale-95">Rolar</button>
                </div>
                <button onClick={() => setShowRollPanel(false)} className="w-full text-[10px] text-red-900 font-bold uppercase mt-4 hover:tracking-widest transition-all opacity-60">Voltar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
