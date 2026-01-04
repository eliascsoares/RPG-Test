
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Escriba das Sombras", Loremaster para Lord of the Rings 5E. 

VISUAIS E NARRATIVA:
1. Quando narrar o início de um capítulo ou uma nova cena importante, descreva o ambiente com detalhes sensoriais (clima, arquitetura, sombras, natureza).
2. Se o usuário pedir para "ver" ou "evocar visão", foque sua narrativa na estética visual do local para ajudar o gerador de imagens.
3. Use um tom solene e épico, como se estivesse lendo as crônicas do Reino de Arnor.

REGRAS DE AJUDA:
- Sempre explique mecânicas de 5E (Dados, Proficiência) quando solicitado via botões de ajuda.
- Sombra: Monitore o Shadow Score. Testes de Sombra ocorrem em locais de malícia antiga.

ESTILO: Imersivo e sombrio. Você é a voz da história de Arnor.
`;

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'tales_eriador',
    title: 'Tales from Eriador',
    description: 'Seis aventuras épicas pelas terras ermas, de covis de Trolls a mistérios náuticos.',
    context: 'Eriador, Arnor.',
    chapters: [
      { id: 'te_1', title: 'A Troll-hole, if Ever There Was One', description: 'Uma caverna úmida e fétida nos Bosques de Chet, onde Trolls guardam tesouros roubados.' },
      { id: 'te_2', title: 'Messing About in Boats', description: 'O porto em ruínas de Lond Daer sob a luz de uma lua pálida.' },
      { id: 'te_3', title: 'Kings of Little Kingdoms', description: 'As colinas de Evendim, onde tumbas de reis esquecidos sussurram ao vento.' }
    ]
  },
  {
    id: 'shire_adventures',
    title: 'Shire Adventures',
    description: 'A Conspiração do Livro Vermelho no coração do Condado.',
    context: 'The Shire.',
    chapters: [
      { id: 'sa_1', title: 'A Conspiracy Most Cracked', description: 'O interior aconchegante mas misterioso do Mathom-house em Michel Delving.' },
      { id: 'sa_2', title: 'Expert Treasure Hunters', description: 'As tocas de texugos e clareiras escondidas perto de Woodhall.' }
    ]
  },
  {
    id: 'ruins_eriador',
    title: 'Ruins of Eriador',
    description: 'Exploração dos marcos históricos do reino perdido de Arnor.',
    context: 'Arnor Ruins.',
    chapters: [
      { id: 're_1', title: 'The White Towers', description: 'As três torres élficas sobre as colinas de Emyn Beraid, brilhando sob as estrelas.' },
      { id: 're_5', title: 'Weathertop (Amon Sûl)', description: 'O topo solitário e carbonizado onde outrora ficava a maior torre de vigia do norte.' }
    ]
  }
];

export const DICE_SVG = (
  <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
);
