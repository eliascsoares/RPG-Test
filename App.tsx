
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule, StoryChapter } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters_v3';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate_v3';

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
    if (savedChars) try { setCharacters(JSON.parse(savedChars)); } catch(e) {}
    if (savedState) try { setGameState(JSON.parse(savedState)); } catch(e) {}
    
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
      
      const geoKeywords = ['chegam', 'viajam', 'direção', 'estrada', 'local', 'ruínas', 'torre', 'colina', 'condado', 'bri'];
      const responseLower = response.toLowerCase();
      if (geoKeywords.some(key => responseLower.includes(key)) || Math.random() > 0.8) {
        const map = await loremaster.current.generateMap(gameState.location);
        if (map) setCurrentMap(map);
      }

      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...updatedHistory, modelMsg] }));

      if (voiceEnabled) {
        setIsSpeaking(true);
        await loremaster.current.speak(response, () => setIsSpeaking(false));
      }
    } catch (e: any) {
      console.error("LOREMASTER ERROR:", e);
      const errorMsg: Message = { 
        role: 'model', 
        text: `As Sombras de Arnor escureceram minha visão. (Erro: ${e.message || 'Conexão interrompida'}). Tente novamente em instantes.`, 
        timestamp: Date.now() 
      };
      setGameState(prev => ({ ...prev, history: [...prev.history, errorMsg] }));
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
      hope: { current: 10, max: 10 },
      hitDice: { current: 1, max: '1d8' },
      deathSaves: { successes: 0, failures: 0 },
      shadow: { score: 0, scars: 0, miserable: false, anguished: false },
      encumbrance: { carriedWeight: 0, isEncumbered: false, isHeavilyEncumbered: false },
      toolsAndLanguages: '',
      featuresTraitsVirtues: '',
      equipment: '',
      attacks: [],
      journeyRole: JourneyRole.NONE,
      fellowshipPoints: 0
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
    handleSend(`Escriba, narre o início da Lenda "${story.title}", Capítulo "${chapter.title}". Contexto: ${chapter.description}`);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#040804] text-[#d1dbd1] overflow-hidden font-serif">
      
      <aside className={`
        ${showSidebar ? 'w-full md:w-[450px]' : 'w-0'} 
        transition-all duration-300 bg-[#081108] border-r border-emerald-900/30 flex flex-col z-50 fixed lg:relative h-full shadow-2xl
      `}>
        {showSidebar && (
          <div className="p-5 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-emerald-500 font-bold tracking-[0.2em] text-lg uppercase">Escriba de Arnor</h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-emerald-700 p-2 text-xl">✕</button>
            </div>

            <div className="flex gap-2 mb-6 bg-black/40 p-1.5 rounded-2xl border border-emerald-900/20">
              {(['Heroes', 'NPCs', 'Legends'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all ${sidebarTab === tab ? 'bg-emerald-900 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/30' : 'text-emerald-900/60 hover:text-emerald-500'}`}
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
                        className="w-full p-5 text-left transition-colors bg-white/10"
                      >
                        <h3 className="font-cinzel font-bold text-emerald-950 text-base mb-1 tracking-tight">{story.title}</h3>
                        <p className="text-[11px] text-emerald-900/70 italic leading-snug">{story.description}</p>
                      </button>
                      {expandedStoryId === story.id && (
                        <div className="bg-emerald-950/10 p-3 space-y-2 border-t border-emerald-900/20">
                          {story.chapters.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => startChapter(story, c)}
                              className={`w-full text-left p-3 rounded-xl hover:bg-emerald-900 hover:text-white text-[11px] font-bold transition-all border border-emerald-900/10 ${gameState.activeChapterId === c.id ? 'bg-emerald-800 text-white shadow-md' : 'bg-white/40'}`}
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
                      onAskHelp={(f) => handleSend(`[PEDIDO DE AJUDA] Escriba, preciso de orientação técnica sobre "${f}". Explique como preencher, quais dados usar (Ex: d20) e as regras do Lord of the Rings 5E envolvidas.`)}
                    />
                  ))}
                  <button onClick={() => createCharacter(sidebarTab === 'NPCs')} className="w-full py-5 border-2 border-dashed border-emerald-900/30 rounded-2xl text-emerald-900 text-xs font-bold hover:bg-emerald-900/5 transition-all active:scale-95 uppercase tracking-widest font-cinzel">+ Novo {sidebarTab === 'Heroes' ? 'Herói' : 'Aliado'}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#040604]">
        
        <div className="h-16 flex items-center px-4 md:px-8 justify-between border-b border-emerald-900/20 bg-[#050a05] z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="text-2xl hover:scale-110 transition-transform p-2">📜</button>
            <div className="hidden md:flex items-center gap-4 border-l border-emerald-900/20 pl-4">
               <div className="w-9 h-9 rounded-full bg-black border border-red-900/50 flex items-center justify-center text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)] text-lg">👁️</div>
               <div className="flex flex-col">
                  <span className="font-cinzel text-[9px] tracking-[0.2em] text-emerald-700 font-bold uppercase leading-none mb-1">Localização</span>
                  <span className="text-xs text-emerald-100 font-medieval">{gameState.location}</span>
               </div>
            </div>
          </div>
          <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/20 border border-emerald-500/40 px-5 py-2.5 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-3 hover:bg-emerald-900/40 transition-all shadow-lg font-cinzel tracking-widest uppercase">
            {DICE_SVG} Testar
          </button>
        </div>

        {currentMap && (
          <div className="absolute top-20 right-6 w-64 md:w-96 z-40 rounded-3xl overflow-hidden border-2 border-emerald-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] cursor-zoom-in transition-all duration-700 hover:w-[90%] md:hover:w-[70%] group">
             <img src={currentMap} className="w-full h-full object-cover" alt="Mapa" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <span className="font-cinzel text-xs text-emerald-400 font-bold tracking-widest uppercase">Visão Épica de Arnor</span>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-14 space-y-12 scrollbar-hide pb-48">
          {gameState.history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center py-20">
              <div className="text-8xl md:text-[10rem] font-cinzel text-emerald-900 tracking-tighter uppercase">Arnor</div>
              <p className="max-w-2xl italic text-emerald-800 text-xl md:text-2xl mt-12 font-serif px-6">"Tudo o que temos de decidir é o que fazer com o tempo que nos é dado."</p>
            </div>
          )}

          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-8 duration-700`}>
              <div className={`
                max-w-[95%] md:max-w-[85%] lg:max-w-[75%] p-8 rounded-[2rem] shadow-2xl relative
                ${msg.role === 'user' 
                  ? 'bg-[#0a200a] border border-emerald-900/40 text-emerald-100 font-serif italic shadow-inner' 
                  : 'parchment border-2 border-emerald-800/40 text-[#1a261a] font-serif text-xl shadow-[20px_20px_50px_rgba(0,0,0,0.6)]'}
              `}>
                {msg.role === 'model' && (
                  <div className="absolute -top-4 left-8 flex items-center gap-3">
                    <div className="bg-emerald-900 text-white text-[10px] px-4 py-1.5 rounded-full font-cinzel uppercase tracking-[0.2em] shadow-2xl border border-emerald-400/40">Escriba das Sombras</div>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              {msg.isRoll && i === gameState.history.length - 1 && !loading && (
                <div className="flex gap-4 mt-6 px-4">
                   <button onClick={() => handleSend("O herói triunfou! Descreva o sucesso épico.")} className="bg-emerald-950 text-emerald-200 border-2 border-emerald-500/40 px-8 py-2 rounded-2xl text-xs font-bold hover:bg-emerald-900 transition-all font-cinzel uppercase tracking-widest shadow-xl">✨ Sucesso</button>
                   <button onClick={() => handleSend("A Sombra prevaleceu... Narre as consequências da falha.")} className="bg-red-950 text-red-200 border-2 border-red-500/40 px-8 py-2 rounded-2xl text-xs font-bold hover:bg-red-900 transition-all font-cinzel uppercase tracking-widest shadow-xl">💀 Falha</button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start px-12 animate-pulse">
              <div className="bg-emerald-900/10 px-8 py-4 rounded-full border border-emerald-800/20 text-emerald-600 italic text-lg shadow-sm">O Escriba consulta os fios do destino...</div>
            </div>
          )}
          <div ref={chatEndRef} className="h-12" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-[#040804] to-transparent z-40">
          <div className="max-w-5xl mx-auto flex gap-5 items-end">
            <div className="flex-1 relative shadow-2xl rounded-3xl overflow-hidden border border-emerald-900/60">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Declare sua ação nas sombras de Arnor..."
                rows={1}
                className="w-full bg-[#0a1c0a]/95 backdrop-blur-2xl p-6 lg:p-7 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none min-h-[64px] max-h-[220px] text-lg md:text-xl font-serif"
              />
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                className={`absolute right-8 top-1/2 -translate-y-1/2 text-3xl transition-all duration-500 ${voiceEnabled ? 'text-emerald-400 drop-shadow-[0_0_15px_#10b981]' : 'text-emerald-950 opacity-30 hover:opacity-100'}`}
              >
                {voiceEnabled ? '🔊' : '🔇'}
              </button>
            </div>
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()} 
              className="bg-emerald-900 text-white w-18 h-18 lg:w-22 lg:h-22 rounded-3xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-2xl border-b-4 border-emerald-950 group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">📜</span>
            </button>
          </div>
        </div>
      </main>

      {showRollPanel && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl animate-in zoom-in duration-300">
          <div className="parchment w-full max-w-lg p-10 md:p-14 rounded-[3rem] border-4 border-emerald-950 shadow-2xl">
            <h3 className="font-cinzel text-center border-b-2 border-emerald-900/10 pb-8 mb-10 font-bold text-2xl uppercase tracking-[0.5em] text-emerald-950">Desafio do Destino</h3>
            <div className="space-y-8">
              <div>
                <label className="text-[11px] font-bold text-emerald-900/60 uppercase ml-4 mb-3 block tracking-widest font-cinzel">O Caminhante</label>
                <select className="w-full bg-white/70 border-2 border-emerald-900/20 rounded-2xl p-5 text-lg font-bold text-emerald-950 outline-none" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                  <option value="">-- Herói --</option>
                  {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-emerald-900/60 uppercase ml-4 mb-3 block tracking-widest font-cinzel">Habilidade</label>
                <select className="w-full bg-white/70 border-2 border-emerald-900/20 rounded-2xl p-5 text-lg font-bold text-emerald-950 outline-none" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                  {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name} ({s.stat.slice(0,3)})</option>)}
                </select>
              </div>
              <div className="flex gap-6 items-center pt-6">
                <div className="flex-1">
                   <label className="text-[11px] font-bold text-emerald-900/60 uppercase ml-4 mb-3 block tracking-widest font-cinzel text-center">Valor do D20</label>
                   <input type="number" className="w-full bg-white border-4 border-emerald-900/40 rounded-3xl p-8 text-center text-6xl font-bold text-emerald-950 outline-none shadow-2xl" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
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
                }} className="bg-emerald-950 text-white px-12 h-[120px] rounded-[2.5rem] font-cinzel font-bold text-xl hover:bg-emerald-800 transition-all uppercase shadow-2xl active:scale-95">Rolar</button>
              </div>
              <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-900/40 font-bold uppercase mt-10 hover:text-red-700 tracking-[0.3em] font-cinzel">Abandonar Destino</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
