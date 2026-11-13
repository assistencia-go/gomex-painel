      // CADASTRO FIXO DA FROTA (VEÍCULOS, MOTORISTAS TITULARES, ÓLEO & REVISÃO)
      // ==============================================================================
      function sincronizarMotoristasComVistorias() {
        if (!Array.isArray(gastosState.veiculos) || !gastosState.veiculos.length) return;
        const vistorias = state.all || [];
        if (!vistorias.length) return;

        let alterou = false;
        gastosState.veiculos.forEach(v => {
          const p = (v.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
          if (!p) return;
          const rec = vistorias.find(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim() === p);
          if (rec && rec.motorista) {
            if (!v.motorista || v.motorista !== rec.motorista) {
              v.motorista = rec.motorista;
              alterou = true;
            }
            if (rec.rota && (!v.rota || v.rota === '—' || !v.rota.trim())) {
              v.rota = rec.rota;
              alterou = true;
            }
            if (rec.km && (!v.km_inicial || Number(rec.km) > Number(v.km_inicial))) {
              v.km_inicial = Number(rec.km);
              alterou = true;
            }
          }
        });
        if (alterou) {
          salvarGastosLocalStorage();
        }
      }
      window.sincronizarMotoristasComVistorias = sincronizarMotoristasComVistorias;

      function inicializarVeiculosFrotaPadraoSeVazio() {
        if (!Array.isArray(gastosState.veiculos) || gastosState.veiculos.length === 0) {
          if (typeof VEICULOS_PADRAO_FROTA !== 'undefined' && Array.isArray(VEICULOS_PADRAO_FROTA)) {
            gastosState.veiculos = JSON.parse(JSON.stringify(VEICULOS_PADRAO_FROTA));
            salvarGastosLocalStorage();
          }
        }
        sincronizarMotoristasComVistorias();
      }

      function renderFrotaCadView() {
        const tbody = $('cadFrotaTable')?.querySelector('tbody');
        if (!tbody) return;

        inicializarVeiculosFrotaPadraoSeVazio();

        const lista = Array.isArray(gastosState.veiculos) ? gastosState.veiculos : [];
        const ativos = lista.filter(v => v.ativo !== false);

        const q = ($('cadFiltroBusca')?.value || '').toLowerCase().trim();
        const fStatus = $('cadFiltroStatus')?.value || 'todos';

        if ($('btnLimparFiltrosCad')) {
          $('btnLimparFiltrosCad').hidden = !(q || fStatus !== 'todos');
        }

        // Indicadores do topo
        let vistEmDiaCount = 0;
        let vistAvisoCount = 0;
        let oleoAlertaCount = 0;
        let semVistoriaCount = 0;

        const itensCalculados = lista.map(v => {
          const pNorm = (v.placa || '').toUpperCase().trim();
          const vistorias = (state.all || [])
            .filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === pNorm)
            .sort((a, b) => ((b.data || '') + ' ' + (b.hora || '')).localeCompare((a.data || '') + ' ' + (a.hora || '')));
          const recVist = vistorias[0] || null;

          const stOleo = calcularStatusOleoPorKm(pNorm);
          if (stOleo.status === 'vencido' || stOleo.status === 'proximo') oleoAlertaCount++;

          let cicloMensal = null;
          let vistStatus = 'sem_vistoria';
          if (recVist && recVist.data) {
            cicloMensal = calcularCicloVistoriaMensal(recVist.data);
            vistStatus = cicloMensal.status;
            if (vistStatus === 'vencida' || vistStatus === 'proxima') {
              vistAvisoCount++;
            } else if (vistStatus === 'em_dia') {
              vistEmDiaCount++;
            }
          } else {
            semVistoriaCount++;
          }

          // Custo por KM
          const lancs = (gastosState.lancamentos || []).filter(g => (g.placa || '').toUpperCase().trim() === pNorm);
          const somaPecas = lancs.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
          let somaOS = 0;
          vistorias.forEach(x => {
            const m = getManutencaoData(x);
            if (m && m.custo) {
              const c = parseFloat(String(m.custo).replace(/\./g, '').replace(',', '.'));
              if (!isNaN(c)) somaOS += c;
            }
          });
          const totalGasto = somaPecas + somaOS;

          let kmMax = null;
          let kmMin = null;
          vistorias.forEach(x => {
            if (x.km && !isNaN(Number(x.km))) {
              const k = Number(x.km);
              if (kmMax === null || k > kmMax) kmMax = k;
              if (kmMin === null || k < kmMin) kmMin = k;
            }
          });
          const kmRodados = (kmMax !== null && kmMin !== null && kmMax >= kmMin) ? (kmMax - kmMin) : 0;
          const custoPorKm = (kmRodados > 0 && totalGasto > 0) ? (totalGasto / kmRodados) : 0;

          return {
            ...v,
            recVist,
            vistoriasCount: vistorias.length,
            cicloMensal,
            vistStatus,
            stOleo,
            totalGasto,
            kmRodados,
            custoPorKm
          };
        });

        if ($('cadStatTotal')) $('cadStatTotal').textContent = lista.length;
        if ($('cadStatEmDia')) $('cadStatEmDia').textContent = vistEmDiaCount;
        if ($('cadStatAtrasoVistoria')) $('cadStatAtrasoVistoria').textContent = vistAvisoCount;
        if ($('cadStatAlertaOleo')) $('cadStatAlertaOleo').textContent = oleoAlertaCount;
        if ($('cadStatSemVistoria')) $('cadStatSemVistoria').textContent = semVistoriaCount;

        // Filtragem
        const filtrados = itensCalculados.filter(item => {
          if (fStatus === 'em_dia' && item.vistStatus !== 'em_dia') return false;
          if (fStatus === 'atencao_vistoria' && item.vistStatus !== 'vencida' && item.vistStatus !== 'proxima') return false;
          if (fStatus === 'alerta_oleo' && item.stOleo.status !== 'vencido' && item.stOleo.status !== 'proximo') return false;
          if (fStatus === 'sem_vistoria' && item.vistStatus !== 'sem_vistoria') return false;

          if (q) {
            const hay = ((item.placa || '') + ' ' + (item.modelo || '') + ' ' + (item.motorista || '') + ' ' + (item.rota || '') + ' ' + (item.obs || '')).toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        if ($('cadFrotaFooterInfo')) {
          $('cadFrotaFooterInfo').textContent = filtrados.length === 1
            ? '1 veículo listado'
            : filtrados.length + ' de ' + lista.length + ' veículos listados';
        }

        if (!filtrados.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="empty">' +
            '<div class="empty-icon-wrap">' + icon('truck') + '</div>' +
            '<h2>Nenhum veículo encontrado na frota</h2>' +
            '<p>Cadastre seus veículos com placa, modelo e motorista titular para gerenciar vistorias e troca de óleo.</p>' +
            '<div class="empty-action">' +
            '<button type="button" class="btn btn-primary" onclick="abrirModalCadastrarVeiculo()">' +
            icon('plus') + ' <span>Cadastrar Primeiro Veículo</span>' +
            '</button>' +
            '</div>' +
            '</td></tr>';
          return;
        }

        tbody.innerHTML = filtrados.map(v => {
          let vistoriaBadge = '';
          let tipoAvisoWpp = 'vistoria_mensal';
          let atrasoDias = 0;

          if (v.vistStatus === 'sem_vistoria') {
            vistoriaBadge = '<span class="status-badge bad" style="font-weight:700">Sem Vistoria Feita</span>';
            tipoAvisoWpp = 'vistoria_vencida';
            atrasoDias = 30;
          } else if (v.vistStatus === 'vencida') {
            const at = Math.abs(v.cicloMensal.diasParaVencer);
            vistoriaBadge = '<span class="status-badge bad">Vencida há ' + at + 'd</span>';
            tipoAvisoWpp = 'vistoria_vencida';
            atrasoDias = at;
          } else if (v.vistStatus === 'proxima') {
            vistoriaBadge = '<span class="status-badge warn">Vence em ' + v.cicloMensal.diasParaVencer + 'd</span>';
            tipoAvisoWpp = 'vistoria_mensal';
          } else {
            vistoriaBadge = '<span class="status-badge ok">Em dia (Próx: ' + v.cicloMensal.dataProximaFmt + ')</span>';
          }

          if (v.stOleo.status === 'vencido') tipoAvisoWpp = 'oleo_vencido';

          const custoKmLabel = v.custoPorKm > 0
            ? 'R$ ' + v.custoPorKm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '/km'
            : (v.totalGasto > 0 ? fmtMoeda(v.totalGasto) : '—');

          const kmExib = v.stOleo.kmAtual ? fmtKm(v.stOleo.kmAtual) : (v.km_inicial ? fmtKm(v.km_inicial) : '—');

          return '<tr>' +
            '<td>' +
            '<div class="stack">' +
            '<button type="button" class="plate" onclick="abrirHistoricoVeiculo(\'' + esc(v.placa) + '\')" title="Ver prontuário do veículo">' + esc(v.placa) + '</button>' +
            '<span class="t2">' + esc(v.modelo || 'Veículo') + (v.ano ? ' (' + esc(v.ano) + ')' : '') + '</span>' +
            '</div>' +
            '</td>' +
            '<td>' +
            '<div class="stack">' +
            '<span class="t1" style="font-weight:700">' + esc(v.motorista || 'Sem motorista titular') + '</span>' +
            '<span class="t2">' + (v.recVist ? 'Última vistoria: ' + formatarData(v.recVist.data) : 'Nenhum check-list') + '</span>' +
            '</div>' +
            '</td>' +
            '<td><span class="badge-km" style="background:var(--accent-tint);color:var(--accent-hi)">' + esc(v.rota || '—') + '</span></td>' +
            '<td><strong>' + kmExib + '</strong></td>' +
            '<td>' + vistoriaBadge + '</td>' +
            '<td>' + v.stOleo.badgeHtml + '</td>' +
            '<td><span class="custo-km-pill">' + custoKmLabel + '</span></td>' +
            '<td style="text-align:right">' +
            '<div style="display:inline-flex;gap:4px">' +
            '<button type="button" class="btn btn-ghost btn-whatsapp-copy" style="height:26px;padding:0 7px;font-size:11px" onclick="abrirModalCopiarWhatsApp(\'' + esc(v.motorista) + '\', \'' + esc(v.placa) + '\', \'' + tipoAvisoWpp + '\', { atraso: ' + atrasoDias + ', diffKm: ' + (v.stOleo.diffKm || 0) + ' })" title="Copiar texto pronto para cobrar motorista no WhatsApp">' +
            '<svg class="i" style="width:12px;height:12px"><use href="#i-whatsapp" /></svg> <span>Cobrar</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px" onclick="abrirHistoricoVeiculo(\'' + esc(v.placa) + '\')" title="Ver prontuário completo da placa">' +
            icon('clock') +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px;color:var(--accent-hi)" onclick="abrirModalLancarGasto(\'' + esc(v.placa) + '\', \'' + esc(v.motorista) + '\', \'' + (v.stOleo.kmAtual || v.km_inicial || '') + '\')" title="Lançar gasto, peça ou óleo nesta placa">' +
            icon('plus') +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px;color:var(--accent-hi)" onclick="abrirModalCadastrarVeiculo(\'' + esc(v.id) + '\')" title="Editar dados do veículo">' +
            icon('edit') +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px;color:var(--bad)" onclick="excluirCadastroVeiculo(\'' + esc(v.id) + '\')" title="Remover da frota">' +
            icon('trash') +
            '</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
        }).join('');
      }
      window.renderFrotaCadView = renderFrotaCadView;

      function filtrarFrotaPorCard(status) {
        const sel = $('cadFiltroStatus');
        if (sel) {
          sel.value = status;
          renderFrotaCadView();
        }
      }
      window.filtrarFrotaPorCard = filtrarFrotaPorCard;

      function exportarFrotaVeiculosCsv() {
        const lista = Array.isArray(gastosState.veiculos) ? gastosState.veiculos : [];
        if (!lista.length) {
          toast('Não há veículos cadastrados para exportar.', 'error');
          return;
        }

        const headers = [
          'Placa', 'Modelo', 'Ano', 'Motorista Titular', 'Rota', 'KM Atual',
          'Vistoria Mensal', 'Troca de Óleo', 'Total Investido (R$)', 'Status'
        ];

        const rows = lista.map(v => {
          const pNorm = (v.placa || '').toUpperCase().trim();
          const vistorias = (state.all || [])
            .filter(x => x.status !== 'inativo' && (x.placa || '').toUpperCase().trim() === pNorm)
            .sort((a, b) => ((b.data || '') + ' ' + (b.hora || '')).localeCompare((a.data || '') + ' ' + (a.hora || '')));
          const recVist = vistorias[0] || null;
          const stOleo = calcularStatusOleoPorKm(pNorm);

          let stVistFmt = 'Sem vistoria';
          if (recVist && recVist.data) {
            const ciclo = calcularCicloVistoriaMensal(recVist.data);
            stVistFmt = ciclo.status === 'em_dia' ? ('Em dia (próx: ' + ciclo.dataProximaFmt + ')') : ('Vencida há ' + Math.abs(ciclo.diasParaVencer) + ' dias');
          }

          const lancs = (gastosState.lancamentos || []).filter(g => (g.placa || '').toUpperCase().trim() === pNorm);
          const totalGasto = lancs.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
          const kmExib = stOleo.kmAtual || v.km_inicial || '';

          return [
            v.placa || '',
            v.modelo || '',
            v.ano || '',
            v.motorista || 'Sem motorista',
            v.rota || '',
            kmExib,
            stVistFmt,
            stOleo.label || '',
            totalGasto.toFixed(2),
            v.ativo !== false ? 'Ativo' : 'Inativo'
          ].map(csvCell).join(';');
        });

        const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Gomex_Frota_Veiculos_' + isoLocal(new Date()) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast(lista.length + ' veículos da frota exportados com sucesso!');
      }
      window.exportarFrotaVeiculosCsv = exportarFrotaVeiculosCsv;

      function limparFiltrosCad() {
        if ($('cadFiltroBusca')) $('cadFiltroBusca').value = '';
        if ($('cadFiltroStatus')) $('cadFiltroStatus').value = 'todos';
        renderFrotaCadView();
      }
      window.limparFiltrosCad = limparFiltrosCad;

      function abrirModalCadastrarVeiculo(id = '') {
        if (!podeEditar('frotacad')) {
          mostrarToastBloqueioEdicao('Cadastro de Frota');
          return;
        }
        const v = id ? (gastosState.veiculos || []).find(x => String(x.id) === String(id)) : null;

        popularDatalistEPlacasNoModalGasto();

        if ($('cadVeiculoEditId')) $('cadVeiculoEditId').value = v ? v.id : '';
        const titleEl = $('cadVeiculoModalTitle') || $('modalCadastrarVeiculoTitulo');
        if (titleEl) titleEl.textContent = v ? ('Editar Veículo · Placa ' + (v.placa || '')) : 'Cadastrar Novo Veículo na Frota';
        if ($('btnSalvarCadVeiculoLabel')) $('btnSalvarCadVeiculoLabel').textContent = v ? 'Atualizar Veículo' : 'Salvar Veículo';

        if ($('cadInputPlaca')) {
          $('cadInputPlaca').value = v ? (v.placa || '') : '';
          $('cadInputPlaca').disabled = Boolean(v); // Placa não deve ser alterada em edição
        }
        if ($('cadInputModelo')) $('cadInputModelo').value = v ? (v.modelo || '') : '';
        if ($('cadInputAno')) $('cadInputAno').value = v ? (v.ano || '') : '';
        if ($('cadInputMotorista')) $('cadInputMotorista').value = v ? (v.motorista || '') : '';
        if ($('cadInputRota')) $('cadInputRota').value = v ? (v.rota || '') : '';
        if ($('cadInputKm')) $('cadInputKm').value = v ? (v.km_inicial || '') : '';
        if ($('cadInputMetaOleo')) $('cadInputMetaOleo').value = v ? (v.meta_oleo_km || 10000) : 10000;
        if ($('cadInputObs')) $('cadInputObs').value = v ? (v.obs || '') : '';

        if ($('modalCadastrarVeiculo')) $('modalCadastrarVeiculo').classList.add('open');
      }
      window.abrirModalCadastrarVeiculo = abrirModalCadastrarVeiculo;

      function fecharModalCadastrarVeiculo() {
        $('modalCadastrarVeiculo').classList.remove('open');
      }
      window.fecharModalCadastrarVeiculo = fecharModalCadastrarVeiculo;

      async function salvarCadastroVeiculo() {
        if (!podeEditar('frotacad')) {
          mostrarToastBloqueioEdicao('Cadastro de Frota');
          return;
        }
        const placa = ($('cadInputPlaca').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (!placa) {
          toast('Informe a placa do veículo.', 'error');
          $('cadInputPlaca').focus();
          return;
        }

        const editId = $('cadVeiculoEditId').value;
        const modelo = ($('cadInputModelo').value || '').trim() || 'Kombi';
        const ano = ($('cadInputAno').value || '').trim();
        const motorista = ($('cadInputMotorista').value || '').trim();
        const rota = ($('cadInputRota').value || '').trim();
        const km_inicial = Number($('cadInputKm').value) || 0;
        const meta_oleo_km = Number($('cadInputMetaOleo').value) || 10000;
        const obs = ($('cadInputObs').value || '').trim();

        if (!Array.isArray(gastosState.veiculos)) gastosState.veiculos = [];

        if (editId) {
          const idx = gastosState.veiculos.findIndex(x => String(x.id) === String(editId));
          if (idx !== -1) {
            gastosState.veiculos[idx] = {
              ...gastosState.veiculos[idx],
              modelo,
              ano,
              motorista,
              rota,
              km_inicial,
              meta_oleo_km,
              obs
            };
          }
        } else {
          // Checar se a placa já existe
          const jaExiste = gastosState.veiculos.some(x => (x.placa || '').toUpperCase().trim() === placa);
          if (jaExiste) {
            toast('A placa ' + placa + ' já está cadastrada na frota.', 'error');
            return;
          }
          gastosState.veiculos.push({
            id: 'veic_' + Date.now(),
            placa,
            modelo,
            ano,
            motorista,
            rota,
            km_inicial,
            meta_oleo_km,
            obs,
            ativo: true,
            created_at: isoLocal(new Date())
          });
        }

        const btn = $('btnSalvarCadVeiculo');
        if (btn) btn.disabled = true;

        try {
          await sincronizarGastosComServidor('push');
          fecharModalCadastrarVeiculo();
          renderFrotaCadView();
          renderSummary();
          toast(editId ? 'Veículo atualizado no cadastro!' : 'Veículo ' + placa + ' cadastrado com sucesso!');
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      window.salvarCadastroVeiculo = salvarCadastroVeiculo;

      async function excluirCadastroVeiculo(id) {
        if (!podeEditar('frotacad')) {
          mostrarToastBloqueioEdicao('Cadastro de Frota');
          return;
        }
        const v = (gastosState.veiculos || []).find(x => String(x.id) === String(id));
        if (!v) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Remover Veículo da Frota',
          subtitulo: 'Cadastro fixo da frota Gomex',
          mensagem: `Deseja realmente remover o veículo de placa <strong>${esc(v.placa)}</strong> (${esc(v.modelo || 'Veículo')}) do cadastro fixo da frota?`,
          aviso: 'Esta operação removerá o veículo das listas ativas de monitoramento da frota.',
          textoConfirmar: 'Remover Veículo',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;

        gastosState.veiculos = (gastosState.veiculos || []).filter(x => String(x.id) !== String(id));
        await sincronizarGastosComServidor('push');
        renderFrotaCadView();
        renderSummary();
        toast('Veículo ' + v.placa + ' removido do cadastro.');
      }
      window.excluirCadastroVeiculo = excluirCadastroVeiculo;

      // ==============================================================================