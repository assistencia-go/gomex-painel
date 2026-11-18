      // MÓDULO DE CUSTOS, PEÇAS, INSUMOS E GALERIA DA FROTA (COM CÓDIGO DE PRODUTO E SUPABASE)
      // ==============================================================================
      const GASTOS_CATALOGO_KEY = 'gomex_frota_catalogo_produtos_v1';
      const GASTOS_LANCAMENTOS_KEY = 'gomex_frota_lancamentos_gastos_v1';
      const GALERIA_VEICULOS_KEY = 'gomex_frota_galeria_veiculos_v1';
      const HIST_MANUT_ALL_KEY = 'gomex_frota_historico_manutencoes_v1';
      const FROTA_VEICULOS_KEY = 'gomex_frota_cadastro_veiculos_v1';
      const OCORRENCIAS_FROTA_KEY = 'gomex_frota_ocorrencias_v1';
      const AGENDAMENTOS_FROTA_KEY = 'gomex_frota_agendamentos_v1';
      const VENDEDORES_ROTAS_KEY = 'gomex_frota_vendedores_rotas_v1';

      // Lista base de veículos carregada sob demanda (/chunks/veiculos-padrao.json)
      window.VEICULOS_PADRAO_FROTA = window.VEICULOS_PADRAO_FROTA || null;
      async function carregarVeiculosPadraoChunk() {
        if (Array.isArray(window.VEICULOS_PADRAO_FROTA) && window.VEICULOS_PADRAO_FROTA.length) {
          return window.VEICULOS_PADRAO_FROTA;
        }
        try {
          const res = await fetch('/chunks/veiculos-padrao.json', { cache: 'force-cache' });
          if (res.ok) {
            const arr = await res.json();
            if (Array.isArray(arr)) {
              window.VEICULOS_PADRAO_FROTA = arr;
              return arr;
            }
          }
        } catch (e) { }
        return [];
      }
      window.carregarVeiculosPadraoChunk = carregarVeiculosPadraoChunk;

      const PRODUTOS_PADRAO_FROTA = [
        { id: 'p_oleo_5w30', codigo: '01', nome: 'Óleo de Motor 5W30 Sintético', categoria: 'Óleo & Lubrificantes', unidade: 'L', preco_base: 45.00 },
        { id: 'p_oleo_15w40', codigo: '02', nome: 'Óleo de Motor 15W40 Semissintético', categoria: 'Óleo & Lubrificantes', unidade: 'L', preco_base: 38.00 },
        { id: 'p_fluido_freio', codigo: '03', nome: 'Fluido de Freio DOT 4', categoria: 'Óleo & Lubrificantes', unidade: 'L', preco_base: 32.00 },
        { id: 'p_aditivo_rad', codigo: '04', nome: 'Aditivo de Radiador / Arrefecimento', categoria: 'Óleo & Lubrificantes', unidade: 'L', preco_base: 28.00 },
        { id: 'p_filtro_oleo', codigo: '05', nome: 'Filtro de Óleo do Motor', categoria: 'Filtros', unidade: 'un', preco_base: 48.00 },
        { id: 'p_filtro_ar', codigo: '06', nome: 'Filtro de Ar do Motor', categoria: 'Filtros', unidade: 'un', preco_base: 55.00 },
        { id: 'p_filtro_comb', codigo: '07', nome: 'Filtro de Combustível', categoria: 'Filtros', unidade: 'un', preco_base: 45.00 },
        { id: 'p_pastilha_diant', codigo: '08', nome: 'Pastilha de Freio Dianteira', categoria: 'Freios & Suspensão', unidade: 'jg', preco_base: 165.00 },
        { id: 'p_disco_freio', codigo: '09', nome: 'Disco de Freio Dianteiro', categoria: 'Freios & Suspensão', unidade: 'par', preco_base: 290.00 },
        { id: 'p_amortecedor', codigo: '10', nome: 'Amortecedor de Suspensão', categoria: 'Freios & Suspensão', unidade: 'par', preco_base: 480.00 },
        { id: 'p_correia_dent', codigo: '11', nome: 'Kit Correia Dentada + Tensor', categoria: 'Peças Mecânicas', unidade: 'jg', preco_base: 320.00 },
        { id: 'p_embreagem', codigo: '12', nome: 'Kit de Embreagem Completo', categoria: 'Peças Mecânicas', unidade: 'jg', preco_base: 690.00 },
        { id: 'p_bateria_60ah', codigo: '13', nome: 'Bateria Automotiva 60Ah / 70Ah', categoria: 'Elétrica & Iluminação', unidade: 'un', preco_base: 460.00 },
        { id: 'p_lampada_h4', codigo: '14', nome: 'Lâmpada de Farol / Lanterna', categoria: 'Elétrica & Iluminação', unidade: 'un', preco_base: 25.00 },
        { id: 'p_palheta_limp', codigo: '15', nome: 'Palheta do Limpador de Para-brisa', categoria: 'Elétrica & Iluminação', unidade: 'par', preco_base: 65.00 },
        { id: 'p_pneu_novo', codigo: '16', nome: 'Pneu Novo Reforçado Carga', categoria: 'Pneus & Borracharia', unidade: 'un', preco_base: 540.00 },
        { id: 'p_conserto_pneu', codigo: '17', nome: 'Vulcanização / Conserto de Pneu', categoria: 'Pneus & Borracharia', unidade: 'sv', preco_base: 40.00 },
        { id: 'p_alinhamento', codigo: '18', nome: 'Alinhamento e Balanceamento', categoria: 'Pneus & Borracharia', unidade: 'sv', preco_base: 120.00 },
        { id: 'p_mao_obra', codigo: '19', nome: 'Mão de Obra Mecânica / Oficina', categoria: 'Mão de Obra / Serviço', unidade: 'sv', preco_base: 150.00 }
      ];

      const UNIDADE_LABELS = {
        'L': 'Litros (L)',
        'un': 'Unidade (un)',
        'jg': 'Jogo / Kit (jg)',
        'par': 'Par (par)',
        'sv': 'Serviço (sv)',
        'kg': 'Quilo (kg)'
      };

      const gastosState = {
        produtos: [],
        lancamentos: [],
        historico_manutencoes: {},
        galeria: [],
        veiculos: [],
        ocorrencias: [],
        agendamentos: [],
        vendedores_rotas: [],
        aba: 'lancamentos',
        periodoQuick: 'todos',
        dataInicio: '',
        dataFim: '',
        placa: '',
        motorista: '',
        categoria: '',
        busca: '',
        modalItensDraft: [],
        galUploadsDraft: [],
        gastoAnexosDraft: []
      };
      window.gastosState = gastosState;
      window.PRODUTOS_PADRAO_FROTA = PRODUTOS_PADRAO_FROTA;
      window.UNIDADE_LABELS = UNIDADE_LABELS;

      function garantirCodigosProdutos() {
        if (!Array.isArray(gastosState.produtos)) return;
        let maxNum = 0;
        gastosState.produtos.forEach(p => {
          const n = parseInt(String(p.codigo || '').replace(/\D/g, ''), 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        gastosState.produtos.forEach((p, idx) => {
          if (!p.codigo || !String(p.codigo).trim()) {
            const padrao = PRODUTOS_PADRAO_FROTA.find(d => d.id === p.id || d.nome === p.nome);
            if (padrao && padrao.codigo) {
              p.codigo = padrao.codigo;
            } else {
              maxNum = Math.max(maxNum + 1, idx + 1);
              p.codigo = String(maxNum).padStart(2, '0');
            }
          }
        });
      }

      function sugerirProximoCodigoProduto() {
        let maxNum = 0;
        gastosState.produtos.forEach(p => {
          const n = parseInt(String(p.codigo || '').replace(/\D/g, ''), 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        return String(maxNum + 1).padStart(2, '0');
      }

      function fmtMoeda(val) {
        const n = Number(val) || 0;
        return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      function parseNumeroMoeda(str) {
        if (typeof str === 'number') return isNaN(str) ? 0 : str;
        const s = String(str || '').trim().replace(/[R$\s]/g, '');
        if (!s) return 0;
        if (s.includes(',') && s.includes('.')) {
          return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
        }
        if (s.includes(',')) {
          return parseFloat(s.replace(',', '.')) || 0;
        }
        return parseFloat(s) || 0;
      }

      function carregarGastosLocalStorage() {
        try {
          const rawP = localStorage.getItem(GASTOS_CATALOGO_KEY);
          if (rawP) {
            const parsedP = JSON.parse(rawP);
            if (Array.isArray(parsedP) && parsedP.length) {
              gastosState.produtos = parsedP;
            }
          }
        } catch (e) { }
        if (!gastosState.produtos.length) {
          gastosState.produtos = [...PRODUTOS_PADRAO_FROTA];
        }
        garantirCodigosProdutos();
        localStorage.setItem(GASTOS_CATALOGO_KEY, JSON.stringify(gastosState.produtos));

        try {
          const rawL = localStorage.getItem(GASTOS_LANCAMENTOS_KEY);
          if (rawL) {
            const parsedL = JSON.parse(rawL);
            if (Array.isArray(parsedL)) {
              gastosState.lancamentos = parsedL;
            }
          }
        } catch (e) { }

        try {
          const rawM = localStorage.getItem(HIST_MANUT_ALL_KEY);
          if (rawM) {
            const parsedM = JSON.parse(rawM);
            if (parsedM && typeof parsedM === 'object') {
              gastosState.historico_manutencoes = parsedM;
            }
          }
        } catch (e) { }

        try {
          const rawG = localStorage.getItem(GALERIA_VEICULOS_KEY);
          if (rawG) {
            const parsedG = JSON.parse(rawG);
            if (Array.isArray(parsedG)) {
              gastosState.galeria = parsedG;
            }
          }
        } catch (e) { }

        try {
          const rawV = localStorage.getItem(FROTA_VEICULOS_KEY);
          if (rawV) {
            const parsedV = JSON.parse(rawV);
            if (Array.isArray(parsedV)) gastosState.veiculos = parsedV;
          }
        } catch (e) { }

        try {
          const rawO = localStorage.getItem(OCORRENCIAS_FROTA_KEY);
          if (rawO) {
            const parsedO = JSON.parse(rawO);
            if (Array.isArray(parsedO)) gastosState.ocorrencias = parsedO;
          }
        } catch (e) { }

        try {
          const rawAg = localStorage.getItem(AGENDAMENTOS_FROTA_KEY);
          if (rawAg) {
            const parsedAg = JSON.parse(rawAg);
            if (Array.isArray(parsedAg)) gastosState.agendamentos = parsedAg;
          }
        } catch (e) { }

        try {
          const rawVr = localStorage.getItem(VENDEDORES_ROTAS_KEY);
          if (rawVr) {
            const parsedVr = JSON.parse(rawVr);
            if (Array.isArray(parsedVr)) gastosState.vendedores_rotas = parsedVr;
          }
        } catch (e) { }
      }

      function _safeLocalSetItem(key, val) {
        try {
          localStorage.setItem(key, val);
          return true;
        } catch (e) {
          return false;
        }
      }

      function salvarGastosLocalStorage() {
        try { garantirCodigosProdutos(); } catch (e) { }
        // DIRETRIZ PERMANENTE: Nunca gravar múltiplos keys em um único try/catch (evita que QuotaExceededError
        // na galeria bloqueie veiculos, ocorrencias e rotas) e limitar blobs base64 em cache local.
        _safeLocalSetItem(GASTOS_CATALOGO_KEY, JSON.stringify(gastosState.produtos || []));
        _safeLocalSetItem(GASTOS_LANCAMENTOS_KEY, JSON.stringify(gastosState.lancamentos || []));
        _safeLocalSetItem(HIST_MANUT_ALL_KEY, JSON.stringify(gastosState.historico_manutencoes || {}));
        _safeLocalSetItem(FROTA_VEICULOS_KEY, JSON.stringify(gastosState.veiculos || []));
        _safeLocalSetItem(OCORRENCIAS_FROTA_KEY, JSON.stringify(gastosState.ocorrencias || []));
        _safeLocalSetItem(AGENDAMENTOS_FROTA_KEY, JSON.stringify(gastosState.agendamentos || []));
        _safeLocalSetItem(VENDEDORES_ROTAS_KEY, JSON.stringify(gastosState.vendedores_rotas || []));

        const allGal = Array.isArray(gastosState.galeria) ? gastosState.galeria : [];
        let dataUrlBudget = 1800000;
        const galeriaCompacta = [];
        for (const item of allGal) {
          if (!item || typeof item !== 'object') continue;
          const img = typeof item.imagem === 'string' ? item.imagem : '';
          if (!img.startsWith('data:')) {
            galeriaCompacta.push(item);
          } else if (img.length <= dataUrlBudget) {
            galeriaCompacta.push(item);
            dataUrlBudget -= img.length;
          }
        }
        _safeLocalSetItem(GALERIA_VEICULOS_KEY, JSON.stringify(galeriaCompacta));
      }

      const FROTA_ARRAY_COLECOES = ['produtos', 'lancamentos', 'galeria', 'veiculos', 'ocorrencias', 'agendamentos', 'vendedores_rotas'];
      const _frotaSyncSnapshot = {
        produtos: {},
        lancamentos: {},
        galeria: {},
        veiculos: {},
        ocorrencias: {},
        agendamentos: {},
        vendedores_rotas: {},
        historico_manutencoes: {}
      };

      function _frotaRecId(col, item) {
        if (!item || typeof item !== 'object') return '';
        if (col === 'vendedores_rotas') return String(item.id || item.rota || item.nome || '').trim();
        return String(item.id || item.placa || '').trim();
      }

      function _frotaStableHash(obj) {
        if (obj === null || obj === undefined) return '';
        try {
          if (typeof obj === 'object' && !Array.isArray(obj)) {
            const clone = { ...obj };
            delete clone.updated_at;
            return JSON.stringify(clone);
          }
          return JSON.stringify(obj);
        } catch (e) {
          return '';
        }
      }

      function atualizarSnapshotFrota(apenasCol) {
        const cols = apenasCol ? [apenasCol] : [...FROTA_ARRAY_COLECOES, 'historico_manutencoes'];
        for (const col of cols) {
          const nextMap = {};
          if (col === 'historico_manutencoes') {
            const m = gastosState.historico_manutencoes || {};
            for (const placa of Object.keys(m)) {
              if (!placa) continue;
              nextMap[placa] = _frotaStableHash(m[placa]);
            }
          } else {
            const arr = Array.isArray(gastosState[col]) ? gastosState[col] : [];
            for (const item of arr) {
              const id = _frotaRecId(col, item);
              if (id) nextMap[id] = _frotaStableHash(item);
            }
          }
          _frotaSyncSnapshot[col] = nextMap;
        }
      }

      function diffFrotaSnapshotOps() {
        const ops = [];
        for (const col of FROTA_ARRAY_COLECOES) {
          const prevMap = _frotaSyncSnapshot[col] || {};
          const currArr = Array.isArray(gastosState[col]) ? gastosState[col] : [];
          const seenIds = new Set();
          for (const item of currArr) {
            const id = _frotaRecId(col, item);
            if (!id) continue;
            seenIds.add(id);
            const currHash = _frotaStableHash(item);
            if (prevMap[id] !== currHash) {
              ops.push({ colecao: col, op: 'upsert', id, data: item });
            }
          }
          for (const oldId of Object.keys(prevMap)) {
            if (!seenIds.has(oldId)) {
              ops.push({ colecao: col, op: 'delete', id: oldId });
            }
          }
        }
        const prevHist = _frotaSyncSnapshot.historico_manutencoes || {};
        const currHist = gastosState.historico_manutencoes || {};
        const seenPlacas = new Set();
        for (const placa of Object.keys(currHist)) {
          if (!placa) continue;
          seenPlacas.add(placa);
          const h = _frotaStableHash(currHist[placa]);
          if (prevHist[placa] !== h) {
            ops.push({ colecao: 'historico_manutencoes', op: 'upsert', id: placa, data: currHist[placa] });
          }
        }
        for (const oldPlaca of Object.keys(prevHist)) {
          if (!seenPlacas.has(oldPlaca)) {
            ops.push({ colecao: 'historico_manutencoes', op: 'delete', id: oldPlaca });
          }
        }
        return ops;
      }

      function aplicarPendentesFrotaLocais() {
        const queue = typeof window.getPendingFrotaQueue === 'function' ? window.getPendingFrotaQueue() : [];
        if (!queue.length) return;
        for (const entry of queue) {
          if (!entry || !entry.colecao || !entry.id) continue;
          const col = entry.colecao;
          if (col === 'historico_manutencoes') {
            if (!gastosState.historico_manutencoes || typeof gastosState.historico_manutencoes !== 'object') {
              gastosState.historico_manutencoes = {};
            }
            if (entry.op === 'delete') delete gastosState.historico_manutencoes[entry.id];
            else if (entry.data !== undefined) gastosState.historico_manutencoes[entry.id] = entry.data;
            continue;
          }
          if (!Array.isArray(gastosState[col])) gastosState[col] = [];
          const list = gastosState[col];
          const idx = list.findIndex(x => _frotaRecId(col, x) === entry.id);
          if (entry.op === 'delete') {
            if (idx !== -1) list.splice(idx, 1);
          } else if (entry.data && typeof entry.data === 'object') {
            if (idx !== -1) list[idx] = entry.data;
            else list.unshift(entry.data);
          }
        }
      }

      async function sincronizarFilaFrotaPendente() {
        const queue = typeof window.getPendingFrotaQueue === 'function' ? window.getPendingFrotaQueue() : [];
        if (!queue.length) {
          if (typeof window.atualizarIndicadorSyncPendente === 'function') window.atualizarIndicadorSyncPendente();
          return true;
        }
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          if (typeof window.atualizarIndicadorSyncPendente === 'function') window.atualizarIndicadorSyncPendente();
          return false;
        }

        const opsPayload = queue.map(item => ({
          colecao: item.colecao,
          op: item.op,
          id: item.id,
          data: item.data,
          updated_at: item.updated_at
        }));

        try {
          const res = await fetch('/api/frota-gastos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ops: opsPayload })
          });
          if (res.ok) {
            try {
              const respJson = await res.json();
              if (respJson && Array.isArray(respJson.results) && Array.isArray(gastosState.galeria)) {
                let atualizouUrl = false;
                for (const r of respJson.results) {
                  if (r && r.colecao === 'galeria' && r.op === 'upsert' && r.id && r.imagem && !String(r.imagem).startsWith('data:')) {
                    const localItem = gastosState.galeria.find(x => _frotaRecId('galeria', x) === String(r.id));
                    if (localItem && localItem.imagem !== r.imagem) {
                      localItem.imagem = r.imagem;
                      if (r.storage_bucket) localItem.storage_bucket = r.storage_bucket;
                      if (r.storage_path) localItem.storage_path = r.storage_path;
                      atualizouUrl = true;
                    }
                  }
                }
                if (atualizouUrl) {
                  salvarGastosLocalStorage();
                  atualizarSnapshotFrota('galeria');
                  if (window.state && window.state.sel && typeof window.renderDrawerFotos === 'function') {
                    window.renderDrawerFotos(window.state.sel);
                  }
                  if (typeof renderGaleriaView === 'function' && ((window.state && window.state.visaoAtual === 'galeria') || (window.__isLazyLoaded && window.__isLazyLoaded('galeria')))) {
                    renderGaleriaView();
                  }
                }
              }
            } catch (parseErr) { }
            if (typeof window.clearFrotaQueueItems === 'function') window.clearFrotaQueueItems(queue);
            return true;
          }
        } catch (e) { }

        // Fallback direto para registros individuais na tabela parametros do Supabase
        try {
          const upserts = [];
          const deletes = [];
          for (const opSpec of opsPayload) {
            const recRowId = 'frota_rec:' + opSpec.colecao + ':' + opSpec.id;
            if (opSpec.op === 'delete') {
              deletes.push(recRowId);
            } else {
              const ts = opSpec.updated_at || new Date().toISOString();
              const rowPayload = (opSpec.data && typeof opSpec.data === 'object' && !Array.isArray(opSpec.data))
                ? { ...opSpec.data, _id: opSpec.id, _updated_at: ts }
                : { _value: opSpec.data, _id: opSpec.id, _updated_at: ts };
              upserts.push({
                id: recRowId,
                valor: Date.now(),
                descricao: JSON.stringify(rowPayload)
              });
            }
          }
          let allOk = true;
          if (upserts.length) {
            const rUp = await fetch(SUPABASE_URL + '/rest/v1/parametros', {
              method: 'POST',
              headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
              body: JSON.stringify(upserts)
            });
            if (!rUp.ok) allOk = false;
          }
          for (const delId of deletes) {
            const rDel = await fetch(SUPABASE_URL + '/rest/v1/parametros?id=eq.' + encodeURIComponent(delId), {
              method: 'DELETE',
              headers: authHeaders()
            });
            if (!rDel.ok) allOk = false;
          }
          if (allOk) {
            if (typeof window.clearFrotaQueueItems === 'function') window.clearFrotaQueueItems(queue);
            return true;
          }
        } catch (e) { }

        if (typeof window.atualizarIndicadorSyncPendente === 'function') window.atualizarIndicadorSyncPendente();
        return false;
      }
      window.sincronizarFilaFrotaPendente = sincronizarFilaFrotaPendente;

      async function salvarRegistroFrota(colecao, op, dataOrId) {
        const opNorm = op === 'delete' ? 'delete' : 'upsert';
        const id = (typeof dataOrId === 'string' || typeof dataOrId === 'number')
          ? String(dataOrId).trim()
          : _frotaRecId(colecao, dataOrId);

        if (colecao === 'historico_manutencoes') {
          if (!gastosState.historico_manutencoes || typeof gastosState.historico_manutencoes !== 'object') {
            gastosState.historico_manutencoes = {};
          }
          if (opNorm === 'delete' && id) delete gastosState.historico_manutencoes[id];
          else if (id && dataOrId !== undefined) gastosState.historico_manutencoes[id] = dataOrId;
        } else if (Array.isArray(gastosState[colecao]) && id) {
          const idx = gastosState[colecao].findIndex(x => _frotaRecId(colecao, x) === id);
          if (opNorm === 'delete') {
            if (idx !== -1) gastosState[colecao].splice(idx, 1);
          } else if (dataOrId && typeof dataOrId === 'object') {
            const rec = { ...dataOrId, updated_at: dataOrId.updated_at || new Date().toISOString() };
            if (idx !== -1) gastosState[colecao][idx] = rec;
            else gastosState[colecao].unshift(rec);
            dataOrId = rec;
          }
        }

        if (typeof window.enqueueFrotaRecordOp === 'function') {
          window.enqueueFrotaRecordOp(colecao, opNorm, opNorm === 'delete' ? id : dataOrId);
        }
        salvarGastosLocalStorage();
        atualizarSnapshotFrota(colecao);
        return sincronizarFilaFrotaPendente();
      }
      window.salvarRegistroFrota = salvarRegistroFrota;

      function aplicarPayloadServidorFrota(data) {
        if (!data || typeof data !== 'object') return false;
        let mudou = false;
        if (Array.isArray(data.produtos) && data.produtos.length) {
          gastosState.produtos = data.produtos;
          garantirCodigosProdutos();
          mudou = true;
        }
        if (Array.isArray(data.lancamentos) && (data.lancamentos.length || !gastosState.lancamentos.length)) {
          gastosState.lancamentos = data.lancamentos;
          mudou = true;
        }
        if (data.historico_manutencoes && typeof data.historico_manutencoes === 'object') {
          gastosState.historico_manutencoes = { ...gastosState.historico_manutencoes, ...data.historico_manutencoes };
          mudou = true;
        }
        if (Array.isArray(data.galeria) && (data.galeria.length || !gastosState.galeria.length)) {
          gastosState.galeria = data.galeria;
          mudou = true;
        }
        if (Array.isArray(data.veiculos) && (data.veiculos.length || !gastosState.veiculos.length)) {
          gastosState.veiculos = data.veiculos;
          mudou = true;
        }
        if (Array.isArray(data.ocorrencias) && (data.ocorrencias.length || !gastosState.ocorrencias.length)) {
          gastosState.ocorrencias = data.ocorrencias;
          mudou = true;
        }
        if (Array.isArray(data.agendamentos) && (data.agendamentos.length || !gastosState.agendamentos.length)) {
          gastosState.agendamentos = data.agendamentos;
          mudou = true;
        }
        if (Array.isArray(data.vendedores_rotas) && (data.vendedores_rotas.length || !gastosState.vendedores_rotas.length)) {
          gastosState.vendedores_rotas = data.vendedores_rotas;
          mudou = true;
        }
        if (data.permissoes && typeof data.permissoes === 'object') {
          if (!window.state) window.state = {};
          window.state.permissoes = { ...(window.state.permissoes || {}), ...data.permissoes };
          try { localStorage.setItem('gomex_permissoes_v1', JSON.stringify(window.state.permissoes)); } catch (e) { }
          if (typeof carregarPermissoesIniciais === 'function') carregarPermissoesIniciais();
          if (typeof aplicarPermissoesUi === 'function') aplicarPermissoesUi();
          if (typeof atualizarBadgeSyncSupabaseAdmin === 'function' && (window.state.visaoAtual === 'admin' || (window.__isLazyLoaded && window.__isLazyLoaded('admin')))) {
            atualizarBadgeSyncSupabaseAdmin(true);
          }
          if (typeof renderAdminPermissoes === 'function' && window.state.visaoAtual === 'admin') renderAdminPermissoes();
        }
          if (window.state && window.state.sel && typeof window.renderDrawerFotos === 'function') {
            window.renderDrawerFotos(window.state.sel);
          }
          return mudou;
        }

      let _lastFrotaPullTs = 0;
      let _frotaPullPromise = null;

      async function sincronizarGastosComServidor(modo = 'pull', opts = {}) {
        if (modo === 'pull') {
          const minIntervalMs = Number(opts && opts.minIntervalMs) || 0;
          if (minIntervalMs > 0 && _lastFrotaPullTs && (Date.now() - _lastFrotaPullTs) < minIntervalMs) {
            return true;
          }
          if (_frotaPullPromise) return _frotaPullPromise;
          _frotaPullPromise = _executarPullFrotaServidor().finally(() => {
            _frotaPullPromise = null;
          });
          return _frotaPullPromise;
        }
        return _executarPushFrotaServidor();
      }

      async function _executarPullFrotaServidor() {
        // Antes de puxar dados novos do servidor, tenta despachar operações pendentes offline
        if (typeof window.getPendingFrotaQueue === 'function' && window.getPendingFrotaQueue().length) {
          await sincronizarFilaFrotaPendente();
        }
        try {
          const res = await fetch('/api/frota-gastos', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data && data.ok !== false) {
              _lastFrotaPullTs = Date.now();
              const mudou = aplicarPayloadServidorFrota(data);
              atualizarSnapshotFrota();
              aplicarPendentesFrotaLocais();
              if (window.state && window.state.sel && typeof window.renderDrawerFotos === 'function') {
                window.renderDrawerFotos(window.state.sel);
              }
              if (mudou) {
                salvarGastosLocalStorage();
                if (typeof aplicarVendedoresRotas === 'function') aplicarVendedoresRotas();
                renderGastosView();
                if (typeof renderGaleriaView === 'function' && ((window.state && window.state.visaoAtual === 'galeria') || (window.__isLazyLoaded && window.__isLazyLoaded('galeria')))) {
                  renderGaleriaView();
                }
                if (typeof atualizarPaineisFrota === 'function') atualizarPaineisFrota();
                if (typeof renderOcorrenciasView === 'function') renderOcorrenciasView();
                if (typeof renderAgendamentosView === 'function') renderAgendamentosView();
                if (typeof renderVendedoresView === 'function' && window.state && window.state.visaoAtual === 'vendedores') {
                  renderVendedoresView();
                }
              }
              return true;
            }
          }
        } catch (e) { }

        // Fallback direto no Supabase (tabela parametros + registros granulares)
        try {
          const r = await fetch(SUPABASE_URL + '/rest/v1/parametros?or=(id.in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1,frota_ocorrencias_v1,frota_agendamentos_servicos_v1,frota_vendedores_rotas_v1,frota_permissoes_usuarios_v1,frota_tombstones_v2),id.like.frota_rec%3A*)&select=*', {
            headers: authHeaders(),
            cache: 'no-store'
          });
          if (r.ok) {
            const rows = await r.json();
            if (Array.isArray(rows) && rows.length) {
              const legacyIdMap = {
                frota_catalogo_produtos_v1: 'produtos',
                frota_lancamentos_gastos_v1: 'lancamentos',
                frota_historico_manutencoes_v1: 'historico_manutencoes',
                frota_galeria_veiculos_v1: 'galeria',
                frota_cadastro_veiculos_v1: 'veiculos',
                frota_ocorrencias_v1: 'ocorrencias',
                frota_agendamentos_servicos_v1: 'agendamentos',
                frota_vendedores_rotas_v1: 'vendedores_rotas'
              };
              const mergedPayload = {};
              const recRows = [];
              let tombstones = {};
              for (const row of rows) {
                if (!row || !row.id) continue;
                if (row.id === 'frota_permissoes_usuarios_v1' && row.descricao) {
                  try { mergedPayload.permissoes = JSON.parse(row.descricao); } catch (e) { }
                  continue;
                }
                if (row.id === 'frota_tombstones_v2' && row.descricao) {
                  try { tombstones = JSON.parse(row.descricao) || {}; } catch (e) { }
                  continue;
                }
                if (row.id.startsWith('frota_rec:')) {
                  recRows.push(row);
                  continue;
                }
                const colName = legacyIdMap[row.id];
                if (colName && row.descricao) {
                  try { mergedPayload[colName] = JSON.parse(row.descricao); } catch (e) { }
                }
              }
              for (const rr of recRows) {
                try {
                  const parsed = JSON.parse(rr.descricao || '{}');
                  const parts = String(rr.id || '').split(':');
                  const col = parsed.colecao || parts[1];
                  const id = String(parsed._id || parsed.id || parts.slice(2).join(':'));
                  const val = Object.prototype.hasOwnProperty.call(parsed, '_value')
                    ? parsed._value
                    : (Object.prototype.hasOwnProperty.call(parsed, 'data') && parsed.colecao ? parsed.data : parsed);
                  if (!col || !id) continue;
                  if (col === 'historico_manutencoes') {
                    if (!mergedPayload[col] || typeof mergedPayload[col] !== 'object') mergedPayload[col] = {};
                    if (val !== undefined) mergedPayload[col][id] = val;
                  } else if (val && typeof val === 'object') {
                    if (!Array.isArray(mergedPayload[col])) mergedPayload[col] = [];
                    const idx = mergedPayload[col].findIndex(x => _frotaRecId(col, x) === id);
                    if (idx !== -1) mergedPayload[col][idx] = val;
                    else mergedPayload[col].unshift(val);
                  }
                } catch (e) { }
              }
              for (const [col, tMap] of Object.entries(tombstones || {})) {
                if (!tMap || typeof tMap !== 'object') continue;
                if (col === 'historico_manutencoes' && mergedPayload[col]) {
                  for (const id of Object.keys(tMap)) delete mergedPayload[col][id];
                } else if (Array.isArray(mergedPayload[col])) {
                  mergedPayload[col] = mergedPayload[col].filter(x => !tMap[_frotaRecId(col, x)]);
                }
              }
              if (Array.isArray(mergedPayload.galeria)) {
                mergedPayload.galeria.sort((a, b) => {
                  const ta = Number(a && a.created_ts) || Date.parse((a && (a.updated_at || a._updated_at || a.data)) || '') || 0;
                  const tb = Number(b && b.created_ts) || Date.parse((b && (b.updated_at || b._updated_at || b.data)) || '') || 0;
                  if (tb !== ta) return tb - ta;
                  return String((b && b.data) || '').localeCompare(String((a && a.data) || ''));
                });
              }
              _lastFrotaPullTs = Date.now();
              aplicarPayloadServidorFrota(mergedPayload);
              atualizarSnapshotFrota();
              aplicarPendentesFrotaLocais();
              salvarGastosLocalStorage();
              if (typeof aplicarVendedoresRotas === 'function') aplicarVendedoresRotas();
              renderGastosView();
              if (typeof renderGaleriaView === 'function' && ((window.state && window.state.visaoAtual === 'galeria') || (window.__isLazyLoaded && window.__isLazyLoaded('galeria')))) {
                renderGaleriaView();
              }
              if (typeof atualizarPaineisFrota === 'function') atualizarPaineisFrota();
              if (typeof renderOcorrenciasView === 'function') renderOcorrenciasView();
              if (typeof renderAgendamentosView === 'function') renderAgendamentosView();
              if (typeof renderVendedoresView === 'function' && window.state && window.state.visaoAtual === 'vendedores') {
                renderVendedoresView();
              }
              return true;
            }
          }
        } catch (e) { }
        return false;
      }

      async function _executarPushFrotaServidor() {
        // DIRETRIZ PERMANENTE: PUSH granular por registro alterado (PROIBIDO sobrescrever frota_galeria_veiculos_v1 inteiro).
        const ops = diffFrotaSnapshotOps();
        if (typeof window.enqueueFrotaRecordOp === 'function') {
          for (const opSpec of ops) {
            window.enqueueFrotaRecordOp(opSpec.colecao, opSpec.op, opSpec.op === 'delete' ? opSpec.id : opSpec.data);
          }
        }
        salvarGastosLocalStorage();
        atualizarSnapshotFrota();
        return sincronizarFilaFrotaPendente();
      }

      carregarGastosLocalStorage();
      atualizarSnapshotFrota();
      aplicarPendentesFrotaLocais();
      window.sincronizarGastosComServidor = sincronizarGastosComServidor;
      window.atualizarSnapshotFrota = atualizarSnapshotFrota;
      window.salvarGastosLocalStorage = salvarGastosLocalStorage;
      setTimeout(() => sincronizarGastosComServidor('pull'), 400);

      function badgeCategoriaProduto(cat) {
        const c = String(cat || 'Outros');
        let cls = '';
        if (c.includes('Óleo')) cls = ' oleo';
        else if (c.includes('Pneu')) cls = ' pneu';
        else if (c.includes('Serviço') || c.includes('Mão')) cls = ' servico';
        else if (c.includes('Peça') || c.includes('Filtro') || c.includes('Freio')) cls = ' peca';
        return '<span class="badge-cat-prod' + cls + '">' + esc(c) + '</span>';
      }
      window.fmtMoeda = fmtMoeda;
      window.parseNumeroMoeda = parseNumeroMoeda;
      window.garantirCodigosProdutos = garantirCodigosProdutos;
      window.sugerirProximoCodigoProduto = sugerirProximoCodigoProduto;
      window.badgeCategoriaProduto = badgeCategoriaProduto;

      function obterInfoPlacaNaFrota(placaRaw) {
        const p = (placaRaw || '').toUpperCase().trim();
        if (!p) return { placa: '', veiculo: '', motorista: '', km: '' };
        const vistoriasPlaca = state.all
          .filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === p)
          .sort((a, b) => ((b.data || '') + ' ' + (b.hora || '')).localeCompare((a.data || '') + ' ' + (a.hora || '')));
        if (vistoriasPlaca.length) {
          const rec = vistoriasPlaca[0];
          const veic = rec.veiculo === 'Outro' ? (rec.veiculo_outro || 'Outro') : (rec.veiculo || '');
          return {
            placa: p,
            veiculo: veic,
            motorista: rec.motorista || '',
            km: rec.km || ''
          };
        }
        const lancAnt = gastosState.lancamentos.find(g => (g.placa || '').toUpperCase().trim() === p);
        if (lancAnt) {
          return {
            placa: p,
            veiculo: lancAnt.veiculo || '',
            motorista: lancAnt.motorista || '',
            km: lancAnt.km || ''
          };
        }
        const fotoAnt = (gastosState.galeria || []).find(f => (f.placa || '').toUpperCase().trim() === p);
        if (fotoAnt) {
          return {
            placa: p,
            veiculo: fotoAnt.veiculo || '',
            motorista: fotoAnt.motorista || '',
            km: fotoAnt.km || ''
          };
        }
        const cadAnt = (gastosState.veiculos || []).find(v => (v.placa || '').toUpperCase().trim() === p);
        if (cadAnt) {
          return { placa: p, veiculo: cadAnt.modelo || '', motorista: cadAnt.motorista || '', km: cadAnt.km_inicial || '' };
        }
        return { placa: p, veiculo: '', motorista: '', km: '' };
      }

      function obterTodasPlacasConhecidas() {
        const map = new Map();
        (gastosState.veiculos || []).forEach(v => {
          const p = (v.placa || '').toUpperCase().trim();
          if (!p || v.ativo === false) return;
          map.set(p, { placa: p, veiculo: v.modelo || '', motorista: v.motorista || '' });
        });
        state.all.forEach(x => {
          if (x.status === 'inativo') return;
          const p = (x.placa || '').toUpperCase().trim();
          if (!p) return;
          if (!map.has(p)) {
            const veic = x.veiculo === 'Outro' ? (x.veiculo_outro || 'Outro') : (x.veiculo || '');
            map.set(p, { placa: p, veiculo: veic, motorista: x.motorista || '' });
          }
        });
        gastosState.lancamentos.forEach(g => {
          const p = (g.placa || '').toUpperCase().trim();
          if (!p) return;
          if (!map.has(p)) {
            map.set(p, { placa: p, veiculo: g.veiculo || '', motorista: g.motorista || '' });
          }
        });
        (gastosState.galeria || []).forEach(f => {
          const p = (f.placa || '').toUpperCase().trim();
          if (!p) return;
          if (!map.has(p)) {
            map.set(p, { placa: p, veiculo: f.veiculo || '', motorista: f.motorista || '' });
          }
        });
        return Array.from(map.values()).sort((a, b) => a.placa.localeCompare(b.placa));
      }

      function obterTodosMotoristasConhecidos() {
        const set = new Set(['Hendreo']);
        (gastosState.veiculos || []).forEach(v => {
          const m = (v.motorista || '').trim();
          if (m) set.add(m);
        });
        state.all.forEach(x => {
          if (x.status === 'inativo') return;
          const m = (x.motorista || '').trim();
          if (m) set.add(m);
        });
        gastosState.lancamentos.forEach(g => {
          const m = (g.motorista || '').trim();
          if (m) set.add(m);
        });
        (gastosState.galeria || []).forEach(f => {
          const m = (f.motorista || '').trim();
          if (m) set.add(m);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      }
      window.obterInfoPlacaNaFrota = obterInfoPlacaNaFrota;
      window.obterTodasPlacasConhecidas = obterTodasPlacasConhecidas;
      window.obterTodosMotoristasConhecidos = obterTodosMotoristasConhecidos;

      // --- FILTROS DE DATA (LEVANTAMENTO DE X ATÉ Y) ---
      function aplicarPeriodoGastos(tipo) {
        gastosState.periodoQuick = tipo;
        const hoje = new Date();
        const hojeIso = isoLocal(hoje);
        let ini = '';
        let fim = '';

        if (tipo === 'hoje') {
          ini = hojeIso;
          fim = hojeIso;
        } else if (tipo === 'mes_atual') {
          ini = hojeIso.slice(0, 7) + '-01';
          fim = hojeIso;
        } else if (tipo === 'mes_passado') {
          const dMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          const dFimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
          ini = isoLocal(dMesAnt);
          fim = isoLocal(dFimMesAnt);
        } else if (tipo === '30dias') {
          ini = isoLocal(new Date(Date.now() - 30 * 864e5));
          fim = hojeIso;
        } else if (tipo === '90dias') {
          ini = isoLocal(new Date(Date.now() - 90 * 864e5));
          fim = hojeIso;
        } else if (tipo === 'ano_atual') {
          ini = hoje.getFullYear() + '-01-01';
          fim = hojeIso;
        }

        gastosState.dataInicio = ini;
        gastosState.dataFim = fim;
        if ($('gastoDataInicio')) $('gastoDataInicio').value = ini;
        if ($('gastoDataFim')) $('gastoDataFim').value = fim;

        document.querySelectorAll('.pill-period').forEach(b => {
          b.classList.toggle('active', b.dataset.per === tipo);
        });
        renderGastosView();
      }
      window.aplicarPeriodoGastos = aplicarPeriodoGastos;

      function onFiltroGastosDataManual() {
        gastosState.dataInicio = $('gastoDataInicio').value || '';
        gastosState.dataFim = $('gastoDataFim').value || '';
        gastosState.periodoQuick = (gastosState.dataInicio || gastosState.dataFim) ? 'custom' : 'todos';
        document.querySelectorAll('.pill-period').forEach(b => {
          b.classList.toggle('active', b.dataset.per === gastosState.periodoQuick);
        });
        renderGastosView();
      }
      window.onFiltroGastosDataManual = onFiltroGastosDataManual;

      function onFiltroGastosChange() {
        gastosState.busca = ($('gastoFiltroBusca')?.value || '').trim();
        gastosState.placa = $('gastoFiltroPlaca')?.value || '';
        gastosState.motorista = $('gastoFiltroMotorista')?.value || '';
        gastosState.categoria = $('gastoFiltroCategoria')?.value || '';
        renderGastosView();
      }
      window.onFiltroGastosChange = onFiltroGastosChange;

      function limparFiltrosGastos() {
        gastosState.busca = '';
        gastosState.placa = '';
        gastosState.motorista = '';
        gastosState.categoria = '';
        if ($('gastoFiltroBusca')) $('gastoFiltroBusca').value = '';
        if ($('gastoFiltroPlaca')) $('gastoFiltroPlaca').value = '';
        if ($('gastoFiltroMotorista')) $('gastoFiltroMotorista').value = '';
        if ($('gastoFiltroCategoria')) $('gastoFiltroCategoria').value = '';
        aplicarPeriodoGastos('todos');
      }
      window.limparFiltrosGastos = limparFiltrosGastos;

      function alternarAbaGastos(aba) {
        gastosState.aba = aba;
        document.querySelectorAll('#gastosSubTabs .tab').forEach(t => {
          t.setAttribute('aria-pressed', String(t.dataset.gtab === aba));
        });
        renderGastosView();
      }
      window.alternarAbaGastos = alternarAbaGastos;

      function irParaGastosDaPlaca(placa) {
        const p = (placa || '').toUpperCase().trim();
        alternarVisaoPrincipal('gastos');
        gastosState.placa = p;
        gastosState.aba = 'lancamentos';
        document.querySelectorAll('#gastosSubTabs .tab').forEach(t => {
          t.setAttribute('aria-pressed', String(t.dataset.gtab === 'lancamentos'));
        });
        renderGastosView();
        if ($('gastoFiltroPlaca')) $('gastoFiltroPlaca').value = p;
      }
      window.irParaGastosDaPlaca = irParaGastosDaPlaca;

      function irParaGastosDoMotorista(mot) {
        alternarVisaoPrincipal('gastos');
        gastosState.motorista = mot || '';
        gastosState.aba = 'lancamentos';
        document.querySelectorAll('#gastosSubTabs .tab').forEach(t => {
          t.setAttribute('aria-pressed', String(t.dataset.gtab === 'lancamentos'));
        });
        renderGastosView();
        if ($('gastoFiltroMotorista')) $('gastoFiltroMotorista').value = mot || '';
      }
      window.irParaGastosDoMotorista = irParaGastosDoMotorista;

      function obterLancamentosFiltradosGastos() {
        const q = (gastosState.busca || '').toLowerCase();
        const qNorm = norm(q);
        const dIni = gastosState.dataInicio;
        const dFim = gastosState.dataFim;

        return gastosState.lancamentos.filter(g => {
          const dt = String(g.data || '').split('T')[0];
          if (dIni && dt && dt < dIni) return false;
          if (dFim && dt && dt > dFim) return false;
          if (gastosState.placa && (g.placa || '').toUpperCase().trim() !== gastosState.placa.toUpperCase().trim()) return false;
          if (gastosState.motorista && (g.motorista || '').trim().toLowerCase() !== gastosState.motorista.trim().toLowerCase()) return false;
          if (gastosState.categoria && (g.categoria || '') !== gastosState.categoria) return false;
          if (q) {
            const hay = [
              g.placa, g.veiculo, g.motorista, g.produto_nome, g.categoria,
              g.fornecedor, g.nf_os, g.obs
            ].join(' ').toLowerCase();
            if (!hay.includes(q) && !(qNorm && norm(hay).includes(qNorm))) return false;
          }
          return true;
        }).sort((a, b) => {
          const da = String(a.data || '');
          const db = String(b.data || '');
          if (db !== da) return db.localeCompare(da);
          return (Number(b.created_ts) || 0) - (Number(a.created_ts) || 0);
        });
      }

      function popularSelectsFiltroGastos() {
        const selPlaca = $('gastoFiltroPlaca');
        if (selPlaca) {
          const placas = obterTodasPlacasConhecidas();
          const sig = placas.map(x => x.placa).join('|');
          if (selPlaca.dataset.sig !== sig) {
            selPlaca.dataset.sig = sig;
            selPlaca.innerHTML = '<option value="">Todas as placas (' + placas.length + ')</option>' +
              placas.map(x => '<option value="' + esc(x.placa) + '">' + esc(x.placa) + (x.veiculo ? ' · ' + esc(x.veiculo) : '') + '</option>').join('');
          }
          selPlaca.value = gastosState.placa;
        }

        const selMot = $('gastoFiltroMotorista');
        if (selMot) {
          const mots = obterTodosMotoristasConhecidos();
          const sigM = mots.join('|');
          if (selMot.dataset.sig !== sigM) {
            selMot.dataset.sig = sigM;
            selMot.innerHTML = '<option value="">Todos os responsáveis (' + mots.length + ')</option>' +
              mots.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('');
          }
          selMot.value = gastosState.motorista;
        }
      }

      function renderGastosView() {
        if ($('badgeCountProdutos')) $('badgeCountProdutos').textContent = gastosState.produtos.length;
        popularSelectsFiltroGastos();

        const temFiltroAtivo = Boolean(
          gastosState.busca || gastosState.placa || gastosState.motorista ||
          gastosState.categoria || gastosState.dataInicio || gastosState.dataFim
        );
        if ($('btnLimparFiltrosGastos')) $('btnLimparFiltrosGastos').hidden = !temFiltroAtivo;

        const filtrados = obterLancamentosFiltradosGastos();

        // Cálculo dos KPIs do período filtrado
        let totalRS = 0;
        let totalLitros = 0;
        let totalOleoRS = 0;
        let totalPecasQtd = 0;
        const placasMap = new Map();
        const motoristasMap = new Map();
        const produtosMap = new Map();

        filtrados.forEach(g => {
          const val = Number(g.valor_total) || 0;
          const qtd = Number(g.quantidade) || 0;
          const unid = g.unidade || 'un';
          const cat = g.categoria || 'Outros';
          const placa = (g.placa || 'SEM PLACA').toUpperCase().trim();
          const mot = (g.motorista || 'Não informado').trim();
          const prodNome = (g.produto_nome || 'Item').trim();

          totalRS += val;

          if (unid === 'L' || cat.includes('Óleo')) {
            if (unid === 'L') totalLitros += qtd;
            totalOleoRS += val;
          } else {
            totalPecasQtd += qtd;
          }

          // Agregação por Placa
          if (!placasMap.has(placa)) {
            const infoP = obterInfoPlacaNaFrota(placa);
            placasMap.set(placa, {
              placa,
              veiculo: g.veiculo || infoP.veiculo || '—',
              motoristaRecente: mot || infoP.motorista || '—',
              lancamentosCount: 0,
              litrosOleo: 0,
              pecasQtd: 0,
              itensResumo: new Set(),
              motoristasSet: new Set(),
              custoPecas: 0,
              custoManutOS: 0,
              ultimaData: g.data || ''
            });
          }
          const pRec = placasMap.get(placa);
          pRec.lancamentosCount++;
          pRec.custoPecas += val;
          if (unid === 'L') pRec.litrosOleo += qtd;
          else pRec.pecasQtd += qtd;
          pRec.itensResumo.add(prodNome + ' (' + qtd + ' ' + unid + ')');
          if (mot) pRec.motoristasSet.add(mot);
          if (g.data && (!pRec.ultimaData || g.data > pRec.ultimaData)) {
            pRec.ultimaData = g.data;
            if (mot) pRec.motoristaRecente = mot;
          }

          // Agregação por Motorista (Quem Gastou)
          const motKey = mot.toLowerCase();
          if (!motoristasMap.has(motKey)) {
            motoristasMap.set(motKey, {
              motorista: mot,
              placasSet: new Set(),
              lancamentosCount: 0,
              litrosOleo: 0,
              itensResumo: new Set(),
              totalGasto: 0,
              ultimaData: g.data || ''
            });
          }
          const mRec = motoristasMap.get(motKey);
          mRec.lancamentosCount++;
          mRec.totalGasto += val;
          if (placa) mRec.placasSet.add(placa);
          if (unid === 'L') mRec.litrosOleo += qtd;
          mRec.itensResumo.add(prodNome + ' (' + qtd + ' ' + unid + ')');
          if (g.data && (!mRec.ultimaData || g.data > mRec.ultimaData)) mRec.ultimaData = g.data;

          // Agregação por Produto / Peça
          const prodKey = prodNome.toLowerCase();
          if (!produtosMap.has(prodKey)) {
            produtosMap.set(prodKey, {
              produto_nome: prodNome,
              categoria: cat,
              unidade: unid,
              lancamentosCount: 0,
              quantidadeTotal: 0,
              placasSet: new Set(),
              valorTotal: 0
            });
          }
          const prRec = produtosMap.get(prodKey);
          prRec.lancamentosCount++;
          prRec.quantidadeTotal += qtd;
          prRec.valorTotal += val;
          if (placa) prRec.placasSet.add(placa);
        });

        // Incluir também custos de O.S. da aba de Manutenção nas placas (se dentro do filtro)
        let totalManutOSPeriodo = 0;
        state.all.forEach(it => {
          if (it.status === 'inativo') return;
          const m = getManutencaoData(it);
          if (!m || !m.custo) return;
          const custoOS = parseNumeroMoeda(m.custo);
          if (custoOS <= 0) return;
          const dtM = m.entrada || it.data || '';
          if (gastosState.dataInicio && dtM && dtM < gastosState.dataInicio) return;
          if (gastosState.dataFim && dtM && dtM > gastosState.dataFim) return;
          const p = (it.placa || '').toUpperCase().trim();
          if (gastosState.placa && p !== gastosState.placa.toUpperCase().trim()) return;
          if (gastosState.motorista && (it.motorista || '').trim().toLowerCase() !== gastosState.motorista.trim().toLowerCase()) return;

          totalManutOSPeriodo += custoOS;
          if (p) {
            if (!placasMap.has(p)) {
              placasMap.set(p, {
                placa: p,
                veiculo: it.veiculo || '—',
                motoristaRecente: it.motorista || '—',
                lancamentosCount: 0,
                litrosOleo: 0,
                pecasQtd: 0,
                itensResumo: new Set(),
                motoristasSet: new Set(it.motorista ? [it.motorista] : []),
                custoPecas: 0,
                custoManutOS: 0,
                ultimaData: dtM
              });
            }
            placasMap.get(p).custoManutOS += custoOS;
          }
        });

        const listaPorVeiculo = Array.from(placasMap.values()).sort((a, b) => (b.custoPecas + b.custoManutOS) - (a.custoPecas + a.custoManutOS));
        const listaPorMotorista = Array.from(motoristasMap.values()).sort((a, b) => b.totalGasto - a.totalGasto);
        const listaPorProduto = Array.from(produtosMap.values()).sort((a, b) => b.valorTotal - a.valorTotal);

        // Atualizar KPIs
        if ($('gastoStatTotalRS')) $('gastoStatTotalRS').textContent = fmtMoeda(totalRS);
        if ($('gastoStatTotalSub')) {
          $('gastoStatTotalSub').textContent = filtrados.length + (filtrados.length === 1 ? ' item lançado' : ' itens lançados') +
            (totalManutOSPeriodo > 0 ? ' (+ ' + fmtMoeda(totalManutOSPeriodo) + ' em O.S.)' : '');
        }
        if ($('gastoStatLitros')) {
          $('gastoStatLitros').textContent = (Number.isInteger(totalLitros) ? totalLitros : totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) + ' L';
        }
        if ($('gastoStatLitrosSub')) $('gastoStatLitrosSub').textContent = fmtMoeda(totalOleoRS) + ' em óleo/lubrificantes';
        if ($('gastoStatPecasQtd')) {
          $('gastoStatPecasQtd').textContent = (Number.isInteger(totalPecasQtd) ? totalPecasQtd : totalPecasQtd.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) + ' un';
        }
        if ($('gastoStatPecasSub')) $('gastoStatPecasSub').textContent = listaPorVeiculo.length + (listaPorVeiculo.length === 1 ? ' veículo atendido' : ' veículos atendidos');

        if (listaPorVeiculo.length > 0) {
          const topV = listaPorVeiculo[0];
          if ($('gastoStatTopPlaca')) $('gastoStatTopPlaca').textContent = topV.placa;
          if ($('gastoStatTopPlacaSub')) $('gastoStatTopPlacaSub').textContent = fmtMoeda(topV.custoPecas + topV.custoManutOS) + ' (' + topV.veiculo + ')';
        } else {
          if ($('gastoStatTopPlaca')) $('gastoStatTopPlaca').textContent = '–';
          if ($('gastoStatTopPlacaSub')) $('gastoStatTopPlacaSub').textContent = 'Sem gastos no período';
        }

        if (listaPorMotorista.length > 0) {
          const topM = listaPorMotorista[0];
          if ($('gastoStatTopMotorista')) $('gastoStatTopMotorista').textContent = topM.motorista;
          if ($('gastoStatTopMotoristaSub')) $('gastoStatTopMotoristaSub').textContent = fmtMoeda(topM.totalGasto) + ' em ' + topM.lancamentosCount + (topM.lancamentosCount === 1 ? ' item' : ' itens');
        } else {
          if ($('gastoStatTopMotorista')) $('gastoStatTopMotorista').textContent = '–';
          if ($('gastoStatTopMotoristaSub')) $('gastoStatTopMotoristaSub').textContent = 'Sem gastos no período';
        }

        // Contadores das abas
        if ($('cntGastosLanc')) $('cntGastosLanc').textContent = filtrados.length;
        if ($('cntGastosVeic')) $('cntGastosVeic').textContent = listaPorVeiculo.length;
        if ($('cntGastosMot')) $('cntGastosMot').textContent = listaPorMotorista.length;
        if ($('cntGastosProd')) $('cntGastosProd').textContent = listaPorProduto.length;

        const thead = $('gastosTableHead');
        const tbody = $('gastosTableBody');
        if (!thead || !tbody) return;

        // Renderização conforme a aba ativa
        if (gastosState.aba === 'lancamentos') {
          thead.innerHTML = '<tr>' +
            '<th style="width:105px">Data</th>' +
            '<th style="width:135px">Placa / Veículo</th>' +
            '<th style="width:170px">Quem Gastou / Resp.</th>' +
            '<th>Produto / Peça / Óleo</th>' +
            '<th style="width:110px">Qtd. / Unid.</th>' +
            '<th style="width:115px">Valor Unit.</th>' +
            '<th style="width:125px">Valor Total</th>' +
            '<th style="width:150px">Fornecedor / NF</th>' +
            '<th style="width:105px;text-align:right">Ações</th>' +
            '</tr>';

          if (!filtrados.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty">' +
              '<div class="empty-icon-wrap">' + icon('wallet') + '</div>' +
              '<h2>Nenhum gasto ou peça lançado neste período</h2>' +
              '<p>Clique em <strong>"Lançar Gasto no Veículo"</strong> para registrar peças, litros de óleo ou serviços em uma placa da frota.</p>' +
              '<div class="empty-action">' +
              '<button type="button" class="btn btn-primary" onclick="abrirModalLancarGasto()">' +
              icon('plus') + ' <span>Lançar Primeiro Gasto / Peça</span>' +
              '</button>' +
              '</div>' +
              '</td></tr>';
          } else {
            tbody.innerHTML = filtrados.map(g => {
              const qtdFmt = Number.isInteger(Number(g.quantidade)) ? g.quantidade : Number(g.quantidade).toLocaleString('pt-BR');
              return '<tr>' +
                '<td><span class="t1">' + formatarData(g.data) + '</span></td>' +
                '<td>' +
                '<div class="stack">' +
                '<button type="button" class="plate" onclick="abrirHistoricoVeiculo(\'' + esc(g.placa) + '\')" title="Ver histórico desta placa">' + esc(g.placa) + '</button>' +
                '<span class="t2">' + esc(g.veiculo || '—') + '</span>' +
                '</div>' +
                '</td>' +
                '<td>' +
                '<div class="stack">' +
                '<span class="t1" style="font-weight:700">' + esc(g.motorista || 'Não informado') + '</span>' +
                (g.km ? '<span class="badge-km">' + fmtKm(g.km) + '</span>' : '<span class="t2">Responsável</span>') +
                '</div>' +
                '</td>' +
                '<td>' +
                '<div class="stack">' +
                '<span class="t1" style="font-weight:700;color:var(--ink)">' + esc(g.produto_nome) + '</span>' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px">' +
                badgeCategoriaProduto(g.categoria) +
                (g.obs ? '<span class="t2" style="color:var(--ink-3)">· ' + esc(g.obs) + '</span>' : '') +
                '</div>' +
                '</div>' +
                '</td>' +
                '<td><strong style="font-size:13px;color:var(--ink)">' + qtdFmt + ' ' + esc(g.unidade || 'un') + '</strong></td>' +
                '<td style="color:var(--ink-2)">' + fmtMoeda(g.valor_unitario) + '</td>' +
                '<td><strong style="font-size:13.5px;color:var(--ok)">' + fmtMoeda(g.valor_total) + '</strong></td>' +
                '<td>' +
                '<div class="stack">' +
                '<span class="t1">' + esc(g.fornecedor || '—') + '</span>' +
                (g.nf_os ? '<span class="t2">NF/OS: ' + esc(g.nf_os) + '</span>' : '') +
                ((Array.isArray(g.anexo_ids) && g.anexo_ids.length)
                  ? '<button type="button" class="btn-anexo-nf" onclick="abrirLightboxFoto(\'' + esc(g.anexo_ids[0]) + '\')" title="Ver foto da nota / comprovante">' + icon('file-text') + ' Ver NF' + (g.anexo_ids.length > 1 ? ' (' + g.anexo_ids.length + ')' : '') + '</button>'
                  : '') +
                '</div>' +
                '</td>' +
                '<td style="text-align:right">' +
                '<div style="display:inline-flex;gap:4px">' +
                '<button type="button" class="btn btn-ghost btn-icon" onclick="editarLancamentoGasto(\'' + esc(g.id) + '\')" title="Editar este lançamento" style="color:var(--accent-hi)">' + icon('edit') + '</button>' +
                '<button type="button" class="btn btn-ghost btn-icon" onclick="excluirLancamentoGasto(\'' + esc(g.id) + '\')" title="Excluir lançamento" style="color:var(--bad)">' + icon('trash') + '</button>' +
                '</div>' +
                '</td>' +
                '</tr>';
            }).join('');
          }
          if ($('gastosFooterInfo')) $('gastosFooterInfo').textContent = filtrados.length + (filtrados.length === 1 ? ' lançamento exibido' : ' lançamentos exibidos');
          if ($('gastosFooterSum')) $('gastosFooterSum').textContent = 'Total investido nos lançamentos: ' + fmtMoeda(totalRS);
        }
        else if (gastosState.aba === 'por_veiculo') {
          thead.innerHTML = '<tr>' +
            '<th style="width:130px">Placa / Veículo</th>' +
            '<th style="width:170px">Motorista / Quem Gastou</th>' +
            '<th style="width:95px">Lançamentos</th>' +
            '<th style="width:110px">Litros de Óleo</th>' +
            '<th>Peças & Itens Aplicados no Período</th>' +
            '<th style="width:130px">Gasto Peças/Óleo</th>' +
            '<th style="width:120px">Custo O.S. Oficina</th>' +
            '<th style="width:135px">Total Investido</th>' +
            '<th style="width:170px;text-align:right">Ações</th>' +
            '</tr>';

          if (!listaPorVeiculo.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty">' +
              '<div class="empty-icon-wrap">' + icon('truck') + '</div>' +
              '<h2>Nenhum investimento por veículo no período</h2>' +
              '<p>Lance peças ou litros de óleo em uma placa para acompanhar o ranking de custos por veículo.</p>' +
              '</td></tr>';
          } else {
            tbody.innerHTML = listaPorVeiculo.map(v => {
              const totalVeic = v.custoPecas + v.custoManutOS;
              const resumoArr = Array.from(v.itensResumo);
              const resumoTxt = resumoArr.length ? resumoArr.slice(0, 4).join(', ') + (resumoArr.length > 4 ? ' (+' + (resumoArr.length - 4) + ')' : '') : 'Apenas O.S. de Oficina';
              const motsTxt = Array.from(v.motoristasSet).join(', ') || v.motoristaRecente;
              return '<tr>' +
                '<td>' +
                '<div class="stack">' +
                '<button type="button" class="plate" onclick="abrirHistoricoVeiculo(\'' + esc(v.placa) + '\')">' + esc(v.placa) + '</button>' +
                '<span class="t2">' + esc(v.veiculo) + '</span>' +
                '</div>' +
                '</td>' +
                '<td><span class="t1" style="font-weight:600">' + esc(motsTxt) + '</span><span class="t2">Último: ' + formatarData(v.ultimaData) + '</span></td>' +
                '<td><strong>' + v.lancamentosCount + '</strong></td>' +
                '<td><span style="color:#fbbf24;font-weight:700">' + (v.litrosOleo > 0 ? v.litrosOleo.toLocaleString('pt-BR') + ' L' : '—') + '</span></td>' +
                '<td style="font-size:12px;color:var(--ink-2);max-width:260px">' + esc(resumoTxt) + '</td>' +
                '<td style="font-weight:700;color:var(--ink)">' + fmtMoeda(v.custoPecas) + '</td>' +
                '<td style="color:var(--ink-2)">' + (v.custoManutOS > 0 ? fmtMoeda(v.custoManutOS) : '—') + '</td>' +
                '<td><strong style="font-size:14px;color:var(--ok)">' + fmtMoeda(totalVeic) + '</strong></td>' +
                '<td style="text-align:right">' +
                '<div style="display:inline-flex;gap:6px">' +
                '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 8px;font-size:11.5px;color:var(--accent-hi)" onclick="irParaGastosDaPlaca(\'' + esc(v.placa) + '\')" title="Filtrar apenas lançamentos desta placa">' +
                icon('search') + ' <span>Extrato</span>' +
                '</button>' +
                '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 8px;font-size:11.5px" onclick="abrirModalLancarGasto(\'' + esc(v.placa) + '\', \'' + esc(v.motoristaRecente) + '\')" title="Lançar nova peça ou óleo nesta placa">' +
                icon('plus') + ' <span>Lançar</span>' +
                '</button>' +
                '</div>' +
                '</td>' +
                '</tr>';
            }).join('');
          }
          if ($('gastosFooterInfo')) $('gastosFooterInfo').textContent = listaPorVeiculo.length + (listaPorVeiculo.length === 1 ? ' veículo com gastos no período' : ' veículos com gastos no período');
          if ($('gastosFooterSum')) $('gastosFooterSum').textContent = 'Investimento Geral (Peças + O.S.): ' + fmtMoeda(totalRS + totalManutOSPeriodo);
        }
        else if (gastosState.aba === 'por_motorista') {
          thead.innerHTML = '<tr>' +
            '<th>Quem Gastou (Motorista / Responsável)</th>' +
            '<th style="width:180px">Veículos (Placas)</th>' +
            '<th style="width:110px">Qtd. Lançamentos</th>' +
            '<th style="width:120px">Litros de Óleo</th>' +
            '<th>O Que Gastou (Peças / Insumos no Período)</th>' +
            '<th style="width:140px">Total Gasto (R$)</th>' +
            '<th style="width:130px;text-align:right">Ação</th>' +
            '</tr>';

          if (!listaPorMotorista.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">' +
              '<div class="empty-icon-wrap">' + icon('user') + '</div>' +
              '<h2>Nenhum registro por motorista neste período</h2>' +
              '<p>Quando houver lançamentos de peças ou óleo, você verá aqui quem gastou e o que gastou.</p>' +
              '</td></tr>';
          } else {
            tbody.innerHTML = listaPorMotorista.map(m => {
              const placasArr = Array.from(m.placasSet);
              const itensArr = Array.from(m.itensResumo);
              const itensTxt = itensArr.slice(0, 5).join(', ') + (itensArr.length > 5 ? ' (+' + (itensArr.length - 5) + ')' : '');
              return '<tr>' +
                '<td>' +
                '<div style="display:flex;align-items:center;gap:10px">' +
                '<div class="vend-avatar">' + esc(getIniciaisNome(m.motorista)) + '</div>' +
                '<div>' +
                '<div style="font-weight:700;color:var(--ink);font-size:13px">' + esc(m.motorista) + '</div>' +
                '<div style="font-size:11px;color:var(--ink-3)">Último gasto: ' + formatarData(m.ultimaData) + '</div>' +
                '</div>' +
                '</div>' +
                '</td>' +
                '<td>' +
                '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
                placasArr.map(p => '<button type="button" class="plate" style="font-size:11px" onclick="irParaGastosDaPlaca(\'' + esc(p) + '\')">' + esc(p) + '</button>').join('') +
                '</div>' +
                '</td>' +
                '<td><strong>' + m.lancamentosCount + '</strong></td>' +
                '<td><span style="color:#fbbf24;font-weight:700">' + (m.litrosOleo > 0 ? m.litrosOleo.toLocaleString('pt-BR') + ' L' : '—') + '</span></td>' +
                '<td style="font-size:12px;color:var(--ink-2);max-width:300px">' + esc(itensTxt) + '</td>' +
                '<td><strong style="font-size:14px;color:var(--ok)">' + fmtMoeda(m.totalGasto) + '</strong></td>' +
                '<td style="text-align:right">' +
                '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 10px;font-size:12px;color:var(--accent-hi)" onclick="irParaGastosDoMotorista(\'' + esc(m.motorista) + '\')">' +
                icon('search') + ' <span>Ver Itens</span>' +
                '</button>' +
                '</td>' +
                '</tr>';
            }).join('');
          }
          if ($('gastosFooterInfo')) $('gastosFooterInfo').textContent = listaPorMotorista.length + ' responsável(is) listado(s)';
          if ($('gastosFooterSum')) $('gastosFooterSum').textContent = 'Total acumulado no período: ' + fmtMoeda(totalRS);
        }
        else if (gastosState.aba === 'por_produto') {
          thead.innerHTML = '<tr>' +
            '<th>Produto / Peça / Óleo</th>' +
            '<th style="width:170px">Categoria</th>' +
            '<th style="width:120px">Aplicações</th>' +
            '<th style="width:140px">Quantidade Total</th>' +
            '<th>Placas em que foi Aplicado</th>' +
            '<th style="width:140px">Valor Total Gasto</th>' +
            '</tr>';

          if (!listaPorProduto.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">' +
              '<div class="empty-icon-wrap">' + icon('box') + '</div>' +
              '<h2>Nenhum produto consumido no período</h2>' +
              '<p>Os produtos e peças lançados aparecerão consolidados aqui por quantidade e valor total.</p>' +
              '</td></tr>';
          } else {
            tbody.innerHTML = listaPorProduto.map(pr => {
              const placasArr = Array.from(pr.placasSet);
              const qtdFmt = Number.isInteger(pr.quantidadeTotal) ? pr.quantidadeTotal : pr.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
              return '<tr>' +
                '<td><strong style="color:var(--ink);font-size:13px">' + esc(pr.produto_nome) + '</strong></td>' +
                '<td>' + badgeCategoriaProduto(pr.categoria) + '</td>' +
                '<td>' + pr.lancamentosCount + 'x</td>' +
                '<td><strong style="font-size:13.5px;color:var(--accent-hi)">' + qtdFmt + ' ' + esc(pr.unidade) + '</strong></td>' +
                '<td>' +
                '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
                placasArr.map(p => '<button type="button" class="plate" style="font-size:11px" onclick="irParaGastosDaPlaca(\'' + esc(p) + '\')">' + esc(p) + '</button>').join('') +
                '</div>' +
                '</td>' +
                '<td><strong style="font-size:14px;color:var(--ok)">' + fmtMoeda(pr.valorTotal) + '</strong></td>' +
                '</tr>';
            }).join('');
          }
          if ($('gastosFooterInfo')) $('gastosFooterInfo').textContent = listaPorProduto.length + ' tipo(s) de produto/peça consumidos';
          if ($('gastosFooterSum')) $('gastosFooterSum').textContent = 'Total investido em produtos: ' + fmtMoeda(totalRS);
        }
      }
      window.renderGastosView = renderGastosView;

      // --- RESUMO DE GASTOS NA GAVETA E NO MODAL DE HISTÓRICO DA PLACA ---
      function carregarGastosPlacaNoDrawer(placa) {
        const p = (placa || '').toUpperCase().trim();
        const listEl = $('maintGastosPlacaList');
        const totEl = $('maintGastosPlacaTotal');
        if (!listEl || !totEl) return;

        const itens = gastosState.lancamentos.filter(g => (g.placa || '').toUpperCase().trim() === p);
        const soma = itens.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
        totEl.textContent = fmtMoeda(soma);

        if (!itens.length) {
          listEl.innerHTML = '<p class="muted" style="font-size:12px;padding:4px 0">Nenhuma peça ou litro de óleo lançado nesta placa ainda.</p>';
          return;
        }

        listEl.innerHTML = itens.slice(0, 8).map(g => {
          return '<div class="maint-history-item" style="border-left-color:var(--accent)">' +
            '<div class="maint-history-head">' +
            '<span style="color:var(--ink)">' + esc(g.produto_nome) + ' (' + esc(g.quantidade) + ' ' + esc(g.unidade || 'un') + ')</span>' +
            '<strong style="color:var(--ok)">' + fmtMoeda(g.valor_total) + '</strong>' +
            '</div>' +
            '<div style="font-size:11.5px;color:var(--ink-2)">' +
            'Data: <strong>' + formatarData(g.data) + '</strong> · Quem gastou: <strong>' + esc(g.motorista || '—') + '</strong>' +
            (g.fornecedor ? ' · ' + esc(g.fornecedor) : '') +
            '</div>' +
            '</div>';
        }).join('');
      }
      window.carregarGastosPlacaNoDrawer = carregarGastosPlacaNoDrawer;

      function renderResumoGastosNoModalHistorico(placa) {
        const p = (placa || '').toUpperCase().trim();
        const itens = gastosState.lancamentos.filter(g => (g.placa || '').toUpperCase().trim() === p);
        const somaPecas = itens.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);

        if ($('histTotalGastoPlaca')) {
          $('histTotalGastoPlaca').textContent = fmtMoeda(somaPecas);
        }

        const listEl = $('histGastosPlacaList');
        if (!listEl) return;
        if (!itens.length) {
          listEl.innerHTML = '<div class="muted" style="padding:4px 0">Nenhuma peça ou óleo lançado para a placa ' + esc(p) + ' até o momento.</div>';
          return;
        }

        listEl.innerHTML = itens.map(g => {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:var(--raised);border-radius:6px;border-left:3px solid var(--accent)">' +
            '<div>' +
            '<strong style="color:var(--ink)">' + esc(g.produto_nome) + '</strong> ' +
            '<span style="color:var(--accent-hi);font-weight:700">(' + esc(g.quantidade) + ' ' + esc(g.unidade || 'un') + ')</span>' +
            '<div style="font-size:11px;color:var(--ink-3)">' + formatarData(g.data) + ' · Resp: <strong>' + esc(g.motorista || '—') + '</strong>' + (g.km ? ' · ' + fmtKm(g.km) : '') + '</div>' +
            '</div>' +
            '<strong style="color:var(--ok);white-space:nowrap">' + fmtMoeda(g.valor_total) + '</strong>' +
            '</div>';
        }).join('');
      }
      window.renderResumoGastosNoModalHistorico = renderResumoGastosNoModalHistorico;

      // ==============================================================================
      // MODAL 1: LANÇAR / EDITAR GASTO, PEÇA OU ÓLEO NO VEÍCULO (POR CÓDIGO OU AUTOCOMPLETE)
      // ==============================================================================
      function popularDatalistEPlacasNoModalGasto() {
        const placas = obterTodasPlacasConhecidas();
        const dlPlacas = $('datalistPlacasFrota');
        if (dlPlacas) {
          dlPlacas.innerHTML = placas.map(x =>
            '<option value="' + esc(x.placa) + '">' + esc(x.veiculo ? x.veiculo + (x.motorista ? ' · ' + x.motorista : '') : '') + '</option>'
          ).join('');
        }

        const dlMot = $('datalistMotoristasFrota');
        if (dlMot) {
          const mots = obterTodosMotoristasConhecidos();
          dlMot.innerHTML = mots.map(m => '<option value="' + esc(m) + '">').join('');
        }
      }
      window.popularDatalistEPlacasNoModalGasto = popularDatalistEPlacasNoModalGasto;

      function onDigitarPlacaNoModalGasto(placaRaw) {
        const p = (placaRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (p.length >= 7) {
          const info = obterInfoPlacaNaFrota(p);
          if (info.veiculo && $('gastoInputVeiculo')) $('gastoInputVeiculo').value = info.veiculo;
          if (info.motorista && $('gastoInputMotorista')) $('gastoInputMotorista').value = info.motorista;
          if (info.km && $('gastoInputKm') && !$('gastoInputKm').value) $('gastoInputKm').value = info.km;
        }
      }
      window.onDigitarPlacaNoModalGasto = onDigitarPlacaNoModalGasto;

      function abrirModalLancarGasto(placaPadrao = '', motoristaPadrao = '', kmPadrao = '') {
        if (!podeEditar('gastos')) {
          mostrarToastBloqueioEdicao('Custos & Peças');
          return;
        }
        const pNorm = (placaPadrao || '').toUpperCase().trim();
        $('gastoEditId').value = '';
        $('modalLancarGastoTitulo').textContent = 'Lançar Gasto / Peça no Veículo';
        $('btnAddMaisItemGasto').hidden = false;

        garantirCodigosProdutos();
        popularDatalistEPlacasNoModalGasto();

        const info = pNorm ? obterInfoPlacaNaFrota(pNorm) : { placa: '', veiculo: '', motorista: '', km: '' };
        $('gastoInputPlaca').value = pNorm;
        $('gastoInputVeiculo').value = info.veiculo || '';
        $('gastoInputData').value = isoLocal(new Date());
        $('gastoInputMotorista').value = motoristaPadrao || info.motorista || ($('userNameLabel')?.textContent || 'Hendreo');
        $('gastoInputKm').value = kmPadrao || info.km || '';
        $('gastoInputNF').value = '';
        $('gastoInputFornecedor').value = '';
        $('gastoInputObs').value = '';

        const primeiroProd = gastosState.produtos[0] || PRODUTOS_PADRAO_FROTA[0];
        gastosState.modalItensDraft = [
          {
            uid: 'item_' + Date.now(),
            produto_id: primeiroProd.id,
            produto_codigo: primeiroProd.codigo || '01',
            produto_nome: primeiroProd.nome,
            categoria: primeiroProd.categoria,
            unidade: primeiroProd.unidade || 'un',
            quantidade: 1,
            valor_unitario: primeiroProd.preco_base || 0
          }
        ];

        toggleCadastroRapidoProdutoInline(false);
        renderItensDraftNoModalGasto();
        gastosState.gastoAnexosDraft = [];
        renderAnexosGastoDraft();
        $('modalLancarGasto').classList.add('open');
      }
      window.abrirModalLancarGasto = abrirModalLancarGasto;

      function fecharModalLancarGasto() {
        fecharTodosMenusSugestaoProd();
        $('modalLancarGasto').classList.remove('open');
      }
      window.fecharModalLancarGasto = fecharModalLancarGasto;

      function gerarHtmlMenuSugestoesProd(idx, termoBusca = '') {
        const q = (termoBusca || '').toLowerCase().trim();
        const qNorm = norm(q);
        const lista = gastosState.produtos.filter(p => {
          if (!q) return true;
          const cod = String(p.codigo || '').toLowerCase();
          const hay = (cod + ' ' + p.nome + ' ' + p.categoria).toLowerCase();
          return hay.includes(q) || (qNorm && norm(hay).includes(qNorm));
        });

        if (!lista.length) {
          return '<div style="padding:10px 12px;font-size:12px;color:var(--ink-3);display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<span>Nenhum produto encontrado com "' + esc(termoBusca) + '"</span>' +
            '<button type="button" class="btn btn-ghost" style="height:24px;padding:0 8px;font-size:11px;color:var(--accent-hi)" onmousedown="event.preventDefault(); toggleCadastroRapidoProdutoInline(true)">+ Cadastrar</button>' +
            '</div>';
        }

        return lista.map(p => {
          const cod = p.codigo || '—';
          return '<div class="prod-suggest-item" onmousedown="event.preventDefault(); selecionarProdutoSugestao(' + idx + ', \'' + esc(p.id) + '\')">' +
            '<div class="prod-suggest-left">' +
            '<span class="prod-code-badge">' + esc(cod) + '</span>' +
            '<span class="prod-suggest-name">' + esc(p.nome) + '</span>' +
            '</div>' +
            '<span class="prod-suggest-meta">' + fmtMoeda(p.preco_base || 0) + ' · ' + esc(p.unidade || 'un') + '</span>' +
            '</div>';
        }).join('');
      }

      function renderItensDraftNoModalGasto() {
        const container = $('gastoItensContainer');
        if (!container) return;
        garantirCodigosProdutos();

        const isSingle = gastosState.modalItensDraft.length <= 1;

        container.innerHTML = gastosState.modalItensDraft.map((item, idx) => {
          const subtotal = (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0);
          const codVal = item.produto_codigo || (gastosState.produtos.find(p => p.id === item.produto_id)?.codigo) || '';
          return '<div class="gasto-item-row' + (isSingle ? ' single-item' : '') + '" data-idx="' + idx + '">' +
            '<div>' +
            '<label class="gasto-field-lbl" style="font-size:11px">Cód.</label>' +
            '<input type="text" id="gastoItemCod_' + idx + '" class="input" placeholder="01" value="' + esc(codVal) + '" style="height:36px;font-weight:800;text-align:center;color:var(--accent-hi)" oninput="onDigitarCodigoProdutoLinha(' + idx + ', this.value)" title="Digite o código do produto (ex: 01, 02)">' +
            '</div>' +
            '<div class="prod-autocomplete-wrap">' +
            '<label class="gasto-field-lbl" style="font-size:11px">' + (idx + 1) + '. Produto / Peça / Óleo (digite o nome ou código)</label>' +
            '<input type="text" id="gastoItemNome_' + idx + '" class="input" placeholder="Escreva o nome da peça/óleo ou clique para ver..." value="' + esc(item.produto_nome || '') + '" autocomplete="off" style="height:36px;font-weight:600" onfocus="abrirMenuSugestaoProd(' + idx + ', \'\')" oninput="onDigitarNomeProdutoLinha(' + idx + ', this.value)" onblur="setTimeout(() => fecharMenuSugestaoProd(' + idx + '), 200)" onkeydown="if(event.key===\'Escape\'||event.key===\'Enter\'){fecharMenuSugestaoProd(' + idx + ');}">' +
            '<div class="prod-suggest-menu" id="prodSuggestMenu_' + idx + '"></div>' +
            '</div>' +
            '<div>' +
            '<label class="gasto-field-lbl" style="font-size:11px" id="gastoItemUnidLbl_' + idx + '">Qtd. (' + esc(item.unidade || 'un') + ')</label>' +
            '<input type="number" step="0.1" min="0.1" class="input" style="height:36px;font-weight:700" value="' + esc(item.quantidade) + '" oninput="onMudarQtdLinhaGasto(' + idx + ', this.value)">' +
            '</div>' +
            '<div>' +
            '<label class="gasto-field-lbl" style="font-size:11px">Valor Unit. (R$)</label>' +
            '<input type="text" id="gastoItemValUnit_' + idx + '" class="input" style="height:36px" value="' + (Number(item.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '" oninput="onMudarValorUnitLinhaGasto(' + idx + ', this.value)">' +
            '</div>' +
            '<div>' +
            '<label class="gasto-field-lbl" style="font-size:11px">Subtotal</label>' +
            '<div id="gastoItemSubtotal_' + idx + '" style="height:36px;display:flex;align-items:center;padding:0 10px;background:var(--bg);border:1px solid var(--line);border-radius:6px;font-weight:800;color:var(--ok);font-size:13px">' +
            fmtMoeda(subtotal) +
            '</div>' +
            '</div>' +
            (!isSingle
              ? '<div><button type="button" class="btn btn-ghost btn-icon" style="height:36px;width:36px;color:var(--bad)" onclick="removerLinhaItemGasto(' + idx + ')" title="Remover este item">' + icon('trash') + '</button></div>'
              : ''
            ) +
            '</div>';
        }).join('');

        recalcularPreviewModalGasto();
      }

      function abrirMenuSugestaoProd(idx, termo = '') {
        fecharTodosMenusSugestaoProd(idx);
        const menu = $('prodSuggestMenu_' + idx);
        if (!menu) return;
        const html = gerarHtmlMenuSugestoesProd(idx, termo);
        if (!html) {
          fecharMenuSugestaoProd(idx);
          return;
        }
        menu.innerHTML = html;
        menu.style.display = 'block';
        menu.classList.add('open');
      }
      window.abrirMenuSugestaoProd = abrirMenuSugestaoProd;

      function fecharMenuSugestaoProd(idx) {
        const menu = $('prodSuggestMenu_' + idx);
        if (menu) {
          menu.style.display = 'none';
          menu.classList.remove('open');
          menu.innerHTML = '';
        }
      }
      window.fecharMenuSugestaoProd = fecharMenuSugestaoProd;

      function fecharTodosMenusSugestaoProd(excetoIdx = -1) {
        document.querySelectorAll('.prod-suggest-menu').forEach(el => {
          if (excetoIdx >= 0 && el.id === 'prodSuggestMenu_' + excetoIdx) return;
          el.style.display = 'none';
          el.classList.remove('open');
          el.innerHTML = '';
        });
      }
      window.fecharTodosMenusSugestaoProd = fecharTodosMenusSugestaoProd;

      function onDigitarCodigoProdutoLinha(idx, rawCod) {
        if (!gastosState.modalItensDraft[idx]) return;
        const clean = String(rawCod || '').trim();
        gastosState.modalItensDraft[idx].produto_codigo = clean;
        if (!clean) return;

        const numInput = parseInt(clean, 10);
        const prod = gastosState.produtos.find(p => {
          const pCod = String(p.codigo || '').trim();
          if (pCod.toLowerCase() === clean.toLowerCase()) return true;
          const pNum = parseInt(pCod, 10);
          return !isNaN(numInput) && !isNaN(pNum) && pNum === numInput;
        });

        if (prod) {
          aplicarProdutoNoItemDraft(idx, prod, false);
          fecharMenuSugestaoProd(idx);
        }
      }
      window.onDigitarCodigoProdutoLinha = onDigitarCodigoProdutoLinha;

      function onDigitarNomeProdutoLinha(idx, texto) {
        if (!gastosState.modalItensDraft[idx]) return;
        gastosState.modalItensDraft[idx].produto_nome = texto;
        abrirMenuSugestaoProd(idx, texto);
      }
      window.onDigitarNomeProdutoLinha = onDigitarNomeProdutoLinha;

      function selecionarProdutoSugestao(idx, prodId) {
        const prod = gastosState.produtos.find(p => String(p.id) === String(prodId));
        if (!prod || !gastosState.modalItensDraft[idx]) return;
        aplicarProdutoNoItemDraft(idx, prod, true);
        fecharMenuSugestaoProd(idx);
        fecharTodosMenusSugestaoProd();
        const inp = $('gastoItemNome_' + idx);
        if (inp) inp.blur();
      }
      window.selecionarProdutoSugestao = selecionarProdutoSugestao;

      function aplicarProdutoNoItemDraft(idx, prod, atualizarCampoCodigo = true) {
        const item = gastosState.modalItensDraft[idx];
        if (!item || !prod) return;
        item.produto_id = prod.id;
        item.produto_codigo = prod.codigo || '';
        item.produto_nome = prod.nome;
        item.categoria = prod.categoria;
        item.unidade = prod.unidade || 'un';
        item.valor_unitario = Number(prod.preco_base) || 0;

        if (atualizarCampoCodigo && $('gastoItemCod_' + idx)) {
          $('gastoItemCod_' + idx).value = prod.codigo || '';
        }
        if ($('gastoItemNome_' + idx)) {
          $('gastoItemNome_' + idx).value = prod.nome;
        }
        if ($('gastoItemUnidLbl_' + idx)) {
          $('gastoItemUnidLbl_' + idx).textContent = 'Qtd. (' + (prod.unidade || 'un') + ')';
        }
        if ($('gastoItemValUnit_' + idx)) {
          $('gastoItemValUnit_' + idx).value = item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        const sub = (Number(item.quantidade) || 0) * item.valor_unitario;
        if ($('gastoItemSubtotal_' + idx)) {
          $('gastoItemSubtotal_' + idx).textContent = fmtMoeda(sub);
        }
        recalcularPreviewModalGasto();
      }

      function adicionarLinhaItemGasto() {
        const prod = gastosState.produtos[0] || PRODUTOS_PADRAO_FROTA[0];
        gastosState.modalItensDraft.push({
          uid: 'item_' + Date.now() + '_' + Math.random(),
          produto_id: prod.id,
          produto_codigo: prod.codigo || '01',
          produto_nome: prod.nome,
          categoria: prod.categoria,
          unidade: prod.unidade || 'un',
          quantidade: 1,
          valor_unitario: prod.preco_base || 0
        });
        renderItensDraftNoModalGasto();
      }
      window.adicionarLinhaItemGasto = adicionarLinhaItemGasto;

      function removerLinhaItemGasto(idx) {
        if (gastosState.modalItensDraft.length <= 1) return;
        gastosState.modalItensDraft.splice(idx, 1);
        renderItensDraftNoModalGasto();
      }
      window.removerLinhaItemGasto = removerLinhaItemGasto;

      function onMudarQtdLinhaGasto(idx, val) {
        if (!gastosState.modalItensDraft[idx]) return;
        const q = parseFloat(String(val).replace(',', '.')) || 0;
        gastosState.modalItensDraft[idx].quantidade = q;
        const sub = q * (Number(gastosState.modalItensDraft[idx].valor_unitario) || 0);
        const el = $('gastoItemSubtotal_' + idx);
        if (el) el.textContent = fmtMoeda(sub);
        recalcularPreviewModalGasto();
      }
      window.onMudarQtdLinhaGasto = onMudarQtdLinhaGasto;

      function onMudarValorUnitLinhaGasto(idx, val) {
        if (!gastosState.modalItensDraft[idx]) return;
        const v = parseNumeroMoeda(val);
        gastosState.modalItensDraft[idx].valor_unitario = v;
        const sub = (Number(gastosState.modalItensDraft[idx].quantidade) || 0) * v;
        const el = $('gastoItemSubtotal_' + idx);
        if (el) el.textContent = fmtMoeda(sub);
        recalcularPreviewModalGasto();
      }
      window.onMudarValorUnitLinhaGasto = onMudarValorUnitLinhaGasto;

      function recalcularPreviewModalGasto() {
        let total = 0;
        gastosState.modalItensDraft.forEach(it => {
          total += (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0);
        });
        if ($('gastoModalTotalPreview')) $('gastoModalTotalPreview').textContent = fmtMoeda(total);
        if ($('gastoModalResumoItens')) {
          const n = gastosState.modalItensDraft.length;
          $('gastoModalResumoItens').textContent = n + (n === 1 ? ' produto/item neste lançamento' : ' produtos/itens neste lançamento');
        }
      }

      function toggleCadastroRapidoProdutoInline(force) {
        const box = $('boxCadastroRapidoProduto');
        if (!box) return;
        const mostrar = typeof force === 'boolean' ? force : box.hidden;
        box.hidden = !mostrar;
        if (mostrar) {
          if ($('rapidoProdCodigo')) $('rapidoProdCodigo').value = sugerirProximoCodigoProduto();
          $('rapidoProdNome').value = '';
          $('rapidoProdPreco').value = '';
          setTimeout(() => $('rapidoProdNome').focus(), 60);
        }
      }
      window.toggleCadastroRapidoProdutoInline = toggleCadastroRapidoProdutoInline;

      async function salvarProdutoRapidoInline() {
        const nome = ($('rapidoProdNome').value || '').trim();
        if (!nome) {
          toast('Informe o nome do produto ou peça.', 'error');
          $('rapidoProdNome').focus();
          return;
        }
        const codigo = ($('rapidoProdCodigo')?.value || '').trim() || sugerirProximoCodigoProduto();
        const categoria = $('rapidoProdCat').value || 'Peças Mecânicas';
        const unidade = $('rapidoProdUnid').value || 'un';
        const preco_base = parseNumeroMoeda($('rapidoProdPreco').value);

        const novoProd = {
          id: 'prod_' + Date.now(),
          codigo,
          nome,
          categoria,
          unidade,
          preco_base
        };
        gastosState.produtos.push(novoProd);
        await sincronizarGastosComServidor('push');

        // Seleciona automaticamente o produto recém-criado na última linha do modal
        const lastIdx = gastosState.modalItensDraft.length - 1;
        if (lastIdx >= 0) {
          gastosState.modalItensDraft[lastIdx].produto_id = novoProd.id;
          gastosState.modalItensDraft[lastIdx].produto_codigo = novoProd.codigo;
          gastosState.modalItensDraft[lastIdx].produto_nome = novoProd.nome;
          gastosState.modalItensDraft[lastIdx].categoria = novoProd.categoria;
          gastosState.modalItensDraft[lastIdx].unidade = novoProd.unidade;
          gastosState.modalItensDraft[lastIdx].valor_unitario = novoProd.preco_base;
        }

        toggleCadastroRapidoProdutoInline(false);
        renderItensDraftNoModalGasto();
        renderGastosView();
        toast('Produto [' + codigo + '] "' + nome + '" cadastrado com sucesso!');
      }
      window.salvarProdutoRapidoInline = salvarProdutoRapidoInline;

      function acionarSeletorAnexoGasto() {
        const inp = $('gastoAnexoInput');
        if (inp) {
          inp.value = '';
          inp.click();
        }
      }
      window.acionarSeletorAnexoGasto = acionarSeletorAnexoGasto;

      async function onSelecionarAnexosGasto(fileList) {
        if (!fileList || !fileList.length) return;
        const files = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
        if (!files.length) {
          toast('Selecione arquivos de imagem válidos para o comprovante/NF.', 'error');
          return;
        }
        let add = 0;
        for (const f of files) {
          try {
            const dataUrl = await comprimirImagemParaDataUrl(f, 1200, 0.82);
            if (!Array.isArray(gastosState.gastoAnexosDraft)) gastosState.gastoAnexosDraft = [];
            gastosState.gastoAnexosDraft.push({
              uid: 'anx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              nome: f.name,
              dataUrl
            });
            add++;
          } catch (e) { }
        }
        renderAnexosGastoDraft();
        if (add > 0) toast(add + (add === 1 ? ' comprovante/foto anexado!' : ' fotos/comprovantes anexados!'));
      }
      window.onSelecionarAnexosGasto = onSelecionarAnexosGasto;

      function renderAnexosGastoDraft() {
        const container = $('gastoAnexoPreview');
        const btnLbl = $('gastoAnexoBtnLabel');
        if (!container) return;
        const list = gastosState.gastoAnexosDraft || [];
        if (!list.length) {
          container.hidden = true;
          container.style.display = 'none';
          container.innerHTML = '';
          if (btnLbl) btnLbl.textContent = 'Anexar Foto';
          return;
        }
        container.hidden = false;
        container.style.display = 'grid';
        if (btnLbl) btnLbl.textContent = 'Adicionar Mais Fotos (' + list.length + ')';
        container.innerHTML = list.map((a, idx) =>
          '<div class="upload-preview-item" title="' + esc(a.nome || ('Comprovante ' + (idx + 1))) + '">' +
          '<img src="' + a.dataUrl + '" alt="Preview">' +
          '<button type="button" class="upload-preview-remove" onclick="event.stopPropagation(); removerAnexoGastoDraft(' + idx + ')" title="Remover este anexo">×</button>' +
          '</div>'
        ).join('') +
          '<button type="button" onclick="event.stopPropagation(); acionarSeletorAnexoGasto()" title="Anexar mais uma foto" style="height:82px;border-radius:8px;border:1.5px dashed var(--accent);background:var(--accent-tint);color:var(--accent-hi);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;font-size:11px;font-weight:700">' +
          '<span style="font-size:18px;line-height:1">+</span>' +
          '<span>Mais foto</span>' +
          '</button>';
      }
      window.renderAnexosGastoDraft = renderAnexosGastoDraft;

      function removerAnexoGastoDraft(idx) {
        if (!Array.isArray(gastosState.gastoAnexosDraft)) return;
        gastosState.gastoAnexosDraft.splice(idx, 1);
        renderAnexosGastoDraft();
      }
      window.removerAnexoGastoDraft = removerAnexoGastoDraft;

      function registrarAnexosGastoNaGaleria({ placa, veiculo, data, motorista, km, nf_os, fornecedor, usuarioLogado }) {
        const list = gastosState.gastoAnexosDraft || [];
        if (!list.length) return [];
        if (!Array.isArray(gastosState.galeria)) gastosState.galeria = [];
        const ids = [];
        const baseTs = Date.now();

        list.forEach((anx, i) => {
          if (anx.fotoId) {
            ids.push(anx.fotoId);
            return;
          }
          const fotoId = 'foto_nf_' + (baseTs + i) + '_' + Math.random().toString(36).slice(2, 6);
          gastosState.galeria.unshift({
            id: fotoId,
            created_ts: baseTs + i,
            placa: (placa || '').toUpperCase().trim(),
            veiculo: veiculo || 'Veículo da Frota',
            data: data || isoLocal(new Date()),
            motorista: motorista || 'Responsável',
            categoria: 'Nota Fiscal / Comprovante',
            km: km || null,
            obs: 'Comprovante / NF de gasto lançado' + (nf_os ? ' (NF/OS: ' + nf_os + ')' : '') + (fornecedor ? ' · Fornecedor: ' + fornecedor : ''),
            imagem: anx.dataUrl,
            registrado_por: usuarioLogado || 'gomex'
          });
          ids.push(fotoId);
        });
        return ids;
      }

      async function salvarLancamentoGasto() {
        if (!podeEditar('gastos')) {
          mostrarToastBloqueioEdicao('Custos & Peças');
          return;
        }
        const placa = ($('gastoInputPlaca').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (!placa) {
          toast('Informe ou selecione a placa do veículo.', 'error');
          $('gastoInputPlaca').focus();
          return;
        }
        const data = $('gastoInputData').value || isoLocal(new Date());
        const motorista = ($('gastoInputMotorista').value || '').trim() || 'Não informado';
        const infoPlaca = obterInfoPlacaNaFrota(placa);
        const veiculo = ($('gastoInputVeiculo').value || '').trim() || infoPlaca.veiculo || 'Veículo da Frota';
        const km = $('gastoInputKm').value ? Number($('gastoInputKm').value) : (infoPlaca.km || null);
        const nf_os = ($('gastoInputNF').value || '').trim();
        const fornecedor = ($('gastoInputFornecedor').value || '').trim();
        const obs = ($('gastoInputObs').value || '').trim();
        const editId = $('gastoEditId').value;

        if (!gastosState.modalItensDraft.length) {
          toast('Adicione ao menos 1 produto ou peça.', 'error');
          return;
        }

        const btn = $('btnSalvarLancamentoGasto');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Salvando no Banco...';
        }

        try {
          const usuarioLogado = ($('userNameLabel')?.textContent || 'gomex').trim();
          const anexo_ids = registrarAnexosGastoNaGaleria({ placa, veiculo, data, motorista, km, nf_os, fornecedor, usuarioLogado });

          if (editId) {
            const itemDraft = gastosState.modalItensDraft[0];
            const qtd = Number(itemDraft.quantidade) || 1;
            const vUnit = Number(itemDraft.valor_unitario) || 0;
            const idx = gastosState.lancamentos.findIndex(x => String(x.id) === String(editId));
            if (idx !== -1) {
              gastosState.lancamentos[idx] = {
                ...gastosState.lancamentos[idx],
                placa,
                veiculo,
                data,
                motorista,
                km,
                produto_id: itemDraft.produto_id,
                produto_codigo: itemDraft.produto_codigo || '',
                produto_nome: itemDraft.produto_nome,
                categoria: itemDraft.categoria,
                unidade: itemDraft.unidade || 'un',
                quantidade: qtd,
                valor_unitario: vUnit,
                valor_total: Number((qtd * vUnit).toFixed(2)),
                fornecedor,
                nf_os,
                obs,
                anexo_ids
              };
            }
          } else {
            const baseTs = Date.now();
            gastosState.modalItensDraft.forEach((itemDraft, i) => {
              const qtd = Number(itemDraft.quantidade) || 1;
              const vUnit = Number(itemDraft.valor_unitario) || 0;
              gastosState.lancamentos.unshift({
                id: 'gasto_' + (baseTs + i) + '_' + Math.random().toString(36).slice(2, 6),
                created_ts: baseTs + i,
                placa,
                veiculo,
                data,
                motorista,
                km,
                produto_id: itemDraft.produto_id,
                produto_codigo: itemDraft.produto_codigo || '',
                produto_nome: itemDraft.produto_nome,
                categoria: itemDraft.categoria,
                unidade: itemDraft.unidade || 'un',
                quantidade: qtd,
                valor_unitario: vUnit,
                valor_total: Number((qtd * vUnit).toFixed(2)),
                fornecedor,
                nf_os,
                obs,
                anexo_ids,
                registrado_por: usuarioLogado
              });
            });
          }

          await sincronizarGastosComServidor('push');
          fecharModalLancarGasto();
          renderGastosView();
          if (typeof renderGaleriaView === 'function' && ((window.state && window.state.visaoAtual === 'galeria') || (window.__isLazyLoaded && window.__isLazyLoaded('galeria')))) {
            renderGaleriaView();
          }
          if (typeof atualizarPaineisFrota === 'function') atualizarPaineisFrota();
          if (state.sel && (state.sel.placa || '').toUpperCase().trim() === placa) {
            carregarGastosPlacaNoDrawer(placa);
          }
          toast(editId ? 'Lançamento atualizado e salvo no banco!' : 'Gasto lançado na placa ' + placa + ' e salvo no banco!');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = icon('check') + ' <span>Salvar Lançamento na Placa</span>';
          }
        }
      }
      window.salvarLancamentoGasto = salvarLancamentoGasto;

      function editarLancamentoGasto(id) {
        const g = gastosState.lancamentos.find(x => String(x.id) === String(id));
        if (!g) return;

        $('gastoEditId').value = g.id;
        $('modalLancarGastoTitulo').textContent = 'Editar Lançamento · Placa ' + (g.placa || '');
        $('btnAddMaisItemGasto').hidden = true;

        garantirCodigosProdutos();
        popularDatalistEPlacasNoModalGasto();
        $('gastoInputPlaca').value = (g.placa || '').toUpperCase();
        $('gastoInputVeiculo').value = g.veiculo || '';
        $('gastoInputData').value = g.data || isoLocal(new Date());
        $('gastoInputMotorista').value = g.motorista || '';
        $('gastoInputKm').value = g.km || '';
        $('gastoInputNF').value = g.nf_os || '';
        $('gastoInputFornecedor').value = g.fornecedor || '';
        $('gastoInputObs').value = g.obs || '';

        const prodMatch = gastosState.produtos.find(p => p.id === g.produto_id || p.nome === g.produto_nome);
        gastosState.modalItensDraft = [
          {
            uid: 'edit_' + g.id,
            produto_id: g.produto_id || (prodMatch?.id || ''),
            produto_codigo: g.produto_codigo || (prodMatch?.codigo || ''),
            produto_nome: g.produto_nome,
            categoria: g.categoria,
            unidade: g.unidade || 'un',
            quantidade: g.quantidade || 1,
            valor_unitario: g.valor_unitario || 0
          }
        ];

        toggleCadastroRapidoProdutoInline(false);
        renderItensDraftNoModalGasto();
        gastosState.gastoAnexosDraft = (Array.isArray(g.anexo_ids) ? g.anexo_ids : [])
          .map(fid => {
            const foto = (gastosState.galeria || []).find(f => String(f.id) === String(fid));
            return foto ? { uid: 'anx_' + fid, fotoId: foto.id, dataUrl: foto.imagem } : null;
          })
          .filter(Boolean);
        renderAnexosGastoDraft();
        $('modalLancarGasto').classList.add('open');
      }
      window.editarLancamentoGasto = editarLancamentoGasto;

      async function excluirLancamentoGasto(id) {
        if (!podeEditar('gastos')) {
          mostrarToastBloqueioEdicao('Custos & Peças');
          return;
        }
        const g = gastosState.lancamentos.find(x => String(x.id) === String(id));
        if (!g) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Excluir Lançamento de Gasto',
          subtitulo: 'Remoção de despesa / peça',
          mensagem: `Deseja realmente excluir o lançamento <strong>"${esc(g.produto_nome)}"</strong> (${fmtMoeda(g.valor_total)}) da placa <strong>${esc(g.placa)}</strong>?`,
          aviso: 'Este lançamento será excluído e os totais financeiros serão recalculados.',
          textoConfirmar: 'Excluir Gasto',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;
        gastosState.lancamentos = gastosState.lancamentos.filter(x => String(x.id) !== String(id));
        await sincronizarGastosComServidor('push');
        renderGastosView();
        toast('Lançamento excluído com sucesso.');
      }
      window.excluirLancamentoGasto = excluirLancamentoGasto;

      function renderResumoGaleriaNoModalHistorico(placa) {
        const p = (placa || '').toUpperCase().trim();
        const fotos = (gastosState.galeria || []).filter(f => (f.placa || '').toUpperCase().trim() === p);
        if ($('histGaleriaCount')) $('histGaleriaCount').textContent = fotos.length;
        const listEl = $('histGaleriaPlacaList');
        if (!listEl) return;
        if (!fotos.length) {
          listEl.innerHTML = '<div class="muted" style="grid-column:1/-1;font-size:12px;padding:4px 0">Nenhuma foto enviada para a placa ' + esc(p) + ' ainda.</div>';
          return;
        }
        listEl.innerHTML = fotos.slice(0, 6).map(f =>
          '<div style="cursor:pointer;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--raised)" data-action="abrirLightboxFoto" data-arg="' + esc(f.id) + '" title="' + esc(formatarData(f.data) + ' · ' + f.motorista) + '">' +
          '<img src="' + esc(f.imagem) + '" alt="Foto" loading="lazy" decoding="async" style="width:100%;height:74px;object-fit:cover;display:block">' +
          '<div style="padding:4px 6px;font-size:10.5px;line-height:1.25">' +
          '<strong style="color:var(--ink);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(f.motorista) + '</strong>' +
          '<span style="color:var(--ink-3)">' + formatarData(f.data) + '</span>' +
          '</div>' +
          '</div>'
        ).join('');
      }
      window.renderResumoGaleriaNoModalHistorico = renderResumoGaleriaNoModalHistorico;
      // Modal de Catálogo de Produtos carregado sob demanda (/chunks/catalogo.json)
      // ==============================================================================
