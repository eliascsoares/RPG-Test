
import { GoogleGenAI, Modality } from "@google/genai";
import { Character, GameState, Message, StoryModule } from "../types";
import { SYSTEM_INSTRUCTION, STORY_MODULES } from "../constants";

export class LoremasterService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {}

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  public async resumeAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private constructPartyContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'Aliado/NPC' : 'Personagem'}] ${p.name}
        Defesa: ${p.armorClass} | HP: ${p.hp.current}/${p.hp.max} | Sombra: ${p.shadow.score}
    `).join('\n');

    const activeStory = STORY_MODULES.find(s => s.id === gameState.activeStoryId);
    let storyContext = '';
    
    if (activeStory) {
      const activeChapter = activeStory.chapters.find(c => c.id === gameState.activeChapterId);
      storyContext = `\n--- LENDA ATIVA: ${activeStory.title} ---\nCAPÍTULO: ${activeChapter?.title}\nAMBIENTE: ${activeChapter?.description}`;
    }

    return `SITUAÇÃO ATUAL:\nLocal: ${gameState.location}\nNível de Ameaça: ${gameState.eyeAwareness}\n${storyContext}\n\nGRUPO:\n${partyDetails}`;
  }

  async generateVision(description: string, isMap: boolean = false): Promise<string | null> {
    // Sempre reinicializa para garantir que pega a chave do ambiente (Vercel)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Limpar e simplificar a descrição para evitar erros de prompt
    const cleanDesc = description.split('\n')[0].slice(0, 200);
    
    const prompt = isMap 
      ? `Fantasy map of ${cleanDesc}, Tolkien style, sepia ink, parchment, Eriador.`
      : `Cinematic concept art of ${cleanDesc}, Lord of the Rings style, atmospheric lighting, detailed environment.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: { 
            aspectRatio: "16:9"
          }
        }
      });

      // Busca recursiva pela imagem em todas as partes da resposta
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      console.warn("Nenhuma inlineData encontrada na resposta do Gemini.");
      return null;
    } catch (e) {
      console.error("Erro fatal ao gerar visão visual:", e);
      throw e; // Lança para o App.tsx capturar no catch (visionError)
    }
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = this.constructPartyContext(party, gameState);
    
    const conversationHistory = history.slice(0, -1).slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nINFORMAÇÕES DO JOGO:\n${context}`,
          temperature: 0.7,
        }
      });

      return response.text || "O Escriba permanece em silêncio...";
    } catch (error: any) {
      console.error("Erro API Gemini:", error);
      throw error;
    }
  }

  async speak(text: string, onEnd?: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.stopSpeaking();

    try {
      const ctx = await this.resumeAudio();
      if (!ctx) return;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Narre com tom épico e imersivo: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Sem áudio");

      const audioBuffer = await this.decodeAudioData(this.decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { 
        if (this.currentSource === source) { 
          this.currentSource = null; 
          onEnd?.(); 
        } 
      };
      this.currentSource = source;
      source.start();
    } catch (error) {
      console.error("Erro TTS:", error);
      onEnd?.();
    }
  }

  stopSpeaking() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch(e) {}
      this.currentSource = null;
    }
  }
}
