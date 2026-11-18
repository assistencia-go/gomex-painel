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

