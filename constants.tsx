
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Escriba das Sombras", um Loremaster erudito de Middle-earth (LOTR 5E).
Sua autoridade vem dos compêndios: "Tales from Eriador", "Shire Adventures" e "Ruins of Eriador".

REGRAS DE NARRATIVA VISUAL:
1. MAPAS: Sempre que o grupo mudar de localidade ou iniciar uma jornada, use o seu dom de visão para evocar um mapa da região.
2. JORNADA E PASSOS: Acompanhe o progresso em "Steps" (Passos). 
   - 1 Passo = aproximadamente 2 milhas. 
   - 10 Passos = 1 Hexágono (20 milhas).
   - Aplique testes de Fadiga (Constitution save) em terrenos difíceis como Rushock Bog ou Eryn Vorn.
3. ESTILO TOLKIEN: Use linguagem solene, referências geográficas precisas e mencione o clima e a luz (ou sombra).

REGRAS DE FICHA:
- Quando o jogador perguntar sobre a ficha, aja como um Mentor ensinando as regras de Proficiência, Sombra e Esperança.
- Se o personagem estiver WEARY, ele tem desvantagem em quase tudo. Se for MISERABLE, o Olho o vê mais facilmente.
`;

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'tales_eriador',
    title: 'Tales from Eriador',
    description: 'Seis aventuras épicas pelas terras ermas, de covis de Trolls a mistérios náuticos em Lond Daer.',
    context: 'Eriador, Minhiriath e Arnor.',
    chapters: [
      { id: 'te_1', title: 'A Troll-hole, if Ever There Was One', description: 'Uma família de Trolls de Pedra ameaça Bree.' },
      { id: 'te_2', title: 'Messing About in Boats', description: 'Uma profecia estelar guia os heróis ao mar aberto.' },
      { id: 'te_3', title: 'Kings of Little Kingdoms', description: 'A caça a um falso Mago e a sombra na Torre Arruinada.' },
      { id: 'te_4', title: 'Not to Strike Without Need', description: 'Justiça, traição e fugitivos na cidade de Tharbad.' },
      { id: 'te_5', title: 'Wonder of the Northern World', description: 'Vingança anã no Vale de Ouro e perseguição a Orcs.' },
      { id: 'te_6', title: 'The Quest of Amon Guruthos', description: 'O confronto final contra o mal antigo na Montanha da Sombra.' }
    ]
  },
  {
    id: 'shire_adventures',
    title: 'Shire Adventures',
    description: 'A Conspiração do Livro Vermelho. Aventuras no coração do Condado envolvendo Bilbo Baggins.',
    context: 'The Shire, Farthings.',
    chapters: [
      { id: 'sa_1', title: 'A Conspiracy Most Cracked', description: 'Recuperando o mapa do Velho Took no Mathom-house.' },
      { id: 'sa_2', title: 'Expert Treasure Hunters', description: 'Buscando o cajado de Bandobras Bullroarer.' },
      { id: 'sa_3', title: 'Most Excellent Fireworks', description: 'O segredo de Gerda Boffin e os fogos de Gandalf.' },
      { id: 'sa_4', title: 'Involuntary Postmen', description: 'Uma entrega urgente que atravessa o Woody End.' },
      { id: 'sa_5', title: 'To Soothe a Savage Beast', description: 'Enfrentando a Fera Queimada em Bamfurlong.' }
    ]
  },
  {
    id: 'ruins_eriador',
    title: 'Ruins of Eriador',
    description: 'Guia de Marcos e Pontos de Interesse através das ruínas do reino perdido de Arnor.',
    context: 'Eriador, Lugares Históricos.',
    chapters: [
      { id: 're_1', title: 'The Old Dwarf-mines', description: 'Explorando Scowle Hill e o refúgio do último Rei.' },
      { id: 're_2', title: 'The White Towers', description: 'Elostirion e a guarda do Palantír do Oeste.' },
      { id: 're_3', title: 'The Tree of Sorrow', description: 'O horror em Eryn Vorn e a maldição do sangue vegetal.' },
      { id: 're_4', title: 'Tindailin - Elven Refuge', description: 'Um espírito corrompido em um lago sagrado.' },
      { id: 're_5', title: 'Weathertop (Amon Sûl)', description: 'A vigília constante nas ruínas da maior torre do Reino do Norte.' }
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
