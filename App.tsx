
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule, StoryChapter } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters_v2';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate_v2';

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
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMap, setCurrentMap] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const [selectedCharId, setSelectedCharId] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(SKILLS[0].name);
  const [diceValue, setDiceValue] = useState<number | ''>('');
  const [showRollPanel, setShowRollPanel] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const loremaster = useRef(new LoremasterService());

  useEffect(() => {
    const savedChars = localStorage.getItem(STORAGE_KEY_CHARACTERS);
    const savedState = localStorage.getItem(STORAGE_KEY_GAMESTATE);
    if (savedChars) setCharacters(JSON.parse(savedChars));
    if (savedState) setGameState(JSON.parse(savedState));
    
    if (window.innerWidth < 1024) setShowSidebar(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
    localStorage.setItem(STORAGE_KEY_GAMESTATE, JSON.stringify(gameState));
  }, [characters, gameState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history, loading]);

  const handleSend = async (customText?: string, isRoll = false) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    loremaster.current.resumeAudio();
    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now(), isRoll };
    const updatedHistory = [...gameState.history, userMsg];
    
    setGameState(prev => ({ ...prev, history: updatedHistory }));
    setInput('');
    setLoading(true);

    try {
      const response = await loremaster.current.sendMessage(textToSend, characters, gameState, updatedHistory);
      
      // Lógica de atualização de local baseada na resposta da IA
      if (response.toLowerCase().includes('chegam a') || response.toLowerCase().includes('em direção a')) {
        const map = await loremaster.current.generateMap(gameState.location);
        if (map) setCurrentMap(map);
      }

      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...updatedHistory, modelMsg] }));

      if (voiceEnabled) {
        setIsSpeaking(true);
        await loremaster.current.speak(response, () => setIsSpeaking(false));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createCharacter = (isNPC: boolean) => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: isNPC ? 'Novo Povo Livre' : 'Novo Herói',
      culture: Culture.MEN_BREE,
      calling: Calling.WARDEN,
      level: 1,
      experiencePoints: 0,
      distinctiveFeatures: '',
      shadowPath: '',
      isNPC,
      isWeary: false,
      inspiration: false,
      proficiencyBonus: 2,
      armorClass: 10,
      initiative: 0,
      speed: '30ft',
      passiveWisdom: 10,
      stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      savingThrows: [],
      skillProficiencies: [],
      hp: { current: 10, max: 10, temp: 0 },
      hitDice: { current: 1, max: '1d8' },
      deathSaves: { successes: 0, failures: 0 },
      shadow: { score: 0, scars: 0, miserable: false, anguished: false },
      encumbrance: { carriedWeight: 0, isEncumbered: false, isHeavilyEncumbered: false },
      toolsAndLanguages: '',
      featuresTraitsVirtues: '',
      equipment: '',
      attacks: [],
      journeyRole: JourneyRole.NONE,
      fellowshipPoints: 0,
      hope: { current: 10, max: 10 }
    };
    setCharacters([...characters, newChar]);
  };

  const startChapter = (story: StoryModule, chapter: StoryChapter) => {
    setGameState(prev => ({ 
      ...prev, 
      activeStoryId: story.id, 
      activeChapterId: chapter.id, 
      location: story.context,
      history: []
    }));
    handleSend(`Escriba, narre o início do Capítulo "${chapter.title}" do livro "${story.title}". Contexto: ${chapter.description}`);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#040804] text-[#d1dbd1] overflow-hidden">
      
      <aside className={`
        ${showSidebar ? 'w-full lg:w-[450px]' : 'w-0'} 
        transition-all duration-300 bg-[#081108] border-r border-emerald-900/30 flex flex-col z-50 fixed lg:relative h-full shadow-2xl
      `}>
        {showSidebar && (
          <div className="p-5 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-emerald-500 font-bold tracking-[0.2em] text-lg uppercase">Arnor</h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-emerald-700 p-2">✕</button>
            </div>

            <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-2xl border border-emerald-900/20">
              {(['Heroes', 'NPCs', 'Legends'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2.5 text-[10px] font-bold rounded-xl transition-all ${sidebarTab === tab ? 'bg-emerald-900 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-900/60 hover:text-emerald-500'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-5 pb-6">
              {sidebarTab === 'Legends' ? (
                <div className="space-y-4">
                  {STORY_MODULES.map(story => (
                    <div key={story.id} className="parchment rounded-2xl border-2 border-emerald-900/30 overflow-hidden shadow-xl transition-all hover:border-emerald-700/50">
                      <button 
                        onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)}
                        className="w-full p-5 text-left transition-colors"
                      >
                        <h3 className="font-cinzel font-bold text-emerald-950 text-base mb-1 tracking-tight">{story.title}</h3>
                        <p className="text-[11px] text-emerald-900/70 italic leading-snug">{story.description}</p>
                      </button>
                      {expandedStoryId === story.id && (
                        <div className="bg-emerald-950/5 p-3 space-y-1.5 border-t border-emerald-900/20">
                          <p className="text-[9px] font-bold text-emerald-900/40 uppercase mb-2 px-1">Capítulos Disponíveis</p>
                          {story.chapters.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => startChapter(story, c)}
                              className={`w-full text-left p-3 rounded-xl hover:bg-emerald-900 hover:text-white text-[11px] font-bold transition-all border border-transparent ${gameState.activeChapterId === c.id ? 'bg-emerald-900 text-white shadow-md' : 'bg-white/40'}`}
                            >
                              📜 {c.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
                    <CharacterCard 
                      key={char.id} 
                      character={char} 
                      onUpdate={(u) => setCharacters(characters.map(c => c.id === u.id ? u : c))}
                      onRemove={(id) => setCharacters(characters.filter(c => c.id !== id))}
                      onAskHelp={(f) => handleSend(`Escriba, como preencho o campo "${f}" seguindo as regras de LOTR 5E?`)}
                    />
                  ))}
                  <button onClick={() => createCharacter(sidebarTab === 'NPCs')} className="w-full py-5 border-2 border-dashed border-emerald-900/20 rounded-2xl text-emerald-900 text-xs font-bold hover:bg-emerald-900/5 transition-all active:scale-95 uppercase tracking-widest">+ Novo {sidebarTab === 'Heroes' ? 'Herói' : 'Aliado'}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#040604]">
        
        <div className="h-14 lg:h-16 flex items-center px-4 lg:px-8 justify-between border-b border-emerald-900/20 bg-[#050a05] z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="text-xl hover:scale-110 transition-transform">📜</button>
            <div className="h-8 w-px bg-emerald-900/20 hidden lg:block" />
            <div className="hidden lg:flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-black border border-red-900/50 flex items-center justify-center text-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]">👁️</div>
               <span className="font-cinzel text-[10px] tracking-[0.3em] text-emerald-600 font-bold uppercase">Eye Awareness: {gameState.eyeAwareness}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/20 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 hover:bg-emerald-900/40 transition-all active:scale-95 shadow-lg">
              {DICE_SVG} TESTAR
            </button>
          </div>
        </div>

        {currentMap && (
          <div className="absolute top-20 right-6 w-56 lg:w-80 z-40 rounded-2xl overflow-hidden border-2 border-emerald-900/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-zoom-in transition-all hover:w-[400px] group">
             <img src={currentMap} className="w-full h-full object-cover" alt="Mapa" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Visão de Arnor</span>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-10 scrollbar-hide pb-40">
          {gameState.history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center select-none py-20 px-10">
              <div className="text-7xl lg:text-[10rem] font-cinzel text-emerald-900 tracking-tighter uppercase leading-none">Arnor</div>
              <p className="max-w-xl italic text-emerald-800 text-lg lg:text-2xl mt-8 font-serif leading-relaxed px-4">
                "O mundo mudou. Eu sinto isso na água. Eu sinto na terra. Eu sinto no ar. Muito do que existia se perdeu, pois ninguém vive agora que se lembre."
              </p>
            </div>
          )}

          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-700`}>
              <div className={`
                max-w-[95%] lg:max-w-[75%] p-8 rounded-[2.5rem] shadow-2xl relative transition-all
                ${msg.role === 'user' 
                  ? 'bg-[#0a200a] border border-emerald-900/40 text-emerald-100 font-serif italic' 
                  : 'parchment border-2 border-emerald-800/40 text-[#1a261a] font-serif text-lg leading-relaxed shadow-[15px_15px_40px_rgba(0,0,0,0.5)]'}
              `}>
                {msg.role === 'model' && (
                  <div className="absolute -top-4 left-10 flex items-center gap-2">
                    <div className="bg-emerald-900 text-white text-[9px] px-4 py-1.5 rounded-full font-cinzel uppercase tracking-[0.2em] shadow-2xl border border-emerald-500/30">Escriba das Sombras</div>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              {msg.isRoll && i === gameState.history.length - 1 && !loading && (
                <div className="flex gap-3 mt-5 px-4">
                   <button onClick={() => handleSend("SUCESSO ÉPICO! O destino sorriu para nós.")} className="bg-emerald-950 text-emerald-200 border border-emerald-500/30 px-6 py-2 rounded-2xl text-xs font-bold hover:bg-emerald-900 transition-all shadow-xl active:scale-95">✨ SUCESSO</button>
                   <button onClick={() => handleSend("FALHA... A Sombra nos alcançou.")} className="bg-red-950 text-red-200 border border-red-500/30 px-6 py-2 rounded-2xl text-xs font-bold hover:bg-red-900 transition-all shadow-xl active:scale-95">💀 FALHA</button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start px-10 animate-pulse">
              <div className="bg-emerald-900/20 px-8 py-4 rounded-full border border-emerald-800/30 text-emerald-600 italic text-base flex items-center gap-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                O Escriba consulta os fios do destino...
              </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-10" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 bg-gradient-to-t from-[#040804] to-transparent z-40">
          <div className="max-w-4xl mx-auto flex gap-4 items-end">
            <div className="flex-1 relative group shadow-2xl rounded-3xl">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Declare sua ação nas sombras de Arnor..."
                rows={1}
                className="w-full bg-[#0a180a]/95 backdrop-blur-xl border border-emerald-900/60 rounded-3xl p-5 lg:p-6 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none min-h-[64px] max-h-[180px] text-base lg:text-lg font-serif transition-all"
              />
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                className={`absolute right-6 top-1/2 -translate-y-1/2 text-2xl transition-all duration-300 ${voiceEnabled ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-emerald-900 opacity-40 hover:opacity-100'}`}
              >
                {voiceEnabled ? '🔊' : '🔇'}
              </button>
            </div>
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()} 
              className="bg-emerald-900 text-white w-16 h-16 lg:w-20 lg:h-20 rounded-3xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-2xl active:scale-95 border-b-4 border-emerald-950 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">📜</span>
            </button>
          </div>
        </div>
      </main>

      {showRollPanel && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="parchment w-full max-w-md p-10 lg:p-12 rounded-[3rem] border-4 border-emerald-950 shadow-2xl">
            <h3 className="font-cinzel text-center border-b-2 border-emerald-900/10 pb-6 mb-8 font-bold text-xl uppercase tracking-[0.4em] text-emerald-950">Desafio do Destino</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-emerald-900/40 uppercase ml-2 mb-2 block tracking-widest">Escolha o Herói</label>
                <select className="w-full bg-white/60 border border-emerald-900/20 rounded-2xl p-4 text-sm focus:bg-white outline-none transition-all shadow-inner" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                  <option value="">-- Herói --</option>
                  {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-900/40 uppercase ml-2 mb-2 block tracking-widest">A Habilidade</label>
                <select className="w-full bg-white/60 border border-emerald-900/20 rounded-2xl p-4 text-sm focus:bg-white outline-none transition-all shadow-inner" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                  {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name} ({s.stat.slice(0,3)})</option>)}
                </select>
              </div>
              <div className="flex gap-5 items-center pt-4">
                <div className="flex-1">
                   <label className="text-[10px] font-bold text-emerald-900/40 uppercase ml-2 mb-2 block tracking-widest">Resultado do D20</label>
                   <input type="number" className="w-full bg-white border-4 border-emerald-900/30 rounded-2xl p-6 text-center text-5xl font-bold text-emerald-950 outline-none focus:border-emerald-600 transition-all shadow-2xl" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                </div>
                <button onClick={() => {
                  const char = characters.find(c => c.id === selectedCharId);
                  if (char && diceValue !== '') {
                    const skill = SKILLS.find(s => s.name === selectedSkill);
                    const mod = Math.floor((char.stats[skill?.stat as keyof typeof char.stats] - 10) / 2);
                    handleSend(`[ROLAGEM] ${char.name} testa ${selectedSkill}: ${diceValue} + ${mod} = ${(diceValue as number) + mod}`, true);
                    setShowRollPanel(false);
                    setDiceValue('');
                  }
                }} className="bg-emerald-950 text-white px-10 h-[100px] rounded-3xl font-cinzel font-bold hover:bg-emerald-800 transition-all shadow-2xl active:scale-95 border-b-4 border-black">ROLAR</button>
              </div>
              <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-900/50 font-bold uppercase mt-8 hover:text-red-700 transition-colors tracking-widest">Abandonar Teste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
