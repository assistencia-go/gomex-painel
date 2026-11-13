      // CICLO DE VISTORIA MENSAL (30 DIAS) E AVISOS DE VENCIMENTO PRÓXIMO
      // ==============================================================================
      const CICLO_VISTORIA_MENSAL_DIAS = 30;
      const AVISO_VISTORIA_PROXIMA_DIAS = 7; // Avisa quando faltar 7 dias ou menos para fechar 30 dias

      function calcularCicloVistoriaMensal(dataStr) {
        if (!dataStr) return null;
        const cleanDate = String(dataStr).split('T')[0];
        const p = cleanDate.split('-');
        if (p.length !== 3) return null;
        const dUltima = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        if (isNaN(dUltima.getTime())) return null;
        dUltima.setHours(0, 0, 0, 0);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dProxima = new Date(dUltima.getTime() + CICLO_VISTORIA_MENSAL_DIAS * 86400000);
        const dataProximaIso = isoLocal(dProxima);
        const dataProximaFmt = formatarData(dataProximaIso);

        const diasDecorridos = Math.max(0, Math.floor((hoje - dUltima) / 86400000));
        const diasParaVencer = Math.floor((dProxima - hoje) / 86400000);

        let status = 'em_dia';
        let labelCurto = 'Próx: ' + dataProximaFmt;
        let labelBadge = 'Em dia · Próx: ' + dataProximaFmt;

        if (diasParaVencer < 0) {
          status = 'vencida';
          const atraso = Math.abs(diasParaVencer);
          labelCurto = 'Mensal Vencida (' + atraso + 'd)';
          labelBadge = 'Vistoria Mensal Vencida (há ' + atraso + (atraso === 1 ? ' dia' : ' dias') + ')';
        } else if (diasParaVencer <= AVISO_VISTORIA_PROXIMA_DIAS) {
          status = 'proxima';
          if (diasParaVencer === 0) {
            labelCurto = 'Mensal Vence Hoje!';
            labelBadge = 'Vistoria Mensal Vence Hoje (' + dataProximaFmt + ')';
          } else if (diasParaVencer === 1) {
            labelCurto = 'Mensal Amanhã (1d)';
            labelBadge = 'Vistoria Mensal Amanhã (' + dataProximaFmt + ')';
          } else {
            labelCurto = 'Mensal em ' + diasParaVencer + ' dias';
            labelBadge = 'Vistoria Mensal em ' + diasParaVencer + ' dias (' + dataProximaFmt + ')';
          }
        }

        return {
          status,
          diasDecorridos,
          diasParaVencer,
          diasRestantes: diasParaVencer,
          dataUltimaIso: cleanDate,
          dataProximaIso,
          dataProximaFmt,
          labelCurto,
          labelBadge
        };
      }

      function calcularStatusOleoPorKm(placa) {
        const pNorm = (placa || '').toUpperCase().trim();
        if (!pNorm) {
          return { status: 'sem_registro', labelCurto: '—', badgeHtml: '<span class="status-badge" style="background:rgba(255,255,255,0.06);color:var(--ink-3)">Sem dados</span>' };
        }

        const veics = (typeof gastosState !== 'undefined' && Array.isArray(gastosState.veiculos)) ? gastosState.veiculos : [];
        const cad = veics.find(v => (v.placa || '').toUpperCase().trim() === pNorm);
        const metaKm = (cad && Number(cad.meta_oleo_km) > 0) ? Number(cad.meta_oleo_km) : 10000;

        // Vistorias ativas desta placa ordenadas por data/hora decrescente
        const vistorias = (state.all || [])
          .filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === pNorm)
          .sort((a, b) => ((b.data || '') + ' ' + (b.hora || '')).localeCompare((a.data || '') + ' ' + (a.hora || '')));
        const recVist = vistorias[0] || null;

        // Lançamentos de gastos desta placa
        const lancs = (typeof gastosState !== 'undefined' && Array.isArray(gastosState.lancamentos)) ? gastosState.lancamentos : [];
        const gastosPlaca = lancs.filter(g => (g.placa || '').toUpperCase().trim() === pNorm);

        // 1. Determinar KM Atual do Veículo (maior valor entre vistorias, gastos e cadastro)
        let kmAtual = null;
        if (recVist && recVist.km && !isNaN(Number(recVist.km))) kmAtual = Number(recVist.km);
        gastosPlaca.forEach(g => {
          if (g.km && !isNaN(Number(g.km)) && (kmAtual === null || Number(g.km) > kmAtual)) {
            kmAtual = Number(g.km);
          }
        });
        if (cad && cad.km_inicial && !isNaN(Number(cad.km_inicial)) && (kmAtual === null || Number(cad.km_inicial) > kmAtual)) {
          kmAtual = Number(cad.km_inicial);
        }

        // 2. Determinar KM da Última Troca de Óleo
        let kmUltimaTroca = null;
        let dataUltimaTroca = null;
        let fonteUltimaTroca = '';

        const gastosOleo = gastosPlaca.filter(g => {
          const cat = (g.categoria || '').toLowerCase();
          const nm = (g.produto_nome || '').toLowerCase();
          return cat.includes('óleo') || cat.includes('oleo') || cat.includes('lubrificante') ||
            nm.includes('óleo') || nm.includes('oleo') || nm.includes('5w30') || nm.includes('15w40');
        }).sort((a, b) => (b.data || '').localeCompare(a.data || ''));

        const gastoOleoComKm = gastosOleo.find(g => g.km && !isNaN(Number(g.km)));
        if (gastoOleoComKm) {
          kmUltimaTroca = Number(gastoOleoComKm.km);
          dataUltimaTroca = gastoOleoComKm.data;
          fonteUltimaTroca = 'Lançamento de Peça / Óleo';
        }

        // Se não tiver gasto com KM, checar rev_ult_km da vistoria
        if (kmUltimaTroca === null && recVist && recVist.rev_ult_km && !isNaN(Number(recVist.rev_ult_km))) {
          kmUltimaTroca = Number(recVist.rev_ult_km);
          dataUltimaTroca = recVist.rev_ult_data || recVist.data;
          fonteUltimaTroca = 'Revisão Registrada na Vistoria';
        }

        // Se ainda não tiver, checar rev_prox_km
        let kmProximaTroca = null;
        if (kmUltimaTroca !== null) {
          kmProximaTroca = kmUltimaTroca + metaKm;
        } else if (recVist && recVist.rev_prox_km && !isNaN(Number(recVist.rev_prox_km))) {
          kmProximaTroca = Number(recVist.rev_prox_km);
          kmUltimaTroca = Math.max(0, kmProximaTroca - metaKm);
          fonteUltimaTroca = 'Meta Próx. Revisão da Vistoria';
        }

        if (kmUltimaTroca === null || kmProximaTroca === null) {
          return {
            status: 'sem_registro',
            kmAtual: kmAtual || 0,
            kmUltimaTroca: null,
            kmProximaTroca: null,
            diffKm: null,
            metaKm,
            dataUltimaTroca: null,
            labelCurto: 'Sem troca reg.',
            badgeHtml: '<span class="status-badge" style="background:rgba(255,255,255,0.06);color:var(--ink-3)">Sem troca reg.</span>'
          };
        }

        const kmBaseAtual = (kmAtual !== null) ? kmAtual : kmUltimaTroca;
        const diffKm = kmProximaTroca - kmBaseAtual;

        let status = 'em_dia';
        let labelCurto = '';
        let badgeHtml = '';

        if (diffKm < 0) {
          status = 'vencido';
          const atrasoKm = Math.abs(diffKm);
          labelCurto = 'Óleo Vencido (' + fmtKm(atrasoKm) + ')';
          badgeHtml = '<span class="status-badge bad" title="Próx: ' + fmtKm(kmProximaTroca) + ' · Atual: ' + fmtKm(kmBaseAtual) + '">Óleo Vencido (' + fmtKm(atrasoKm) + ')</span>';
        } else if (diffKm <= 1000) {
          status = 'proximo';
          labelCurto = 'Trocar Óleo em ' + fmtKm(diffKm);
          badgeHtml = '<span class="status-badge warn" title="Próx: ' + fmtKm(kmProximaTroca) + ' · Atual: ' + fmtKm(kmBaseAtual) + '">Trocar em ' + fmtKm(diffKm) + '</span>';
        } else {
          status = 'em_dia';
          labelCurto = 'Óleo em dia (' + fmtKm(diffKm) + ')';
          badgeHtml = '<span class="status-badge ok" title="Próx: ' + fmtKm(kmProximaTroca) + ' · Atual: ' + fmtKm(kmBaseAtual) + '">Em dia (restam ' + fmtKm(diffKm) + ')</span>';
        }

        return {
          status,
          kmAtual: kmBaseAtual,
          kmUltimaTroca,
          kmProximaTroca,
          diffKm,
          metaKm,
          dataUltimaTroca,
          fonteUltimaTroca,
          labelCurto,
          badgeHtml
        };
      }
      window.calcularStatusOleoPorKm = calcularStatusOleoPorKm;

      function obterStatusMensalPorPlaca() {
        const mapa = new Map();
        const ativos = state.all.filter(x => x.status !== 'inativo');
        ativos.forEach(it => {
          const placa = (it.placa || '').toUpperCase().trim();
          if (!placa) return;
          const existente = mapa.get(placa);
          const keyIt = (it.data || '') + ' ' + (it.hora || '');
          const keyEx = existente ? ((existente.latest.data || '') + ' ' + (existente.latest.hora || '')) : '';
          if (!existente || keyIt > keyEx || (keyIt === keyEx && Number(it.id) > Number(existente.latest.id))) {
            const ciclo = calcularCicloVistoriaMensal(it.data);
            mapa.set(placa, {
              placa,
              latestId: it.id,
              latest: it,
              ciclo
            });
          }
        });
        return mapa;
      }

      // ==============================================================================
      // RESUMO DOS KPIS & ALERTAS CRÍTICOS
      // ==============================================================================
      function renderSummary() {
        const a = state.all;
        const ativos = a.filter(x => x.status !== 'inativo');
        const inativos = a.filter(x => x.status === 'inativo');
        const total = ativos.length;
        const today = isoLocal(new Date()), month = today.slice(0, 7);
        const lib = ativos.filter(x => x.liberacao === 'Liberado').length;
        const res = ativos.filter(x => x.liberacao === 'Ressalva').length;
        const blk = ativos.filter(x => x.liberacao === 'Não liberado').length;
        const emManut = ativos.filter(x => getManutencaoData(x)?.status === 'Em manutenção').length;
        const jaFoiManut = ativos.filter(x => getManutencaoData(x)?.status === 'Já foi para manutenção').length;

        $('stTotal').textContent = total;
        $('stHoje').textContent = ativos.filter(x => x.data === today).length;
        $('stMes').textContent = ativos.filter(x => (x.data || '').slice(0, 7) === month).length;
        $('stConf').textContent = total ? Math.round(lib / total * 100) + '%' : '—';
        $('stAv').textContent = ativos.filter(x => avariasOf(x).length > 0).length;

        $('cntAll').textContent = total;
        $('cntLib').textContent = lib;
        $('cntRes').textContent = res;
        $('cntBlk').textContent = blk;
        if ($('cntInat')) $('cntInat').textContent = inativos.length;
        if ($('cntManutEm')) $('cntManutEm').textContent = emManut;
        let custoTotalManut = 0;
        ativos.forEach(x => {
          const m = getManutencaoData(x);
          if (m && m.custo) {
            const c = parseFloat(String(m.custo).replace(/\./g, '').replace(',', '.'));
            if (!isNaN(c)) custoTotalManut += c;
          }
        });

        if ($('maintStatEm')) $('maintStatEm').textContent = emManut;
        if ($('maintStatJa')) $('maintStatJa').textContent = jaFoiManut;
        if ($('maintStatCusto')) {
          $('maintStatCusto').textContent = custoTotalManut > 0
            ? 'R$ ' + custoTotalManut.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : 'R$ 0,00';
        }
        if ($('maintStatTotal')) $('maintStatTotal').textContent = emManut + jaFoiManut;

        $('splitOk').style.flexGrow = lib;
        $('splitWarn').style.flexGrow = res;
        $('splitBad').style.flexGrow = blk;

        // Diagnóstico de Alertas Operacionais + Avisos de Vistoria Mensal (30 dias)
        const comPneuDano = ativos.filter(x => x.pneu_dano === 'Sim').length;
        const revisaoVencendo = ativos.filter(x => x.km && x.rev_prox_km && (Number(x.rev_prox_km) - Number(x.km) <= 1000)).length;

        const mapaMensal = obterStatusMensalPorPlaca();
        let vistMensalProxima = 0;
        let vistMensalVencida = 0;
        mapaMensal.forEach(info => {
          if (info.ciclo?.status === 'proxima') vistMensalProxima++;
          else if (info.ciclo?.status === 'vencida') vistMensalVencida++;
        });

        // Alertas de Troca de Óleo por KM (Vencida ou Próxima)
        let oleoVencidoCount = 0;
        let oleoProximoCount = 0;
        const todasPlacasConhecidas = typeof obterTodasPlacasConhecidas === 'function' ? obterTodasPlacasConhecidas() : [];
        todasPlacasConhecidas.forEach(pObj => {
          if (typeof calcularStatusOleoPorKm === 'function') {
            const stOleo = calcularStatusOleoPorKm(pObj.placa);
            if (stOleo.status === 'vencido') oleoVencidoCount++;
            else if (stOleo.status === 'proximo') oleoProximoCount++;
          }
        });

        const totalAlertas = blk + comPneuDano + revisaoVencendo + vistMensalProxima + vistMensalVencida + oleoVencidoCount + oleoProximoCount;

        const banner = $('alertsBanner');
        if (totalAlertas > 0) {
          banner.hidden = false;
          $('alertsSummaryText').textContent = totalAlertas + ' aviso(s) operacional(is) ou de vistoria mensal da frota detectado(s). Clique nas pílulas ao lado para filtrar:';

          const pBlk = $('pillBloqueados');
          if (blk > 0) {
            pBlk.hidden = false;
            pBlk.innerHTML = icon('ban') + ' <span>' + blk + ' Bloqueado(s)</span>';
            pBlk.classList.toggle('active', state.alertType === 'bloqueado');
          } else {
            pBlk.hidden = true;
          }

          const pVistVenc = $('pillVistoriaVencida');
          if (pVistVenc) {
            if (vistMensalVencida > 0) {
              pVistVenc.hidden = false;
              pVistVenc.innerHTML = icon('calendar-clock') + ' <span>' + vistMensalVencida + (vistMensalVencida === 1 ? ' Vistoria Mensal Vencida' : ' Vistorias Mensais Vencidas') + '</span>';
              pVistVenc.classList.toggle('active', state.alertType === 'vistoria_vencida');
            } else {
              pVistVenc.hidden = true;
            }
          }

          const pVistProx = $('pillVistoriaProxima');
          if (pVistProx) {
            if (vistMensalProxima > 0) {
              pVistProx.hidden = false;
              pVistProx.innerHTML = icon('clock') + ' <span>' + vistMensalProxima + (vistMensalProxima === 1 ? ' Vistoria Mensal Próxima' : ' Vistorias Mensais Próximas') + '</span>';
              pVistProx.classList.toggle('active', state.alertType === 'vistoria_proxima');
            } else {
              pVistProx.hidden = true;
            }
          }

          const pPn = $('pillPneus');
          if (comPneuDano > 0) {
            pPn.hidden = false;
            pPn.innerHTML = icon('alert') + ' <span>' + comPneuDano + ' Pneu c/ Dano</span>';
            pPn.classList.toggle('active', state.alertType === 'pneu');
          } else {
            pPn.hidden = true;
          }

          const pRev = $('pillRevisao');
          if (revisaoVencendo > 0) {
            pRev.hidden = false;
            pRev.innerHTML = icon('tool') + ' <span>' + revisaoVencendo + ' Revisão Próxima</span>';
            pRev.classList.toggle('active', state.alertType === 'revisao');
          } else {
            pRev.hidden = true;
          }

          const pOleoVenc = $('pillOleoVencido');
          if (pOleoVenc) {
            if (oleoVencidoCount > 0) {
              pOleoVenc.hidden = false;
              pOleoVenc.innerHTML = icon('droplet') + ' <span>' + oleoVencidoCount + (oleoVencidoCount === 1 ? ' Troca de Óleo Vencida' : ' Trocas de Óleo Vencidas') + '</span>';
              pOleoVenc.classList.toggle('active', state.alertType === 'oleo_vencido');
            } else {
              pOleoVenc.hidden = true;
            }
          }

          const pOleoProx = $('pillOleoProximo');
          if (pOleoProx) {
            if (oleoProximoCount > 0) {
              pOleoProx.hidden = false;
              pOleoProx.innerHTML = icon('droplet') + ' <span>' + oleoProximoCount + (oleoProximoCount === 1 ? ' Troca de Óleo Próxima' : ' Trocas de Óleo Próximas') + '</span>';
              pOleoProx.classList.toggle('active', state.alertType === 'oleo_proximo');
            } else {
              pOleoProx.hidden = true;
            }
          }

          const isFiltered = Boolean(state.alertOnly || state.alertType);
          $('btnFilterAlerts').innerHTML = icon('filter') + ' <span>' + (isFiltered ? 'Exibir Todas' : 'Filtrar Alertas') + '</span>';
          $('btnFilterAlerts').style.background = isFiltered ? 'var(--accent)' : 'rgba(255,255,255,0.15)';
        } else {
          banner.hidden = true;
        }
      }

      function alternarFiltroAlerta(tipo) {
        if (state.alertType === tipo) {
          state.alertType = '';
          state.alertOnly = false;
        } else {
          state.alertType = tipo;
          state.alertOnly = true;
        }
        onFilterChange();
      }

      if ($('pillBloqueados')) $('pillBloqueados').addEventListener('click', () => alternarFiltroAlerta('bloqueado'));
      if ($('pillVistoriaVencida')) $('pillVistoriaVencida').addEventListener('click', () => alternarFiltroAlerta('vistoria_vencida'));
      if ($('pillVistoriaProxima')) $('pillVistoriaProxima').addEventListener('click', () => alternarFiltroAlerta('vistoria_proxima'));
      if ($('pillPneus')) $('pillPneus').addEventListener('click', () => alternarFiltroAlerta('pneu'));
      if ($('pillRevisao')) $('pillRevisao').addEventListener('click', () => alternarFiltroAlerta('revisao'));
      if ($('pillOleoVencido')) $('pillOleoVencido').addEventListener('click', () => alternarFiltroAlerta('oleo_vencido'));
      if ($('pillOleoProximo')) $('pillOleoProximo').addEventListener('click', () => alternarFiltroAlerta('oleo_proximo'));

      $('btnFilterAlerts').addEventListener('click', () => {
        if (state.alertOnly || state.alertType) {
          state.alertOnly = false;
          state.alertType = '';
        } else {
          state.alertOnly = true;
          state.alertType = 'all';
        }
        onFilterChange();
      });

      // ==============================================================================
      // FILTROS E ORDENAÇÃO
      // ==============================================================================
      const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      function applyFilters() {
        const q = state.q.toLowerCase().trim(), qn = norm(q);
        const today = isoLocal(new Date());
        const d7 = isoLocal(new Date(Date.now() - 7 * 864e5));
        const d30 = isoLocal(new Date(Date.now() - 30 * 864e5));
        const known = ['Kombi', 'Transit', 'Master'];
        const mapaMensal = obterStatusMensalPorPlaca();

        state.filtered = state.all.filter(it => {
          const isInativo = it.status === 'inativo';
          if (state.status === 'Inativo') {
            if (!isInativo) return false;
          } else if (state.status === 'Em Manutenção') {
            if (isInativo) return false;
            const m = getManutencaoData(it);
            if (!m || m.status !== 'Em manutenção') return false;
          } else if (state.status === 'Manutenção Concluída') {
            if (isInativo) return false;
            const m = getManutencaoData(it);
            if (!m || m.status !== 'Já foi para manutenção') return false;
          } else {
            if (isInativo) return false;
            if (state.status && it.liberacao !== state.status) return false;
          }

          if (state.alertOnly || state.alertType) {
            const isBlk = it.liberacao === 'Não liberado';
            const isPn = it.pneu_dano === 'Sim';
            const diffRev = (it.km && it.rev_prox_km) ? (Number(it.rev_prox_km) - Number(it.km)) : null;
            const isRev = diffRev !== null && diffRev <= 1000;
            const pNorm = (it.placa || '').toUpperCase().trim();
            const infoM = pNorm ? mapaMensal.get(pNorm) : null;
            const isLatestOfPlate = Boolean(infoM && String(infoM.latestId) === String(it.id));
            const isVistProx = isLatestOfPlate && infoM.ciclo?.status === 'proxima';
            const isVistVenc = isLatestOfPlate && infoM.ciclo?.status === 'vencida';

            if (state.alertType === 'bloqueado') {
              if (!isBlk) return false;
            } else if (state.alertType === 'vistoria_vencida') {
              if (!isVistVenc) return false;
            } else if (state.alertType === 'vistoria_proxima') {
              if (!isVistProx) return false;
            } else if (state.alertType === 'pneu') {
              if (!isPn) return false;
            } else if (state.alertType === 'revisao') {
              if (!isRev) return false;
            } else if (state.alertType === 'oleo_vencido') {
              const stO = typeof calcularStatusOleoPorKm === 'function' ? calcularStatusOleoPorKm(it.placa) : null;
              if (!stO || stO.status !== 'vencido') return false;
            } else if (state.alertType === 'oleo_proximo') {
              const stO = typeof calcularStatusOleoPorKm === 'function' ? calcularStatusOleoPorKm(it.placa) : null;
              if (!stO || stO.status !== 'proximo') return false;
            } else {
              const stO = typeof calcularStatusOleoPorKm === 'function' ? calcularStatusOleoPorKm(it.placa) : null;
              const isOleoAlert = stO && (stO.status === 'vencido' || stO.status === 'proximo');
              if (!isBlk && !isPn && !isRev && !isVistProx && !isVistVenc && !isOleoAlert) return false;
            }
          }
          if (q) {
            const hay = (it.placa || '') + ' ' + (it.motorista || '') + ' ' + (it.numero || '') + ' ' + (it.rota || '') + ' ' + (it.obs || '');
            const hayL = hay.toLowerCase();
            if (!hayL.includes(q) && !(qn && norm(hayL).includes(qn))) return false;
          }
          if (state.equipe) {
            const rDigits = String(it.rota || '').replace(/\D/g, '');
            const eqItem = EQUIPES_VENDEDORES_PADRAO.find(x => x.rota === rDigits);
            if (!eqItem || eqItem.equipe !== state.equipe) return false;
          }
          if (state.rota === '__sem_rota__') { if (it.rota && String(it.rota).trim()) return false; }
          else if (state.rota && String(it.rota || '').trim() !== state.rota) return false;
          if (state.veic === 'Outro') { if (known.includes(it.veiculo)) return false; }
          else if (state.veic && it.veiculo !== state.veic) return false;
          const dt = it.data || '';
          if (state.per === 'hoje' && dt !== today) return false;
          if (state.per === '7dias' && dt < d7) return false;
          if (state.per === '30dias' && dt < d30) return false;
          return true;
        });

        const key = it => state.sortCol === 'data' ? (it.data || '') + ' ' + (it.hora || '') : String(it[state.sortCol] ?? '');
        const dir = state.sortAsc ? 1 : -1;
        state.filtered.sort((a, b) => {
          const A = key(a), B = key(b);
          if (A < B) return -dir;
          if (A > B) return dir;
          return (b.id - a.id) * -dir * -1;
        });
      }

      function onFilterChange() { state.page = 1; renderAll(); }

      $('filtroBusca').addEventListener('input', e => { state.q = e.target.value; onFilterChange(); });
      $('filtroVeiculo').addEventListener('change', e => { state.veic = e.target.value; onFilterChange(); });
      if ($('filtroEquipeVistoria')) {
        $('filtroEquipeVistoria').addEventListener('change', e => {
          state.equipe = e.target.value;
          onFilterChange();
        });
      }
      $('filtroRota').addEventListener('change', e => { state.rota = e.target.value; onFilterChange(); });
      $('filtroPeriodo').addEventListener('change', e => { state.per = e.target.value; onFilterChange(); });
      $('btnClearFilters').addEventListener('click', clearFilters);

      function popularFiltroRotas() {
        const sel = $('filtroRota');
        if (!sel) return;
        const rotas = [...new Set(state.all.map(it => String(it.rota || '').trim()).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
        const temSemRota = state.all.some(it => !String(it.rota || '').trim());
        const assinatura = rotas.join('|') + '#' + temSemRota;
        if (sel.dataset.sig !== assinatura) {
          sel.dataset.sig = assinatura;
          sel.innerHTML = '<option value="">Todas as rotas</option>' +
            rotas.map(r => '<option value="' + esc(r) + '">' + esc(r) + '</option>').join('') +
            (temSemRota ? '<option value="__sem_rota__">Sem rota</option>' : '');
        }
        sel.value = state.rota;
      }

      function clearFilters() {
        state.status = state.q = state.veic = state.per = state.rota = '';
        state.alertOnly = false;
        state.alertType = '';
        $('btnFilterAlerts').textContent = 'Filtrar Alertas';
        $('btnFilterAlerts').style.background = 'rgba(255,255,255,0.15)';
        $('filtroBusca').value = ''; $('filtroVeiculo').value = ''; $('filtroPeriodo').value = ''; $('filtroRota').value = '';
        if ($('filtroEquipeVistoria')) $('filtroEquipeVistoria').value = '';
        state.equipe = '';
        onFilterChange();
      }

      $('tabs').addEventListener('click', e => {
        const t = e.target.closest('.tab');
        if (!t) return;
        state.status = t.dataset.status;
        onFilterChange();
      });

      document.querySelectorAll('.th-sort').forEach(b => b.addEventListener('click', () => {
        const col = b.dataset.sort;
        if (state.sortCol === col) state.sortAsc = !state.sortAsc;
        else { state.sortCol = col; state.sortAsc = false; }
        renderAll();
      }));

      // ==============================================================================
      // TABELA DE VISTORIAS
      // ==============================================================================
      function skeletonRows() {
        return Array.from({ length: 6 }, () =>
          '<tr>' +
          '<td class="c-num"><span class="sk w55"></span></td>' +
          '<td class="c-date"><span class="sk"></span></td>' +
          '<td class="c-veic"><span class="sk w90"></span></td>' +
          '<td class="c-driver"><span class="sk w90"></span></td>' +
          '<td class="c-av"><span class="sk w55"></span></td>' +
          '<td class="c-pneu"><span class="sk w55"></span></td>' +
          '<td class="c-nok"><span class="sk w40"></span></td>' +
          '<td class="c-status"><span class="sk w90"></span></td>' +
          '<td class="c-act"><span class="sk w90"></span></td>' +
          '</tr>'
        ).join('');
      }

      function extrairMotivoInativacao(it) {
        if (!it) return '';
        if (it.motivo_inativacao) return it.motivo_inativacao;
        if (!it.obs) return 'Inativada pela gestão';
        const match = it.obs.match(/Motivo:\s*([^\]\n]+)/i);
        return match ? match[1].trim() : 'Inativada pela gestão';
      }

      function emptyRow(kind) {
        if (state.status === 'Inativo') {
          return '<tr><td class="empty" colspan="9">' + icon('archive') + '<h2>Nenhuma vistoria inativada</h2><p>Vistorias inativadas/arquivadas aparecerão aqui quando forem retiradas da listagem ativa.</p></td></tr>';
        }
        const map = {
          none: ['inbox', 'Nenhuma vistoria recebida ainda', 'Quando um motorista concluir um check-list no aplicativo, ele aparecerá aqui automaticamente.', ''],
          filtered: ['search', 'Nada encontrado com esses filtros', 'Tente outra placa, outro período ou volte para todas as situações.', '<button type="button" class="btn" data-act="clear">Limpar filtros</button>'],
          error: ['alert', 'Não foi possível carregar as vistorias', 'Confira a conexão com a internet. O painel tenta reconectar automaticamente.', '<button type="button" class="btn" data-act="retry">Tentar agora</button>']
        };
        const [ic, title, text, action] = map[kind];
        return '<tr><td class="empty" colspan="9">' + icon(ic) + '<h2>' + title + '</h2><p>' + text + '</p>' + action + '</td></tr>';
      }

      function rowHtml(it, mapaMensalRef = null) {
        const av = avariasOf(it).length;
        const nok = nokOf(it).length;
        const alert = pneuAlert(it);
        const id = esc(it.id);
        const num = esc(it.numero || '—');
        const placaRaw = (it.placa || '').toUpperCase().trim();
        const placa = esc(placaRaw);
        const isInat = it.status === 'inativo';

        // Ciclo Mensal (30 dias) apenas para a vistoria mais recente de cada veículo ativo
        const mapaMensal = mapaMensalRef || obterStatusMensalPorPlaca();
        const infoMensal = (!isInat && placaRaw) ? mapaMensal.get(placaRaw) : null;
        const isLatestOfPlate = Boolean(infoMensal && String(infoMensal.latestId) === String(it.id));
        const cicloMensal = isLatestOfPlate ? infoMensal.ciclo : null;
        const isMensalVencida = Boolean(cicloMensal && cicloMensal.status === 'vencida');
        const isMensalProxima = Boolean(cicloMensal && cicloMensal.status === 'proxima');

        // Diagnóstico de Alertas Operacionais da Linha
        const kmAtual = Number(it.km) || 0;
        const kmRev = Number(it.rev_prox_km) || 0;
        const diffRev = (kmRev > 0 && kmAtual > 0) ? (kmRev - kmAtual) : null;
        const isRevOverdue = diffRev !== null && diffRev <= 0;
        const isRevClose = diffRev !== null && diffRev > 0 && diffRev <= 1000;
        const isRevAlert = isRevOverdue || isRevClose;
        const isPnAlert = it.pneu_dano === 'Sim';
        const isBlkAlert = it.liberacao === 'Não liberado';

        let alertRowClass = '';
        if (isBlkAlert || isRevOverdue || isPnAlert || isMensalVencida) {
          alertRowClass = ' row-alert-red';
        } else if (isRevClose || isMensalProxima) {
          alertRowClass = ' row-alert-yellow';
        }

        return '<tr data-id="' + id + '" class="' + (state.fresh.has(it.id) ? 'row-new' : '') + (isInat ? ' row-inat' : '') + alertRowClass + '">' +
          '<td class="c-num"><button type="button" class="num" data-act="open" data-id="' + id + '" aria-label="Abrir vistoria ' + num + '">' + num + '</button></td>' +
          '<td class="c-date">' +
          '<span class="t1">' + formatarData(it.data) + '</span>' +
          '<span class="t2">' + esc(it.hora || '--:--') + '</span>' +
          (cicloMensal ? '<span class="t2" style="font-size:11px;margin-top:2px;color:' + (isMensalVencida ? '#f87171' : (isMensalProxima ? '#fbbf24' : 'var(--ink-3)')) + ';font-weight:' + ((isMensalVencida || isMensalProxima) ? '700' : '500') + '" title="Ciclo de vistoria mensal (a cada 30 dias)">Próx: ' + esc(cicloMensal.dataProximaFmt) + '</span>' : '') +
          '</td>' +
          '<td class="c-veic">' +
          '<div class="stack">' +
          '<button type="button" class="plate" data-act="history" data-placa="' + placa + '" title="Ver histórico deste veículo">' + placa + '</button>' +
          '<span class="t2">' + esc(it.veiculo || '—') + '</span>' +
          '</div>' +
          '</td>' +
          '<td class="c-driver">' +
          '<div class="stack">' +
          '<span class="t1">' + esc(it.motorista || 'Não informado') + '</span>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
          '<span class="badge-km">' + fmtKm(it.km) + '</span>' +
          (it.rota
            ? '<span class="badge-rota" title="Rota do Vendedor">' + esc(it.rota) + '</span>'
            : '<button type="button" class="btn-add-rota-inline" data-act="editar" data-id="' + id + '" title="Adicionar rota desta vistoria">+ Rota</button>'
          ) +
          '</div>' +
          (isInat ? '<div class="txt-motivo-inat" title="Motivo da inativação">' + icon('alert') + ' <span>Motivo: ' + esc(extrairMotivoInativacao(it)) + '</span></div>' : '') +
          '</div>' +
          '</td>' +
          '<td class="c-av">' + (av ? '<span class="txt-warn">' + av + ' ' + (av === 1 ? 'marca' : 'marcas') + '</span>' : '<span class="muted">Íntegro</span>') + '</td>' +
          '<td class="c-pneu">' +
          (isPnAlert
            ? '<span class="badge-row-alert red"><svg class="i" style="width:11px;height:11px;stroke-width:2.2"><use href="#i-alert"/></svg> Danificado</span>'
            : alert
              ? '<span class="txt-warn">Atenção</span>'
              : '<span class="muted">Normal</span>'
          ) +
          '</td>' +
          '<td class="c-nok">' + (nok ? '<span class="txt-bad">' + nok + '</span>' : '<span class="muted">—</span>') + '</td>' +
          '<td class="c-status">' +
          statusTag(it.liberacao, it.status) +
          (() => {
            const m = getManutencaoData(it);
            if (m && m.status === 'Em manutenção') {
              return '<div><span class="badge-maint-pill em" title="' + esc(m.obs || 'Veículo na oficina') + '">' + icon('tool') + ' Em Manutenção</span></div>';
            } else if (m && m.status === 'Já foi para manutenção') {
              return '<div><span class="badge-maint-pill ja" title="' + esc(m.obs || 'Manutenção realizada') + '">' + icon('check') + ' Manutenção Feita</span></div>';
            }
            return '';
          })() +
          ((isMensalVencida || isMensalProxima)
            ? '<div style="margin-top:4px"><span class="badge-row-alert ' + (isMensalVencida ? 'red' : 'yellow') + '" title="' + esc(cicloMensal.labelBadge) + '">' +
            '<svg class="i" style="width:10px;height:10px;stroke-width:2.2"><use href="#i-calendar"/></svg>' +
            '<span>' + esc(cicloMensal.labelCurto) + '</span>' +
            '</span></div>'
            : '') +
          (isRevAlert
            ? '<div style="margin-top:4px"><span class="badge-row-alert ' + (isRevOverdue ? 'red' : 'yellow') + '" title="Meta da revisão: ' + fmtKm(kmRev) + '">' +
            '<svg class="i" style="width:10px;height:10px;stroke-width:2.2"><use href="#i-tool"/></svg>' +
            '<span>' + (isRevOverdue ? 'Revisão Vencida' : 'Revisão em ' + diffRev.toLocaleString('pt-BR') + ' km') + '</span>' +
            '</span></div>'
            : '') +
          '</td>' +
          '<td class="c-act">' +
          '<div class="row-actions">' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="open" data-id="' + id + '" title="Ver detalhes completos">' + icon('eye') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="editar" data-id="' + id + '" title="Editar dados da vistoria e rota" style="color:var(--accent-hi)">' + icon('edit') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="manutencao" data-id="' + id + '" title="Observações de Manutenção" style="' + (() => {
            const m = getManutencaoData(it);
            return m && m.status !== 'Nenhuma' ? 'color:#f59e0b' : '';
          })() + '">' + icon('tool') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="print" data-id="' + id + '" title="Imprimir 2ª Via Oficial">' + icon('printer') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="pdf" data-id="' + id + '" title="Baixar PDF Oficial">' + icon('download') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-icon" data-act="sigs" data-id="' + id + '" title="Baixar Assinaturas Digitais">' + icon('pen') + '</button>' +
          (isInat
            ? '<button type="button" class="btn btn-ghost btn-icon" data-act="reativar" data-id="' + id + '" title="Reativar Vistoria para o Painel" style="color:var(--ok)">' + icon('refresh') + '</button>'
            : '<button type="button" class="btn btn-ghost btn-icon" data-act="inativar" data-id="' + id + '" title="Inativar Vistoria (Arquivar com motivo)" style="color:var(--bad)">' + icon('archive') + '</button>'
          ) +
          '</div>' +
          '</td>' +
          '</tr>';
      }

      function renderTable() {
        applyFilters();
        const body = $('tableBody');
        const total = state.filtered.length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (state.page > pages) state.page = pages;
        const start = (state.page - 1) * PAGE_SIZE;
        const items = state.filtered.slice(start, start + PAGE_SIZE);

        const hasFilters = !!(state.status || state.q || state.veic || state.per || state.rota || state.alertOnly || state.alertType);
        $('btnClearFilters').hidden = !hasFilters;
        document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.status === state.status && !state.alertOnly && !state.alertType)));
        document.querySelectorAll('.grid th[data-col]').forEach(th => {
          th.setAttribute('aria-sort', th.dataset.col === state.sortCol ? (state.sortAsc ? 'ascending' : 'descending') : 'none');
        });

        if (!state.loaded) {
          body.innerHTML = state.error ? emptyRow('error') : skeletonRows();
          $('tableInfo').textContent = state.error ? 'Sem dados' : 'Carregando…';
        } else if (!state.all.length) {
          body.innerHTML = emptyRow('none');
          $('tableInfo').textContent = '0 vistorias';
        } else if (!total) {
          body.innerHTML = emptyRow('filtered');
          $('tableInfo').textContent = '0 de ' + state.all.length + ' vistorias';
        } else {
          const mapaMensal = obterStatusMensalPorPlaca();
          body.innerHTML = items.map(it => rowHtml(it, mapaMensal)).join('');
          $('tableInfo').textContent = (start + 1) + '–' + (start + items.length) + ' de ' + total + ' ' + (total === 1 ? 'vistoria' : 'vistorias');
        }

        $('pageIndicator').textContent = 'Página ' + state.page + ' de ' + pages;
        $('btnPrevPage').disabled = state.page <= 1;
        $('btnNextPage').disabled = state.page >= pages;
      }

      function renderAll() {
        popularFiltroRotas();
        renderSummary();
        renderTable();
        renderManutencaoViewGeral();
        renderVendedoresView();
        if (typeof renderGastosView === 'function') renderGastosView();
        if (typeof renderGaleriaView === 'function') renderGaleriaView();
        if (typeof renderFrotaCadView === 'function') renderFrotaCadView();
      }

      $('btnPrevPage').addEventListener('click', () => { if (state.page > 1) { state.page--; renderTable(); } });
      $('btnNextPage').addEventListener('click', () => { state.page++; renderTable(); });

      $('tableBody').addEventListener('click', e => {
        const btn = e.target.closest('[data-act]');
        if (btn) {
          const act = btn.dataset.act;
          if (act === 'open') openDrawer(btn.dataset.id, btn, 'vistoria');
          else if (act === 'editar' || act === 'edit') abrirModalEditarVistoria(btn.dataset.id);
          else if (act === 'manutencao') openDrawer(btn.dataset.id, btn, 'manut');
          else if (act === 'pdf') baixarPdfOficial(btn.dataset.id, btn, false);
          else if (act === 'print') baixarPdfOficial(btn.dataset.id, btn, true);
          else if (act === 'sigs') {
            const item = state.all.find(x => String(x.id) === String(btn.dataset.id));
            if (item) baixarTodasAssinaturas(item);
          }
          else if (act === 'history') abrirHistoricoVeiculo(btn.dataset.placa);
          else if (act === 'inativar') {
            const item = state.all.find(x => String(x.id) === String(btn.dataset.id));
            if (item) abrirModalInativar(item);
          }
          else if (act === 'reativar') {
            const item = state.all.find(x => String(x.id) === String(btn.dataset.id));
            if (item) reativarVistoria(item);
          }
          else if (act === 'clear') clearFilters();
          else if (act === 'retry') load();
          return;
        }
        const row = e.target.closest('tr[data-id]');
        if (row) openDrawer(row.dataset.id, row.querySelector('.num'));
      });

      // ==============================================================================
      // GAVETA DE DETALHES & WORKFLOW DE APROVAÇÃO
      // ==============================================================================
      const SIG_ROLES = [['ass_motorista', 'Motorista / vendedor'], ['ass_vistoriador', 'Vistoriador'], ['ass_responsavel', 'Responsável da frota']];
      const revText = (km, dt) => [km ? fmtKm(km) : null, dt ? formatarData(dt) : null].filter(Boolean).join(' · ') || '—';

      function renderSigs(row) {
        $('drSigs').innerHTML = SIG_ROLES.map(([k, label]) => {
          let body;
          if (row === null) body = '<span class="sk"></span>';
          else if (row[k] && /^data:image\//.test(row[k])) {
            body = '<img src="' + esc(row[k]) + '" alt="Assinatura de ' + esc(label) + '">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:6px">' +
              '<span class="sig-st ok">Assinado</span>' +
              '<button type="button" class="btn btn-ghost" onclick="baixarAssinaturaUnica(\'' + k + '\')" style="height:24px;padding:0 8px;font-size:11px" title="Baixar esta assinatura em PNG">' +
              icon('download') + ' <span>Baixar PNG</span>' +
              '</button>' +
              '</div>';
          } else {
            body = '<span class="sig-st">Pendente</span>';
          }
          return '<div class="sig"><span class="sig-role">' + label + '</span>' + body + '</div>';
        }).join('');
      }

      function selecionarDecisao(status) {
        state.decisaoAtual = status;
        $('btnSetLiberado').className = 'btn-decision' + (status === 'Liberado' ? ' active-liberado' : '');
        $('btnSetRessalva').className = 'btn-decision' + (status === 'Ressalva' ? ' active-ressalva' : '');
        $('btnSetBloqueado').className = 'btn-decision' + (status === 'Não liberado' ? ' active-bloqueado' : '');
      }
      window.selecionarDecisao = selecionarDecisao;

      async function salvarDecisaoGestor() {
        if (!podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        if (!state.sel) return;
        const status = state.decisaoAtual || state.sel.liberacao;
        const parecer = $('drParecerInput').value.trim();
        const btn = $('btnSalvarParecer');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        // Preservar tags de auditoria e manutenção existentes no registro
        const tagsExtras = (state.sel.obs || '').match(/\[(INATIVADO|REATIVADO|MANUTENCAO)[^\]]+\]/gi) || [];
        const obsFinal = (parecer + (tagsExtras.length ? (parecer ? '\n' : '') + tagsExtras.join('\n') : '')).trim();

        try {
          const { synced } = await persistirNoBanco(state.sel.id, {
            liberacao: status,
            obs: obsFinal
          });

          $('drStatus').innerHTML = statusTag(status, state.sel.status);
          if ($('drEditLiberacao')) $('drEditLiberacao').value = status;
          if ($('drEditObs')) $('drEditObs').value = parecer;
          const obsLinhas = formatarObservacoesParaPdf(obsFinal, state.sel);
          const partes = extrairPartesObservacao(obsFinal);
          $('drNotesSec').hidden = !Boolean(partes.textoLivre || partes.manutencao || partes.auditoria.length);
          $('drNotes').innerHTML = obsLinhas.map(l => '<div style="margin-bottom:4px;line-height:1.45">' + esc(l) + '</div>').join('');
          renderAll();
          toast('Parecer e situação salvos com sucesso!');
        } catch (err) {
          toast('Erro ao salvar: ' + err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = icon('check') + ' Salvar Parecer';
        }
      }
      window.salvarDecisaoGestor = salvarDecisaoGestor;

      // ==============================================================================