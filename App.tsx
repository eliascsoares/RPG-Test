
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
    
    // Auto-hide sidebar on mobile/small tablets
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
      
      // Se a mensagem contiver um novo local, tenta gerar mapa
      if (response.length > 20 && Math.random() > 0.7) {
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

  const startChapter = (story: StoryModule, chapter: StoryChapter) => {
    setGameState(prev => ({ ...prev, activeStoryId: story.id, activeChapterId: chapter.id, location: story.context }));
    handleSend(`Escriba, inicie a lenda "${story.title}", Capítulo: "${chapter.title}". Descreva o local e a situação inicial.`);
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#040804] text-[#d1dbd1] overflow-hidden">
      
      {/* Sidebar de Navegação */}
      <aside className={`
        ${showSidebar ? 'w-full lg:w-[400px]' : 'w-0'} 
        transition-all duration-300 bg-[#081108] border-r border-emerald-900/30 flex flex-col z-50 fixed lg:relative h-full
      `}>
        {showSidebar && (
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-emerald-500 font-bold tracking-widest text-lg">ARNOR LOREMASTER</h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-emerald-700">✕</button>
            </div>

            <div className="flex gap-2 mb-6 bg-black/30 p-1 rounded-xl">
              {(['Heroes', 'NPCs', 'Legends'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${sidebarTab === tab ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-900 hover:text-emerald-500'}`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-4">
              {sidebarTab === 'Legends' ? (
                <div className="space-y-4">
                  {STORY_MODULES.map(story => (
                    <div key={story.id} className="parchment rounded-xl border-2 border-emerald-900/20 overflow-hidden">
                      <button 
                        onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)}
                        className="w-full p-4 text-left hover:bg-emerald-900/5 transition-colors"
                      >
                        <h3 className="font-cinzel font-bold text-emerald-950 text-sm">{story.title}</h3>
                        <p className="text-[10px] text-emerald-900/60 mt-1 italic">{story.description}</p>
                      </button>
                      {expandedStoryId === story.id && (
                        <div className="bg-white/40 p-2 space-y-1 border-t border-emerald-900/10">
                          {story.chapters.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => startChapter(story, c)}
                              className="w-full text-left p-2 rounded hover:bg-emerald-900 hover:text-white text-[10px] font-bold transition-all"
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
                <div className="space-y-4">
                  {characters.filter(c => sidebarTab === 'Heroes' ? !c.isNPC : c.isNPC).map(char => (
                    <CharacterCard 
                      key={char.id} 
                      character={char} 
                      onUpdate={(u) => setCharacters(characters.map(c => c.id === u.id ? u : c))}
                      onRemove={(id) => setCharacters(characters.filter(c => c.id !== id))}
                      onAskHelp={(f) => handleSend(`Escriba, ajude-me a preencher ${f} baseado nas regras.`)}
                    />
                  ))}
                  <button onClick={() => {/* Logica de adicionar */}} className="w-full py-4 border-2 border-dashed border-emerald-900/20 rounded-xl text-emerald-900 text-xs font-bold">+ NOVO PERSONAGEM</button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Área Principal do Chat */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Bar Mobile */}
        <div className="h-14 lg:h-0 flex items-center px-4 justify-between border-b border-emerald-900/20 bg-[#050a05] lg:hidden">
          <button onClick={() => setShowSidebar(true)} className="text-xl">📜</button>
          <span className="font-cinzel text-xs tracking-widest text-emerald-600 uppercase font-bold">Arnor</span>
          <button onClick={() => setShowRollPanel(true)} className="text-xl">🎲</button>
        </div>

        {/* Visualizador de Mapa Dinâmico */}
        {currentMap && (
          <div className="absolute top-4 right-4 w-48 h-32 lg:w-72 lg:h-48 z-40 rounded-xl overflow-hidden border-2 border-emerald-900/50 shadow-2xl group transition-all hover:w-[80%] hover:h-[60%] hover:top-[10%] hover:right-[10%]">
             <img src={currentMap} className="w-full h-full object-cover" alt="Mapa de Viagem" />
             <div className="absolute bottom-0 w-full bg-black/60 p-1 text-[8px] text-center uppercase tracking-tighter">Mapa da Região</div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-8 scrollbar-hide pb-32">
          {gameState.history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`
                max-w-[90%] lg:max-w-[70%] p-6 rounded-3xl shadow-2xl relative
                ${msg.role === 'user' 
                  ? 'bg-[#0a200a] border border-emerald-900/50 text-emerald-100 font-serif italic' 
                  : 'parchment border-2 border-emerald-800/40 text-[#1a261a] font-serif text-lg leading-relaxed shadow-[10px_10px_30px_rgba(0,0,0,0.4)]'}
              `}>
                {msg.role === 'model' && (
                  <div className="absolute -top-3 left-6 flex items-center gap-2">
                    <div className="bg-emerald-900 text-white text-[9px] px-3 py-1 rounded-full font-cinzel uppercase tracking-widest shadow-lg">Escriba das Sombras</div>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              {msg.isRoll && i === gameState.history.length - 1 && !loading && (
                <div className="flex gap-2 mt-3">
                   <button onClick={() => handleSend("SUCESSO ABSOLUTO! Narre o desfecho.")} className="bg-emerald-900/40 text-emerald-200 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-emerald-900 transition-colors">✨ SUCESSO</button>
                   <button onClick={() => handleSend("FALHA TERRÍVEL... Quais são as consequências?")} className="bg-red-900/40 text-red-200 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-900 transition-colors">💀 FALHA</button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start px-6 animate-pulse">
              <div className="bg-emerald-900/10 px-6 py-3 rounded-full border border-emerald-800/20 text-emerald-700 italic text-sm">O Escriba consulta os fios do destino...</div>
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Input Estilizado */}
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8 bg-gradient-to-t from-[#040804] to-transparent z-40">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <div className="flex-1 relative group">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Declare sua ação..."
                rows={1}
                className="w-full bg-[#0a140a]/95 backdrop-blur-sm border border-emerald-900/50 rounded-2xl p-4 lg:p-5 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none min-h-[56px] max-h-[160px] text-base font-serif shadow-2xl transition-all"
              />
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)} 
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-xl transition-all ${voiceEnabled ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-emerald-900 opacity-50'}`}
              >
                {voiceEnabled ? '🔊' : '🔇'}
              </button>
            </div>
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()} 
              className="bg-emerald-900 text-white w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-xl active:scale-95 border-b-4 border-emerald-950"
            >
              <span className="text-2xl">📜</span>
            </button>
            <button onClick={() => setShowRollPanel(true)} className="hidden lg:flex bg-black/40 border border-emerald-900/50 text-emerald-500 w-16 h-16 rounded-2xl items-center justify-center hover:bg-black/60 transition-all shadow-xl active:scale-95">
              {DICE_SVG}
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Dados Responsivo */}
      {showRollPanel && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="parchment w-full max-w-sm p-8 lg:p-10 rounded-[2.5rem] border-2 border-emerald-950 shadow-2xl scale-in-center">
            <h3 className="font-cinzel text-center border-b border-emerald-900/20 pb-4 mb-6 font-bold text-lg uppercase tracking-widest text-emerald-950">Lançar Desafio</h3>
            <div className="space-y-5">
              <select className="w-full bg-white/50 border border-emerald-900/10 rounded-xl p-3 text-sm focus:bg-white outline-none" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)}>
                <option value="">Herói...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full bg-white/50 border border-emerald-900/10 rounded-xl p-3 text-sm focus:bg-white outline-none" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {SKILLS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-4 items-center">
                <input type="number" className="flex-1 bg-white border-2 border-emerald-900/20 rounded-xl p-4 text-center text-4xl font-bold text-emerald-950 focus:border-emerald-600 outline-none" value={diceValue} onChange={e => setDiceValue(e.target.value === '' ? '' : +e.target.value)} />
                <button onClick={() => {
                  const char = characters.find(c => c.id === selectedCharId);
                  if (char && diceValue !== '') {
                    const skill = SKILLS.find(s => s.name === selectedSkill);
                    const mod = Math.floor((char.stats[skill?.stat as keyof typeof char.stats] - 10) / 2);
                    handleSend(`[ROLAGEM] ${char.name} testa ${selectedSkill}: ${diceValue} + ${mod} = ${(diceValue as number) + mod}`, true);
                    setShowRollPanel(false);
                    setDiceValue('');
                  }
                }} className="bg-emerald-950 text-white px-8 h-full rounded-xl font-cinzel font-bold hover:bg-emerald-800 transition-all shadow-xl">ROLAR</button>
              </div>
              <button onClick={() => setShowRollPanel(false)} className="w-full text-[10px] text-red-900 font-bold uppercase mt-4 hover:tracking-widest transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
