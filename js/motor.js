function lerTokens(expressao) {
  const tokens = [];
  let posicao = 0;
  for (const caractere of expressao) {
    posicao++;
    if (/\s/.test(caractere)) continue;
    if ('()*.'.includes(caractere)) tokens.push({ tipo: caractere, posicao });
    else if (caractere === '|' || caractere === '+') tokens.push({ tipo: '|', posicao });
    else if ('ε&λ'.includes(caractere)) tokens.push({ tipo: 'vazia', posicao });
    else if ('∅Ø'.includes(caractere)) tokens.push({ tipo: 'nula', posicao });
    else tokens.push({ tipo: 'simbolo', valor: caractere, posicao });
  }
  return tokens;
}

function analisarExpressao(expressao) {
  const tokens = lerTokens(expressao);
  let indice = 0;

  if (!tokens.length) throw new Error('Digite uma expressão regular.');

  const atual = () => tokens[indice];
  const iniciaOperando = token => token && ['simbolo', 'vazia', 'nula', '('].includes(token.tipo);

  function uniao() {
    let no = concatenacao();
    while (atual() && atual().tipo === '|') {
      indice++;
      no = { tipo: 'uniao', esquerda: no, direita: concatenacao() };
    }
    return no;
  }

  function concatenacao() {
    let no = fecho();
    while (atual() && (atual().tipo === '.' || iniciaOperando(atual()))) {
      if (atual().tipo === '.') indice++;
      no = { tipo: 'concatenacao', esquerda: no, direita: fecho() };
    }
    return no;
  }

  function fecho() {
    let no = operando();
    while (atual() && atual().tipo === '*') {
      indice++;
      no = { tipo: 'fecho', esquerda: no };
    }
    return no;
  }

  function operando() {
    const token = atual();
    if (!token) throw new Error('A expressão termina com um operador sem operando.');
    if (token.tipo === 'simbolo') {
      indice++;
      return { tipo: 'simbolo', valor: token.valor };
    }
    if (token.tipo === 'vazia' || token.tipo === 'nula') {
      indice++;
      return { tipo: token.tipo };
    }
    if (token.tipo === ')') {
      throw new Error(`O parêntese ")" na posição ${token.posicao} não tem "(" correspondente.`);
    }
    if (token.tipo === '(') {
      indice++;
      if (!atual()) {
        throw new Error(`O parêntese aberto na posição ${token.posicao} não foi fechado.`);
      }
      if (atual().tipo === ')') {
        throw new Error(`Parênteses vazios na posição ${token.posicao}. Use ε para a cadeia vazia.`);
      }
      const no = uniao();
      if (!atual() || atual().tipo !== ')') {
        throw new Error(`O parêntese aberto na posição ${token.posicao} não foi fechado.`);
      }
      indice++;
      return no;
    }
    throw new Error(`O operador "${token.tipo}" na posição ${token.posicao} não tem operando à esquerda.`);
  }

  const arvore = uniao();

  if (indice < tokens.length) {
    const token = tokens[indice];
    if (token.tipo === ')') throw new Error(`O parêntese ")" na posição ${token.posicao} não tem "(" correspondente.`);
    throw new Error(`Símbolo inesperado na posição ${token.posicao}.`);
  }

  return arvore;
}

function listarPartes(no, tipo, partes = []) {
  if (no.tipo === tipo) {
    listarPartes(no.esquerda, tipo, partes);
    listarPartes(no.direita, tipo, partes);
  } else {
    partes.push(no);
  }
  return partes;
}

function textoAgrupado(no, raiz = false) {
  if (no.tipo === 'simbolo') return no.valor;
  if (no.tipo === 'vazia') return 'ε';
  if (no.tipo === 'nula') return '∅';

  let texto = '';
  if (no.tipo === 'fecho') texto = textoAgrupado(no.esquerda) + '*';
  if (no.tipo === 'concatenacao') texto = listarPartes(no, 'concatenacao').map(parte => textoAgrupado(parte)).join('');
  if (no.tipo === 'uniao') texto = listarPartes(no, 'uniao').map(parte => textoAgrupado(parte)).join(' | ');

  return raiz ? texto : `(${texto})`;
}

function simbolosDaArvore(no, simbolos = new Set()) {
  if (no.tipo === 'simbolo') simbolos.add(no.valor);
  if (no.esquerda) simbolosDaArvore(no.esquerda, simbolos);
  if (no.direita) simbolosDaArvore(no.direita, simbolos);
  return simbolos;
}

function construirAutomato(arvore) {
  let total = 0;
  const ligacoes = [];
  const novoEstado = () => total++;
  const ligar = (origem, simbolo, destino, curva = null) => ligacoes.push({ origem, simbolo, destino, curva });

  function montar(no) {
    const inicio = novoEstado();
    const fim = novoEstado();
    const parte = { tipo: no.tipo, inicio, fim, filhos: [], largura: 1, altura: 1 };

    if (no.tipo === 'simbolo') ligar(inicio, no.valor, fim);
    if (no.tipo === 'vazia') ligar(inicio, null, fim);

    if (no.tipo === 'concatenacao') {
      const a = montar(no.esquerda);
      const b = montar(no.direita);
      ligar(inicio, null, a.inicio);
      ligar(a.fim, null, b.inicio);
      ligar(b.fim, null, fim);
      parte.filhos = [a, b];
      parte.largura = a.largura + b.largura + 3;
      parte.altura = Math.max(a.altura, b.altura);
    }

    if (no.tipo === 'uniao') {
      const a = montar(no.esquerda);
      const b = montar(no.direita);
      ligar(inicio, null, a.inicio);
      ligar(inicio, null, b.inicio);
      ligar(a.fim, null, fim);
      ligar(b.fim, null, fim);
      parte.filhos = [a, b];
      parte.largura = Math.max(a.largura, b.largura) + 2;
      parte.altura = a.altura + b.altura;
    }

    if (no.tipo === 'fecho') {
      const a = montar(no.esquerda);
      ligar(inicio, null, a.inicio);
      ligar(inicio, null, fim, { lado: 1, altura: a.altura / 2 + 0.4 });
      ligar(a.fim, null, a.inicio, { lado: -1, altura: a.altura / 2 + 0.4 });
      ligar(a.fim, null, fim);
      parte.filhos = [a];
      parte.largura = a.largura + 2;
      parte.altura = a.altura + 1;
    }

    return parte;
  }

  const raiz = montar(arvore);

  const posicoes = [];
  function posicionar(parte, x, y) {
    posicoes[parte.inicio] = { x, y };
    posicoes[parte.fim] = { x: x + parte.largura, y };
    const [a, b] = parte.filhos;
    if (parte.tipo === 'concatenacao') {
      posicionar(a, x + 1, y);
      posicionar(b, x + a.largura + 2, y);
    }
    if (parte.tipo === 'uniao') {
      const meio = parte.largura - 2;
      posicionar(a, x + 1 + (meio - a.largura) / 2, y - parte.altura / 2 + a.altura / 2);
      posicionar(b, x + 1 + (meio - b.largura) / 2, y + parte.altura / 2 - b.altura / 2);
    }
    if (parte.tipo === 'fecho') posicionar(a, x + 1, y);
  }
  posicionar(raiz, 0, raiz.altura / 2);

  const vizinhos = new Map();
  for (const ligacao of ligacoes) {
    if (!vizinhos.has(ligacao.origem)) vizinhos.set(ligacao.origem, []);
    vizinhos.get(ligacao.origem).push(ligacao);
  }

  const novoNumero = new Map([[raiz.inicio, 0]]);
  const fila = [raiz.inicio];
  while (fila.length) {
    const estado = fila.shift();
    for (const ligacao of vizinhos.get(estado) || []) {
      if (!novoNumero.has(ligacao.destino)) {
        novoNumero.set(ligacao.destino, novoNumero.size);
        fila.push(ligacao.destino);
      }
    }
  }
  for (let estado = 0; estado < total; estado++) {
    if (!novoNumero.has(estado)) novoNumero.set(estado, novoNumero.size);
  }

  const transicoes = ligacoes.map(l => ({
    origem: novoNumero.get(l.origem),
    simbolo: l.simbolo,
    destino: novoNumero.get(l.destino),
    curva: l.curva
  }));

  const saidas = Array.from({ length: total }, () => []);
  for (const transicao of transicoes) saidas[transicao.origem].push(transicao);

  const desenho = { largura: raiz.largura, altura: raiz.altura, posicoes: [] };
  posicoes.forEach((posicao, estado) => { desenho.posicoes[novoNumero.get(estado)] = posicao; });

  return {
    estados: total,
    inicial: 0,
    final: novoNumero.get(raiz.fim),
    transicoes,
    saidas,
    desenho
  };
}

function fechoVazio(automato, conjunto) {
  const resultado = new Set(conjunto);
  const pilha = [...conjunto];
  while (pilha.length) {
    const estado = pilha.pop();
    for (const transicao of automato.saidas[estado]) {
      if (transicao.simbolo === null && !resultado.has(transicao.destino)) {
        resultado.add(transicao.destino);
        pilha.push(transicao.destino);
      }
    }
  }
  return resultado;
}

function mover(automato, conjunto, simbolo) {
  const destinos = new Set();
  for (const estado of conjunto) {
    for (const transicao of automato.saidas[estado]) {
      if (transicao.simbolo === simbolo) destinos.add(transicao.destino);
    }
  }
  return destinos;
}

function simularCadeia(automato, cadeia) {
  const simbolos = [...cadeia];
  const passos = [];
  let atuais = fechoVazio(automato, [automato.inicial]);
  passos.push({ lido: '—', estados: atuais });

  for (const simbolo of simbolos) {
    atuais = fechoVazio(automato, mover(automato, atuais, simbolo));
    passos.push({ lido: simbolo, estados: atuais });
    if (!atuais.size) break;
  }

  const lidos = passos.length - 1;
  return {
    passos,
    aceita: lidos === simbolos.length && atuais.has(automato.final),
    travou: lidos < simbolos.length
  };
}

function gerarCadeias(automato, alfabeto, tamanhoMaximo, limite = 300) {
  const encontradas = [];
  let nivel = [{ cadeia: '', estados: fechoVazio(automato, [automato.inicial]) }];

  for (let tamanho = 0; tamanho <= tamanhoMaximo && nivel.length; tamanho++) {
    for (const item of nivel) {
      if (item.estados.has(automato.final)) {
        encontradas.push(item.cadeia);
        if (encontradas.length >= limite) return { encontradas, cortada: true };
      }
    }
    if (tamanho === tamanhoMaximo) break;

    const proximo = [];
    for (const item of nivel) {
      for (const simbolo of alfabeto) {
        const estados = fechoVazio(automato, mover(automato, item.estados, simbolo));
        if (estados.size) proximo.push({ cadeia: item.cadeia + simbolo, estados });
      }
    }
    if (proximo.length > 20000) return { encontradas, cortada: true };
    nivel = proximo;
  }

  return { encontradas, cortada: false };
}
