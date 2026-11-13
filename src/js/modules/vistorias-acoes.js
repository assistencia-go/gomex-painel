      // DOWNLOAD INDIVIDUAL E EM LOTE DE ASSINATURAS DIGITAIS
      // ==============================================================================
      function baixarAssinatura(dataUrl, nomeArquivo) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      async function baixarTodasAssinaturas(c) {
        if (!c) return;
        let sigRow = state.sigCache[c.id];
        if (!sigRow) {
          toast('Carregando assinaturas...', 'loading');
          const rows = await fetchSigs(c.id);
          sigRow = rows && rows[0] ? rows[0] : {};
          state.sigCache[c.id] = sigRow;
        }

        const sigs = [
          { key: 'ass_motorista', papel: 'Motorista' },
          { key: 'ass_vistoriador', papel: 'Vistoriador' },
          { key: 'ass_responsavel', papel: 'Responsavel_Frota' }
        ].filter(s => sigRow[s.key] && /^data:image\//.test(sigRow[s.key]));

        if (!sigs.length) {
          toast('Nenhuma assinatura digital anexada a esta vistoria.', 'error');
          return;
        }

        const num = c.numero || '000000';
        const placa = (c.placa || 'FROTA').toUpperCase().replace(/[^A-Z0-9]/g, '');

        sigs.forEach((s, idx) => {
          setTimeout(() => {
            const fileName = `Assinatura_${s.papel}_Vistoria_${num}_${placa}.png`;
            baixarAssinatura(sigRow[s.key], fileName);
          }, idx * 250);
        });

        toast(`${sigs.length} assinatura(s) baixada(s) em PNG!`);
      }
      window.baixarTodasAssinaturas = baixarTodasAssinaturas;

      function baixarAssinaturaUnica(chave) {
        if (!state.sel) return;
        const sigRow = state.sigCache[state.sel.id] || {};
        const dataUrl = sigRow[chave];
        if (!dataUrl) {
          toast('Assinatura não encontrada.', 'error');
          return;
        }
        const num = state.sel.numero || '000000';
        const placa = (state.sel.placa || 'FROTA').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const papel = chave === 'ass_motorista' ? 'Motorista' : chave === 'ass_vistoriador' ? 'Vistoriador' : 'Responsavel_Frota';
        baixarAssinatura(dataUrl, `Assinatura_${papel}_Vistoria_${num}_${placa}.png`);
        toast(`Assinatura de ${papel} baixada com sucesso!`);
      }
      window.baixarAssinaturaUnica = baixarAssinaturaUnica;

      // ==============================================================================
      // GESTÃO DE INATIVAÇÃO DE VISTORIAS (ARQUIVAMENTO COM MOTIVO OBRIGATÓRIO)
      // ==============================================================================
      let vistoriaParaInativar = null;

      function abrirModalInativar(it) {
        if (!podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        if (!it) return;
        vistoriaParaInativar = it;
        $('inativarModalTitle').textContent = 'Inativar Vistoria Nº ' + (it.numero || '—');
        $('inatVeicLabel').textContent = it.veiculo || '—';
        $('inatPlacaLabel').textContent = (it.placa || '—').toUpperCase();
        $('inatMotoristaLabel').textContent = it.motorista || '—';
        $('inatDataLabel').textContent = formatarData(it.data);
        $('motivoInativacaoInput').value = '';
        $('motivoInativacaoErro').style.display = 'none';
        $('modalInativar').classList.add('open');
        setTimeout(() => $('motivoInativacaoInput').focus(), 80);
      }
      window.abrirModalInativar = abrirModalInativar;

      function fecharModalInativar() {
        vistoriaParaInativar = null;
        $('modalInativar').classList.remove('open');
      }
      window.fecharModalInativar = fecharModalInativar;

      $('modalInativar').addEventListener('click', e => {
        if (e.target === $('modalInativar')) fecharModalInativar();
      });
      $('historyModal').addEventListener('click', e => {
        if (e.target === $('historyModal')) fecharHistoricoModal();
      });
      if ($('modalEditarVistoria')) {
        $('modalEditarVistoria').addEventListener('click', e => {
          if (e.target === $('modalEditarVistoria')) fecharModalEditarVistoria();
        });
      }
      if ($('modalHistVendedor')) {
        $('modalHistVendedor').addEventListener('click', e => {
          if (e.target === $('modalHistVendedor')) fecharModalVendedor();
        });
      }
      if ($('modalCustodiaVeiculo')) {
        $('modalCustodiaVeiculo').addEventListener('click', e => {
          if (e.target === $('modalCustodiaVeiculo')) fecharModalCustodia();
        });
      }

      async function confirmarInativacao() {
        if (!podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        if (!vistoriaParaInativar) return;
        const motivo = $('motivoInativacaoInput').value.replace(/[\[\]\r\n]/g, ' ').trim();
        if (!motivo) {
          $('motivoInativacaoErro').style.display = 'block';
          $('motivoInativacaoInput').focus();
          return;
        }
        $('motivoInativacaoErro').style.display = 'none';

        const btn = $('btnConfirmarInativacao');
        btn.disabled = true;
        btn.textContent = 'Inativando...';

        const d = new Date();
        const usuario = ($('userNameLabel') && $('userNameLabel').textContent) || 'gomex';
        const carimbo = `[INATIVADO em ${formatarData(isoLocal(d))} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} por ${usuario} - Motivo: ${motivo}]`;
        const novaObs = (vistoriaParaInativar.obs ? vistoriaParaInativar.obs + '\n' : '') + carimbo;
        const targetVistoria = vistoriaParaInativar;

        try {
          const { synced } = await persistirNoBanco(targetVistoria.id, {
            status: 'inativo',
            obs: novaObs,
            motivo_inativacao: motivo
          });

          fecharModalInativar();
          if (state.sel && state.sel.id === targetVistoria.id) {
            closeDrawer();
          }
          renderAll();
          toast(synced
            ? `Vistoria Nº ${targetVistoria.numero || ''} inativada e salva no banco!`
            : `Vistoria Nº ${targetVistoria.numero || ''} inativada localmente (sincronizará automaticamente)!`
          );
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = icon('check') + ' Confirmar Inativação';
        }
      }
      window.confirmarInativacao = confirmarInativacao;

      async function reativarVistoria(it) {
        if (!podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        if (!it) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Reativar Vistoria',
          subtitulo: 'Retornar vistoria para a frota ativa',
          mensagem: `Deseja reativar a Vistoria <strong>Nº ${esc(it.numero || '')}</strong> (${esc((it.placa || '').toUpperCase())}) para a lista operacional ativa?`,
          aviso: 'O status será alterado para concluído e registrado no histórico com carimbo da data e hora atual.',
          textoConfirmar: 'Reativar Vistoria',
          variante: 'padrao',
          icone: 'check'
        });
        if (!confirmado) return;

        const d = new Date();
        const usuario = ($('userNameLabel') && $('userNameLabel').textContent) || 'gomex';
        const carimbo = `[REATIVADO em ${formatarData(isoLocal(d))} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} por ${usuario}]`;
        const novaObs = (it.obs ? it.obs + '\n' : '') + carimbo;

        try {
          const { synced } = await persistirNoBanco(it.id, {
            status: 'concluido',
            obs: novaObs
          });
          delete it.motivo_inativacao;

          if (state.sel && state.sel.id === it.id) {
            fillDrawer(state.sel);
          }
          renderAll();
          toast(synced
            ? `Vistoria Nº ${it.numero || ''} reativada com sucesso!`
            : `Vistoria Nº ${it.numero || ''} reativada localmente (sincronizará automaticamente)!`
          );
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
      window.reativarVistoria = reativarVistoria;

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          if ($('modalNotificacoesPush') && $('modalNotificacoesPush').classList.contains('open')) fecharModalNotificacoesPush();
          else if ($('modalVerFotoGaleria') && $('modalVerFotoGaleria').classList.contains('open')) fecharLightboxFoto();
          else if ($('modalSubirFotoGaleria') && $('modalSubirFotoGaleria').classList.contains('open')) fecharModalSubirFoto();
          else if ($('modalLancarGasto') && $('modalLancarGasto').classList.contains('open')) fecharModalLancarGasto();
          else if ($('modalCatalogoProdutos') && $('modalCatalogoProdutos').classList.contains('open')) fecharModalCatalogoProdutos();
          else if ($('modalInativar') && $('modalInativar').classList.contains('open')) fecharModalInativar();
          else if ($('modalEditarVistoria') && $('modalEditarVistoria').classList.contains('open')) fecharModalEditarVistoria();
          else if ($('modalHistVendedor') && $('modalHistVendedor').classList.contains('open')) fecharModalVendedor();
          else if ($('modalCustodiaVeiculo') && $('modalCustodiaVeiculo').classList.contains('open')) fecharModalCustodia();
          else if ($('historyModal') && $('historyModal').classList.contains('open')) fecharHistoricoModal();
          else closeDrawer();
          return;
        }
        if (e.key === '/' && authed && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) {
          e.preventDefault();
          if (state.visaoAtual === 'gastos' && $('gastoFiltroBusca')) $('gastoFiltroBusca').focus();
          else if (state.visaoAtual === 'galeria' && $('galFiltroBusca')) $('galFiltroBusca').focus();
          else $('filtroBusca').focus();
        }
      });

      // ==============================================================================
      // MODAL DE HISTÓRICO COMPLETO DA PLACA
      // ==============================================================================
      function abrirHistoricoVeiculo(placa) {
        if (!placa) return;
        const pNorm = placa.toUpperCase().trim();
        $('histPlateTitle').textContent = pNorm;

        const info = obterInfoPlacaNaFrota(pNorm);
        if ($('histVeiculoSubTitle')) {
          $('histVeiculoSubTitle').textContent = (info.veiculo || 'Veículo da Frota') + (info.motorista ? ' · Titular: ' + info.motorista : '');
        }

        const vistorias = (state.all || [])
          .filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === pNorm)
          .sort((a, b) => ((b.data || '') + ' ' + (b.hora || '')).localeCompare((a.data || '') + ' ' + (a.hora || '')));

        state.histAtualPlaca = pNorm;
        state.histAtualVistorias = vistorias;

        $('histTotalCount').textContent = vistorias.length;
        if ($('histFirstDate')) {
          $('histFirstDate').textContent = vistorias.length
            ? 'Desde ' + formatarData(vistorias[vistorias.length - 1].data)
            : 'Sem vistorias';
        }

        // Quilometragem atual e percorrida
        let kmMax = null;
        let kmMin = null;
        vistorias.forEach(v => {
          if (v.km && !isNaN(Number(v.km))) {
            const k = Number(v.km);
            if (kmMax === null || k > kmMax) kmMax = k;
            if (kmMin === null || k < kmMin) kmMin = k;
          }
        });

        const stOleo = calcularStatusOleoPorKm(pNorm);
        const kmAtual = (kmMax !== null) ? kmMax : (stOleo.kmAtual || (info.km ? Number(info.km) : null));
        $('histLastKm').textContent = kmAtual ? fmtKm(kmAtual) : '—';

        const kmRodados = (kmMax !== null && kmMin !== null && kmMax >= kmMin) ? (kmMax - kmMin) : 0;
        if ($('histKmRodadosSub')) {
          $('histKmRodadosSub').textContent = kmRodados > 0 ? fmtKm(kmRodados) + ' rodados' : 'Base cadastrada';
        }

        // Total investido em Peças + O.S. da placa
        const itensGastos = (gastosState.lancamentos || []).filter(g => (g.placa || '').toUpperCase().trim() === pNorm);
        const somaPecas = itensGastos.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);

        let somaOS = 0;
        vistorias.forEach(v => {
          const m = getManutencaoData(v);
          if (m && m.custo) {
            const c = parseFloat(String(m.custo).replace(/\./g, '').replace(',', '.'));
            if (!isNaN(c)) somaOS += c;
          }
        });
        const totalInvestido = somaPecas + somaOS;

        if ($('histTotalGastoPlaca')) $('histTotalGastoPlaca').textContent = fmtMoeda(totalInvestido);
        if ($('histGastoPecasOSSub')) {
          $('histGastoPecasOSSub').textContent = fmtMoeda(somaPecas) + ' peças' + (somaOS > 0 ? ' + ' + fmtMoeda(somaOS) + ' OS' : '');
        }

        // Custo por KM
        if ($('histCustoPorKm')) {
          if (kmRodados > 0 && totalInvestido > 0) {
            const cKm = totalInvestido / kmRodados;
            $('histCustoPorKm').textContent = 'R$ ' + cKm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '/km';
          } else {
            $('histCustoPorKm').textContent = 'R$ 0,00/km';
          }
        }

        // Status da Troca de Óleo
        if ($('histStatusOleo')) {
          $('histStatusOleo').innerHTML = stOleo.badgeHtml;
        }
        if ($('histMetaOleoSub')) {
          $('histMetaOleoSub').textContent = 'Meta: a cada ' + fmtKm(stOleo.metaKm);
        }

        // Configurar botão de Cobrança WhatsApp no cabeçalho do prontuário
        const btnWpp = $('btnHistCobrarWpp');
        if (btnWpp) {
          const motResp = (vistorias[0] && vistorias[0].motorista) || info.motorista || 'Motorista';
          const motivo = stOleo.status === 'vencido' ? 'oleo_vencido' : (stOleo.status === 'proximo' ? 'oleo_proximo' : 'vistoria_mensal');
          btnWpp.onclick = () => abrirModalCopiarWhatsApp(motResp, pNorm, motivo, { diffKm: stOleo.diffKm });
        }

        if (typeof renderResumoGastosNoModalHistorico === 'function') {
          renderResumoGastosNoModalHistorico(pNorm);
        }
        if (typeof renderResumoGaleriaNoModalHistorico === 'function') {
          renderResumoGaleriaNoModalHistorico(pNorm);
        }

        filtrarTimelineHist('todos');
        $('historyModal').classList.add('open');
      }

      function filtrarTimelineHist(tipo) {
        state.filtroHistTimeline = tipo || 'todos';
        ['btnHistFilterAll', 'btnHistFilterAvarias', 'btnHistFilterBloq'].forEach(id => {
          const btn = $(id);
          if (btn) btn.classList.remove('active');
        });
        if (tipo === 'avarias' && $('btnHistFilterAvarias')) $('btnHistFilterAvarias').classList.add('active');
        else if (tipo === 'bloqueadas' && $('btnHistFilterBloq')) $('btnHistFilterBloq').classList.add('active');
        else if ($('btnHistFilterAll')) $('btnHistFilterAll').classList.add('active');

        renderTimelineModalHistorico();
      }
      window.filtrarTimelineHist = filtrarTimelineHist;

      function renderTimelineModalHistorico() {
        const vistorias = state.histAtualVistorias || [];
        const tipo = state.filtroHistTimeline || 'todos';
        const timelineEl = $('histTimeline');
        if (!timelineEl) return;

        const filtradas = vistorias.filter(v => {
          if (tipo === 'avarias') return avariasOf(v).length > 0;
          if (tipo === 'bloqueadas') return v.liberacao === 'Não liberado' || v.liberacao === 'Ressalva';
          return true;
        });

        if (!filtradas.length) {
          timelineEl.innerHTML = '<p class="muted" style="padding:14px 0;text-align:center">Nenhuma vistoria encontrada com este filtro na placa ' + esc(state.histAtualPlaca || '') + '.</p>';
          return;
        }

        timelineEl.innerHTML = filtradas.map(v => {
          const av = avariasOf(v).length;
          const nok = nokOf(v).length;
          const cls = v.liberacao === 'Não liberado' ? 'bad' : v.liberacao === 'Ressalva' ? 'warn' : 'ok';
          return '<div class="hist-item ' + cls + '">' +
            '<i class="hist-dot"></i>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<span style="font-weight:700;font-size:13px;color:var(--ink)">' +
            'Vistoria Nº ' + v.numero + ' · ' + formatarData(v.data) + ' às ' + (v.hora || '--:--') +
            '</span>' +
            statusTag(v.liberacao) +
            '</div>' +
            '<div style="font-size:12px;color:var(--ink-2);margin-top:2px">' +
            'Motorista: <b>' + esc(v.motorista || 'Não informado') + '</b> · Km: ' + fmtKm(v.km) + ' · Rota: ' + esc(v.rota || '—') + ' · ' + esc(v.tipo || 'Saída') +
            '</div>' +
            '<div style="font-size:11.5px;color:var(--ink-3);margin-top:2px">' +
            (av ? '<span class="txt-warn">' + av + ' avaria(s) na carroceria</span>' : 'Carroceria íntegra') +
            (nok ? ' · <span class="txt-bad">' + nok + ' item(ns) reprovado(s)</span>' : '') +
            '</div>' +
            '<div style="margin-top:6px">' +
            '<button type="button" class="btn btn-ghost" style="height:26px;font-size:11.5px;padding:0 8px" onclick="fecharHistoricoModal(); openDrawer(\'' + v.id + '\')">' +
            icon('eye') + ' Ver Ficha Desta Vistoria' +
            '</button>' +
            '</div>' +
            '</div>';
        }).join('');
      }

      function imprimirProntuarioVeiculo() {
        const placa = ($('histPlateTitle')?.textContent || '').toUpperCase().trim();
        if (!placa) return;
        const vistorias = (state.all || []).filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === placa);
        const stOleo = calcularStatusOleoPorKm(placa);
        const info = obterInfoPlacaNaFrota(placa);
        const lancs = (gastosState.lancamentos || []).filter(g => (g.placa || '').toUpperCase().trim() === placa);
        const totalInvestido = lancs.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);

        const printWin = window.open('', '_blank');
        if (!printWin) {
          toast('Permita a abertura de pop-ups para imprimir o prontuário.', 'error');
          return;
        }

        const html = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
          '<title>Prontuário - Placa ' + placa + ' - Gomex Frota</title>' +
          '<style>' +
          'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:24px;color:#1e293b;font-size:12.5px;line-height:1.45}' +
          '.head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #312e81;padding-bottom:12px;margin-bottom:16px}' +
          '.title{font-size:18px;font-weight:800;color:#312e81;margin:0}' +
          '.badge-placa{display:inline-block;padding:4px 12px;border-radius:6px;font-weight:800;font-size:15px;background:#e0e7ff;color:#3730a3}' +
          '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}' +
          '.box{padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}' +
          '.lbl{font-size:10.5px;color:#64748b;font-weight:700;text-transform:uppercase}' +
          '.val{font-size:15px;font-weight:800;color:#0f172a;margin-top:2px}' +
          'table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11.5px}' +
          'th{background:#f1f5f9;padding:6px 8px;text-align:left;font-weight:700;border-bottom:1px solid #cbd5e1}' +
          'td{padding:6px 8px;border-bottom:1px solid #e2e8f0}' +
          'h3{font-size:13px;font-weight:700;margin-top:18px;margin-bottom:6px;color:#1e1b4b;border-bottom:1px solid #e2e8f0;padding-bottom:4px}' +
          '@media print{button{display:none}}' +
          '</style></head><body>' +
          '<div class="head"><div><h1 class="title">GOMEX DISTRIBUIDORA · PRONTUÁRIO DO VEÍCULO</h1><div style="font-size:11px;color:#64748b">Controle de Frota · Vistorias, Peças e Prevenção de Troca de Óleo</div></div><div class="badge-placa">PLACA: ' + placa + '</div></div>' +
          '<div class="grid">' +
          '<div class="box"><div class="lbl">Veículo</div><div class="val">' + esc(info.veiculo || '—') + '</div></div>' +
          '<div class="box"><div class="lbl">Motorista Responsável</div><div class="val">' + esc(info.motorista || '—') + '</div></div>' +
          '<div class="box"><div class="lbl">KM Atual</div><div class="val">' + (stOleo.kmAtual ? fmtKm(stOleo.kmAtual) : '—') + '</div></div>' +
          '<div class="box"><div class="lbl">Total Investido</div><div class="val" style="color:#16a34a">' + fmtMoeda(totalInvestido) + '</div></div>' +
          '</div>' +
          '<div class="grid">' +
          '<div class="box"><div class="lbl">Total de Vistorias</div><div class="val">' + vistorias.length + '</div></div>' +
          '<div class="box"><div class="lbl">Status da Troca de Óleo</div><div class="val">' + esc(stOleo.labelCurto) + '</div></div>' +
          '<div class="box"><div class="lbl">Próxima Troca de Óleo</div><div class="val">' + (stOleo.kmProximaTroca ? fmtKm(stOleo.kmProximaTroca) : '—') + '</div></div>' +
          '<div class="box"><div class="lbl">Ciclo Recomendado</div><div class="val">A cada ' + fmtKm(stOleo.metaKm) + '</div></div>' +
          '</div>' +
          '<h3>HISTÓRICO RECENTE DE PEÇAS & GASTOS (' + lancs.length + ' lançamentos)</h3>' +
          '<table><thead><tr><th>Data</th><th>Produto / Peça / Óleo</th><th>Qtd</th><th>Total</th><th>Motorista</th><th>NF/OS</th></tr></thead><tbody>' +
          (lancs.length ? lancs.slice(0, 15).map(g => '<tr><td>' + formatarData(g.data) + '</td><td><strong>' + esc(g.produto_nome) + '</strong></td><td>' + g.quantidade + ' ' + esc(g.unidade || 'un') + '</td><td style="color:#16a34a;font-weight:700">' + fmtMoeda(g.valor_total) + '</td><td>' + esc(g.motorista || '—') + '</td><td>' + esc(g.nf_os || '—') + '</td></tr>').join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b">Nenhum gasto ou peça registrado nesta placa.</td></tr>') +
          '</tbody></table>' +
          '<h3>HISTÓRICO DE VISTORIAS (' + vistorias.length + ' vistorias)</h3>' +
          '<table><thead><tr><th>Nº</th><th>Data/Hora</th><th>Motorista</th><th>KM</th><th>Situação</th><th>Avarias</th></tr></thead><tbody>' +
          (vistorias.length ? vistorias.slice(0, 15).map(v => '<tr><td>' + v.numero + '</td><td>' + formatarData(v.data) + ' ' + esc(v.hora || '') + '</td><td>' + esc(v.motorista || '—') + '</td><td>' + (v.km ? v.km + ' km' : '—') + '</td><td><strong>' + esc(v.liberacao || '—') + '</strong></td><td>' + avariasOf(v).length + ' avarias</td></tr>').join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b">Nenhuma vistoria encontrada.</td></tr>') +
          '</tbody></table>' +
          '<div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:#64748b">Emitido pelo Painel Operacional Gomex Frota em ' + new Date().toLocaleDateString('pt-BR') + '</span><button onclick="window.print()" style="padding:6px 14px;background:#312e81;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700">Imprimir / Salvar PDF</button></div>' +
          '</body></html>';

        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        setTimeout(function () {
          try {
            printWin.focus();
            printWin.print();
          } catch (e) { }
        }, 400);
      }
      window.imprimirProntuarioVeiculo = imprimirProntuarioVeiculo;
      window.abrirHistoricoVeiculo = abrirHistoricoVeiculo;

      function fecharHistoricoModal() {
        $('historyModal').classList.remove('open');
      }
      window.fecharHistoricoModal = fecharHistoricoModal;

      // ==============================================================================