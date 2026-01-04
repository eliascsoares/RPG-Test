
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
      - [${p.isNPC ? 'Servo/Aliado' : 'Herói'}] ${p.name}
        CA: ${p.armorClass} | HP: ${p.hp.current}/${p.hp.max} | Sombra: ${p.shadow.score}
    `).join('\n');

    const activeStory = STORY_MODULES.find(s => s.id === gameState.activeStoryId);
    let storyContext = '';
    
    if (activeStory) {
      const activeChapter = activeStory.chapters.find(c => c.id === gameState.activeChapterId);
      storyContext = `\nLenda Ativa: ${activeStory.title}\nCena Atual: ${activeChapter?.title}\nAmbiente: ${activeChapter?.description}`;
    }

    return `CONTEXTO DE JOGO:\nLocalização: ${gameState.location}\nOlho de Sauron (Ameaça): ${gameState.eyeAwareness}\n${storyContext}\n\nHERÓIS E SERVOS:\n${partyDetails}`;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const context = this.constructPartyContext(party, gameState);
    
    const conversationHistory = history.slice(0, -1).slice(-12).map(m => ({
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
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nINFOS ATUAIS:\n${context}`,
          temperature: 0.8,
        }
      });

      return response.text || "As chamas de Mordor consomem as palavras...";
    } catch (error: any) {
      console.error("Erro Gemini:", error);
      throw error;
    }
  }

  async speak(text: string, onEnd?: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.stopSpeaking();

    try {
      const ctx = await this.resumeAudio();
      if (!ctx) return;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak as a dark, powerful, and gravelly overlord from Mordor: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
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
