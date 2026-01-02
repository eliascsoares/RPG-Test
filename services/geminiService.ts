
import { GoogleGenAI } from "@google/genai";
import { Character, GameState, Message } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class LoremasterService {
  constructor() {}

  private constructPartyContext(party: Character[], gameState: GameState): string {
    const partyDetails = party.map(p => `
      - [${p.isNPC ? 'NPC' : 'PC'}] ${p.name}
        Papel na Jornada: ${p.journeyRole}
        Condição: ${p.isWeary ? 'WEARY (Esgotado)' : 'Normal'}
        Esperança: ${p.hope.current}/${p.hope.max}
        Sombra: ${p.shadow.points} (Scars: ${p.shadow.scars})
        Atributos: FOR ${p.stats.strength} DES ${p.stats.dexterity} CON ${p.stats.constitution} INT ${p.stats.intelligence} SAB ${p.stats.wisdom} CAR ${p.stats.charisma}
    `).join('\n');

    return `
      --- ESTADO DO MUNDO ---
      Ano: ${gameState.currentYear} T.E. | Estação: ${gameState.season}
      Localização: ${gameState.location}
      Fellowship Pool: ${gameState.fellowshipPool}
      Eye Awareness: ${gameState.eyeAwareness}

      --- COMPANHIA ---
      ${partyDetails}
    `;
  }

  async sendMessage(userInput: string, party: Character[], gameState: GameState, history: Message[]) {
    // Inicialização dentro do método para garantir que usa a chave do processo atual
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const context = this.constructPartyContext(party, gameState);

    // Mapeamos o histórico garantindo a alternância correta. 
    // Filtramos apenas mensagens de texto reais para o histórico do Gemini.
    const chatHistory = history.map(m => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...chatHistory, { role: 'user', parts: [{ text: userInput }] }],
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCONTEXTO ATUAL DA PARTIDA:\n${context}`,
          temperature: 0.8,
          topP: 0.95,
        }
      });

      if (!response || !response.text) {
        throw new Error("Resposta vazia da API");
      }

      return response.text;
    } catch (error) {
      console.error("Erro na API Gemini:", error);
      throw error;
    }
  }
}
