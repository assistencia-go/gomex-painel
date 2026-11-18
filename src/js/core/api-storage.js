      // DADOS — API REST, CACHE OFFLINE E FILA DE PERSISTÊNCIA SEGURA (ZERO DATA LOSS)
      // ==============================================================================
      const OFFLINE_CACHE_KEY = 'gomex_offline_cache_v1';
      const PENDING_SYNC_KEY = 'gomex_pending_sync_v1';
      const FROTA_PENDING_KEY = 'gomex_frota_pending_v1';
      const authHeaders = () => ({ apikey: apiKey(), Authorization: 'Bearer ' + apiKey(), 'Content-Type': 'application/json' });
      window.authHeaders = authHeaders;

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
        atualizarIndicadorSyncPendente();
      }

      function clearPendingSyncItem(id) {
        try {
          const map = getPendingSyncMap();
          if (map[String(id)]) {
            delete map[String(id)];
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(map));
          }
        } catch (e) { }
        atualizarIndicadorSyncPendente();
      }

      function getPendingFrotaQueue() {
        try {
          const parsed = JSON.parse(localStorage.getItem(FROTA_PENDING_KEY) || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }

      function savePendingFrotaQueue(arr) {
        try {
          localStorage.setItem(FROTA_PENDING_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
        } catch (e) { }
        atualizarIndicadorSyncPendente();
      }

      function resolveFrotaOpId(colecao, dataOrId) {
        if (typeof dataOrId === 'string' || typeof dataOrId === 'number') return String(dataOrId).trim();
        if (!dataOrId || typeof dataOrId !== 'object') return '';
        if (colecao === 'vendedores_rotas') return String(dataOrId.id || dataOrId.rota || dataOrId.nome || '').trim();
        return String(dataOrId.id || dataOrId.placa || '').trim();
      }

      function enqueueFrotaRecordOp(colecao, op, dataOrId) {
        const id = resolveFrotaOpId(colecao, dataOrId);
        if (!colecao || !id) return;
        const queue = getPendingFrotaQueue();
        const key = colecao + ':' + id;
        const ts = Date.now();
        const updated_at = (dataOrId && typeof dataOrId === 'object' && dataOrId.updated_at) || new Date(ts).toISOString();
        const entry = {
          key,
          colecao,
          op: op === 'delete' ? 'delete' : 'upsert',
          id,
          data: op === 'delete' ? null : dataOrId,
          updated_at,
          ts
        };
        const filtered = queue.filter(x => x && x.key !== key);
        filtered.push(entry);
        savePendingFrotaQueue(filtered);
        return entry;
      }

      function clearFrotaQueueItems(syncedEntries) {
        if (!Array.isArray(syncedEntries) || !syncedEntries.length) return;
        const doneTs = new Map();
        syncedEntries.forEach(item => {
          if (item && item.key) doneTs.set(item.key, item.ts);
        });
        const next = getPendingFrotaQueue().filter(item => {
          if (!item || !item.key) return false;
          if (!doneTs.has(item.key)) return true;
          return item.ts !== doneTs.get(item.key);
        });
        savePendingFrotaQueue(next);
      }

      function countPendingSyncTotal() {
        return Object.keys(getPendingSyncMap()).length + getPendingFrotaQueue().length;
      }

      window.FROTA_PENDING_KEY = FROTA_PENDING_KEY;
      window.getPendingFrotaQueue = getPendingFrotaQueue;
      window.savePendingFrotaQueue = savePendingFrotaQueue;
      window.enqueueFrotaRecordOp = enqueueFrotaRecordOp;
      window.clearFrotaQueueItems = clearFrotaQueueItems;
      window.countPendingSyncTotal = countPendingSyncTotal;

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

      // Normaliza e resolve nome completo do vendedor/motorista em CAIXA ALTA apenas no painel
      function _normTxtVist(s) {
        return String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function _tokensNomeVist(s) {
        return _normTxtVist(s).split(' ').filter(Boolean);
      }

      function _tokensBatemNoNome(typedTokens, candidatoNome, prefixMin = 0) {
        if (!typedTokens.length) return false;
        const candTokens = _tokensNomeVist(candidatoNome);
        if (!candTokens.length) return false;
        return typedTokens.every(t =>
          candTokens.includes(t) ||
          (prefixMin > 0 && t.length >= prefixMin && candTokens.some(ct => ct.startsWith(t)))
        );
      }

      function resolverNomeVendedorPainel(rawNome, rota = '', placa = '', nomesHistoricosPlaca = []) {
        const orig = String(rawNome || '').trim();
        if (!orig) return '';
        if (_normTxtVist(orig) === 'nao informado') return 'NÃO INFORMADO';

        const typedTokens = _tokensNomeVist(orig);
        const listaOficial = (typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined' && Array.isArray(EQUIPES_VENDEDORES_PADRAO))
          ? EQUIPES_VENDEDORES_PADRAO
          : [];
        const rotaDigits = String(rota || '').replace(/\D/g, '');

        // 1. Se houver rota oficial e o nome digitado conferir com o titular daquela rota
        if (rotaDigits && listaOficial.length) {
          const porRota = listaOficial.find(v => v.rota === rotaDigits);
          if (porRota && _tokensBatemNoNome(typedTokens, porRota.nome, 3)) {
            return String(porRota.nome).toLocaleUpperCase('pt-BR');
          }
        }

        // 2. Match no catálogo oficial de vendedores (token exato primeiro, depois prefixo >= 3 letras)
        if (listaOficial.length) {
          let candidatos = listaOficial.filter(v => _tokensBatemNoNome(typedTokens, v.nome, 0));
          if (!candidatos.length) {
            candidatos = listaOficial.filter(v => _tokensBatemNoNome(typedTokens, v.nome, 3));
          }
          if (candidatos.length === 1) {
            return String(candidatos[0].nome).toLocaleUpperCase('pt-BR');
          }
          // Desempate caso haja homônimo de primeiro nome usando histórico da própria placa
          if (candidatos.length > 1 && Array.isArray(nomesHistoricosPlaca) && nomesHistoricosPlaca.length) {
            const histNormSet = new Set(nomesHistoricosPlaca.map(n => _normTxtVist(n)).filter(Boolean));
            const noHistorico = candidatos.filter(c => histNormSet.has(_normTxtVist(c.nome)));
            if (noHistorico.length === 1) {
              return String(noHistorico[0].nome).toLocaleUpperCase('pt-BR');
            }
          }
        }

        // 3. Fallback: nomes completos já vistos no histórico da própria placa ou no cadastro da frota
        const extras = Array.isArray(nomesHistoricosPlaca) ? nomesHistoricosPlaca.slice() : [];
        if (typeof gastosState !== 'undefined' && Array.isArray(gastosState.veiculos)) {
          const pNorm = String(placa || '').toUpperCase().trim();
          gastosState.veiculos.forEach(v => {
            if ((!pNorm || String(v.placa || '').toUpperCase().trim() === pNorm) && v.motorista) {
              extras.push(v.motorista);
            }
          });
        }
        const nomesMultiUnicos = [...new Set(extras.map(n => String(n || '').trim()).filter(n => _tokensNomeVist(n).length >= 2))];
        if (nomesMultiUnicos.length) {
          let histCand = nomesMultiUnicos.filter(n => _tokensBatemNoNome(typedTokens, n, 0));
          if (!histCand.length) histCand = nomesMultiUnicos.filter(n => _tokensBatemNoNome(typedTokens, n, 3));
          if (histCand.length === 1) {
            return histCand[0].toLocaleUpperCase('pt-BR');
          }
        }

        // 4. Sempre exibir em CAIXA ALTA no painel
        return orig.toLocaleUpperCase('pt-BR');
      }
      window.resolverNomeVendedorPainel = resolverNomeVendedorPainel;

      function normalizarVistoriasPainel(rows) {
        if (!Array.isArray(rows)) return rows;
        const nomesPorPlaca = new Map();
        rows.forEach(it => {
          if (!it || it.status === 'inativo') return;
          const p = String(it.placa || '').toUpperCase().trim();
          const m = String(it.motorista || '').trim();
          if (!p || !m || _tokensNomeVist(m).length < 2) return;
          if (!nomesPorPlaca.has(p)) nomesPorPlaca.set(p, []);
          nomesPorPlaca.get(p).push(m);
        });

        rows.forEach(it => {
          if (!it) return;
          const orig = String(it.motorista || '').trim();
          if (!orig) return;
          const p = String(it.placa || '').toUpperCase().trim();
          const histPlaca = p ? (nomesPorPlaca.get(p) || []) : [];
          const resolvido = resolverNomeVendedorPainel(orig, it.rota, p, histPlaca);
          if (resolvido && resolvido !== orig) {
            if (!it._motoristaOriginal && _normTxtVist(orig) !== _normTxtVist(resolvido)) {
              it._motoristaOriginal = orig;
            }
            it.motorista = resolvido;
          }
        });
        return rows;
      }
      window.normalizarVistoriasPainel = normalizarVistoriasPainel;

      function obterMapaTrocasVendedorPlaca(rows) {
        const fonte = Array.isArray(rows) ? rows : (state.all || []);
        const porPlaca = new Map();
        fonte.forEach(it => {
          if (!it || it.status === 'inativo') return;
          const p = String(it.placa || '').toUpperCase().trim();
          if (!p) return;
          if (!porPlaca.has(p)) porPlaca.set(p, []);
          porPlaca.get(p).push(it);
        });

        const porVistoriaId = new Map();
        const latestChangedIds = new Set();

        porPlaca.forEach((lista, placa) => {
          if (lista.length < 2) return;
          lista.sort((a, b) => {
            const ka = (a.data || '') + ' ' + (a.hora || '');
            const kb = (b.data || '') + ' ' + (b.hora || '');
            const cmp = ka.localeCompare(kb);
            if (cmp !== 0) return cmp;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
          });

          for (let i = 1; i < lista.length; i++) {
            const anterior = lista[i - 1];
            const atual = lista[i];
            const mAnt = String(anterior.motorista || '').trim();
            const mAtu = String(atual.motorista || '').trim();
            const normAnt = _normTxtVist(mAnt);
            const normAtu = _normTxtVist(mAtu);
            if (normAnt && normAtu && normAnt !== 'nao informado' && normAtu !== 'nao informado' && normAnt !== normAtu) {
              const isLatest = i === lista.length - 1;
              porVistoriaId.set(String(atual.id), {
                placa,
                motoristaAnterior: mAnt,
                motoristaAtual: mAtu,
                vistoriaAnteriorNum: anterior.numero || '—',
                vistoriaAnteriorData: anterior.data || '',
                isLatestOfPlate: isLatest
              });
              if (isLatest) latestChangedIds.add(String(atual.id));
            }
          }
        });

        return { porVistoriaId, latestChangedIds };
      }
      window.obterMapaTrocasVendedorPlaca = obterMapaTrocasVendedorPlaca;

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

      let _lastDesiredSyncState = 'loading';
      function atualizarIndicadorSyncPendente() {
        const elSync = $('sync');
        if (!elSync) return;
        const pending = countPendingSyncTotal();
        const offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
        elSync.dataset.pending = String(pending);
        elSync.dataset.hasPending = pending > 0 ? '1' : '0';

        if (offline) {
          elSync.dataset.state = 'offline';
        } else if (_lastDesiredSyncState === 'loading') {
          elSync.dataset.state = 'loading';
        } else if (_lastDesiredSyncState === 'error' || state.error) {
          elSync.dataset.state = 'error';
        } else if (pending > 0) {
          elSync.dataset.state = 'pending';
        } else {
          elSync.dataset.state = 'ok';
        }
        renderSyncText();
      }
      window.atualizarIndicadorSyncPendente = atualizarIndicadorSyncPendente;

      function setSync(kind) {
        _lastDesiredSyncState = kind;
        atualizarIndicadorSyncPendente();
      }

      function renderSyncText() {
        const syncWrap = $('sync');
        const el = $('syncText');
        if (!syncWrap || !el) return;
        const kind = syncWrap.dataset.state;
        const pending = Number(syncWrap.dataset.pending || 0);
        const pendSuffix = pending > 0 ? ' · ' + pending + ' pend.' : '';

        if (kind === 'offline') {
          el.textContent = pending > 0 ? ('Sem internet · ' + pending + ' pendente(s)') : 'Sem internet · Salvo local';
          return;
        }
        if (kind === 'error') {
          el.textContent = pending > 0 ? ('Modo offline · ' + pending + ' pendente(s)') : 'Modo offline · dados salvos localmente';
          return;
        }
        if (kind === 'loading') {
          el.textContent = (state.loaded ? 'Atualizando…' : 'Conectando…') + pendSuffix;
          return;
        }
        if (kind === 'pending' || pending > 0) {
          el.textContent = pending + ' pendente(s) · Enviar';
          return;
        }
        if (!state.lastSync) {
          el.textContent = 'Conectado';
          return;
        }
        const s = Math.max(0, Math.round((Date.now() - state.lastSync) / 1000));
        el.textContent = s < 5 ? 'Sincronizado agora' : 'Sincronizado há ' + (s < 60 ? s + ' s' : Math.floor(s / 60) + ' min');
      }
      setInterval(renderSyncText, 1000);

      async function sincronizarTudoManual() {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          atualizarIndicadorSyncPendente();
          toast('Sem internet no momento. Seus dados continuam salvos localmente.', 'error');
          return false;
        }
        setSync('loading');
        await sincronizarPendentes();
        if (typeof window.sincronizarFilaFrotaPendente === 'function') {
          await window.sincronizarFilaFrotaPendente();
        }
        await load({ silent: true });
        if (typeof window.sincronizarGastosComServidor === 'function') {
          await window.sincronizarGastosComServidor('pull');
        }
        atualizarIndicadorSyncPendente();
        const restam = countPendingSyncTotal();
        if (restam === 0 && !state.error) {
          toast('Painel sincronizado com o servidor.');
        } else if (restam > 0) {
          toast('Ainda há ' + restam + ' alteração(ões) aguardando conexão.', 'error');
        }
        return restam === 0;
      }
      window.sincronizarTudoManual = sincronizarTudoManual;

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
              const merged = normalizarVistoriasPainel(aplicarPendentesLocais(cached));
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

        const d = normalizarVistoriasPainel(aplicarPendentesLocais(raw));
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
          const trocasInfo = obterMapaTrocasVendedorPlaca(d);
          const freshTrocas = fresh
            .map(x => trocasInfo.porVistoriaId.get(String(x.id)))
            .filter(Boolean);
          const hasBad = fresh.some(x => x.liberacao === 'Não liberado');
          const hasWarn = fresh.some(x => x.liberacao === 'Ressalva') || freshTrocas.length > 0;
          if (hasBad) tocarChimeAlerta('bad');
          else if (hasWarn) tocarChimeAlerta('warn');

          toast(fresh.length === 1 ? 'Nova vistoria ' + fresh[0].numero + ' recebida' : fresh.length + ' novas vistorias recebidas');
          if (freshTrocas.length === 1) {
            const tr = freshTrocas[0];
            toast('Atenção: placa ' + tr.placa + ' mudou de vendedor (' + tr.motoristaAnterior + ' -> ' + tr.motoristaAtual + ')', 'error');
          } else if (freshTrocas.length > 1) {
            toast('Atenção: ' + freshTrocas.length + ' vistorias chegaram com troca de vendedor em placas já cadastradas!', 'error');
          }
          dispararNotificacaoNativa(fresh[0], fresh.length);
          notificarServidorNovaVistoria(fresh[0], fresh.length);
          // Sempre que chegar nova vistoria, sincroniza também a Galeria para trazer as fotos
          if (typeof window.sincronizarGastosComServidor === 'function') {
            window.sincronizarGastosComServidor('pull');
          }
        }
        setTimeout(() => state.fresh.clear(), 2600);
      }

      // DIRETRIZ DE SINCRONISMO: O botão "Atualizar" (#btnRefresh) deve sincronizar tanto
      // vistorias quanto fotos/gastos/ocorrências (/api/frota-gastos).
      $('btnRefresh').addEventListener('click', () => {
        load();
        if (typeof window.sincronizarGastosComServidor === 'function') {
          window.sincronizarGastosComServidor('pull');
        }
      });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && authed) load({ silent: true }); });
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', async () => {
          atualizarIndicadorSyncPendente();
          if (!authed) return;
          await sincronizarPendentes();
          if (typeof window.sincronizarFilaFrotaPendente === 'function') {
            await window.sincronizarFilaFrotaPendente();
          }
          await load({ silent: true });
          if (countPendingSyncTotal() === 0) {
            toast('Conexão restabelecida · pendências sincronizadas!');
          }
        });
        window.addEventListener('offline', () => {
          atualizarIndicadorSyncPendente();
          toast('Sem internet · suas alterações serão salvas localmente até reconectar.', 'error');
        });
      }
      setInterval(async () => {
        if (!authed) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        if (countPendingSyncTotal() <= 0) return;
        await sincronizarPendentes();
        if (typeof window.sincronizarFilaFrotaPendente === 'function') {
          await window.sincronizarFilaFrotaPendente();
        }
      }, 15000);

      // ==============================================================================