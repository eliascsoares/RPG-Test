
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule, StoryChapter } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'arnor_loremaster_characters_v4';
const STORAGE_KEY_GAMESTATE = 'arnor_loremaster_gamestate_v4';

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
  const [currentVision, setCurrentVision] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [showFullscreenVision, setShowFullscreenVision] = useState(false);
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

  const triggerVision = async (desc: string, isMap: boolean = false) => {
    setVisionLoading(true);
    try {
      const img = await loremaster.current.generateVision(desc, isMap);
      if (img) setCurrentVision(img);
    } finally {
      setVisionLoading(false);
    }
  };

  const handleSend = async (customText?: string, isRoll = false, autoVision = false) => {
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
      
      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...updatedHistory, modelMsg] }));

      if (autoVision) {
        triggerVision(gameState.location, true);
      } else {
        const keywords = ['mapa', 'ver', 'olhar', 'lugar', 'chegam', 'ruína', 'estrada', 'paisagem'];
        if (keywords.some(k => response.toLowerCase().includes(k))) {
          triggerVision(response.slice(0, 400));
        }
      }

      if (voiceEnabled) {
        setIsSpeaking(true);
        await loremaster.current.speak(response, () => setIsSpeaking(false));
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg: Message = { role: 'model', text: `As Sombras impediram o Escriba.`, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...prev.history, errorMsg] }));
    } finally {
      setLoading(false);
    }
  };

  const startChapter = (story: StoryModule, chapter: StoryChapter) => {
    setGameState(prev => ({ 
      ...prev, 
      activeStoryId: story.id, 
      activeChapterId: chapter.id, 
      location: chapter.title,
      history: []
    }));
    handleSend(`Escriba, narre o início de "${chapter.title}" da lenda "${story.title}". Contexto: ${chapter.description}`, false, true);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#040804] text-[#d1dbd1] overflow-hidden font-serif">
      
      {/* Sidebar Restored */}
      <aside className={`${showSidebar ? 'w-full md:w-[450px]' : 'w-0'} transition-all duration-300 bg-[#081108] border-r border-emerald-900/30 flex flex-col z-50 fixed lg:relative h-full shadow-2xl overflow-hidden`}>
        {showSidebar && (
          <div className="p-5 flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-emerald-500 font-bold tracking-[0.2em] text-lg uppercase">Escriba de Arnor</h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-emerald-700 p-2 text-xl">✕</button>
            </div>

            <div className="flex gap-2 mb-6 bg-black/40 p-1.5 rounded-2xl border border-emerald-900/20">
              {(['Heroes', 'NPCs', 'Legends'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all ${sidebarTab === tab ? 'bg-emerald-900 text-white border border-emerald-400/30' : 'text-emerald-900/60 hover:text-emerald-500'}`}
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
                        className="w-full p-5 text-left bg-emerald-950/5 hover:bg-emerald-950/10 transition-colors"
                      >
                        <h3 className="font-cinzel font-bold text-emerald-950 text-sm mb-1 uppercase tracking-tight">{story.title}</h3>
                        <p className="text-[10px] text-emerald-900/80 italic leading-tight">{story.description}</p>
                      </button>
                      {expandedStoryId === story.id && (
                        <div className="bg-white/20 p-2 space-y-1 border-t border-emerald-900/10">
                          {story.chapters.map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => startChapter(story, c)} 
                              className={`w-full text-left p-3 rounded-xl hover:bg-emerald-900 hover:text-white text-[10px] font-bold transition-all ${gameState.activeChapterId === c.id ? 'bg-emerald-800 text-white shadow-md' : 'bg-white/40 text-emerald-900'}`}
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
                      key={char.id} character={char} 
                      onUpdate={(u) => setCharacters(characters.map(c => c.id === u.id ? u : c))}
                      onRemove={(id) => setCharacters(characters.filter(c => c.id !== id))}
                      onAskHelp={(f) => handleSend(`Escriba, preciso de ajuda com "${f}". Como as regras de Arnor se aplicam?`)}
                    />
                  ))}
                  <button onClick={() => setCharacters([...characters, { id: Math.random().toString(), name: sidebarTab === 'Heroes' ? 'Novo Herói' : 'Novo Aliado', culture: Culture.MEN_BREE, calling: Calling.WARDEN, level: 1, stats: {strength:10, dexterity:10, constitution:10, intelligence:10, wisdom:10, charisma:10}, hp: {current:10, max:10, temp:0}, hope: {current:10, max:10}, shadow: {score:0, scars:0, miserable:false, anguished:false}, savingThrows: [], skillProficiencies: [], isNPC: sidebarTab === 'NPCs', proficiencyBonus: 2, armorClass: 10, initiative: 0, speed: '30ft', passiveWisdom: 10, experiencePoints: 0, distinctiveFeatures: '', shadowPath: '', hitDice: {current:1, max:'1d8'}, deathSaves: {successes:0, failures:0}, encumbrance: {carriedWeight:0, isEncumbered:false, isHeavilyEncumbered:false}, toolsAndLanguages: '', featuresTraitsVirtues: '', equipment: '', attacks: [], journeyRole: JourneyRole.NONE, fellowshipPoints: 0 }])} className="w-full py-5 border-2 border-dashed border-emerald-900/30 rounded-2xl text-emerald-900 text-[10px] font-bold hover:bg-emerald-900/5 transition-all uppercase font-cinzel tracking-widest">+ Novo {sidebarTab === 'Heroes' ? 'Herói' : 'Aliado'}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#040604]">
        
        <div className="h-16 flex items-center px-4 md:px-8 justify-between border-b border-emerald-900/20 bg-[#050a05] z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-2xl hover:scale-110 transition-transform p-2">📜</button>
            <div className="h-6 w-px bg-emerald-900/20" />
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-100 font-medieval uppercase tracking-widest">{gameState.location}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => triggerVision(gameState.history[gameState.history.length-1]?.text || gameState.location)} disabled={visionLoading} className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 text-[10px] font-bold hover:bg-emerald-900/40 transition-all font-cinzel uppercase tracking-widest disabled:opacity-20">
              {visionLoading ? '👁️ Evocando...' : '👁️ Ver Cena'}
            </button>
            <button onClick={() => setShowRollPanel(true)} className="bg-emerald-900/20 border border-emerald-500/40 px-4 py-2 rounded-xl text-emerald-400 text-[10px] font-bold hover:bg-emerald-900/40 transition-all font-cinzel uppercase tracking-widest">
              {DICE_SVG} Rolar
            </button>
          </div>
        </div>

        {/* Cinematic Vision Overlay with corrected Click logic */}
        {(currentVision || visionLoading) && (
          <div className="absolute top-20 right-6 w-72 md:w-[450px] z-40 group animate-in slide-in-from-right duration-700">
            <div className="parchment p-1 rounded-2xl border-2 border-emerald-900/60 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden relative">
              {visionLoading ? (
                <div className="h-40 md:h-64 bg-black/40 animate-pulse flex items-center justify-center text-emerald-600 italic text-[10px] font-cinzel uppercase tracking-[0.3em]">O Escriba desenha a visão...</div>
              ) : (
                <img 
                  src={currentVision!} 
                  className="w-full h-auto cursor-zoom-in transition-transform duration-1000 group-hover:scale-105" 
                  alt="Visão de Arnor" 
                  onClick={() => setShowFullscreenVision(true)} 
                />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white/70 font-cinzel text-center tracking-widest uppercase">Palantír de Arnor (Clique para Ampliar)</p>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Vision (Lightbox) */}
        {showFullscreenVision && currentVision && (
          <div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500 cursor-zoom-out"
            onClick={() => setShowFullscreenVision(false)}
          >
            <div className="max-w-[90vw] max-h-[90vh] relative animate-in zoom-in duration-500">
              <img src={currentVision} className="w-full h-full object-contain rounded-2xl border-4 border-emerald-900 shadow-[0_0_100px_rgba(16,185,129,0.2)]" alt="Visão Ampliada" />
              <button className="absolute -top-12 right-0 text-white font-cinzel uppercase tracking-widest text-xs border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition-all">Fechar Visão ✕</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 space-y-12 scrollbar-hide pb-52">
          {gameState.history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center py-20 grayscale">
              <div className="text-[120px] font-cinzel text-emerald-900 uppercase leading-none select-none">Arnor</div>
              <p className="mt-8 italic text-emerald-800 text-2xl font-serif">Escolha uma Lenda para começar sua jornada.</p>
            </div>
          )}

          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-700`}>
              <div className={`max-w-[90%] md:max-w-[80%] lg:max-w-[70%] p-8 rounded-[2rem] shadow-2xl relative ${msg.role === 'user' ? 'bg-[#0a200a] border border-emerald-900/40 text-emerald-100 font-serif italic' : 'parchment border-2 border-emerald-800/30 text-[#1a261a] font-serif text-xl'}`}>
                {msg.role === 'model' && (
                  <div className="absolute -top-4 left-8 bg-emerald-900 text-white text-[9px] px-3 py-1.5 rounded-full font-cinzel uppercase tracking-[0.2em] shadow-xl border border-emerald-400/40">Escriba das Sombras</div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
              {msg.isRoll && i === gameState.history.length - 1 && !loading && (
                <div className="flex gap-4 mt-6 px-4">
                   <button onClick={() => handleSend("O herói triunfou! Descreva o sucesso épico.")} className="bg-emerald-950 text-emerald-200 border border-emerald-500/40 px-6 py-2 rounded-xl text-[10px] font-bold hover:bg-emerald-900 transition-all font-cinzel uppercase tracking-widest">✨ Sucesso</button>
                   <button onClick={() => handleSend("A Sombra prevaleceu... Narre a falha cruel.")} className="bg-red-950 text-red-200 border border-red-500/40 px-6 py-2 rounded-xl text-[10px] font-bold hover:bg-red-900 transition-all font-cinzel uppercase tracking-widest">💀 Falha</button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start px-12 animate-pulse">
              <div className="bg-emerald-900/10 px-8 py-4 rounded-full border border-emerald-800/20 text-emerald-600 italic text-lg">O Escriba consulta os arquivos de Valfenda...</div>
            </div>
          )}
          <div ref={chatEndRef} className="h-12" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-[#040804] via-[#040804]/90 to-transparent z-40">
          <div className="max-w-4xl mx-auto flex gap-4 items-end">
            <div className="flex-1 relative shadow-2xl rounded-3xl overflow-hidden border border-emerald-900/50">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Declare sua ação nas Sombras..." rows={1} className="w-full bg-[#0a1c0a]/95 p-6 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none text-xl font-serif" />
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`absolute right-6 top-1/2 -translate-y-1/2 text-2xl transition-all ${voiceEnabled ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]' : 'text-emerald-950 opacity-40'}`}> {voiceEnabled ? '🔊' : '🔇'}</button>
            </div>
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-emerald-900 text-white w-20 h-20 rounded-3xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-2xl border-b-4 border-emerald-950 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">📜</span>
            </button>
          </div>
        </div>
      </main>

      {showRollPanel && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl animate-in zoom-in duration-300">
          <div className="parchment w-full max-w-lg p-12 rounded-[3rem] border-4 border-emerald-950 shadow-2xl">
            <h3 className="font-cinzel text-center border-b-2 border-emerald-900/10 pb-8 mb-10 font-bold text-2xl uppercase tracking-[0.5em] text-emerald-950">Destino Revelado</h3>
            <div className="space-y-6">
              <select className="w-full bg-white/70 border-2 border-emerald-900/20 rounded-2xl p-5 text-lg font-bold text-emerald-950 outline-none" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                <option value="">-- Escolha o Herói --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full bg-white/70 border-2 border-emerald-900/20 rounded-2xl p-5 text-lg font-bold text-emerald-950 outline-none" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-4 items-center pt-4">
                <input type="number" className="flex-1 bg-white border-4 border-emerald-900/40 rounded-3xl p-8 text-center text-6xl font-bold text-emerald-950 outline-none" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} placeholder="0" />
                <button onClick={() => {
                  const char = characters.find(c => c.id === selectedCharId);
                  if (char && diceValue !== '') {
                    const skill = SKILLS.find(s => s.name === selectedSkill);
                    const mod = Math.floor((char.stats[skill?.stat as keyof typeof char.stats] - 10) / 2);
                    handleSend(`[ROLAGEM] ${char.name} testa ${selectedSkill}: ${diceValue} + ${mod} = ${(diceValue as number) + mod}`, true);
                    setShowRollPanel(false);
                    setDiceValue('');
                  }
                }} className="bg-emerald-950 text-white px-10 h-32 rounded-[2rem] font-cinzel font-bold text-xl hover:bg-emerald-800 transition-all uppercase shadow-2xl">Rolar</button>
              </div>
              <button onClick={() => setShowRollPanel(false)} className="w-full text-xs text-red-900/40 font-bold uppercase mt-6 hover:text-red-700 tracking-[0.3em] font-cinzel">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
