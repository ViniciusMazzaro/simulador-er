const EXEMPLOS_FORMAIS = [
  { origem: 'Aula 02', expressao: '(a|b)*aa(a|b)*', cadeias: 'aa\nbaa\naab\nbaab\nbaaba\nabab\nb\nε' },
  { origem: 'Aula 02', expressao: '01* | 10*', cadeias: '0\n0111\n1\n1000\n01\n10\n011\nε' },
  { origem: 'Aula 02', expressao: '01* | 1', cadeias: '1\n0\n01\n011\n11\nε' },
  { origem: 'Aula 02', expressao: '(01)*', cadeias: 'ε\n01\n0101\n010\n011' },
  { origem: 'Aula 02', expressao: '(01)*|(10)*|0(10)*|1(01)*', cadeias: '010101\n101010\n01010\n10101\n0110' },
  { origem: 'Aula 02', expressao: '(L|_)(L|_|D)*', alfabeto: 'L, _, D', cadeias: 'L\n_\nLDD\n_L_D\nD\nDL' },
  { origem: 'Ex. 1a', expressao: '0 | 10*', cadeias: '0\n1\n10\n1000\n00\n01' },
  { origem: 'Ex. 1b', expressao: '(0 | 1)0*', cadeias: '0\n1\n100\n000\n11\n010' },
  { origem: 'Ex. 1c', expressao: '(0011)*', cadeias: 'ε\n0011\n00110011\n0101\n001' },
  { origem: 'Ex. 1d', expressao: '(0|1)*1(0|1)*', cadeias: '1\n0001\n1000\n000\nε' },
  { origem: 'Ex. 1e', expressao: '0*11*0', cadeias: '10\n0110\n00111100\n0\n011' },
  { origem: 'Ex. 1f', expressao: '0(0|1)*0', cadeias: '00\n010\n01110\n0\n01' },
  { origem: 'Ex. 1g', expressao: '(ε|0)(ε|1)', cadeias: 'ε\n0\n1\n01\n10' },
  { origem: 'Ex. 1h', expressao: '(000*|1)*', cadeias: 'ε\n1\n00\n100\n1001\n0\n101' },
  { origem: 'Ex. 1i', expressao: '(0*|0*11(1|00*11)*)(ε|00*)', cadeias: 'ε\n000\n11\n110\n0110110\n101' },
  { origem: 'Ex. 2, |w| ≥ 3', expressao: '(a|b)(a|b)(a|b)(a|b)*', alfabeto: 'a, b', cadeias: 'aba\nabab\nab\nε' },
  { origem: 'Ex. 2, |w| ≤ 3', expressao: '(ε|a|b)(ε|a|b)(ε|a|b)', alfabeto: 'a, b', cadeias: 'ε\na\naba\nabab' },
  { origem: 'Ex. 2, |w| ≠ 3', expressao: '(ε|a|b)(ε|a|b) | (a|b)(a|b)(a|b)(a|b)(a|b)*', alfabeto: 'a, b', cadeias: 'ε\nab\naba\nabab' },
  { origem: 'Ex. 2, par', expressao: '((a|b)(a|b))*', alfabeto: 'a, b', cadeias: 'ε\nab\nabba\na\naba' },
  { origem: 'Ex. 2, ímpar', expressao: '(a|b)((a|b)(a|b))*', alfabeto: 'a, b', cadeias: 'a\naba\nab\nε' },
  { origem: 'Ex. 2, múltiplo de 4', expressao: '((a|b)(a|b)(a|b)(a|b))*', alfabeto: 'a, b', cadeias: 'ε\nabab\nabababab\naba' },
  { origem: 'Aula 03', expressao: '(a|b)*(aa|bb)', cadeias: 'aa\nbb\nabaa\nabbb\nab\nba' },
  { origem: 'Aula 05', expressao: 'ab*c*', cadeias: 'a\nabbb\nacc\nabbcc\nb\nacb' },
  { origem: 'Aula 05', expressao: '(a|b|c|d)*abcd(a|b|c|d)*', cadeias: 'abcd\ndabcda\naabcdd\nabdc' },
  { origem: 'Aula 05', expressao: 'a*b*c*a*', cadeias: 'ε\naabca\nbbcc\nacab\ncba' }
];

const EXEMPLOS_REGEXP = [
  { descricao: '^(a|b)*c$', expressao: '^(a|b)*c$', textos: 'aaaaaabac\nc\naaab\nabcc' },
  { descricao: 'Identificador', expressao: '^[a-z_][0-9a-z_]*$', textos: '11111aux\n2_aux\naux_123\n_tmp' },
  { descricao: 'Inteiro com ou sem sinal', expressao: '^[+-]?[0-9]+$', textos: '42\n-17\n+8\n3.14\n--2' },
  { descricao: 'grep mysql', expressao: 'mysql', textos: 'erro: mysql não respondeu\nconexão com postgres ok\nMYSQL reiniciado\nmysql e mysqldump' },
  { descricao: 'Grupos: data', expressao: '([0-9]{2})/([0-9]{2})/([0-9]{4})', textos: 'Entrega em 09/10/2026\nprova 15/11/2026 e 30/11/2026\nsem data' }
];

const TECLAS = [
  ['ε', 'Cadeia vazia'],
  ['∅', 'Linguagem vazia'],
  ['|', 'União'],
  ['*', 'Fechamento'],
  ['.', 'Concatenação'],
  ['(', 'Abre grupo'],
  [')', 'Fecha grupo']
];
