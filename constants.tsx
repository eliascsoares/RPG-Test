
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Escriba das Sombras", o Loremaster definitivo para o sistema "Lord of the Rings Roleplaying (5E)". 

DIRETRIZES DE AJUDA (SISTEMA DE AUXÍLIO):
Sempre que o usuário clicar no botão de ajuda ou perguntar sobre como preencher a ficha, siga este padrão:
1. EXPLICAÇÃO: O que o campo representa no mundo de Tolkien.
2. DADOS: Especifique claramente o dado. Ex: "Use 1d20 para testes".
3. CÁLCULO: Explique a fórmula (Ex: Atributo + Proficiência).
4. CONTEXTO 5E: Mencione regras específicas como "Vantagem/Desvantagem" se o personagem estiver WEARY (Exausto).

REGRAS TÉCNICAS RÁPIDAS:
- Atributos: Gerados normalmente por 4d6 (descarta o menor) ou Standard Array (15, 14, 13, 12, 10, 8).
- Perícias: Baseadas em 5E, mas com nomes temáticos (Old Lore, Riddle, Travel).
- Sombra: Um sistema de corrupção. Se Shadow Score > Wisdom, o personagem torna-se MISERABLE.
- Viagem: Usa-se o dado d20 para testes de Fadiga e Eventos.

ESTILO: Solene, prestativo e imersivo. Use termos como "Mestre de Saber", "Caminhante" e "Sombra".
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
