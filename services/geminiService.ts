
import { GoogleGenAI, Modality } from "@google/genai";
import { Character, GameState, Message } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

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

  private constructPartyContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'NPC' : 'PC'}] ${p.name} (${p.journeyRole})
        Status: ${p.isWeary ? 'EXAUSTO' : 'OK'} | Esperança: ${p.hope.current}/${p.hope.max}
        Pontos de Sombra: ${p.shadow.points}
    `).join('\n');

    return `
      ANO: ${gameState.currentYear} | FELLOWSHIP: ${gameState.fellowshipPool} | OLHO: ${gameState.eyeAwareness}
      LOCAL: ${gameState.location}
      PERSONAGENS ATUAIS:
      ${partyDetails}
    `;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const context = this.constructPartyContext(party, gameState);
    
    const formattedHistory = history.slice(0, -1).map(m => ({
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
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\n--- CONTEXTO DE MUNDO ATUAL ---\n${context}`,
          temperature: 0.85,
        }
      });

      const text = response.text;
      if (!text) throw new Error("O Escriba permaneceu em silêncio absoluto.");
      return text;
    } catch (error: any) {
      console.error("Erro Gemini:", error);
      throw error;
    }
  }

  async speak(text: string, onEnd?: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Parar narração anterior se houver
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Com tom de um bardo da Terra Média, narre: ${text}` }] }],
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
      if (base64Audio) {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        // Browsers bloqueiam áudio sem interação. Tentamos retomar.
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const audioBuffer = await this.decodeAudioData(
          this.decode(base64Audio),
          this.audioContext,
          24000,
          1
        );

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        
        source.onended = () => {
          this.currentSource = null;
          if (onEnd) onEnd();
        };

        this.currentSource = source;
        source.start();
      }
    } catch (error) {
      console.error("Erro ao gerar voz:", error);
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }
}
