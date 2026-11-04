// =========================================================
//  MINHA AGENDA
//  Online: as tarefas ficam guardadas na tua conta (acesso em qualquer computador).
//  Aberta como ficheiro local: ficam guardadas neste navegador.
// =========================================================

const CHAVE = 'minhaAgenda.tarefas';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TIPOS = { tarefa: '📝 Tarefa', simples: '📁 Projeto simples', complexo: '🧩 Projeto complexo' };

let tarefas = [];
let mesVisivel = new Date();
let diaSelecionado = hojeISO();
let editandoId = null;

// ----- Armazenamento: nuvem (db) ou navegador (localStorage) -----
let colecao = null; // coleção na nuvem, quando disponível

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
}
function gravarLocal() {
  try { localStorage.setItem(CHAVE, JSON.stringify(tarefas)); } catch {}
}

async function guardarTarefa(t) {
  if (colecao) {
    const { id, ...corpo } = t;
    try { await colecao.doc(id).set(corpo); }
    catch (e) { mostrarEstado('Erro ao guardar. Tenta outra vez.', 'aviso'); }
  } else {
    gravarLocal();
  }
}

async function apagarTarefa(id) {
  if (colecao) {
    try { await colecao.doc(id).delete(); }
    catch (e) { mostrarEstado('Erro ao apagar. Tenta outra vez.', 'aviso'); }
  } else {
    gravarLocal();
  }
}

function mostrarEstado(texto, tipo = '') {
  const el = $('estado');
  el.textContent = texto;
  el.className = 'estado ' + tipo;
}

async function ligarNuvem() {
  const temClaude = window.claude && typeof window.claude.use === 'function';
  if (!temClaude) { mostrarEstado('Guardado neste navegador'); return; }

  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  const uid = user ? await user.id() : null;
  if (!db || !uid) {
    tarefas = lerLocal();
    atualizar();
    mostrarEstado('Guardado neste navegador — inicia sessão para sincronizar', 'aviso');
    return;
  }

  colecao = db.collection('data/users/' + uid);
  tarefas = [];
  atualizar();
  mostrarEstado('A carregar…');

  const temporizador = setTimeout(() => mostrarEstado('Sem ligação — a tentar…', 'aviso'), 10000);

  colecao.onSnapshot(snap => {
    tarefas = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (!snap.metadata.fromCache) {
      clearTimeout(temporizador);
      mostrarEstado('☁ Sincronizado', 'ok');
    }
    atualizar();
  }, () => {
    clearTimeout(temporizador);
    mostrarEstado('Ligação perdida — recarrega a página', 'aviso');
  });
}

// ----- Utilitários -----
const $ = (id) => document.getElementById(id);
function paraISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function deISO(iso) { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); }
function hojeISO() { return paraISO(new Date()); }
function esc(t) { const d = document.createElement('div'); d.textContent = t ?? ''; return d.innerHTML; }
function novoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function subs(t) { return Array.isArray(t.subtarefas) ? t.subtarefas : []; }

function tarefasDoDia(iso) {
  return tarefas.filter(t => t.data === iso)
    .sort((a, b) => (a.hora || '99:99').localeCompare(b.hora || '99:99'));
}
function progresso(t) {
  const s = subs(t);
  if (s.length) return Math.round(s.filter(x => x.feita).length / s.length * 100);
  return t.feita ? 100 : 0;
}

// ----- Calendário -----
function desenharCalendario() {
  const ano = mesVisivel.getFullYear(), mes = mesVisivel.getMonth();
  $('tituloMes').textContent = `${MESES[mes]} ${ano}`;
  const grelha = $('grelha');
  grelha.innerHTML = '';
  const deslocamento = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const hoje = hojeISO();

  for (let i = 0; i < 42; i++) {
    const data = new Date(ano, mes, 1 - deslocamento + i);
    const iso = paraISO(data);
    const doDia = tarefasDoDia(iso);

    const cel = document.createElement('div');
    cel.className = 'dia';
    cel.tabIndex = 0;
    if (data.getMonth() !== mes) cel.classList.add('fora');
    if (iso === hoje) cel.classList.add('hoje');
    if (iso === diaSelecionado) cel.classList.add('selecionado');

    let chips = doDia.slice(0, 3)
      .map(t => `<span class="chip ${esc(t.prioridade)} ${t.feita ? 'feita' : ''}">${esc(t.titulo)}</span>`).join('');
    if (doDia.length > 3) chips += `<span class="mais">+${doDia.length - 3} mais</span>`;

    cel.innerHTML = `<span class="numero">${data.getDate()}</span>
      <div class="chips">${chips}</div>
      ${doDia.length ? `<span class="contador">${doDia.length}</span>` : ''}`;

    const selecionar = () => {
      diaSelecionado = iso;
      if (data.getMonth() !== mes) mesVisivel = new Date(data.getFullYear(), data.getMonth(), 1);
      atualizar();
    };
    cel.addEventListener('click', selecionar);
    cel.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(); } });
    cel.addEventListener('dblclick', () => abrirModal());
    grelha.appendChild(cel);
  }
}

// ----- Painel do dia -----
function desenharPainel() {
  $('tituloDia').textContent = deISO(diaSelecionado)
    .toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  const lista = tarefasDoDia(diaSelecionado);
  const ul = $('listaTarefas');
  ul.innerHTML = '';

  const feitas = lista.filter(t => t.feita).length;
  $('textoProgresso').textContent = lista.length ? `${feitas} de ${lista.length} concluídas` : 'Sem tarefas para este dia';
  $('barraDia').style.width = lista.length ? `${feitas / lista.length * 100}%` : '0';

  if (!lista.length) {
    ul.innerHTML = '<li class="vazio">Nada agendado. Clica em "+ Nova" ☕</li>';
    return;
  }

  lista.forEach(t => {
    const s = subs(t);
    const li = document.createElement('li');
    li.className = `tarefa ${esc(t.prioridade)} ${t.feita ? 'feita' : ''}`;
    li.innerHTML = `
      <div class="linha">
        <input type="checkbox" data-acao="feita" ${t.feita ? 'checked' : ''} aria-label="Concluída">
        <div class="info">
          <strong>${esc(t.titulo)}</strong>
          <small>${t.hora ? esc(t.hora) + ' · ' : ''}${TIPOS[t.tipo] || ''}</small>
        </div>
        <button class="btn-icone" data-acao="editar" title="Editar">✏️</button>
        <button class="btn-icone" data-acao="apagar" title="Apagar">🗑️</button>
      </div>
      ${t.descricao ? `<p>${esc(t.descricao)}</p>` : ''}
      ${s.length ? `<ul class="subtarefas">${s.map((x, i) =>
        `<li><label><input type="checkbox" data-sub="${i}" ${x.feita ? 'checked' : ''}> ${esc(x.texto)}</label></li>`).join('')}</ul>
        <div class="barra"><div style="width:${progresso(t)}%"></div></div>` : ''}`;

    li.addEventListener('change', e => {
      const n = { ...t, subtarefas: s.map(x => ({ ...x })) };
      if (e.target.dataset.acao === 'feita') {
        n.feita = e.target.checked;
        n.subtarefas.forEach(x => x.feita = n.feita);
      } else if (e.target.dataset.sub !== undefined) {
        n.subtarefas[e.target.dataset.sub].feita = e.target.checked;
        n.feita = n.subtarefas.every(x => x.feita);
      }
      tarefas = tarefas.map(x => x.id === n.id ? n : x);
      atualizar();
      guardarTarefa(n);
    });

    li.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.acao === 'editar') abrirModal(t);
      if (btn.dataset.acao === 'apagar') {
        if (!btn.classList.contains('confirmar')) {
          btn.classList.add('confirmar');
          btn.textContent = 'Apagar?';
          setTimeout(() => { if (btn.isConnected) { btn.classList.remove('confirmar'); btn.textContent = '🗑️'; } }, 3000);
          return;
        }
        tarefas = tarefas.filter(x => x.id !== t.id);
        atualizar();
        apagarTarefa(t.id);
      }
    });

    ul.appendChild(li);
  });
}

// ----- Projetos em curso -----
function desenharProjetos() {
  const ul = $('listaProjetos');
  const projetos = tarefas.filter(t => t.tipo !== 'tarefa' && !t.feita)
    .sort((a, b) => a.data.localeCompare(b.data));

  if (!projetos.length) { ul.innerHTML = '<li class="vazio">Nenhum projeto em curso.</li>'; return; }

  ul.innerHTML = '';
  const hoje = hojeISO();
  projetos.forEach(p => {
    const atrasado = p.data < hoje;
    const li = document.createElement('li');
    li.className = 'projeto';
    li.tabIndex = 0;
    li.innerHTML = `
      <div class="projeto-topo">
        <strong>${esc(p.titulo)}</strong>
        <small class="${atrasado ? 'atrasado' : ''}">${atrasado ? '⚠️ ' : ''}${deISO(p.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</small>
      </div>
      <div class="barra"><div style="width:${progresso(p)}%"></div></div>`;
    const ir = () => { diaSelecionado = p.data; mesVisivel = deISO(p.data); atualizar(); };
    li.addEventListener('click', ir);
    li.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
    ul.appendChild(li);
  });
}

// ----- Janela nova / editar -----
function abrirModal(t = null) {
  editandoId = t ? t.id : null;
  $('tituloModal').textContent = t ? 'Editar tarefa' : 'Nova tarefa';
  $('campoTitulo').value = t?.titulo ?? '';
  $('campoTipo').value = t?.tipo ?? 'tarefa';
  $('campoPrioridade').value = t?.prioridade ?? 'media';
  $('campoData').value = t?.data ?? diaSelecionado;
  $('campoHora').value = t?.hora ?? '';
  $('campoDescricao').value = t?.descricao ?? '';
  $('campoSubtarefas').value = t ? subs(t).map(x => x.texto).join('\n') : '';
  $('erroForm').hidden = true;
  mostrarSubtarefas();
  $('modal').showModal();
  $('campoTitulo').focus();
}
function mostrarSubtarefas() { $('grupoSubtarefas').hidden = $('campoTipo').value !== 'complexo'; }

$('formTarefa').addEventListener('submit', e => {
  e.preventDefault();
  const titulo = $('campoTitulo').value.trim();
  if (!titulo) { $('erroForm').textContent = 'Escreve um título para a tarefa.'; $('erroForm').hidden = false; return; }

  const antiga = tarefas.find(t => t.id === editandoId);
  const tipo = $('campoTipo').value;
  const subtarefas = tipo === 'complexo'
    ? $('campoSubtarefas').value.split('\n').map(x => x.trim()).filter(Boolean).map(texto => ({
        texto, feita: antiga ? (subs(antiga).find(x => x.texto === texto)?.feita ?? false) : false
      }))
    : [];

  const dados = {
    id: editandoId ?? novoId(),
    titulo, tipo,
    prioridade: $('campoPrioridade').value,
    data: $('campoData').value,
    hora: $('campoHora').value,
    descricao: $('campoDescricao').value.trim(),
    subtarefas,
    feita: subtarefas.length ? subtarefas.every(x => x.feita) : (antiga?.feita ?? false)
  };

  tarefas = antiga ? tarefas.map(x => x.id === dados.id ? dados : x) : [...tarefas, dados];
  diaSelecionado = dados.data;
  mesVisivel = deISO(dados.data);
  $('modal').close();
  atualizar();
  guardarTarefa(dados);
});

$('campoTipo').addEventListener('change', mostrarSubtarefas);
$('btnCancelar').addEventListener('click', () => $('modal').close());

// ----- Navegação -----
$('btnAnterior').addEventListener('click', () => { mesVisivel = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1); desenharCalendario(); });
$('btnProximo').addEventListener('click', () => { mesVisivel = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1); desenharCalendario(); });
$('btnHoje').addEventListener('click', () => { mesVisivel = new Date(); diaSelecionado = hojeISO(); atualizar(); });
$('btnNova').addEventListener('click', () => abrirModal());

function atualizar() { desenharCalendario(); desenharPainel(); desenharProjetos(); }

// ----- Arranque -----
const temClaude = window.claude && typeof window.claude.use === 'function';
if (!temClaude) tarefas = lerLocal();
atualizar();
ligarNuvem();
