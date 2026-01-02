
import { GoogleGenAI } from "@google/genai";
import { Character, GameState, Message } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class LoremasterService {
  private ai: GoogleGenAI;

  constructor() {
    // Tenta ler do process.env (Vercel) ou de uma variável injetada pelo Vite
    const key = (process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY) as string;
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  private constructContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'NPC' : 'PC'}] ${p.name}
        Papel na Jornada: ${p.journeyRole}
        Condição: ${p.isWeary ? 'WEARY (Esgotado)' : 'Normal'}
        Esperança: ${p.hope.current}/${p.hope.max}
        Sombra: ${p.shadow.points} (Scars: ${p.shadow.scars})
        Stats: STR ${p.stats.strength} DEX ${p.stats.dexterity} CON ${p.stats.constitution} INT ${p.stats.intelligence} WIS ${p.stats.wisdom} CHA ${p.stats.charisma}
    `).join('\n');

    return `
      --- SITUAÇÃO DO MUNDO ---
      Ano: ${gameState.currentYear} T.E. | Estação: ${gameState.season}
      Localização: ${gameState.location}
      Reserva de Companheirismo (Fellowship Pool): ${gameState.fellowshipPool} pontos
      Nível de Vigilância (Eye Awareness): ${gameState.eyeAwareness}

      --- COMPANHIA ---
      ${partyDetails}
    `;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    const context = this.constructContext(party, gameState);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { role: 'user', parts: [{ text: `SYSTEM_INSTRUCTION:\n${SYSTEM_INSTRUCTION}\n\nAMBIENTE_E_DADOS:\n${context}` }] },
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: userInput }] }
      ],
      config: {
        temperature: 0.75,
        topP: 0.9,
      }
    });

    return response.text;
  }
}
