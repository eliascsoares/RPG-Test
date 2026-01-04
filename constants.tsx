
import React from 'react';
import { StoryModule } from './types';

export const SYSTEM_INSTRUCTION = `
Você é o "Mestre das Cinzas", um Loremaster cruel e detalhista de Mordor para Lord of the Rings 5E. 

DIRETRIZES NARRATIVAS:
1. Descreva o mundo através da lente da Sombra: perigo constante, fadiga, e a beleza melancólica do que está sendo perdido.
2. Use um tom autoritário, épico e imersivo. Cada ação tem consequências.
3. Não cite imagens ou gerações visuais. Foque puramente na narrativa textual rica.

REGRAS DE JOGO:
- Aplique as regras de Lord of the Rings 5E (Weary, Miserable, Shadow Score).
- Quando o usuário realizar uma rolagem, interprete o resultado baseando-se no contexto da cena.

ESTILO: Volcânico, sombrio e impiedoso.
`;

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'tales_eriador',
    title: 'Tales from Eriador',
    description: 'Crônicas de sobrevivência nas terras ermas.',
    context: 'Eriador Wilds.',
    chapters: [
      { id: 'te_1', title: 'O Covil do Troll', description: 'Uma caverna fétida onde a luz do sol nunca toca.' },
      { id: 'te_2', title: 'A Emboscada no Bosque de Chet', description: 'Salteadores espreitam nas sombras das árvores antigas.' },
      { id: 'te_3', title: 'O Naufrágio de Lond Daer', description: 'Ruínas costeiras açoitadas por tempestades sobrenaturais.' },
      { id: 'te_4', title: 'Rastros de Wargs', description: 'Uma caçada desesperada sob a lua carmesim.' },
      { id: 'te_5', title: 'O Enigma do Guia Morto', description: 'Encontrar um corpo é apenas o começo do mistério.' },
      { id: 'te_6', title: 'Fome nas Colinas', description: 'O inverno chegou cedo, e algo está caçando o seu gado.' },
      { id: 'te_7', title: 'O Ouro Maldito de Tharbad', description: 'Tesouros que brilham com uma luz doentia sob o pântano.' },
      { id: 'te_8', title: 'Sussurros nas Charnecas', description: 'Vozes sem corpo tentam desviar o grupo do caminho.' },
      { id: 'te_9', title: 'O Forte dos Exilados', description: 'Um reduto de homens que juraram lealdade à Sombra.' },
      { id: 'te_10', title: 'A Travessia do Rio Cinzento', description: 'As águas estão altas e algo se move nas profundezas.' }
    ]
  },
  {
    id: 'shire_adventures',
    title: 'Shire Adventures',
    description: 'A corrupção silenciosa do coração do mundo.',
    context: 'The Shire.',
    chapters: [
      { id: 'sa_1', title: 'Conspiração no Mathom-house', description: 'Relíquias roubadas e segredos de família em Michel Delving.' },
      { id: 'sa_2', title: 'Sombras sobre a Mata Fechada', description: 'O Velho Homem-Salgueiro está inquieto.' },
      { id: 'sa_3', title: 'O Estranho no Dragão Verde', description: 'Um viajante encapuzado que sabe demais sobre o anel.' },
      { id: 'sa_4', title: 'O Sumiço dos Bolseiros', description: 'Uma toca vazia e sinais de luta.' },
      { id: 'sa_5', title: 'Lobos no Rio Brandivin', description: 'O gelo está grosso o suficiente para eles cruzarem.' },
      { id: 'sa_6', title: 'O Mercado de Ervas Malignas', description: 'Fumo de folha que traz pesadelos reais.' },
      { id: 'sa_7', title: 'O Fantasma da Ponte de Pedra', description: 'Uma aparição que cobra pedágio em lembranças.' },
      { id: 'sa_8', title: 'Terror em Pequeno Cavamento', description: 'Tocas foram escavadas por algo que não é Hobbit.' },
      { id: 'sa_9', title: 'A Festa Interrompida', description: 'Fogos de artifício que revelam olhos na escuridão.' },
      { id: 'sa_10', title: 'A Fuga para a Balsa', description: 'Sentindo o hálito frio dos cavaleiros negros.' }
    ]
  },
  {
    id: 'ruins_eriador',
    title: 'Ruins of Eriador',
    description: 'Onde o passado de Arnor clama por sangue.',
    context: 'Arnor Ruins.',
    chapters: [
      { id: 're_1', title: 'As Torres Brancas de Emyn Beraid', description: 'Relíquias élficas que agora abrigam horrores antigos.' },
      { id: 're_2', title: 'Amon Sûl em Chamas', description: 'Reencenar a defesa da grande torre sob um céu de cinzas.' },
      { id: 're_3', title: 'As Tumbas de Fornost', description: 'Onde os reis mortos não descansam em paz.' },
      { id: 're_4', title: 'O Altar de Angmar', description: 'Um local de sacrifício no topo de uma colina gelada.' },
      { id: 're_5', title: 'O Labirinto de Annúminas', description: 'Ruínas inundadas onde a memória se perde.' },
      { id: 're_6', title: 'O Ferreiro das Sombras', description: 'Uma forja que ainda queima com fogo negro.' },
      { id: 're_7', title: 'O Estandarte Despedaçado', description: 'Recuperar um símbolo de esperança em um campo de morte.' },
      { id: 're_8', title: 'O Observatório de Elendil', description: 'Instrumentos de cristal que agora mostram apenas o Olho.' },
      { id: 're_9', title: 'A Ponte de Osgiliath (Fragmento)', description: 'Memórias de uma guerra que nunca terminou.' },
      { id: 're_10', title: 'O Portão Sem Chave', description: 'Uma entrada para as entranhas da terra que exige um sacrifício.' }
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
