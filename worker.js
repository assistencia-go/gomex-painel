// ==============================================================================
// GOMEX DISTRIBUIDORA · CLOUDFLARE WORKER & API BACKEND (PAINEL EXECUTIVO)
// ==============================================================================

// ==============================================================================
// GOMEX FROTA · REPOSITÓRIO GRANULAR POR REGISTRO (SUPABASE + MIRROR LOCAL)
// ==============================================================================
// Compatível com Node.js (server.js) e Cloudflare Workers (worker.js).
// Garante escrita granular por ID (INSERT / PATCH / DELETE), evitando perda de
// dados ou sobrescrita quando múltiplos supervisores editam ao mesmo tempo.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.__gomexFrotaRepo = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const COLECAO_META = {
    produtos: { table: 'frota_catalogo_produtos', legacyId: 'frota_catalogo_produtos_v1', prefix: 'frota_rec:produtos:' },
    lancamentos: { table: 'frota_lancamentos_gastos', legacyId: 'frota_lancamentos_gastos_v1', prefix: 'frota_rec:lancamentos:' },
    galeria: { table: 'frota_galeria_fotos', legacyId: 'frota_galeria_veiculos_v1', prefix: 'frota_rec:galeria:' },
    veiculos: { table: 'frota_veiculos', legacyId: 'frota_cadastro_veiculos_v1', prefix: 'frota_rec:veiculos:' },
    ocorrencias: { table: 'frota_ocorrencias', legacyId: 'frota_ocorrencias_v1', prefix: 'frota_rec:ocorrencias:' },
    agendamentos: { table: 'frota_agendamentos', legacyId: 'frota_agendamentos_servicos_v1', prefix: 'frota_rec:agendamentos:' },
    vendedores_rotas: { table: 'frota_vendedores_rotas', legacyId: 'frota_vendedores_rotas_v1', prefix: 'frota_rec:vendedores_rotas:' },
    historico_manutencoes: { table: 'frota_manutencoes', legacyId: 'frota_historico_manutencoes_v1', prefix: 'frota_rec:historico_manutencoes:', isMap: true }
  };

  const TOMBSTONES_PARAM_ID = 'frota_tombstones_v2';
  const LEGACY_PARAM_IDS = [
    ...Object.values(COLECAO_META).map(m => m.legacyId),
    'frota_permissoes_usuarios_v1',
    TOMBSTONES_PARAM_ID
  ];

  let _dedicatedCheckTs = 0;
  let _dedicatedTablesReady = false;

  function makeSupabaseHeaders(supabaseKey, prefer) {
    const h = {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json'
    };
    if (prefer) h['Prefer'] = prefer;
    return h;
  }

  function extractRecordId(colecao, item, explicitId) {
    if (explicitId !== undefined && explicitId !== null && String(explicitId).trim()) {
      return String(explicitId).trim();
    }
    if (!item || typeof item !== 'object') return '';
    if (colecao === 'vendedores_rotas') {
      return String(item.id || item.rota || item.nome || '').trim();
    }
    return String(item.id || item.placa || '').trim();
  }

  function applyLocalRecordOp(dbObj, opSpec) {
    const meta = COLECAO_META[opSpec && opSpec.colecao];
    if (!meta || !dbObj || typeof dbObj !== 'object') return dbObj;
    const col = opSpec.colecao;
    const id = extractRecordId(col, opSpec.data, opSpec.id);
    if (!id) return dbObj;
    const ts = opSpec.updated_at || new Date().toISOString();

    if (!dbObj.tombstones || typeof dbObj.tombstones !== 'object') dbObj.tombstones = {};
    if (!dbObj.tombstones[col] || typeof dbObj.tombstones[col] !== 'object') dbObj.tombstones[col] = {};

    if (meta.isMap) {
      if (!dbObj[col] || typeof dbObj[col] !== 'object') dbObj[col] = {};
      if (opSpec.op === 'delete') {
        delete dbObj[col][id];
        dbObj.tombstones[col][id] = ts;
      } else if (opSpec.data !== undefined) {
        dbObj[col][id] = opSpec.data;
        delete dbObj.tombstones[col][id];
      }
      return dbObj;
    }

    if (!Array.isArray(dbObj[col])) dbObj[col] = [];
    const list = dbObj[col];
    const idx = list.findIndex(x => extractRecordId(col, x) === id);

    if (opSpec.op === 'delete') {
      if (idx !== -1) list.splice(idx, 1);
      dbObj.tombstones[col][id] = ts;
    } else if (opSpec.data && typeof opSpec.data === 'object') {
      const rec = { ...opSpec.data, updated_at: ts };
      if (!rec.id && col !== 'vendedores_rotas') rec.id = id;
      if (idx !== -1) list[idx] = rec;
      else list.unshift(rec);
      delete dbObj.tombstones[col][id];
    }
    return dbObj;
  }

  async function hasDedicatedTables(supabaseUrl, supabaseKey, forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && _dedicatedCheckTs && (now - _dedicatedCheckTs) < 300000) {
      return _dedicatedTablesReady;
    }
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/frota_ocorrencias?select=id&limit=1`, {
        headers: makeSupabaseHeaders(supabaseKey)
      });
      _dedicatedTablesReady = res.ok;
    } catch (e) {
      _dedicatedTablesReady = false;
    }
    _dedicatedCheckTs = now;
    return _dedicatedTablesReady;
  }

  async function loadTombstones(supabaseUrl, supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.${TOMBSTONES_PARAM_ID}&select=id,descricao`, {
        headers: makeSupabaseHeaders(supabaseKey)
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0] && rows[0].descricao) {
          const parsed = JSON.parse(rows[0].descricao);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } catch (e) {}
    return {};
  }

  async function saveTombstones(supabaseUrl, supabaseKey, tombstones) {
    const total = Object.values(tombstones || {}).reduce((acc, m) => acc + (m && typeof m === 'object' ? Object.keys(m).length : 0), 0);
    await fetch(`${supabaseUrl}/rest/v1/parametros`, {
      method: 'POST',
      headers: makeSupabaseHeaders(supabaseKey, 'resolution=merge-duplicates'),
      body: JSON.stringify([{
        id: TOMBSTONES_PARAM_ID,
        valor: total,
        descricao: JSON.stringify(tombstones || {})
      }])
    });
  }

  async function saveGranularRecord(supabaseUrl, supabaseKey, opSpec) {
    const meta = COLECAO_META[opSpec && opSpec.colecao];
    if (!meta) return { ok: false, error: 'Coleção inválida' };
    const id = extractRecordId(opSpec.colecao, opSpec.data, opSpec.id);
    if (!id) return { ok: false, error: 'ID do registro obrigatório' };
    const op = opSpec.op === 'delete' ? 'delete' : 'upsert';
    const ts = opSpec.updated_at || new Date().toISOString();

    const useTables = await hasDedicatedTables(supabaseUrl, supabaseKey);
    if (useTables) {
      if (op === 'delete') {
        const rDel = await fetch(`${supabaseUrl}/rest/v1/${meta.table}?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: makeSupabaseHeaders(supabaseKey)
        });
        return { ok: rDel.ok, mode: 'tables', colecao: opSpec.colecao, op, id, updated_at: ts };
      }
      const payload = opSpec.data && typeof opSpec.data === 'object' ? { ...opSpec.data, updated_at: ts } : { valor: opSpec.data, updated_at: ts };
      const rUp = await fetch(`${supabaseUrl}/rest/v1/${meta.table}`, {
        method: 'POST',
        headers: makeSupabaseHeaders(supabaseKey, 'resolution=merge-duplicates,return=representation'),
        body: JSON.stringify([{ id, updated_at: ts, payload }])
      });
      return { ok: rUp.ok, mode: 'tables', colecao: opSpec.colecao, op, id, updated_at: ts };
    }

    // Modo granular imediato na tabela parametros (1 linha por registro, zero sobrescrita concorrente)
    const rowId = meta.prefix + id;
    if (op === 'delete') {
      const rDel = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.${encodeURIComponent(rowId)}`, {
        method: 'DELETE',
        headers: makeSupabaseHeaders(supabaseKey)
      });
      const tombs = await loadTombstones(supabaseUrl, supabaseKey);
      if (!tombs[opSpec.colecao] || typeof tombs[opSpec.colecao] !== 'object') tombs[opSpec.colecao] = {};
      tombs[opSpec.colecao][id] = ts;
      await saveTombstones(supabaseUrl, supabaseKey, tombs);
      return { ok: rDel.ok, mode: 'parametros_granular', colecao: opSpec.colecao, op, id, updated_at: ts };
    }

    const rowPayload = opSpec.data && typeof opSpec.data === 'object'
      ? { ...opSpec.data, _id: id, _updated_at: ts }
      : { _value: opSpec.data, _id: id, _updated_at: ts };
    const rUp = await fetch(`${supabaseUrl}/rest/v1/parametros`, {
      method: 'POST',
      headers: makeSupabaseHeaders(supabaseKey, 'resolution=merge-duplicates,return=representation'),
      body: JSON.stringify([{
        id: rowId,
        valor: Date.now(),
        descricao: JSON.stringify(rowPayload)
      }])
    });

    // Limpa eventual tombstone antigo se o ID foi recriado
    try {
      const tombs = await loadTombstones(supabaseUrl, supabaseKey);
      if (tombs[opSpec.colecao] && tombs[opSpec.colecao][id]) {
        delete tombs[opSpec.colecao][id];
        await saveTombstones(supabaseUrl, supabaseKey, tombs);
      }
    } catch (e) {}

    return { ok: rUp.ok, mode: 'parametros_granular', colecao: opSpec.colecao, op, id, updated_at: ts };
  }

  function mergeCollectionsFromRows({ paramRows, dedicatedByCol, baseLocal }) {
    const out = {
      produtos: baseLocal && Array.isArray(baseLocal.produtos) ? baseLocal.produtos : null,
      lancamentos: [],
      historico_manutencoes: {},
      galeria: [],
      veiculos: [],
      ocorrencias: [],
      agendamentos: [],
      vendedores_rotas: null,
      permissoes: null,
      tombstones: {}
    };

    const legacyMap = {};
    const recMaps = {};
    for (const col of Object.keys(COLECAO_META)) recMaps[col] = new Map();

    if (Array.isArray(paramRows)) {
      for (const row of paramRows) {
        if (!row || !row.id) continue;
        if (row.id === TOMBSTONES_PARAM_ID && row.descricao) {
          try { out.tombstones = JSON.parse(row.descricao) || {}; } catch (e) {}
          continue;
        }
        if (row.id === 'frota_permissoes_usuarios_v1' && row.descricao) {
          try { out.permissoes = JSON.parse(row.descricao); } catch (e) {}
          continue;
        }
        if (row.id.startsWith('frota_rec:')) {
          for (const [col, meta] of Object.entries(COLECAO_META)) {
            if (row.id.startsWith(meta.prefix) && row.descricao) {
              const recId = row.id.slice(meta.prefix.length);
              try {
                const parsed = JSON.parse(row.descricao);
                const val = (parsed && Object.prototype.hasOwnProperty.call(parsed, '_value')) ? parsed._value : parsed;
                recMaps[col].set(recId, val);
              } catch (e) {}
              break;
            }
          }
          continue;
        }
        for (const [col, meta] of Object.entries(COLECAO_META)) {
          if (row.id === meta.legacyId && row.descricao) {
            try { legacyMap[col] = JSON.parse(row.descricao); } catch (e) {}
            break;
          }
        }
      }
    }

    for (const [col, meta] of Object.entries(COLECAO_META)) {
      const tombCol = (out.tombstones && out.tombstones[col]) || {};
      if (meta.isMap) {
        const merged = {};
        const legObj = (legacyMap[col] && typeof legacyMap[col] === 'object') ? legacyMap[col] : {};
        for (const [k, v] of Object.entries(legObj)) {
          if (!tombCol[k]) merged[k] = v;
        }
        for (const [k, v] of recMaps[col].entries()) {
          merged[k] = v;
        }
        const dedRows = dedicatedByCol && dedicatedByCol[col];
        if (Array.isArray(dedRows)) {
          for (const dr of dedRows) {
            if (dr && dr.id && dr.payload !== undefined) merged[String(dr.id)] = dr.payload;
          }
        }
        out[col] = merged;
        continue;
      }

      const itemMap = new Map();
      const legArr = legacyMap[col];
      if (Array.isArray(legArr)) {
        for (const it of legArr) {
          const rid = extractRecordId(col, it);
          if (!rid || tombCol[rid]) continue;
          itemMap.set(rid, it);
        }
      }
      for (const [rid, it] of recMaps[col].entries()) {
        if (tombCol[rid]) continue;
        itemMap.set(rid, it);
      }
      const dedRows = dedicatedByCol && dedicatedByCol[col];
      if (Array.isArray(dedRows)) {
        for (const dr of dedRows) {
          if (dr && dr.id && dr.payload && typeof dr.payload === 'object') {
            const drId = String(dr.id);
            if (tombCol[drId]) continue;
            itemMap.set(drId, { ...dr.payload, id: dr.payload.id || drId, updated_at: dr.updated_at || dr.payload.updated_at });
          }
        }
      }

      if (itemMap.size > 0 || Array.isArray(legArr)) {
        const listOut = Array.from(itemMap.values());
        // DIRETRIZ DE ORDENAÇÃO: Fotos granulares (frota_rec:galeria:*) chegam depois
        // do array legado no Map; ordenar por created_ts/data desc garante que as mais
        // recentes apareçam sempre no topo da Galeria e da aba Fotos da Vistoria.
        if (col === 'galeria') {
          listOut.sort((a, b) => {
            const ta = Number(a && a.created_ts) || Date.parse((a && (a.updated_at || a._updated_at || a.data)) || '') || 0;
            const tb = Number(b && b.created_ts) || Date.parse((b && (b.updated_at || b._updated_at || b.data)) || '') || 0;
            if (tb !== ta) return tb - ta;
            return String((b && b.data) || '').localeCompare(String((a && a.data) || ''));
          });
        }
        out[col] = listOut;
      } else if (col === 'produtos' || col === 'vendedores_rotas') {
        out[col] = null;
      }
    }

    return out;
  }

  async function fetchAllMerged(supabaseUrl, supabaseKey, baseLocal) {
    const inList = LEGACY_PARAM_IDS.join(',');
    const urlParam = `${supabaseUrl}/rest/v1/parametros?or=(id.in.(${inList}),id.like.frota_rec:*)&select=id,valor,descricao`;
    const useTables = await hasDedicatedTables(supabaseUrl, supabaseKey);

    let paramRows = [];
    const rParam = await fetch(urlParam, { headers: makeSupabaseHeaders(supabaseKey) });
    if (rParam.ok) {
      const parsed = await rParam.json().catch(() => []);
      if (Array.isArray(parsed)) paramRows = parsed;
    }

    const dedicatedByCol = {};
    if (useTables) {
      await Promise.all(Object.entries(COLECAO_META).map(async ([col, meta]) => {
        try {
          const r = await fetch(`${supabaseUrl}/rest/v1/${meta.table}?select=id,updated_at,payload&order=updated_at.desc`, {
            headers: makeSupabaseHeaders(supabaseKey)
          });
          if (r.ok) {
            const rows = await r.json().catch(() => []);
            if (Array.isArray(rows)) dedicatedByCol[col] = rows;
          }
        } catch (e) {}
      }));
    }

    const merged = mergeCollectionsFromRows({ paramRows, dedicatedByCol, baseLocal });
    merged.storageMode = useTables ? 'tables' : 'parametros_granular';
    return merged;
  }

  function classifyParamRowModule(rowId) {
    const id = String(rowId || '');
    if (id === 'frota_galeria_veiculos_v1' || id.startsWith('frota_rec:galeria:')) return 'galeria';
    if (id === 'frota_lancamentos_gastos_v1' || id === 'frota_catalogo_produtos_v1' || id.startsWith('frota_rec:lancamentos:') || id.startsWith('frota_rec:produtos:')) return 'gastos';
    if (id === 'frota_ocorrencias_v1' || id === 'frota_agendamentos_servicos_v1' || id.startsWith('frota_rec:ocorrencias:') || id.startsWith('frota_rec:agendamentos:')) return 'ocorrencias';
    return 'outros';
  }

  return {
    COLECAO_META,
    LEGACY_PARAM_IDS,
    TOMBSTONES_PARAM_ID,
    extractRecordId,
    applyLocalRecordOp,
    hasDedicatedTables,
    saveGranularRecord,
    fetchAllMerged,
    mergeCollectionsFromRows,
    classifyParamRowModule
  };
});



const frotaRepo = globalThis.__gomexFrotaRepo;

const FALLBACK_KEY_B64 = 'c2Jfc2VjcmV0XzF6ZXd0MUlSU1loMnhYQUYzbUJDT1FfMHZ5SEVtVDU=';

const ALLOWED_PATCH_COLS = new Set([
  'veiculo', 'veiculo_outro', 'placa', 'km', 'motorista', 'rota',
  'data', 'hora', 'tipo', 'combustivel',
  'rev_ult_km', 'rev_ult_data', 'rev_prox_km', 'rev_prox_data',
  'avarias', 'sem_avarias', 'pneus', 'pneu_dano', 'itens',
  'extintor_validade', 'thermo_temp', 'outro_item',
  'obs', 'condicao_motorista', 'liberacao',
  'ass_motorista', 'ass_vistoriador', 'ass_responsavel', 'status'
]);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'X-XSS-Protection': '1; mode=block'
};

function getSupabaseKey(env) {
  if (env && env.SUPABASE_KEY) return env.SUPABASE_KEY;
  try {
    if (typeof atob === 'function') return atob(FALLBACK_KEY_B64);
    if (typeof Buffer !== 'undefined') return Buffer.from(FALLBACK_KEY_B64, 'base64').toString('utf8');
  } catch (e) {}
  return '';
}

const VAPID_PUB_B64URL = 'BNC0C6aRpTSIkY76KeYB_x7VTA52qvjRrV6nAoeHHpZHgC6chgFIA2SCL-ZklO2bJ4egYC8yydWvV-ypBZW9Qfc';
const PRIV_JWK = {
  key_ops: ['sign'],
  ext: true,
  kty: 'EC',
  x: '0LQLppGlNIiRjvop5gH_HtVMDnaq-NGtXqcCh4celkc',
  y: 'gC6chgFIA2SCL-ZklO2bJ4egYC8yydWvV-ypBZW9Qfc',
  crv: 'P-256',
  d: '-SIssqVleGqKh03BuMunJteSZYOC5XxA1RG4Q_0hbVY'
};

const EMBEDDED_MANIFEST = "{\n  \"name\": \"Gomex Frota - Painel Executivo\",\n  \"short_name\": \"Gomex Frota\",\n  \"description\": \"Painel Executivo de Gestao de Frota e Auditoria de Vistorias da Gomex Distribuidora\",\n  \"start_url\": \"/\",\n  \"scope\": \"/\",\n  \"display\": \"standalone\",\n  \"orientation\": \"any\",\n  \"background_color\": \"#0f0f13\",\n  \"theme_color\": \"#16161b\",\n  \"categories\": [\n    \"business\",\n    \"productivity\",\n    \"utilities\"\n  ],\n  \"icons\": [\n    {\n      \"src\": \"/icon.svg\",\n      \"sizes\": \"512x512 192x192 any\",\n      \"type\": \"image/svg+xml\",\n      \"purpose\": \"any maskable\"\n    }\n  ]\n}\n";
const EMBEDDED_SW = "// ==============================================================================\n// GOMEX DISTRIBUIDORA · SERVICE WORKER PWA (PAINEL EXECUTIVO)\n// ==============================================================================\n\nconst CACHE_NAME = 'gomex-painel-pwa-v1.7';\nconst STATIC_ASSETS = [\n  '/',\n  '/index.html',\n  '/manifest.json',\n  '/icon.svg',\n  '/chunks/veiculos-padrao.json',\n  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',\n  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'\n];\n\nself.addEventListener('install', event => {\n  event.waitUntil(\n    caches.open(CACHE_NAME).then(cache => {\n      return cache.addAll(STATIC_ASSETS).catch(err => {\n        console.warn('[PWA] Cache parcial durante install:', err);\n      });\n    })\n  );\n  self.skipWaiting();\n});\n\nself.addEventListener('activate', event => {\n  event.waitUntil(\n    caches.keys().then(keys => {\n      return Promise.all(\n        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))\n      );\n    })\n  );\n  self.clients.claim();\n});\n\nself.addEventListener('fetch', event => {\n  const req = event.request;\n  const url = new URL(req.url);\n\n  // Em localhost, nunca interceptar com cache para refletir alterações imediatamente\n  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {\n    return;\n  }\n\n  // Requisições para APIs do backend: Network First com fallback para cache\n  if (url.pathname.startsWith('/api/')) {\n    event.respondWith(\n      fetch(req)\n        .then(networkRes => {\n          return networkRes;\n        })\n        .catch(() => {\n          return caches.match(req);\n        })\n    );\n    return;\n  }\n\n  // Navegação de páginas (rotas SPA como /vistoria, /frota, etc.): Network first com atualização de cache, fallback para cache\n  if (req.mode === 'navigate') {\n    event.respondWith(\n      fetch(req, { cache: 'no-cache' })\n        .then(networkRes => {\n          if (networkRes && networkRes.status === 200) {\n            const resClone = networkRes.clone();\n            caches.open(CACHE_NAME).then(cache => {\n              cache.put(req, resClone);\n              cache.put('/index.html', networkRes.clone());\n            });\n          }\n          return networkRes;\n        })\n        .catch(() => {\n          return caches.match('/index.html') || caches.match('/');\n        })\n    );\n    return;\n  }\n\n  // Assets estáticos (fontes, scripts, css, imagens): Cache First com revalidação\n  event.respondWith(\n    caches.match(req).then(cached => {\n      if (cached) return cached;\n      return fetch(req).then(networkRes => {\n        if (networkRes && networkRes.status === 200 && req.method === 'GET') {\n          const resClone = networkRes.clone();\n          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));\n        }\n        return networkRes;\n      }).catch(() => cached);\n    })\n  );\n});\n\n// ==============================================================================\n// WEB PUSH: ATENDIMENTO A NOTIFICAÇÕES EM SEGUNDO PLANO NO CELULAR/APARELHO\n// ==============================================================================\nself.addEventListener('push', event => {\n  event.waitUntil((async () => {\n    let title = 'Gomex Frota · Alerta da Frota';\n    let body = 'Nova vistoria ou alteração de veículo registrada.';\n    let targetUrl = '/';\n\n    if (event.data) {\n      try {\n        const payload = event.data.json();\n        if (payload.title) title = payload.title;\n        if (payload.body) body = payload.body;\n        if (payload.url) targetUrl = payload.url;\n      } catch (e) {\n        try {\n          const txt = event.data.text();\n          if (txt) body = txt;\n        } catch (err) {}\n      }\n    } else {\n      // Se não veio payload criptografado, consulta o último alerta no servidor\n      try {\n        const res = await fetch('/api/push-ultimo-alerta', { cache: 'no-store' });\n        if (res.ok) {\n          const info = await res.json();\n          if (info.title) title = info.title;\n          if (info.body) body = info.body;\n          if (info.url) targetUrl = info.url;\n        }\n      } catch (err) {}\n    }\n\n    const options = {\n      body,\n      icon: '/icon.svg',\n      badge: '/icon.svg',\n      vibrate: [200, 100, 200],\n      tag: 'gomex-frota-alerta',\n      renotify: true,\n      data: {\n        url: targetUrl,\n        timestamp: Date.now()\n      },\n      actions: [\n        { action: 'open', title: 'Abrir Painel' }\n      ]\n    };\n\n    return self.registration.showNotification(title, options);\n  })());\n});\n\nself.addEventListener('notificationclick', event => {\n  event.notification.close();\n  const targetUrl = event.notification.data?.url || '/';\n\n  event.waitUntil(\n    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {\n      for (const client of windowClients) {\n        if (client.url.includes(self.location.origin) && 'focus' in client) {\n          client.navigate(targetUrl);\n          return client.focus();\n        }\n      }\n      if (clients.openWindow) {\n        return clients.openWindow(targetUrl);\n      }\n    })\n  );\n});\n\n\n";
const EMBEDDED_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">\n  <defs>\n    <!-- Gradiente de Fundo Executivo Obsidian Dark -->\n    <radialGradient id=\"bgRadial\" cx=\"50%\" cy=\"38%\" r=\"65%\" fx=\"50%\" fy=\"30%\">\n      <stop offset=\"0%\" stop-color=\"#222330\"/>\n      <stop offset=\"55%\" stop-color=\"#15161c\"/>\n      <stop offset=\"100%\" stop-color=\"#0c0d11\"/>\n    </radialGradient>\n\n    <!-- Gradiente de Borda Metálica Coral / Bronze -->\n    <linearGradient id=\"rimGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ff9a85\" stop-opacity=\"0.85\"/>\n      <stop offset=\"45%\" stop-color=\"#ed8570\" stop-opacity=\"0.35\"/>\n      <stop offset=\"80%\" stop-color=\"#3b201a\" stop-opacity=\"0.2\"/>\n      <stop offset=\"100%\" stop-color=\"#ff7a5e\" stop-opacity=\"0.7\"/>\n    </linearGradient>\n\n    <!-- Gradiente do Símbolo Principal do Caminhão -->\n    <linearGradient id=\"bodyGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ffffff\"/>\n      <stop offset=\"40%\" stop-color=\"#fff1ee\"/>\n      <stop offset=\"85%\" stop-color=\"#fed7ce\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\"/>\n    </linearGradient>\n\n    <!-- Gradiente Coral Neon para Detalhes e Faróis -->\n    <linearGradient id=\"neonCoral\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">\n      <stop offset=\"0%\" stop-color=\"#ff9a85\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\"/>\n    </linearGradient>\n\n    <!-- Gradiente Escudo de Auditoria -->\n    <linearGradient id=\"shieldGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ed8570\" stop-opacity=\"0.25\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\" stop-opacity=\"0.05\"/>\n    </linearGradient>\n\n    <!-- Sombra e Brilho de Alta Resolução -->\n    <filter id=\"truckShadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">\n      <feDropShadow dx=\"0\" dy=\"16\" stdDeviation=\"18\" flood-color=\"#000000\" flood-opacity=\"0.75\"/>\n      <feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"8\" flood-color=\"#ed8570\" flood-opacity=\"0.35\"/>\n    </filter>\n\n    <filter id=\"rimGlow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\">\n      <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-color=\"#ed8570\" flood-opacity=\"0.4\"/>\n    </filter>\n  </defs>\n\n  <!-- Fundo Squircle Suave PWA (Seguro para máscara circular no Android e cantos no iOS/Windows) -->\n  <rect width=\"512\" height=\"512\" rx=\"116\" fill=\"url(#bgRadial)\"/>\n  \n  <!-- Borda de Precisão com Brilho Superior -->\n  <rect x=\"14\" y=\"14\" width=\"484\" height=\"484\" rx=\"104\" fill=\"none\" stroke=\"url(#rimGrad)\" stroke-width=\"4.5\" filter=\"url(#rimGlow)\"/>\n\n  <!-- Malha de Fundo Sutil de Alta Tecnologia (Linhas de Precisão) -->\n  <g opacity=\"0.06\" stroke=\"#ffffff\" stroke-width=\"1.2\">\n    <line x1=\"80\" y1=\"120\" x2=\"432\" y2=\"120\"/>\n    <line x1=\"80\" y1=\"256\" x2=\"432\" y2=\"256\"/>\n    <line x1=\"80\" y1=\"392\" x2=\"432\" y2=\"392\"/>\n    <line x1=\"168\" y1=\"80\" x2=\"168\" y2=\"432\"/>\n    <line x1=\"344\" y1=\"80\" x2=\"344\" y2=\"432\"/>\n  </g>\n\n  <!-- Escudo Central de Segurança & Frota no Fundo do Ícone -->\n  <path d=\"M256 128 L356 168 V266 C356 332 256 376 256 376 C256 376 156 332 156 266 V168 Z\" \n        fill=\"url(#shieldGrad)\" stroke=\"url(#neonCoral)\" stroke-width=\"2\" stroke-opacity=\"0.35\" stroke-dasharray=\"6 4\"/>\n\n  <!-- Grupo Principal do Caminhão e Prontuário Executivo -->\n  <g filter=\"url(#truckShadow)\">\n    \n    <!-- Silhueta da Carroceria / Baú (Gomex Carga Segura) -->\n    <path d=\"M116 196 C116 182 126 172 140 172 H272 C282 172 290 180 290 190 V314 C290 320 286 324 280 324 H126 C120 324 116 320 116 314 Z\" \n          fill=\"#171821\" stroke=\"url(#bodyGrad)\" stroke-width=\"6.5\" stroke-linejoin=\"round\"/>\n\n    <!-- Detalhes do Baú: Frisos Aerodinâmicos Horizontais -->\n    <line x1=\"140\" y1=\"214\" x2=\"266\" y2=\"214\" stroke=\"url(#neonCoral)\" stroke-width=\"3\" stroke-linecap=\"round\" opacity=\"0.85\"/>\n    <line x1=\"140\" y1=\"242\" x2=\"246\" y2=\"242\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" opacity=\"0.45\"/>\n    <line x1=\"140\" y1=\"270\" x2=\"266\" y2=\"270\" stroke=\"url(#neonCoral)\" stroke-width=\"3\" stroke-linecap=\"round\" opacity=\"0.85\"/>\n\n    <!-- Cabine Dianteira com Design Aerodinâmico Moderno -->\n    <path d=\"M290 216 H342 C354 216 364 224 370 234 L392 272 C395 277 396 283 396 288 V316 C396 321 392 324 388 324 H290 V216 Z\" \n          fill=\"#171821\" stroke=\"url(#bodyGrad)\" stroke-width=\"6.5\" stroke-linejoin=\"round\"/>\n\n    <!-- Para-brisa / Janela da Cabine com Reflexo Translúcido Coral -->\n    <path d=\"M302 230 H338 C344 230 350 234 354 240 L368 266 C370 270 368 274 364 274 H302 V230 Z\" \n          fill=\"url(#neonCoral)\" fill-opacity=\"0.32\" stroke=\"url(#neonCoral)\" stroke-width=\"2\"/>\n\n    <!-- Farol Dianteiro de LED Gomex -->\n    <path d=\"M386 294 L396 294 L394 306 L384 306 Z\" fill=\"#ffffff\" filter=\"url(#rimGlow)\"/>\n\n    <!-- Linha de Chassi / Base -->\n    <line x1=\"104\" y1=\"324\" x2=\"408\" y2=\"324\" stroke=\"url(#bodyGrad)\" stroke-width=\"6\" stroke-linecap=\"round\"/>\n\n    <!-- Rodas Reforçadas Traseiras e Dianteiras -->\n    <!-- Roda Traseira 1 -->\n    <g transform=\"translate(162, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Roda Traseira 2 -->\n    <g transform=\"translate(226, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Roda Dianteira -->\n    <g transform=\"translate(352, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Selo de Verificação / Checkmark de Vistoria Oficial no Topo da Cabine -->\n    <g transform=\"translate(256, 128) scale(1.15)\">\n      <circle cx=\"0\" cy=\"0\" r=\"18\" fill=\"#ed8570\"/>\n      <path d=\"M-6 0 L-2 4 L7 -5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    </g>\n  </g>\n</svg>\n";

let ultimoAlertaPush = {
  title: 'Gomex Frota · Sistema Conectado',
  body: 'Notificações ativadas com sucesso neste aparelho.',
  url: '/',
  timestamp: Date.now()
};

function strToB64Url(str) {
  let b64;
  if (typeof btoa === 'function') {
    b64 = btoa(unescape(encodeURIComponent(str)));
  } else {
    b64 = Buffer.from(str, 'utf8').toString('base64');
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufToB64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function gerarVapidJwt(endpointUrl, subject = 'mailto:contato@gomex.com.br') {
  try {
    const urlObj = new URL(endpointUrl);
    const audience = `${urlObj.protocol}//${urlObj.host}`;
    const now = Math.floor(Date.now() / 1000);
    const header = { typ: 'JWT', alg: 'ES256' };
    const payload = {
      aud: audience,
      exp: now + 43200,
      sub: subject
    };

    const unsigned = strToB64Url(JSON.stringify(header)) + '.' + strToB64Url(JSON.stringify(payload));
    const cryptoSubtle = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle : require('crypto').webcrypto.subtle;

    const key = await cryptoSubtle.importKey(
      'jwk',
      PRIV_JWK,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const sig = await cryptoSubtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      encoder.encode(unsigned)
    );

    return unsigned + '.' + bufToB64Url(sig);
  } catch (e) {
    return '';
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Sanitização de Segurança: Redireciona removendo credenciais da URL se alguém acessar com parâmetros no link
    if (url.searchParams.has('username') || url.searchParams.has('password') || url.searchParams.has('user') || url.searchParams.has('pass')) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('username');
      cleanUrl.searchParams.delete('password');
      cleanUrl.searchParams.delete('user');
      cleanUrl.searchParams.delete('pass');
      return Response.redirect(cleanUrl.toString(), 302);
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      ...SECURITY_HEADERS
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Atalhos amigáveis e redirecionamentos
    if (url.pathname === '/checklist' || url.pathname === '/check-list') {
      return Response.redirect('https://gomex-checklist.gomexassistencia2026.workers.dev/', 302);
    }

    // 0. ATENDIMENTO DE ASSETS DO PWA (MANIFEST, SERVICE WORKER E ÍCONE)
    if (url.pathname === '/manifest.json') {
      return new Response(EMBEDDED_MANIFEST, {
        status: 200,
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    if (url.pathname === '/sw.js') {
      return new Response(EMBEDDED_SW, {
        status: 200,
        headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/', ...corsHeaders }
      });
    }

    if (url.pathname === '/icon.svg') {
      return new Response(EMBEDDED_ICON, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', ...corsHeaders }
      });
    }

    // 1. ROTA HEALTH CHECK
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'gomex-painel',
        runtime: 'cloudflare-worker',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 1.2 ROTAS DE WEB PUSH NOTIFICATIONS
    if (url.pathname === '/api/push-vapid-key') {
      return new Response(JSON.stringify({ ok: true, publicKey: VAPID_PUB_B64URL }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (url.pathname === '/api/push-ultimo-alerta') {
      return new Response(JSON.stringify(ultimoAlertaPush), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    if (url.pathname === '/api/push-subscribe') {
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          const sub = payload.subscription || (payload.endpoint ? payload : null);
          if (!sub || !sub.endpoint) {
            return new Response(JSON.stringify({ error: 'Inscrição push inválida' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (getRes.ok) {
              const rows = await getRes.json();
              if (rows && rows[0] && rows[0].descricao) {
                subs = JSON.parse(rows[0].descricao) || [];
              }
            }
          } catch (e) {}

          const map = new Map();
          subs.forEach(s => s && s.endpoint && map.set(s.endpoint, s));
          map.set(sub.endpoint, {
            ...sub,
            userAgent: payload.userAgent || '',
            deviceName: payload.deviceName || 'Aparelho',
            updatedAt: new Date().toISOString()
          });
          const atualizados = Array.from(map.values());

          await fetch(`${supabaseUrl}/rest/v1/parametros`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify([{
              id: 'frota_push_subscriptions_v1',
              valor: atualizados.length,
              descricao: JSON.stringify(atualizados)
            }])
          });

          return new Response(JSON.stringify({ ok: true, total: atualizados.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    if (url.pathname === '/api/push-send') {
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          ultimoAlertaPush = {
            title: payload.title || 'Gomex Frota · Alerta da Frota',
            body: payload.body || 'Nova movimentação na frota.',
            url: payload.url || '/',
            timestamp: Date.now()
          };

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (getRes.ok) {
              const rows = await getRes.json();
              if (rows && rows[0] && rows[0].descricao) {
                subs = JSON.parse(rows[0].descricao) || [];
              }
            }
          } catch (e) {}

          let sentCount = 0;
          const validEndpoints = [];

          for (const sub of subs) {
            if (!sub || !sub.endpoint) continue;
            try {
              const jwt = await gerarVapidJwt(sub.endpoint);
              if (!jwt) continue;

              const pushRes = await fetch(sub.endpoint, {
                method: 'POST',
                headers: {
                  'TTL': '86400',
                  'Urgency': 'high',
                  'Authorization': `vapid t=${jwt}, k=${VAPID_PUB_B64URL}`,
                  'Content-Length': '0'
                }
              });

              if (pushRes.status === 410 || pushRes.status === 404) {
                continue;
              }

              validEndpoints.push(sub);
              if (pushRes.ok || pushRes.status === 201 || pushRes.status === 200 || pushRes.status === 202) {
                sentCount++;
              }
            } catch (e) {
              validEndpoints.push(sub);
            }
          }

          if (validEndpoints.length !== subs.length) {
            try {
              await fetch(`${supabaseUrl}/rest/v1/parametros`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify([{
                  id: 'frota_push_subscriptions_v1',
                  valor: validEndpoints.length,
                  descricao: JSON.stringify(validEndpoints)
                }])
              });
            } catch (e) {}
          }

          return new Response(JSON.stringify({ ok: true, sent: sentCount, total: subs.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 1.4 API GRANULAR POR REGISTRO (/api/frota-registro) -> INSERT / PATCH / DELETE individual por ID
    if (url.pathname === '/api/frota-registro') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);
      const method = request.method;
      if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
        try {
          const rawTxt = await request.text();
          const parsed = rawTxt ? JSON.parse(rawTxt) : {};
          const opSpec = {
            colecao: parsed.colecao || url.searchParams.get('colecao') || '',
            op: method === 'DELETE' ? 'delete' : (parsed.op || 'upsert'),
            id: parsed.id !== undefined ? parsed.id : url.searchParams.get('id'),
            data: parsed.data,
            updated_at: parsed.updated_at || new Date().toISOString()
          };
          if (!frotaRepo.COLECAO_META[opSpec.colecao]) {
            return new Response(JSON.stringify({ ok: false, error: 'Coleção inválida' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          const result = await frotaRepo.saveGranularRecord(supabaseUrl, supabaseKey, opSpec);
          return new Response(JSON.stringify({ ok: true, synced: Boolean(result && result.ok), ...result }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 1.5 ROTA DE CUSTOS, PEÇAS E INSUMOS DA FROTA (/api/frota-gastos)
    if (url.pathname === '/api/frota-gastos') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      if (request.method === 'GET') {
        try {
          const out = await frotaRepo.fetchAllMerged(supabaseUrl, supabaseKey, null);
          return new Response(JSON.stringify({ ok: true, ...out }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          // DIRETRIZ PERMANENTE: Nunca retornar HTTP 200 com coleções vazias no catch
          // (isso mascara falhas e impede o fallback direto no Supabase pelo cliente).
          return new Response(JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Falha ao consultar repositório' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
      }

      if (request.method === 'POST' || request.method === 'PATCH') {
        try {
          const payload = await request.json();
          if (Array.isArray(payload.ops) && payload.ops.length) {
            const results = [];
            for (const opSpec of payload.ops) {
              results.push(await frotaRepo.saveGranularRecord(supabaseUrl, supabaseKey, opSpec));
            }
            const allOk = results.every(r => r && r.ok);
            return new Response(JSON.stringify({ ok: true, synced: allOk, results }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const rowsToUpsert = [];
          if (Array.isArray(payload.produtos)) {
            rowsToUpsert.push({
              id: 'frota_catalogo_produtos_v1',
              valor: payload.produtos.length,
              descricao: JSON.stringify(payload.produtos)
            });
          }
          if (Array.isArray(payload.lancamentos)) {
            const totalInvestido = payload.lancamentos.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
            rowsToUpsert.push({
              id: 'frota_lancamentos_gastos_v1',
              valor: Number(totalInvestido.toFixed(2)),
              descricao: JSON.stringify(payload.lancamentos)
            });
          }
          if (payload.historico_manutencoes && typeof payload.historico_manutencoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_historico_manutencoes_v1',
              valor: Object.keys(payload.historico_manutencoes).length,
              descricao: JSON.stringify(payload.historico_manutencoes)
            });
          }
          if (Array.isArray(payload.galeria)) {
            rowsToUpsert.push({
              id: 'frota_galeria_veiculos_v1',
              valor: payload.galeria.length,
              descricao: JSON.stringify(payload.galeria)
            });
          }
          if (Array.isArray(payload.veiculos)) {
            rowsToUpsert.push({
              id: 'frota_cadastro_veiculos_v1',
              valor: payload.veiculos.length,
              descricao: JSON.stringify(payload.veiculos)
            });
          }
          if (Array.isArray(payload.ocorrencias)) {
            rowsToUpsert.push({
              id: 'frota_ocorrencias_v1',
              valor: payload.ocorrencias.length,
              descricao: JSON.stringify(payload.ocorrencias)
            });
          }
          if (Array.isArray(payload.agendamentos)) {
            rowsToUpsert.push({
              id: 'frota_agendamentos_servicos_v1',
              valor: payload.agendamentos.length,
              descricao: JSON.stringify(payload.agendamentos)
            });
          }
          if (Array.isArray(payload.vendedores_rotas)) {
            rowsToUpsert.push({
              id: 'frota_vendedores_rotas_v1',
              valor: payload.vendedores_rotas.length,
              descricao: JSON.stringify(payload.vendedores_rotas)
            });
          }
          if (payload.permissoes && typeof payload.permissoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_permissoes_usuarios_v1',
              valor: Object.keys(payload.permissoes).length,
              descricao: JSON.stringify(payload.permissoes)
            });
          }
          const res = await fetch(`${supabaseUrl}/rest/v1/parametros`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(rowsToUpsert)
          });
          return new Response(JSON.stringify({ ok: true, synced: res.ok }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 1.6 MONITOR DE ARMAZENAMENTO SUPABASE (/api/supabase-storage-stats)
    if (url.pathname === '/api/supabase-storage-stats' && request.method === 'GET') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);
      const enc = new TextEncoder();
      const byteLen = (s) => enc.encode(String(s || '')).length;
      const sbHeaders = {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json'
      };
      try {
        let parametrosRows = [];
        let checklistsRows = [];
        let checklistsTotal = 0;
        let buckets = [];
        let rpcData = null;

        const [rParam, rChk, rBucket, rRpc] = await Promise.allSettled([
          fetch(supabaseUrl + '/rest/v1/parametros?select=id,valor,descricao', { headers: sbHeaders }),
          fetch(supabaseUrl + '/rest/v1/veiculo_checklists?select=*&order=id.desc&limit=500', {
            headers: { ...sbHeaders, 'Prefer': 'count=exact' }
          }),
          fetch(supabaseUrl + '/storage/v1/bucket', { headers: sbHeaders }),
          fetch(supabaseUrl + '/rest/v1/rpc/gomex_db_storage_stats', { method: 'POST', headers: sbHeaders, body: '{}' })
        ]);

        const rParamOk = rParam.status === 'fulfilled' && rParam.value.ok;
        const rChkOk = rChk.status === 'fulfilled' && rChk.value.ok;
        if (!rParamOk && !rChkOk) {
          return new Response(JSON.stringify({ ok: false, error: 'Falha ao consultar tabelas reais no Supabase' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        }
        if (rParamOk) {
          const d = await rParam.value.json().catch(() => []);
          if (Array.isArray(d)) parametrosRows = d;
        }
        if (rChkOk) {
          const cr = rChk.value.headers.get('content-range') || '';
          const mTotal = cr.match(/\/(\d+)$/);
          const d = await rChk.value.json().catch(() => []);
          if (Array.isArray(d)) checklistsRows = d;
          checklistsTotal = mTotal ? Number(mTotal[1]) : checklistsRows.length;
        }
        if (rBucket.status === 'fulfilled' && rBucket.value.ok) {
          const d = await rBucket.value.json().catch(() => []);
          if (Array.isArray(d)) buckets = d;
        }
        if (rRpc.status === 'fulfilled' && rRpc.value.ok) {
          rpcData = await rRpc.value.json().catch(() => null);
        }

        let galeriaBytes = 0, galeriaFotos = 0, gastosBytes = 0, ocorrenciasBytes = 0, outrosParametrosBytes = 0;
        for (const row of parametrosRows) {
          const rowBytes = byteLen(JSON.stringify(row));
          const mod = frotaRepo.classifyParamRowModule(row.id);
          if (mod === 'galeria') {
            galeriaBytes += rowBytes;
            if (row.id === 'frota_galeria_veiculos_v1') {
              try {
                const arr = JSON.parse(row.descricao || '[]');
                if (Array.isArray(arr)) galeriaFotos = arr.length;
              } catch (e) {
                galeriaFotos = Number(row.valor) || 0;
              }
            } else {
              galeriaFotos++;
            }
          } else if (mod === 'gastos') {
            gastosBytes += rowBytes;
          } else if (mod === 'ocorrencias') {
            ocorrenciasBytes += rowBytes;
          } else {
            outrosParametrosBytes += rowBytes;
          }
        }

        const sampleChkBytes = checklistsRows.reduce((acc, r) => acc + byteLen(JSON.stringify(r)), 0);
        const checklistsBytes = checklistsRows.length && checklistsTotal > checklistsRows.length
          ? Math.round((sampleChkBytes / checklistsRows.length) * checklistsTotal)
          : sampleChkBytes;

        let storageFilesCount = 0;
        let storageBytesUsed = 0;
        for (const b of buckets) {
          const bName = b.id || b.name;
          if (!bName) continue;
          const prefixes = [''];
          let calls = 0;
          while (prefixes.length && calls < 25) {
            const prefix = prefixes.shift();
            calls++;
            try {
              const listRes = await fetch(supabaseUrl + '/storage/v1/object/list/' + encodeURIComponent(bName), {
                method: 'POST',
                headers: sbHeaders,
                body: JSON.stringify({ prefix, limit: 1000, offset: 0 })
              });
              if (!listRes.ok) continue;
              const objs = await listRes.json().catch(() => []);
              if (!Array.isArray(objs)) continue;
              for (const obj of objs) {
                if (!obj || !obj.name || obj.name === '.emptyFolderPlaceholder') continue;
                if (obj.metadata && typeof obj.metadata.size === 'number') {
                  storageFilesCount++;
                  storageBytesUsed += obj.metadata.size;
                } else if (!obj.metadata && obj.id === null) {
                  prefixes.push(prefix ? prefix + '/' + obj.name : obj.name);
                }
              }
            } catch (e) {}
          }
        }

        const measuredTablesBytes = checklistsBytes + galeriaBytes + gastosBytes + ocorrenciasBytes + outrosParametrosBytes;
        const rpcDbBytes = rpcData && typeof rpcData.db_bytes === 'number' ? rpcData.db_bytes : null;
        const exactPgSize = rpcDbBytes !== null;
        const dbBytesUsed = exactPgSize ? rpcDbBytes : measuredTablesBytes;

        return new Response(JSON.stringify({
          ok: true,
          exactPgSize,
          dbBytesUsed,
          measuredTablesBytes,
          dbBreakdown: {
            checklistsBytes,
            checklistsCount: checklistsTotal,
            galeriaBytes,
            galeriaFotos,
            gastosBytes,
            ocorrenciasBytes,
            outrosParametrosBytes
          },
          storage: {
            available: rBucket.status === 'fulfilled' && rBucket.value.ok,
            bucketsCount: buckets.length,
            filesCount: storageFilesCount,
            bytesUsed: storageBytesUsed
          },
          checkedAt: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    // 2. ROTA DE CHECKLISTS (GET, PATCH & POST)
    if (url.pathname === '/api/checklists') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      // GET /api/checklists
      if (request.method === 'GET') {
        const select = url.searchParams.get('select') || '*';
        const idParam = url.searchParams.get('id');
        if (!/^[a-z0-9_,*]+$/i.test(select) || (idParam !== null && !/^\d+$/.test(idParam))) {
          return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        const query = idParam !== null
          ? `select=${select}&id=eq.${idParam}`
          : `select=${select}&order=id.desc&limit=500`;

        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/veiculo_checklists?${query}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await res.text();
          return new Response(data, {
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }

      // PATCH ou POST /api/checklists (Atualizar vistoria, rota, manutenção, parecer ou inativação)
      if (request.method === 'PATCH' || request.method === 'POST') {
        try {
          const rawPayload = await request.json();
          const id = rawPayload?.id;
          if (!id || !/^\d+$/.test(String(id))) {
            return new Response(JSON.stringify({ error: 'ID numérico da vistoria é obrigatório' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const cleanPayload = {};
          for (const [k, v] of Object.entries(rawPayload)) {
            if (ALLOWED_PATCH_COLS.has(k) && v !== undefined) {
              cleanPayload[k] = v;
            }
          }

          if (Object.keys(cleanPayload).length === 0) {
            return new Response(JSON.stringify({ error: 'Nenhum campo válido para atualização' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const res = await fetch(`${supabaseUrl}/rest/v1/veiculo_checklists?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(cleanPayload)
          });

          const data = await res.text();
          return new Response(data, {
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 3. ATENDIMENTO DE ASSETS ESTÁTICOS VIA BINDING (./public)
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status < 400) {
          const out = new Response(assetRes.body, assetRes);
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
          return out;
        }
      } catch (e) {}
    }

    // 4. FALLBACK SPA: SERVIR INDEX.HTML VIA ASSETS
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const fallbackRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
        if (fallbackRes.status < 400) {
          const out = new Response(fallbackRes.body, fallbackRes);
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
          return out;
        }
      } catch (e) {}
    }

    return new Response('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gomex Frota</title><meta http-equiv="refresh" content="0;url=/"></head><body>Carregando Gomex Frota...</body></html>', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...SECURITY_HEADERS
      }
    });
  }
};
