
import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, Message, Culture, Calling, SKILLS, JourneyRole, StoryModule, StoryChapter } from './types';
import { LoremasterService } from './services/geminiService';
import { CharacterCard } from './components/CharacterCard';
import { DICE_SVG, STORY_MODULES } from './constants';

const STORAGE_KEY_CHARACTERS = 'mordor_loremaster_v9_chars';
const STORAGE_KEY_GAMESTATE = 'mordor_loremaster_v9_state';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'Heroes' | 'NPCs' | 'Legends'>('Heroes');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentYear: 2965,
    season: 'Autumn',
    location: 'Wilds of Eriador',
    fellowshipPool: 0,
    eyeAwareness: 0,
    history: [],
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
      const modelMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
      setGameState(prev => ({ ...prev, history: [...updatedHistory, modelMsg] }));

      if (voiceEnabled) {
        setIsSpeaking(true);
        await loremaster.current.speak(response, () => setIsSpeaking(false));
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg: Message = { role: 'model', text: `As Sombras de Barad-dûr impediram sua mensagem.`, timestamp: Date.now() };
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
    handleSend(`Mestre, vamos iniciar a jornada "${chapter.title}" da lenda "${story.title}". Contexto: ${chapter.description}`, false);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  const createNewCharacter = (isNPC: boolean) => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: isNPC ? 'Servo da Sombra' : 'Novo Herói',
      culture: Culture.MEN_BREE,
      calling: isNPC ? Calling.NPC : Calling.WARDEN,
      level: 1,
      stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      hp: { current: 10, max: 10, temp: 0 },
      hope: { current: 10, max: 10 },
      shadow: { score: 0, scars: 0, miserable: false, anguished: false },
      savingThrows: [],
      skillProficiencies: [],
      isNPC,
      inspiration: false,
      proficiencyBonus: 2,
      armorClass: 10,
      initiative: 0,
      speed: '30ft',
      passiveWisdom: 10,
      experiencePoints: 0,
      distinctiveFeatures: '',
      shadowPath: '',
      hitDice: { current: 1, max: '1d8' },
      deathSaves: { successes: 0, failures: 0 },
      encumbrance: { carriedWeight: 0, isEncumbered: false, isHeavilyEncumbered: false },
      toolsAndLanguages: '',
      featuresTraitsVirtues: '',
      equipment: '',
      attacks: [],
      journeyRole: JourneyRole.NONE,
      fellowshipPoints: 0
    };
    setCharacters([...characters, newChar]);
    if (!isNPC) {
      // Prompt específico para orientação de regras
      handleSend(`Mestre, acabei de criar um rascunho de ficha para um novo Herói. Por favor, aja como meu guia de regras (Rulebook 5E):
      1. Explique passo a passo como preencher os atributos.
      2. Sugira Virtudes e Perícias adequadas para minha cultura.
      3. Explique como funcionam as mecânicas de Sombra e Esperança para este personagem.`);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#1c1917] text-[#e7e5e4] overflow-hidden font-serif selection:bg-orange-900 selection:text-white relative">
      
      {/* Sidebar Temática */}
      <aside className={`${showSidebar ? 'w-full md:w-[380px] lg:w-[420px]' : 'w-0'} transition-all duration-300 bg-[#292524] border-r border-[#44403c] flex flex-col z-50 fixed lg:relative h-full shadow-[10px_0_40px_rgba(0,0,0,0.5)] overflow-hidden`}>
        {showSidebar && (
          <div className="p-4 md:p-6 flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-orange-500 font-bold tracking-[0.25em] text-lg md:text-xl uppercase fire-text">Forjas de Mordor</h2>
              <button onClick={() => setShowSidebar(false)} className="text-[#a8a29e] p-2 text-2xl hover:text-orange-500 hover:rotate-90 transition-all">✕</button>
            </div>

            <div className="flex gap-2 mb-6 bg-[#1c1917] p-1.5 rounded-xl border border-[#44403c]">
              {(['Heroes', 'NPCs', 'Legends'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2.5 text-[10px] md:text-[11px] font-bold rounded-lg transition-all ${sidebarTab === tab ? 'bg-[#44403c] text-white border border-orange-500/30 fire-glow shadow-md' : 'text-[#78716c] hover:text-orange-400'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-4 pb-12">
              {sidebarTab === 'Legends' ? (
                <div className="space-y-3">
                  {STORY_MODULES.map(story => (
                    <div key={story.id} className="iron-plate rounded-xl border border-[#44403c] overflow-hidden transition-all hover:border-orange-500/40 animate-lava">
                      <button 
                        onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)} 
                        className="w-full p-4 text-left bg-black/20 hover:bg-black/40 transition-colors"
                      >
                        <h3 className="font-cinzel font-bold text-orange-500 text-xs md:text-sm mb-1 uppercase tracking-wider">{story.title}</h3>
                        <p className="text-[10px] text-[#a8a29e] italic leading-tight">{story.description}</p>
                      </button>
                      {expandedStoryId === story.id && (
                        <div className="bg-black/30 p-2 space-y-1 border-t border-[#44403c] max-h-[50vh] overflow-y-auto scrollbar-hide">
                          {story.chapters.map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => startChapter(story, c)} 
                              className={`w-full text-left p-3 rounded-lg hover:bg-orange-900/40 hover:text-white text-[10px] md:text-[11px] font-bold transition-all ${gameState.activeChapterId === c.id ? 'bg-[#57534e] text-orange-300 border border-orange-500/30 shadow-lg' : 'bg-white/5 text-[#a8a29e]'}`}
                            >
                              🔥 {c.title}
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
                    <CharacterCard 
                      key={char.id} character={char} 
                      onUpdate={(u) => setCharacters(characters.map(c => c.id === u.id ? u : c))}
                      onRemove={(id) => setCharacters(characters.filter(c => c.id !== id))}
                      onAskHelp={(f) => handleSend(f)}
                    />
                  ))}
                  <button onClick={() => createNewCharacter(sidebarTab === 'NPCs')} className="w-full py-5 border-2 border-dashed border-[#57534e] rounded-xl text-[#a8a29e] text-[11px] font-bold hover:bg-[#44403c] hover:text-orange-400 transition-all uppercase font-cinzel tracking-widest">+ Forjar {sidebarTab === 'Heroes' ? 'Herói' : 'Servo'}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#1c1917]">
        
        {/* Header Superior */}
        <div className="h-16 md:h-20 flex items-center px-4 md:px-10 justify-between border-b border-[#44403c] bg-[#1c1917] z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-2xl hover:scale-110 transition-transform p-2 fire-text">📜</button>
            <div className="h-8 w-px bg-[#44403c]" />
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs text-orange-500 font-medieval uppercase tracking-[0.2em]">{gameState.location}</span>
              <span className="text-[8px] md:text-[10px] text-[#78716c] uppercase tracking-tighter">Sombra: {gameState.eyeAwareness}</span>
            </div>
          </div>
          <button onClick={() => setShowRollPanel(true)} className="bg-[#292524] border border-[#57534e] px-4 md:px-6 py-2.5 rounded-xl text-orange-400 text-[10px] md:text-[11px] font-bold hover:bg-[#44403c] transition-all font-cinzel uppercase tracking-widest fire-glow">
            {DICE_SVG} Rolar
          </button>
        </div>

        {/* Chat de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-20 space-y-12 scrollbar-hide pb-52 chat-container">
          {gameState.history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-80 text-center py-20 animate-in fade-in duration-1000 select-none pointer-events-none">
                {/* Eye Icon */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
                    <div className="absolute inset-0 bg-orange-500 blur-[60px] opacity-20 animate-pulse"></div>
                    <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                        <path d="M5,30 Q50,-20 95,30 Q50,80 5,30 Z" fill="#292524" stroke="#f97316" strokeWidth="1.5" />
                        <circle cx="50" cy="30" r="14" fill="#f97316" className="animate-pulse" />
                        <ellipse cx="50" cy="30" rx="3" ry="14" fill="#1c1917" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-5xl font-cinzel text-orange-600/80 uppercase tracking-[0.25em] mb-4 fire-text">O Olho Que Tudo Vê</h1>
                <p className="italic text-[#78716c] text-lg md:text-xl font-serif max-w-lg leading-relaxed">
                    "Eu vejo seus medos. Vejo seus desejos. <br/>
                    O que você ousa perguntar às trevas?"
                </p>
            </div>
          )}

          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-700`}>
              <div className={`max-w-[95%] md:max-w-[80%] lg:max-w-[70%] p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.3)] relative ${msg.role === 'user' ? 'bg-[#292524] border border-[#57534e] text-orange-100 font-serif italic' : 'iron-plate text-[#e7e5e4] text-lg md:text-2xl leading-relaxed'}`}>
                {msg.role === 'model' && (
                  <div className="absolute -top-4 left-10 bg-[#44403c] text-orange-200 text-[9px] px-4 py-2 rounded-full font-cinzel uppercase tracking-widest shadow-xl border border-orange-500/20 fire-glow">Mestre das Cinzas</div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              {msg.isRoll && i === gameState.history.length - 1 && !loading && (
                <div className="flex gap-4 mt-8 px-6">
                   <button onClick={() => handleSend("O herói triunfou! Narre as consequências positivas.")} className="bg-[#44403c] text-orange-300 border border-orange-500/30 px-6 py-3 rounded-xl text-[10px] font-bold hover:bg-[#57534e] transition-all font-cinzel uppercase tracking-widest">Sucesso 🔥</button>
                   <button onClick={() => handleSend("A Sombra prevaleceu... Narre a falha e o desespero.")} className="bg-[#450a0a] text-red-300 border border-red-800/50 px-6 py-3 rounded-xl text-[10px] font-bold hover:bg-[#7f1d1d] transition-all font-cinzel uppercase tracking-widest">Falha 💀</button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start px-12 animate-pulse">
              <div className="bg-[#292524] px-8 py-4 rounded-full border border-[#44403c] text-[#a8a29e] italic text-xl">Consultando os pergaminhos...</div>
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Input de Mensagem Flutuante */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 bg-gradient-to-t from-[#1c1917] via-[#1c1917]/95 to-transparent z-40">
          <div className="max-w-5xl mx-auto flex gap-4 items-end">
            <div className="flex-1 relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-[#44403c] bg-[#292524] backdrop-blur-md">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                placeholder="Diga suas palavras..." 
                rows={1} 
                className="w-full bg-transparent p-5 md:p-8 text-[#e7e5e4] focus:outline-none focus:ring-1 focus:ring-orange-500/20 resize-none text-lg md:text-2xl font-serif placeholder:opacity-30" 
              />
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`absolute right-6 top-1/2 -translate-y-1/2 text-2xl transition-all ${voiceEnabled ? 'fire-text scale-125' : 'text-[#57534e] opacity-40'}`}> {voiceEnabled ? '🔊' : '🔇'}</button>
            </div>
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-[#44403c] text-white w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center hover:bg-[#57534e] disabled:opacity-20 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-b-4 border-[#1c1917] group fire-glow">
              <span className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">📜</span>
            </button>
          </div>
        </div>

        {/* Rodapé com Créditos */}
        <div className="absolute bottom-3 right-5 z-50 pointer-events-none mix-blend-plus-lighter">
           <p className="text-[9px] md:text-[11px] font-cinzel uppercase tracking-[0.3em] text-white/20 text-shadow-sm">
             developed by <span className="text-orange-500/40 font-bold">elias soares</span>
           </p>
        </div>
      </main>

      {/* Painel de Rolagem - RESPONSIVO */}
      {showRollPanel && (
        <div className="fixed inset-0 bg-[#1c1917]/90 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl animate-in zoom-in duration-500">
          <div className="iron-plate w-full max-w-xl p-8 md:p-16 rounded-[2rem] md:rounded-[3.5rem] border-4 border-[#44403c] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[95dvh] relative">
            
            {/* Botão de Fechar X Adicionado */}
            <button 
              onClick={() => setShowRollPanel(false)} 
              className="absolute top-6 right-6 md:top-8 md:right-8 text-[#78716c] hover:text-orange-500 text-2xl md:text-3xl transition-colors p-2 z-10"
              aria-label="Fechar painel"
            >
              ✕
            </button>

            <h3 className="font-cinzel text-center border-b border-[#44403c] pb-6 md:pb-10 mb-6 md:mb-10 font-bold text-xl md:text-3xl uppercase tracking-[0.4em] text-orange-600 fire-text">Destino nas Chamas</h3>
            <div className="space-y-4 md:space-y-6">
              <select className="w-full bg-[#1c1917] border-2 border-[#44403c] rounded-xl md:rounded-2xl p-4 md:p-5 text-sm md:text-xl font-bold text-[#d6d3d1] outline-none focus:border-orange-500 transition-all" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                <option value="">-- Escolha o Herói --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full bg-[#1c1917] border-2 border-[#44403c] rounded-xl md:rounded-2xl p-4 md:p-5 text-sm md:text-xl font-bold text-[#d6d3d1] outline-none focus:border-orange-500 transition-all" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-stretch sm:items-center pt-4 md:pt-6">
                <input 
                  type="number" 
                  className="flex-1 bg-[#0c0a09] border-4 border-[#44403c] rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-center text-4xl md:text-7xl font-bold text-orange-600 outline-none fire-glow focus:border-orange-400 w-full" 
                  value={diceValue} 
                  onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} 
                  placeholder="0" 
                />
                <button 
                  onClick={() => {
                    const char = characters.find(c => c.id === selectedCharId);
                    if (char && diceValue !== '') {
                      const skill = SKILLS.find(s => s.name === selectedSkill);
                      const mod = Math.floor((char.stats[skill?.stat as keyof typeof char.stats] - 10) / 2);
                      handleSend(`[ROLAGEM] ${char.name} testa ${selectedSkill}: Resultado ${diceValue} + ${mod} mod = ${(diceValue as number) + mod}`, true);
                      setShowRollPanel(false);
                      setDiceValue('');
                    }
                  }} 
                  className="bg-[#44403c] text-white px-8 md:px-12 py-6 sm:h-32 md:h-40 rounded-2xl md:rounded-[2.5rem] font-cinzel font-bold text-lg md:text-2xl hover:bg-[#57534e] transition-all uppercase shadow-2xl border-2 border-orange-500/20 active:scale-95"
                >
                  Rolar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
