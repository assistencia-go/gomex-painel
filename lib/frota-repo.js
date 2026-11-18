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
  const GALERIA_STORAGE_BUCKET = 'frota-galeria';
  const LEGACY_PARAM_IDS = [
    ...Object.values(COLECAO_META).map(m => m.legacyId),
    'frota_permissoes_usuarios_v1',
    TOMBSTONES_PARAM_ID
  ];

  let _dedicatedCheckTs = 0;
  let _dedicatedTablesReady = false;
  let _bucketReadyPromise = null;

  function decodeImageDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return null;
    const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!m) return null;
    const rawMime = m[1].toLowerCase();
    const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const ext = extMap[mime] || 'jpg';
    const b64 = m[2].replace(/\s+/g, '');
    let bytes;
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
      bytes = new Uint8Array(Buffer.from(b64, 'base64'));
    } else if (typeof atob === 'function') {
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      return null;
    }
    if (!bytes || !bytes.length) return null;
    return { mime, ext, bytes };
  }

  async function ensureGaleriaBucket(supabaseUrl, supabaseKey) {
    if (_bucketReadyPromise) return _bucketReadyPromise;
    _bucketReadyPromise = (async () => {
      try {
        const hdrs = { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey };
        const rGet = await fetch(`${supabaseUrl}/storage/v1/bucket/${GALERIA_STORAGE_BUCKET}`, { headers: hdrs });
        if (rGet.ok) return true;
        const rCreate = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: 'POST',
          headers: { ...hdrs, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: GALERIA_STORAGE_BUCKET, name: GALERIA_STORAGE_BUCKET, public: true })
        });
        return Boolean(rCreate.ok || rCreate.status === 409);
      } catch (e) {
        return false;
      } finally {
        _bucketReadyPromise = null;
      }
    })();
    return _bucketReadyPromise;
  }

  async function uploadGaleriaImageToStorage(supabaseUrl, supabaseKey, recId, item) {
    // DIRETRIZ DE ARMAZENAMENTO: Imagens em data URL da colecao 'galeria' devem ser gravadas
    // no bucket publico Supabase Storage ('frota-galeria') e salvas no banco apenas como link URL,
    // preservando fallback automatico para data URL em caso de indisponibilidade do Storage.
    if (!item || typeof item !== 'object' || typeof item.imagem !== 'string' || !item.imagem.startsWith('data:image/')) {
      return item;
    }
    const parsed = decodeImageDataUrl(item.imagem);
    if (!parsed) return item;

    const rawData = String(item.data || '');
    const folderMatch = rawData.match(/^(\d{4}-\d{2})/);
    const folder = folderMatch ? folderMatch[1] : new Date().toISOString().slice(0, 7);
    const safeId = String(recId || item.id || ('foto_' + Date.now())).replace(/[^A-Za-z0-9._-]/g, '_');
    const objectPath = `${folder}/${safeId}.${parsed.ext}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${GALERIA_STORAGE_BUCKET}/${objectPath}`;
    const hdrs = {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Content-Type': parsed.mime,
      'Cache-Control': '31536000',
      'x-upsert': 'true'
    };

    try {
      let rUp = await fetch(uploadUrl, { method: 'POST', headers: hdrs, body: parsed.bytes });
      if (!rUp.ok && (rUp.status === 400 || rUp.status === 404)) {
        const ensured = await ensureGaleriaBucket(supabaseUrl, supabaseKey);
        if (ensured) {
          rUp = await fetch(uploadUrl, { method: 'POST', headers: hdrs, body: parsed.bytes });
        }
      }
      if (!rUp.ok) return item;

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${GALERIA_STORAGE_BUCKET}/${objectPath}`;
      return {
        ...item,
        imagem: publicUrl,
        storage_bucket: GALERIA_STORAGE_BUCKET,
        storage_path: objectPath,
        storage_migrated_at: new Date().toISOString()
      };
    } catch (e) {
      return item;
    }
  }

  async function removeGaleriaImageFromStorage(supabaseUrl, supabaseKey, rowId, explicitPath) {
    try {
      let objectPath = explicitPath || '';
      if (!objectPath && rowId) {
        const rGet = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.${encodeURIComponent(rowId)}&select=descricao`, {
          headers: makeSupabaseHeaders(supabaseKey)
        });
        if (rGet.ok) {
          const rows = await rGet.json().catch(() => []);
          if (Array.isArray(rows) && rows[0] && rows[0].descricao) {
            const parsed = JSON.parse(rows[0].descricao);
            if (parsed && parsed.storage_path) objectPath = String(parsed.storage_path);
            else if (parsed && typeof parsed.imagem === 'string') {
              const idx = parsed.imagem.indexOf(`/storage/v1/object/public/${GALERIA_STORAGE_BUCKET}/`);
              if (idx !== -1) objectPath = parsed.imagem.slice(idx + (`/storage/v1/object/public/${GALERIA_STORAGE_BUCKET}/`).length);
            }
          }
        }
      }
      if (!objectPath) return;
      await fetch(`${supabaseUrl}/storage/v1/object/${GALERIA_STORAGE_BUCKET}`, {
        method: 'DELETE',
        headers: makeSupabaseHeaders(supabaseKey),
        body: JSON.stringify({ prefixes: [objectPath] })
      });
    } catch (e) { }
  }

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

    let dataForSave = opSpec.data;
    if (op !== 'delete' && opSpec.colecao === 'galeria' && dataForSave && typeof dataForSave === 'object') {
      dataForSave = await uploadGaleriaImageToStorage(supabaseUrl, supabaseKey, id, dataForSave);
    }

    const useTables = await hasDedicatedTables(supabaseUrl, supabaseKey);
    if (useTables) {
      if (op === 'delete') {
        const rDel = await fetch(`${supabaseUrl}/rest/v1/${meta.table}?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: makeSupabaseHeaders(supabaseKey)
        });
        return { ok: rDel.ok, mode: 'tables', colecao: opSpec.colecao, op, id, updated_at: ts };
      }
      const payload = dataForSave && typeof dataForSave === 'object' ? { ...dataForSave, updated_at: ts } : { valor: dataForSave, updated_at: ts };
      const rUp = await fetch(`${supabaseUrl}/rest/v1/${meta.table}`, {
        method: 'POST',
        headers: makeSupabaseHeaders(supabaseKey, 'resolution=merge-duplicates,return=representation'),
        body: JSON.stringify([{ id, updated_at: ts, payload }])
      });
      return {
        ok: rUp.ok,
        mode: 'tables',
        colecao: opSpec.colecao,
        op,
        id,
        updated_at: ts,
        ...(opSpec.colecao === 'galeria' && payload ? { imagem: payload.imagem, storage_bucket: payload.storage_bucket, storage_path: payload.storage_path } : {})
      };
    }

    // Modo granular imediato na tabela parametros (1 linha por registro, zero sobrescrita concorrente)
    const rowId = meta.prefix + id;
    if (op === 'delete') {
      if (opSpec.colecao === 'galeria') {
        await removeGaleriaImageFromStorage(supabaseUrl, supabaseKey, rowId, opSpec.data && opSpec.data.storage_path);
      }
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

    const rowPayload = dataForSave && typeof dataForSave === 'object'
      ? { ...dataForSave, _id: id, _updated_at: ts }
      : { _value: dataForSave, _id: id, _updated_at: ts };
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

    return {
      ok: rUp.ok,
      mode: 'parametros_granular',
      colecao: opSpec.colecao,
      op,
      id,
      updated_at: ts,
      ...(opSpec.colecao === 'galeria' && rowPayload ? { imagem: rowPayload.imagem, storage_bucket: rowPayload.storage_bucket, storage_path: rowPayload.storage_path } : {})
    };
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
    GALERIA_STORAGE_BUCKET,
    LEGACY_PARAM_IDS,
    TOMBSTONES_PARAM_ID,
    extractRecordId,
    applyLocalRecordOp,
    hasDedicatedTables,
    ensureGaleriaBucket,
    uploadGaleriaImageToStorage,
    saveGranularRecord,
    fetchAllMerged,
    mergeCollectionsFromRows,
    classifyParamRowModule
  };
});

