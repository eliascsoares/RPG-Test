
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Escriba das Sombras", um Mestre de Jogo (Loremaster) erudito e imersivo para Lord of the Rings 5E.

REGRAS CRÍTICAS DE NARRATIVA:
1. BREVIDADE É ESSENCIAL: Narre apenas UM trecho ou cena por vez (máximo 150-200 palavras). Isso garante que a narração por voz seja fluida e não sofra interrupções.
2. ESPERE PELOS JOGADORES: Após descrever a cena, PARE e aguarde a decisão dos jogadores. Nunca narre a ação dos personagens dos jogadores por eles.
3. ESTILO TOLKIENIANO: Use um tom solene e poético. Descreva os sons, cheiros e a atmosfera (ex: o frio penetrante das charnecas, o cheiro de mofo em ruínas antigas).
4. MECÂNICA ORGÂNICA: Sugira testes (CDs) apenas quando necessário, integrando-os na narrativa.
5. CHAMADA PARA AÇÃO: Termine SEMPRE com uma pergunta clara: "O que vocês fazem?", "Como pretendem prosseguir?", etc.

TONALIDADE: Alta Fantasia, Glória Perdida, Sombra Crescente. Responda sempre em Português (Brasil).
`;

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'angmar_shadow',
    title: 'A Sombra de Angmar',
    description: 'Um mal antigo desperta nas ruínas geladas do norte. Sussurros de um novo Rei-Bruxo ecoam entre os guardiões de Arnor.',
    context: 'Contexto: Arnor, Ruínas de Fornost, Inverno rigoroso. Temas: Vigilância, Frio, Espectros.'
  },
  {
    id: 'bree_mystery',
    title: 'O Mistério de Bri',
    description: 'Estranhos viajantes chegam ao Pônei Saltitante. Desaparecimentos nas matas de Chetwode intrigam os locais.',
    context: 'Contexto: Bri, Terras de ninguém, Homens de Bri. Temas: Espionagem, Segredos, Conforto vs Perigo.'
  },
  {
    id: 'moria_echoes',
    title: 'Ecos de Khazad-dûm',
    description: 'Uma expedição anã busca recuperar relíquias perdidas. Mas nem tudo que dorme deve ser acordado nas profundezas.',
    context: 'Contexto: Moria (Níveis Superiores), Anões. Temas: Escuridão, Ganância, Eco, Medo Ancestral.'
  },
  {
    id: 'isengard_rising',
    title: 'A Ascensão de Isengard',
    description: 'O Mago Branco começou a fortificar o Círculo de Orthanc. Algo estranho está acontecendo com as florestas vizinhas.',
    context: 'Contexto: Nan Curunír, Entwash. Temas: Indústria, Traição, Natureza vs Máquina.'
  }
];

export const DICE_SVG = (
  <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
);
