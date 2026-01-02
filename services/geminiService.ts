
import { GoogleGenAI } from "@google/genai";
import { Character, GameState, Message } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class LoremasterService {
  constructor() {}

  private constructPartyContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'NPC' : 'PC'}] ${p.name}
        Papel: ${p.journeyRole}
        Status: ${p.isWeary ? 'WEARY' : 'OK'} | Hope: ${p.hope.current}/${p.hope.max}
        Atributos: FOR${p.stats.strength} DES${p.stats.dexterity} CON${p.stats.constitution} INT${p.stats.intelligence} SAB${p.stats.wisdom} CAR${p.stats.charisma}
    `).join('\n');

    return `
      --- AMBIENTE ---
      Ano: ${gameState.currentYear} | Local: ${gameState.location}
      Companheirismo: ${gameState.fellowshipPool} | Vigília do Olho: ${gameState.eyeAwareness}

      --- PERSONAGENS ---
      ${partyDetails}
    `;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    // Usando Gemini 3 Flash: mais rápido e com maior limite de cota gratuita
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const context = this.constructPartyContext(party, gameState);

    // No Gemini, o histórico DEVE alternar entre user e model.
    // Como a última mensagem do usuário já foi adicionada ao histórico no App.tsx,
    // nós enviamos o histórico completo até a penúltima mensagem e a última como o conteúdo atual.
    
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
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCONTEXTO DO MUNDO:\n${context}`,
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (!text) throw new Error("O Escriba permaneceu em silêncio.");
      return text;
    } catch (error: any) {
      console.error("Erro Gemini:", error);
      if (error.message?.includes('429')) {
        throw new Error("Limite de audiência com os Valar atingido (Erro 429). Por favor, aguarde um minuto antes de prosseguir.");
      }
      throw error;
    }
  }
}
