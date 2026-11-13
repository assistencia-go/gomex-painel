      // DADOS — API REST, CACHE OFFLINE E FILA DE PERSISTÊNCIA SEGURA (ZERO DATA LOSS)
      // ==============================================================================
      const OFFLINE_CACHE_KEY = 'gomex_offline_cache_v1';
      const PENDING_SYNC_KEY = 'gomex_pending_sync_v1';
      const authHeaders = () => ({ apikey: apiKey(), Authorization: 'Bearer ' + apiKey(), 'Content-Type': 'application/json' });

      function getPendingSyncMap() {
        try {
          return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '{}') || {};
        } catch (e) {
          return {};
        }
      }

      function setPendingSyncItem(id, patchFields) {
        try {
          const map = getPendingSyncMap();
          map[String(id)] = { ...(map[String(id)] || {}), ...patchFields, _ts: Date.now() };
          localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(map));
        } catch (e) { }
      }

      function clearPendingSyncItem(id) {
        try {
          const map = getPendingSyncMap();
          if (map[String(id)]) {
            delete map[String(id)];
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(map));
          }
        } catch (e) { }
      }

      function salvarSnapshotLocal(rows) {
        try {
          if (Array.isArray(rows) && rows.length) {
            localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(rows));
          }
        } catch (e) { }
      }

      function lerSnapshotLocal() {
        try {
          const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) && parsed.length ? parsed : null;
        } catch (e) {
          return null;
        }
      }

      function aplicarPendentesLocais(rows) {
        if (!Array.isArray(rows)) return rows;
        const map = getPendingSyncMap();
        const ids = Object.keys(map);
        if (!ids.length) return rows;
        return rows.map(r => {
          const pend = map[String(r.id)];
          if (!pend) return r;
          const copy = { ...r, ...pend };
          delete copy._ts;
          return copy;
        });
      }

      async function enviarPatchSupabase(id, patchFields) {
        const numId = Number(id);
        const cleanFields = { ...patchFields };
        delete cleanFields.id;
        delete cleanFields._ts;

        // 1. Tenta proxy no servidor (/api/checklists)
        try {
          const res = await fetch('/api/checklists', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: numId, ...cleanFields })
          });
          if (res.ok) return true;
        } catch (e) { }

        // 2. Fallback direto no Supabase REST
        try {
          const resDirect = await fetch(SUPABASE_URL + '/rest/v1/veiculo_checklists?id=eq.' + numId, {
            method: 'PATCH',
            headers: { ...authHeaders(), Prefer: 'return=representation' },
            body: JSON.stringify(cleanFields)
          });
          if (resDirect.ok) return true;
        } catch (e) { }

        return false;
      }

      async function persistirNoBanco(id, patchFields) {
        const numId = Number(id);
        // Salva imediatamente no buffer local contra perda de dados
        setPendingSyncItem(numId, patchFields);

        // Atualiza em memória e no snapshot local imediatamente
        const idx = state.all.findIndex(x => Number(x.id) === numId);
        if (idx !== -1) {
          Object.assign(state.all[idx], patchFields);
        }
        if (state.sel && Number(state.sel.id) === numId) {
          Object.assign(state.sel, patchFields);
        }
        salvarSnapshotLocal(state.all);
        state.sig = computeStateSig(state.all);

        const synced = await enviarPatchSupabase(numId, patchFields);
        if (synced) {
          clearPendingSyncItem(numId);
        }
        return { ok: true, synced };
      }

      async function sincronizarPendentes() {
        const map = getPendingSyncMap();
        const ids = Object.keys(map);
        if (!ids.length) return;
        for (const id of ids) {
          const ok = await enviarPatchSupabase(id, map[id]);
          if (ok) clearPendingSyncItem(id);
        }
      }

      function computeStateSig(rows) {
        if (!Array.isArray(rows)) return '';
        return rows.map(x => [
          x.id, x.status || '', x.liberacao || '', x.rota || '',
          x.motorista || '', x.placa || '', x.veiculo || '',
          x.km ?? '', x.data || '', x.hora || '', x.tipo || '',
          x.combustivel || '', x.condicao_motorista || '', x.obs || ''
        ].join(':')).join('|');
      }

      async function getRows(proxyPath, directPath) {
        try {
          const r = await fetch(proxyPath, { cache: 'no-store' });
          if (r.ok) { const d = await r.json(); if (Array.isArray(d)) return d; }
        } catch (e) { }
        try {
          const r = await fetch(SUPABASE_URL + '/rest/v1/' + directPath, { headers: authHeaders(), cache: 'no-store' });
          if (r.ok) { const d = await r.json(); if (Array.isArray(d)) return d; }
        } catch (e) { }
        return null;
      }

      const fetchList = () => getRows('/api/checklists?select=' + LIST_COLS, 'veiculo_checklists?select=' + LIST_COLS + '&order=id.desc&limit=500');
      const fetchSigs = id => { id = Number(id); return getRows('/api/checklists?id=' + id + '&select=' + SIG_COLS, 'veiculo_checklists?id=eq.' + id + '&select=' + SIG_COLS); };

      function setSync(kind) { $('sync').dataset.state = kind; renderSyncText(); }
      function renderSyncText() {
        const kind = $('sync').dataset.state;
        const el = $('syncText');
        if (kind === 'error') { el.textContent = 'Modo offline · dados salvos localmente'; return; }
        if (kind === 'loading') { el.textContent = state.loaded ? 'Atualizando…' : 'Conectando…'; return; }
        if (!state.lastSync) return;
        const s = Math.max(0, Math.round((Date.now() - state.lastSync) / 1000));
        el.textContent = s < 5 ? 'Sincronizado agora' : 'Sincronizado há ' + (s < 60 ? s + ' s' : Math.floor(s / 60) + ' min');
      }
      setInterval(renderSyncText, 1000);

      async function load({ silent = false } = {}) {
        if (loading || !authed) return;
        loading = true;
        if (!silent) { setSync('loading'); $('btnRefresh').classList.add('is-loading'); }

        // Sincroniza quaisquer edições pendentes antes de buscar a lista
        await sincronizarPendentes();

        let raw = await fetchList();
        loading = false;
        $('btnRefresh').classList.remove('is-loading');

        if (!raw) {
          state.error = true;
          setSync('error');
          if (!state.loaded) {
            const cached = lerSnapshotLocal();
            if (cached) {
              const merged = aplicarPendentesLocais(cached);
              merged.forEach(x => state.known.add(x.id));
              state.all = merged;
              state.sig = computeStateSig(merged);
              state.loaded = true;
              renderAll();
              return;
            }
            renderTable();
          }
          return;
        }

        const d = aplicarPendentesLocais(raw);
        // Propaga automaticamente a rota mais recente informada pelo vendedor no check-list
        const rotaPorMotorista = new Map();
        d.forEach(item => {
          const motKey = (item.motorista || '').trim().toLowerCase();
          const rt = (item.rota || '').trim();
          if (motKey && rt && !rotaPorMotorista.has(motKey)) {
            rotaPorMotorista.set(motKey, rt);
          }
        });
        d.forEach(item => {
          const motKey = (item.motorista || '').trim().toLowerCase();
          if (motKey && (!item.rota || !String(item.rota).trim()) && rotaPorMotorista.has(motKey)) {
            item.rota = rotaPorMotorista.get(motKey);
          }
        });
        salvarSnapshotLocal(d);

        state.error = false;
        state.lastSync = Date.now();
        setSync('ok');

        const sig = computeStateSig(d);
        if (state.loaded && sig === state.sig) return;

        const fresh = state.loaded ? d.filter(x => !state.known.has(x.id)) : [];
        d.forEach(x => state.known.add(x.id));
        state.all = d;
        state.sig = sig;
        state.loaded = true;
        state.fresh = new Set(fresh.map(x => x.id));
        if (state.sel) {
          const updatedSel = d.find(x => Number(x.id) === Number(state.sel.id));
          if (updatedSel) state.sel = updatedSel;
        }
        renderAll();

        if (fresh.length) {
          const hasBad = fresh.some(x => x.liberacao === 'Não liberado');
          const hasWarn = fresh.some(x => x.liberacao === 'Ressalva');
          if (hasBad) tocarChimeAlerta('bad');
          else if (hasWarn) tocarChimeAlerta('warn');

          toast(fresh.length === 1 ? 'Nova vistoria ' + fresh[0].numero + ' recebida' : fresh.length + ' novas vistorias recebidas');
          dispararNotificacaoNativa(fresh[0], fresh.length);
          notificarServidorNovaVistoria(fresh[0], fresh.length);
        }
        setTimeout(() => state.fresh.clear(), 2600);
      }

      $('btnRefresh').addEventListener('click', () => load());
      document.addEventListener('visibilitychange', () => { if (!document.hidden && authed) load({ silent: true }); });

      // ==============================================================================