
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

  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private constructPartyContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'NPC' : 'PC'}] ${p.name} (${p.journeyRole})
        Status: ${p.isWeary ? 'EXAUSTO' : 'OK'} | Esperança: ${p.hope.current}/${p.hope.max}
    `).join('\n');

    const activeStory = STORY_MODULES.find(s => s.id === gameState.activeStoryId);
    const storyContext = activeStory ? `\n--- Lenda Ativa: ${activeStory.title} ---\n${activeStory.description}\nContexto: ${activeStory.context}` : '';

    return `
      ANO: ${gameState.currentYear} | FELLOWSHIP: ${gameState.fellowshipPool} | OLHO: ${gameState.eyeAwareness}
      LOCAL: ${gameState.location}${storyContext}
      PERSONAGENS:
      ${partyDetails}
    `;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    // Correctly initialize GoogleGenAI using named parameters and directly from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = this.constructPartyContext(party, gameState);
    
    const formattedHistory = history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${context}`,
          temperature: 0.7,
        }
      });

      // Extract generated text directly from response.text property
      return response.text || "O Escriba permaneceu em silêncio...";
    } catch (error: any) {
      console.error("Erro Gemini:", error);
      throw error;
    }
  }

  async speak(text: string, onEnd?: () => void) {
    // Correctly initialize GoogleGenAI using named parameters and directly from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.stopSpeaking();

    try {
      const ctx = await this.ensureAudioContext();
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Aja como o Escriba das Sombras narrando esta passagem com solenidade e pausadamente: ${text}` }] }],
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
      if (!base64Audio) throw new Error("Sem dados de áudio");

      const audioBuffer = await this.decodeAudioData(
        this.decode(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          if (onEnd) onEnd();
        }
      };

      this.currentSource = source;
      source.start();
    } catch (error) {
      console.error("Erro no TTS:", error);
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch(e) {}
      this.currentSource = null;
    }
  }
}
