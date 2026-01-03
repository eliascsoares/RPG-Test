
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Escriba das Sombras", o Loremaster supremo de Lord of the Rings 5E.
Sua base de conhecimento são os livros: "Tales from Eriador", "Shire Adventures" e "Ruins of Eriador".

REGRAS DE NARRATIVA VISUAL E MAPAS:
1. GERAÇÃO DE MAPA: Sempre que o grupo chegar a um novo local importante ou Landmark, você deve descrever visualmente o terreno.
2. DISTÂNCIAS E VIAGEM: Use o sistema de Hexágonos (1 Hex = 20 milhas). Narre o progresso em "Steps" (Passos).
   - Terreno Border Lands: Viagem normal.
   - Terreno Wild Lands: DC 15 de fadiga.
   - Terreno Dark Lands: DC 20 de fadiga.
3. ESTILO: Solene, poético e imersivo. Use Português (Brasil).

REGRAS DE DADOS:
- Valide SUCESSO e FALHA conforme as perícias oficiais da ficha (Acrobatics, Old Lore, Riddle, etc).
- Se o personagem estiver WEARY (Exausto), ele tem desvantagem.
`;

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'tales_eriador',
    title: 'Tales from Eriador',
    description: 'Seis aventuras épicas nas terras ermas de Arnor, enfrentando a sombra crescente do Rei-Bruxo.',
    context: 'Eriador, 2965 da Terceira Era.',
    chapters: [
      { id: 'te_1', title: 'A Troll-hole, if Ever There Was One', description: 'Investigando um ninho de Trolls perto de Bree com o anão Jari.' },
      { id: 'te_2', title: 'Messing About in Boats', description: 'Uma viagem marítima saindo de Lond Daer rumo à Ilha da Mãe.' },
      { id: 'te_3', title: 'Kings of Little Kingdoms', description: 'O mistério do falso Gandalf e a torre arruinada de Gwendaith.' },
      { id: 'te_4', title: 'Not to Strike Without Need', description: 'Justiça e traição nas passagens lamacentas de Tharbad.' },
      { id: 'te_5', title: 'Wonder of the Northern World', description: 'O saque do Vale de Ouro e a perseguição a Hultmar Manyhanded.' },
      { id: 'te_6', title: 'The Quest of Amon Guruthos', description: 'A jornada final ao topo da Colina do Medo.' }
    ]
  },
  {
    id: 'shire_adventures',
    title: 'Shire Adventures',
    description: 'A conspiração do Livro Vermelho. Aventuras leves mas perigosas nos quatro Farthings.',
    context: 'O Condado, Verão de 1360 (S.R).',
    chapters: [
      { id: 'sa_1', title: 'A Conspiracy Most Cracked', description: 'Recuperando o mapa do Velho Took no Mathom-house.' },
      { id: 'sa_2', title: 'Expert Treasure Hunters', description: 'Em busca do cajado perdido de Bandobras Bullroarer.' },
      { id: 'sa_3', title: 'Most Excellent Fireworks', description: 'Recuperando os fogos de artifício perdidos de Gandalf no Yale.' },
      { id: 'sa_4', title: 'Involuntary Postmen', description: 'Uma punição que se torna uma missão de entrega urgente.' },
      { id: 'sa_5', title: 'To Soothe a Savage Beast', description: 'Enfrentando a fera queimada que aterroriza Bamfurlong.' }
    ]
  },
  {
    id: 'ruins_eriador',
    title: 'Ruins of Eriador (Landmarks)',
    description: 'Exploração livre de marcos históricos e locais de poder através de Eriador.',
    context: 'Marcos de Arnor e Cardolan.',
    chapters: [
      { id: 're_1', title: 'The Old Dwarf-mines', description: 'Scowle Hill, onde o último Rei de Arthedain buscou refúgio.' },
      { id: 're_2', title: 'The White Towers', description: 'Elostirion e a Palantír que olha apenas para o Oeste.' },
      { id: 're_3', title: 'The Tree of Sorrow', description: 'Um horror vegetal em Eryn Vorn que consome sangue e memórias.' },
      { id: 're_4', title: 'Tindailin - An Elven Refuge', description: 'Um refúgio de paz corrompido por um espírito das águas.' },
      { id: 're_5', title: 'Weathertop (Amon Sûl)', description: 'A vigília constante nas ruínas da maior torre de Arnor.' }
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
