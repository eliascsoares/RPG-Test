
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
    context: 'Arnor, Ruínas de Fornost, Inverno rigoroso.',
    chapters: [
      { id: 'ang_1', title: 'I: O Vento Gelado de Fornost', description: 'A chegada às ruínas sob uma nevasca sobrenatural que oculta olhos vigilantes.' },
      { id: 'ang_2', title: 'II: Sussurros nas Pedras', description: 'A descoberta de inscrições proféticas em meio ao gelo que parecem sangrar.' },
      { id: 'ang_3', title: 'III: O Confronto nas Sombras', description: 'Um encontro brutal com batedores de Angmar em meio à névoa.' },
      { id: 'ang_4', title: 'IV: As Trilhas Ocultas', description: 'Buscando passagens secretas usadas pelos antigos Dúnedain.' },
      { id: 'ang_5', title: 'V: O Acampamento sob as Estrelas', description: 'Um momento de descanso onde sonhos perturbadores revelam o passado.' },
      { id: 'ang_6', title: 'VI: O Horror nas Colinas', description: 'Uma presença inominável caça os heróis em terreno aberto.' },
      { id: 'ang_7', title: 'VII: O Forte Abandonado', description: 'Investigando uma estrutura que não deveria estar no mapa.' },
      { id: 'ang_8', title: 'VIII: O Ritual Interrompido', description: 'Descobrindo um sacrifício sendo preparado para invocar o Rei-Bruxo.' },
      { id: 'ang_9', title: 'IX: A Ascensão do Capitão de Ferro', description: 'O confronto com o líder local das forças de Angmar.' },
      { id: 'ang_10', title: 'X: O Confronto Final nas Ruínas', description: 'A batalha desesperada para selar a fresta entre os mundos.' }
    ]
  },
  {
    id: 'bree_mystery',
    title: 'O Mistério de Bri',
    description: 'Estranhos viajantes chegam ao Pônei Saltitante. Desaparecimentos e sombras intrigam os locais.',
    context: 'Bri, Terras de ninguém, Homens de Bri.',
    chapters: [
      { id: 'bree_1', title: 'I: Uma Noite no Pônei Saltitante', description: 'Rumores na taverna e a ausência notável de um informante chave.' },
      { id: 'bree_2', title: 'II: A Trilha na Mata de Chetwode', description: 'Seguindo pistas sutis fora dos caminhos batidos da Grande Estrada.' },
      { id: 'bree_3', title: 'III: A Emboscada no Prado', description: 'O perigo revela sua face sob o luar; mercenários ou algo pior?' },
      { id: 'bree_4', title: 'IV: O Segredo do Velho Salgueiro', description: 'Uma árvore antiga que parece guardar as memórias da região.' },
      { id: 'bree_5', title: 'V: Sombras em Archet', description: 'A vila vizinha está sob cerco silencioso de espiões.' },
      { id: 'bree_6', title: 'VI: O Traidor na Estalagem', description: 'A percepção de que o inimigo pode estar dormindo no quarto ao lado.' },
      { id: 'bree_7', title: 'VII: Encontro nas Terras de Ninguém', description: 'Um Ranger do Norte traz notícias sombrias das Colinas do Vento.' },
      { id: 'bree_8', title: 'VIII: A Caverna dos Renegados', description: 'Onde o mal recrutou aqueles que Bri expulsou.' },
      { id: 'bree_9', title: 'IX: O Destino de um Amigo', description: 'O resgate final do sequestrado antes que seja tarde demais.' },
      { id: 'bree_10', title: 'X: A Paz Retorna a Bri', description: 'Limpando as últimas sombras e garantindo a segurança das fronteiras.' }
    ]
  },
  {
    id: 'moria_echoes',
    title: 'Ecos de Khazad-dûm',
    description: 'Uma expedição anã busca recuperar relíquias perdidas nas Minas de Moria.',
    context: 'Moria (Níveis Superiores), Escuridão Claustrofóbica.',
    chapters: [
      { id: 'mor_1', title: 'I: Os Portões de Durin', description: 'A entrada silenciosa na antiga e majestosa morada anã.' },
      { id: 'mor_2', title: 'II: O Salão das Mil Colunas', description: 'Onde ecos do passado ainda ressoam nas trevas profundas.' },
      { id: 'mor_3', title: 'III: Tambores nas Profundezas', description: 'O sinal aterrador de que a expedição foi detectada.' },
      { id: 'mor_4', title: 'IV: A Ponte de Khazad-dûm', description: 'Atravessando o abismo enquanto flechas negras voam.' },
      { id: 'mor_5', title: 'V: A Escadaria Sem Fim', description: 'Uma subida exaustiva que testa a resistência física e mental.' },
      { id: 'mor_6', title: 'VI: O Laboratório de Balin', description: 'A busca por registros históricos em uma biblioteca em ruínas.' },
      { id: 'mor_7', title: 'VII: O Enclave Esquecido', description: 'Encontrando evidências de uma resistência anã que falhou.' },
      { id: 'mor_8', title: 'VIII: O Guardião do Abismo', description: 'Um confronto com uma criatura das eras antigas.' },
      { id: 'mor_9', title: 'IX: A Fuga Desesperada', description: 'Uma corrida contra o tempo enquanto os salões desabam.' },
      { id: 'mor_10', title: 'X: A Luz das Estrelas Novamente', description: 'A saída para o Vale do Ribeiro Escuro com o que restou.' }
    ]
  },
  {
    id: 'isengard_rising',
    title: 'A Ascensão de Isengard',
    description: 'O Mago Branco começou a fortificar o Círculo de Orthanc. Algo estranho acontece nas florestas.',
    context: 'Nan Curunír, Entwash, Indústria vs Natureza.',
    chapters: [
      { id: 'ise_1', title: 'I: O Círculo de Orthanc', description: 'Observando a mudança drástica nas terras de Saruman.' },
      { id: 'ise_2', title: 'II: O Grito das Árvores', description: 'A floresta de Fangorn reage violentamente à fumaça das forjas.' },
      { id: 'ise_3', title: 'III: Lâminas de Ferro Negro', description: 'Encontro com a nova raça de orcs: os Uruk-hai.' },
      { id: 'ise_4', title: 'IV: A Fumaça das Forjas', description: 'Investigando o subsolo onde o metal é moldado para a guerra.' },
      { id: 'ise_5', title: 'V: O Prisioneiro da Torre', description: 'Uma missão furtiva para extrair um aliado capturado.' },
      { id: 'ise_6', title: 'VI: A Corrupção de Nan Curunír', description: 'Lidando com a terra envenenada e seus guardiões distorcidos.' },
      { id: 'ise_7', title: 'VII: O Contra-ataque de Fangorn', description: 'Ajudando os Ents a protegerem as bordas da floresta.' },
      { id: 'ise_8', title: 'VIII: O Vale sob o Olhar de Saruman', description: 'Evitando a vigilância mágica do Mago Branco.' },
      { id: 'ise_9', title: 'IX: A Batalha das Portas de Ferro', description: 'Um confronto em larga escala nas defesas externas de Isengard.' },
      { id: 'ise_10', title: 'X: A Queda de Isengard', description: 'Presenciando a fúria da natureza contra a máquina de guerra.' }
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
