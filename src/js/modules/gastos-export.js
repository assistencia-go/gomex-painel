      // EXPORTAÇÃO CSV E RELATÓRIO PDF EXECUTIVO DE CUSTOS, PEÇAS & INSUMOS (DE X ATÉ Y)
      // ==============================================================================
      function exportarCsvGastos() {
        const filtrados = obterLancamentosFiltradosGastos();
        if (!filtrados.length) {
          toast('Não há lançamentos de gastos no período/filtro atual para exportar.', 'error');
          return;
        }
        const headers = ['Data', 'Placa', 'Veículo', 'Quem Gastou / Motorista', 'KM', 'Produto / Peça', 'Categoria', 'Quantidade', 'Unidade', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Fornecedor / Oficina', 'NF / O.S.', 'Observações'];
        const rows = filtrados.map(g => [
          formatarData(g.data),
          (g.placa || '').toUpperCase(),
          g.veiculo || '',
          g.motorista || '',
          g.km || '',
          g.produto_nome || '',
          g.categoria || '',
          String(g.quantidade || 0).replace('.', ','),
          g.unidade || 'un',
          Number(g.valor_unitario || 0).toFixed(2).replace('.', ','),
          Number(g.valor_total || 0).toFixed(2).replace('.', ','),
          g.fornecedor || '',
          g.nf_os || '',
          g.obs || ''
        ].map(csvCell).join(';'));

        const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Gomex_Custos_Frota_' + (gastosState.dataInicio || 'Inicio') + '_a_' + (gastosState.dataFim || isoLocal(new Date())) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast(filtrados.length + ' lançamento(s) exportado(s) para Excel (CSV)!');
      }
      window.exportarCsvGastos = exportarCsvGastos;

      function gerarRelatorioPdfGastos(isPrint = false) {
        const filtrados = obterLancamentosFiltradosGastos();
        if (!filtrados.length) {
          toast('Nenhum gasto encontrado no período/filtro selecionado para gerar o relatório.', 'error');
          return;
        }

        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

          const M = 10;
          const W = 190;
          const ROXO = [48, 42, 110];
          const CINZA = [95, 95, 110];
          const LINHA = [195, 195, 208];

          const fonte = (tam, estilo = 'normal', cor = [20, 20, 30]) => {
            doc.setFont('helvetica', estilo);
            doc.setFontSize(tam);
            doc.setTextColor(...cor);
          };

          const corta = (txt, maxW) => {
            const l = doc.splitTextToSize(String(txt || ''), maxW);
            return l[0] || '';
          };

          // Consolidações do período
          let totalRS = 0;
          let totalLitros = 0;
          let totalPecas = 0;
          const porPlaca = new Map();
          const porMotorista = new Map();

          filtrados.forEach(g => {
            const v = Number(g.valor_total) || 0;
            const q = Number(g.quantidade) || 0;
            totalRS += v;
            if (g.unidade === 'L') totalLitros += q;
            else totalPecas += q;

            const p = (g.placa || '—').toUpperCase();
            if (!porPlaca.has(p)) {
              porPlaca.set(p, { placa: p, veiculo: g.veiculo || '—', qtd: 0, litros: 0, total: 0 });
            }
            const rp = porPlaca.get(p);
            rp.qtd++;
            if (g.unidade === 'L') rp.litros += q;
            rp.total += v;

            const m = (g.motorista || 'Não informado').trim();
            const mk = m.toLowerCase();
            if (!porMotorista.has(mk)) {
              porMotorista.set(mk, { motorista: m, placas: new Set(), qtd: 0, total: 0 });
            }
            const rm = porMotorista.get(mk);
            rm.qtd++;
            if (p !== '—') rm.placas.add(p);
            rm.total += v;
          });

          const rankingPlacas = Array.from(porPlaca.values()).sort((a, b) => b.total - a.total);
          const rankingMots = Array.from(porMotorista.values()).sort((a, b) => b.total - a.total);

          const periodoTexto = (gastosState.dataInicio || gastosState.dataFim)
            ? 'De ' + (gastosState.dataInicio ? formatarData(gastosState.dataInicio) : 'Início') + ' até ' + (gastosState.dataFim ? formatarData(gastosState.dataFim) : formatarData(isoLocal(new Date())))
            : 'Todo o histórico registrado';

          let y = M;

          // 1. CABEÇALHO OFICIAL GOMEX FROTA
          doc.setFillColor(...ROXO);
          doc.roundedRect(M, y, 28, 13, 2, 2, 'F');
          fonte(9, 'bold', [255, 255, 255]);
          doc.text('GOMEX', M + 14, y + 5.8, { align: 'center' });
          fonte(6, 'bold', [196, 210, 255]);
          doc.text('FROTA', M + 14, y + 9.8, { align: 'center' });

          fonte(12, 'bold', ROXO);
          doc.text('RELATÓRIO EXECUTIVO DE CUSTOS, PEÇAS & INSUMOS', M + 32, y + 5.2);
          fonte(7, 'normal', CINZA);
          doc.text('Levantamento financeiro por veículo (placa), responsável/motorista e período · Gomex Distribuidora', M + 32, y + 9.5);
          doc.text('Período analisado: ' + periodoTexto + (gastosState.placa ? ' · Placa: ' + gastosState.placa : '') + (gastosState.motorista ? ' · Resp.: ' + gastosState.motorista : ''), M + 32, y + 12.8);

          y += 16;

          // 2. QUADRO DE INDICADORES FINANCEIROS DO PERÍODO
          const kpiW = W / 4;
          const kpis = [
            ['TOTAL INVESTIDO NO PERÍODO', fmtMoeda(totalRS), [21, 128, 61]],
            ['LITROS DE ÓLEO / FLUIDOS', totalLitros.toLocaleString('pt-BR') + ' L', [180, 83, 9]],
            ['PEÇAS / SERVIÇOS APLICADOS', totalPecas.toLocaleString('pt-BR') + ' un (' + filtrados.length + ' lanç.)', ROXO],
            ['VEÍCULOS ATENDIDOS', rankingPlacas.length + (rankingPlacas.length === 1 ? ' placa' : ' placas'), [20, 20, 30]]
          ];
          kpis.forEach(([lbl, val, cor], idx) => {
            const kx = M + idx * kpiW;
            doc.setFillColor(245, 246, 252);
            doc.rect(kx, y, kpiW, 13, 'F');
            doc.setDrawColor(...LINHA);
            doc.rect(kx, y, kpiW, 13);
            fonte(5.8, 'bold', CINZA);
            doc.text(lbl, kx + 2.5, y + 4.2);
            fonte(9.5, 'bold', cor);
            doc.text(val, kx + 2.5, y + 10.2);
          });
          y += 16;

          // 3. RESUMO LADO A LADO: POR VEÍCULO (PLACA) & POR QUEM GASTOU (MOTORISTA)
          const halfW = (W - 4) / 2;
          doc.setFillColor(...ROXO);
          doc.rect(M, y, halfW, 5.5, 'F');
          doc.rect(M + halfW + 4, y, halfW, 5.5, 'F');
          fonte(7.2, 'bold', [255, 255, 255]);
          doc.text('1. INVESTIMENTO POR VEÍCULO (PLACA)', M + 2.5, y + 3.9);
          doc.text('2. CONTROLE POR QUEM GASTOU (RESPONSÁVEL)', M + halfW + 6.5, y + 3.9);
          y += 5.5;

          const maxRowsResumo = Math.max(rankingPlacas.slice(0, 8).length, rankingMots.slice(0, 8).length, 1);
          let yEsq = y;
          rankingPlacas.slice(0, 8).forEach(rp => {
            doc.setDrawColor(...LINHA);
            doc.rect(M, yEsq, halfW, 5.5);
            fonte(7, 'bold', ROXO);
            doc.text(rp.placa, M + 2, yEsq + 3.8);
            fonte(6.5, 'normal', CINZA);
            doc.text(corta(rp.veiculo + ' (' + rp.qtd + ' lanç.' + (rp.litros ? ', ' + rp.litros + 'L óleo' : '') + ')', 46), M + 20, yEsq + 3.8);
            fonte(7.2, 'bold', [21, 128, 61]);
            doc.text(fmtMoeda(rp.total), M + halfW - 2, yEsq + 3.8, { align: 'right' });
            yEsq += 5.5;
          });

          let yDir = y;
          rankingMots.slice(0, 8).forEach(rm => {
            const xD = M + halfW + 4;
            doc.setDrawColor(...LINHA);
            doc.rect(xD, yDir, halfW, 5.5);
            fonte(6.8, 'bold', [20, 20, 30]);
            doc.text(corta(rm.motorista, 38), xD + 2, yDir + 3.8);
            fonte(6.2, 'normal', CINZA);
            doc.text(corta('Placas: ' + Array.from(rm.placas).join(', '), 30), xD + 42, yDir + 3.8);
            fonte(7.2, 'bold', [21, 128, 61]);
            doc.text(fmtMoeda(rm.total), xD + halfW - 2, yDir + 3.8, { align: 'right' });
            yDir += 5.5;
          });

          y += maxRowsResumo * 5.5 + 4;

          // 4. EXTRATO DISCRIMINADO DE TODOS OS LANÇAMENTOS NO PERÍODO
          const desenharCabecalhoTabelaDetalhe = (posY) => {
            doc.setFillColor(...ROXO);
            doc.rect(M, posY, W, 5.5, 'F');
            fonte(7.2, 'bold', [255, 255, 255]);
            doc.text('3. EXTRATO DETALHADO DE PRODUTOS, PEÇAS E LITROS LANÇADOS NO PERÍODO', M + 2.5, posY + 3.9);
            posY += 5.5;

            doc.setFillColor(240, 242, 248);
            doc.rect(M, posY, W, 5.2, 'F');
            doc.setDrawColor(...LINHA);
            doc.rect(M, posY, W, 5.2);
            fonte(6, 'bold', CINZA);
            doc.text('DATA', M + 2, posY + 3.6);
            doc.text('PLACA / VEÍC.', M + 20, posY + 3.6);
            doc.text('QUEM GASTOU / RESP.', M + 50, posY + 3.6);
            doc.text('PRODUTO / PEÇA / ÓLEO', M + 88, posY + 3.6);
            doc.text('QTD', M + 142, posY + 3.6, { align: 'right' });
            doc.text('V. UNIT.', M + 164, posY + 3.6, { align: 'right' });
            doc.text('TOTAL (R$)', M + W - 2, posY + 3.6, { align: 'right' });
            return posY + 5.2;
          };

          y = desenharCabecalhoTabelaDetalhe(y);

          filtrados.forEach((g, idx) => {
            if (y > 266) {
              doc.addPage();
              y = M;
              y = desenharCabecalhoTabelaDetalhe(y);
            }
            if (idx % 2 === 1) {
              doc.setFillColor(250, 250, 253);
              doc.rect(M, y, W, 5.4, 'F');
            }
            doc.setDrawColor(...LINHA);
            doc.rect(M, y, W, 5.4);

            fonte(6.5, 'normal', [20, 20, 30]);
            doc.text(formatarData(g.data), M + 2, y + 3.7);
            fonte(6.8, 'bold', ROXO);
            doc.text(corta((g.placa || '').toUpperCase() + (g.veiculo ? ' · ' + g.veiculo : ''), 28), M + 20, y + 3.7);
            fonte(6.5, 'normal', [20, 20, 30]);
            doc.text(corta(g.motorista || '—', 35), M + 50, y + 3.7);
            doc.text(corta(g.produto_nome + (g.fornecedor ? ' (' + g.fornecedor + ')' : ''), 48), M + 88, y + 3.7);
            doc.text(String(g.quantidade) + ' ' + (g.unidade || 'un'), M + 142, y + 3.7, { align: 'right' });
            doc.text(fmtMoeda(g.valor_unitario), M + 164, y + 3.7, { align: 'right' });
            fonte(6.8, 'bold', [21, 128, 61]);
            doc.text(fmtMoeda(g.valor_total), M + W - 2, y + 3.7, { align: 'right' });
            y += 5.4;
          });

          // Linha de Total Geral no fim da tabela
          if (y > 260) {
            doc.addPage();
            y = M;
          }
          doc.setFillColor(235, 248, 240);
          doc.rect(M, y, W, 6.8, 'F');
          doc.setDrawColor(...LINHA);
          doc.rect(M, y, W, 6.8);
          fonte(7.5, 'bold', [20, 20, 30]);
          doc.text('VALOR TOTAL INVESTIDO NO PERÍODO SELECIONADO (' + filtrados.length + ' LANÇAMENTOS):', M + 3, y + 4.6);
          fonte(9, 'bold', [21, 128, 61]);
          doc.text(fmtMoeda(totalRS), M + W - 2, y + 4.7, { align: 'right' });
          y += 14;

          // Assinatura de conferência do Gestor de Frota (Hendreo)
          if (y < 268) {
            doc.setDrawColor(120, 120, 135);
            doc.line(M + 55, y + 8, M + 135, y + 8);
            fonte(7, 'bold', ROXO);
            doc.text('Conferência e Gestão de Frota · Gomex Distribuidora', M + 95, y + 12, { align: 'center' });
            fonte(6, 'normal', CINZA);
            doc.text('Emitido em ' + new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' por ' + ($('userNameLabel')?.textContent || 'Hendreo'), M + 95, y + 15.5, { align: 'center' });
          }

          const nomeArq = 'Relatorio_Custos_Frota_' + (gastosState.placa || 'Geral') + '_' + isoLocal(new Date()) + '.pdf';
          if (isPrint) {
            doc.autoPrint();
            const url = URL.createObjectURL(doc.output('blob'));
            window.open(url, '_blank');
            toast('Abrindo relatório de custos para impressão...');
          } else {
            doc.save(nomeArq);
            toast('Relatório PDF de Custos e Peças gerado com sucesso!');
          }
        } catch (err) {
          toast('Erro ao gerar PDF: ' + err.message, 'error');
        }
      }
      window.gerarRelatorioPdfGastos = gerarRelatorioPdfGastos;

      // ==============================================================================