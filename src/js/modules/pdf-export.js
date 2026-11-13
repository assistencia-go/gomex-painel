      // RENDERIZADOR DO MAPA VETORIAL DA VAN PARA O PDF
      // ==============================================================================
      function renderizarVanParaImagem(item) {
        return new Promise(resolve => {
          try {
            const svgOriginal = $('modalVanSvg');
            if (!svgOriginal) return resolve(null);
            const clone = svgOriginal.cloneNode(true);
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('width', '900');
            clone.setAttribute('height', '546');

            const marksLayer = clone.querySelector('#modalVanMarksLayer');
            if (marksLayer) {
              marksLayer.innerHTML = avariasOf(item).map(([x, y, k]) =>
                '<g>' +
                '<circle cx="' + Number(x) + '" cy="' + Number(y) + '" r="6.8" fill="#dc2626" stroke="#ffffff" stroke-width="1.8"/>' +
                '<text x="' + Number(x) + '" y="' + Number(y) + '" fill="#ffffff" font-size="8.8" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="central">' + esc(k) + '</text>' +
                '</g>'
              ).join('');
            }

            const xml = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            img.onload = () => {
              const cv = document.createElement('canvas');
              cv.width = 900; cv.height = 546;
              const ctx = cv.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 900, 546);
              ctx.drawImage(img, 0, 0, 900, 546);
              resolve(cv.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = () => resolve(null);
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
          } catch (e) {
            resolve(null);
          }
        });
      }

      // ==============================================================================
      // GERADOR DE PDF OFICIAL COMPLETO (PADRÃO 1 PÁGINA A4 GOMEX FROTA)
      // ==============================================================================
      async function baixarPdfOficial(id, btn, isPrint = false) {
        const d = state.all.find(c => String(c.id) === String(id));
        if (!d) return;

        if (btn) btn.disabled = true;

        try {
          if (!state.sigCache[d.id]) {
            const rows = await fetchSigs(d.id);
            state.sigCache[d.id] = rows && rows[0] ? rows[0] : {};
          }
          const sigs = state.sigCache[d.id] || {};

          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

          const M = 8;
          const W = 194;
          const ROXO = [48, 42, 110];
          const CINZA = [100, 100, 115];
          const LINHA = [185, 185, 198];

          const fonte = (tam, estilo = 'normal', cor = [20, 20, 30]) => {
            doc.setFont('helvetica', estilo);
            doc.setFontSize(tam);
            doc.setTextColor(...cor);
          };

          const barraTitulo = (x, y, w, txt) => {
            doc.setFillColor(...ROXO);
            doc.rect(x, y, w, 5.0, 'F');
            fonte(7.5, 'bold', [255, 255, 255]);
            doc.text(txt, x + 2.5, y + 3.6);
          };

          const caixa = (x, y, w, h) => {
            doc.setDrawColor(...LINHA);
            doc.setLineWidth(0.22);
            doc.rect(x, y, w, h);
          };

          const corta = (txt, maxW) => {
            const l = doc.splitTextToSize(String(txt || ''), maxW);
            return l[0] || '';
          };

          const dataBr = iso => {
            if (!iso) return '__/__/____';
            const p = String(iso).split('-');
            return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
          };

          let y = M;

          // --- 1. CABEÇALHO ---
          doc.setFillColor(...ROXO);
          doc.roundedRect(M, y, 26, 11.5, 2, 2, 'F');
          fonte(8.5, 'bold', [255, 255, 255]);
          doc.text('GOMEX', M + 13, y + 5.2, { align: 'center' });
          fonte(5.8, 'bold', [196, 210, 255]);
          doc.text('FROTA', M + 13, y + 8.8, { align: 'center' });

          fonte(11.5, 'bold', ROXO);
          doc.text('CHECK-LIST DE VEÍCULO · CONTROLE DE FROTA', M + 30, y + 4.8);
          fonte(6.3, 'normal', CINZA);
          doc.text('Documento oficial de vistoria e liberação da frota · Gomex Distribuidora', M + 30, y + 8.8);

          const numBoxW = 28;
          const numBoxX = M + W - numBoxW;
          doc.setFillColor(243, 244, 250);
          doc.rect(numBoxX, y, numBoxW, 4.5, 'F');
          caixa(numBoxX, y, numBoxW, 11.5);
          fonte(5.5, 'bold', CINZA);
          doc.text('Nº VISTORIA', numBoxX + numBoxW / 2, y + 3.2, { align: 'center' });
          fonte(9.5, 'bold', ROXO);
          doc.text(String(d.numero || '000000'), numBoxX + numBoxW / 2, y + 9.0, { align: 'center' });

          y += 13.5;

          // --- 2. IDENTIFICAÇÃO ---
          barraTitulo(M, y, W, '1. IDENTIFICAÇÃO DO VEÍCULO E MOTORISTA');
          y += 5.0;

          const colW = [74, 52, 68];
          const veiculoNome = d.veiculo === 'Outro' ? (d.veiculo_outro || 'Outro') : (d.veiculo || '—');
          const hRowId = 7.0;

          caixa(M, y, colW[0], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('VEÍCULO', M + 2, y + 2.5);
          fonte(7.8, 'bold'); doc.text('[X] ' + veiculoNome, M + 2, y + 5.7);

          caixa(M + colW[0], y, colW[1], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('PLACA', M + colW[0] + 2, y + 2.5);
          fonte(8.5, 'bold'); doc.text((d.placa || '—').toUpperCase(), M + colW[0] + 2, y + 5.7);

          caixa(M + colW[0] + colW[1], y, colW[2], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('DATA / HORA', M + colW[0] + colW[1] + 2, y + 2.5);
          fonte(7.8, 'normal'); doc.text(dataBr(d.data) + ' · ' + (d.hora || '—'), M + colW[0] + colW[1] + 2, y + 5.7);
          y += hRowId;

          // Linha 2: Motorista (64mm), Rota (34mm), KM (36mm), Tipo (60mm)
          caixa(M, y, 64, hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('MOTORISTA / VENDEDOR', M + 2, y + 2.5);
          fonte(7.8, 'normal'); doc.text(corta(d.motorista || '—', 60), M + 2, y + 5.7);

          caixa(M + 64, y, 34, hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('ROTA / REGIÃO', M + 64 + 2, y + 2.5);
          fonte(7.8, 'bold', ROXO); doc.text(corta(d.rota || '—', 30), M + 64 + 2, y + 5.7);

          caixa(M + 98, y, 36, hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('KM ATUAL', M + 98 + 2, y + 2.5);
          fonte(7.8, 'bold'); doc.text(d.km ? d.km + ' km' : '—', M + 98 + 2, y + 5.7);

          caixa(M + 134, y, 60, hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('TIPO DE VISTORIA', M + 134 + 2, y + 2.5);
          fonte(7.8, 'normal'); doc.text('[X] ' + (d.tipo || '—'), M + 134 + 2, y + 5.7);
          y += hRowId;

          caixa(M, y, colW[0], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('NÍVEL DE COMBUSTÍVEL', M + 2, y + 2.5);
          fonte(7.8, 'normal'); doc.text('[X] ' + (d.combustivel || '—'), M + 2, y + 5.7);

          caixa(M + colW[0], y, colW[1], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('ÚLT. REVISÃO (KM / DATA)', M + colW[0] + 2, y + 2.5);
          fonte(7.2, 'normal'); doc.text((d.rev_ult_km ? d.rev_ult_km + ' km' : '') + ' ' + dataBr(d.rev_ult_data), M + colW[0] + 2, y + 5.7);

          caixa(M + colW[0] + colW[1], y, colW[2], hRowId);
          fonte(5.5, 'bold', CINZA); doc.text('PRÓX. REVISÃO (KM / DATA)', M + colW[0] + colW[1] + 2, y + 2.5);
          fonte(7.2, 'normal'); doc.text((d.rev_prox_km ? d.rev_prox_km + ' km' : '') + ' ' + dataBr(d.rev_prox_data), M + colW[0] + colW[1] + 2, y + 5.7);
          y += hRowId + 2.0;

          // --- 3. SEÇÃO 2 (AVARIAS) & SEÇÃO 3 (PNEUS) ---
          const wAvarias = 98;
          const xPneus = M + wAvarias + 3;
          const wPneus = W - wAvarias - 3;
          const hSec2 = 62.0;

          barraTitulo(M, y, wAvarias, '2. AVARIAS NA CARROCERIA');
          barraTitulo(xPneus, y, wPneus, '3. PNEUS E REQUISITOS');
          y += 5.0;

          caixa(M, y, wAvarias, hSec2);
          const vanImg = await renderizarVanParaImagem(d);
          if (vanImg) {
            try { doc.addImage(vanImg, 'JPEG', M + 1, y + 1, wAvarias - 2, 48.5); } catch (e) { }
          }
          fonte(5.8, 'normal', CINZA);
          doc.text('Legenda: A Amassado · R Risco · Q Quebrado · T Trincado · F Faltando', M + 2.5, y + 53.5);
          const semAvText = d.sem_avarias ? '[X] Sem avarias novas (Veículo íntegro)' : '[X] ' + avariasOf(d).length + ' avaria(s) marcada(s) no diagrama';
          fonte(6.5, 'bold', d.sem_avarias ? [21, 128, 61] : [185, 28, 28]);
          doc.text(semAvText, M + 2.5, y + 58.5);

          // Tabela de Pneus
          let yP = y;
          doc.setFillColor(240, 242, 248);
          doc.rect(xPneus, yP, wPneus, 4.5, 'F');
          caixa(xPneus, yP, wPneus, 4.5);
          doc.line(xPneus + 33, yP, xPneus + 33, yP + 4.5);
          doc.line(xPneus + 48, yP, xPneus + 48, yP + 4.5);
          doc.line(xPneus + 63, yP, xPneus + 63, yP + 4.5);
          doc.line(xPneus + 78, yP, xPneus + 78, yP + 4.5);

          fonte(5.5, 'bold', CINZA);
          doc.text('POSIÇÃO', xPneus + 2.0, yP + 3.1);
          doc.text('BOM', xPneus + 40.5, yP + 3.1, { align: 'center' });
          doc.text('MEIA', xPneus + 55.5, yP + 3.1, { align: 'center' });
          doc.text('GASTO', xPneus + 70.5, yP + 3.1, { align: 'center' });
          doc.text('PSI', xPneus + 85.5, yP + 3.1, { align: 'center' });
          yP += 4.5;

          const listaPneus = pneusOf(d).length ? pneusOf(d) : [
            { pos: 'Dianteiro Esquerdo', estado: 'Bom', psi: '32' },
            { pos: 'Dianteiro Direito', estado: 'Bom', psi: '32' },
            { pos: 'Traseiro Esquerdo', estado: 'Bom', psi: '35' },
            { pos: 'Traseiro Direito', estado: 'Bom', psi: '35' },
            { pos: 'Estepe', estado: 'Bom', psi: '35' }
          ];

          listaPneus.slice(0, 5).forEach(p => {
            caixa(xPneus, yP, wPneus, 5.3);
            doc.line(xPneus + 33, yP, xPneus + 33, yP + 5.3);
            doc.line(xPneus + 48, yP, xPneus + 48, yP + 5.3);
            doc.line(xPneus + 63, yP, xPneus + 63, yP + 5.3);
            doc.line(xPneus + 78, yP, xPneus + 78, yP + 5.3);

            fonte(6.5, 'bold'); doc.text(p.pos, xPneus + 2.0, yP + 3.8);
            fonte(7.0, 'bold');
            doc.text(p.estado === 'Bom' ? '[X]' : '[ ]', xPneus + 40.5, yP + 3.8, { align: 'center' });
            doc.text(p.estado === 'Meia vida' ? '[X]' : '[ ]', xPneus + 55.5, yP + 3.8, { align: 'center' });
            doc.text(p.estado === 'Gasto' ? '[X]' : '[ ]', xPneus + 70.5, yP + 3.8, { align: 'center' });
            fonte(7.0, 'normal');
            doc.text(String(p.psi || '—'), xPneus + 85.5, yP + 3.8, { align: 'center' });
            yP += 5.3;
          });

          caixa(xPneus, yP, wPneus, 6.0);
          fonte(6.2, 'bold');
          doc.text('Desgaste irregular / bolha: ' + (d.pneu_dano === 'Sim' ? '[X] SIM' : '[X] NÃO'), xPneus + 2.0, yP + 4.1);
          yP += 6.0;

          [['VALIDADE DO EXTINTOR', d.extintor_validade || 'Conforme'],
          ['TEMP. THERMO STAR', d.thermo_temp ? d.thermo_temp + ' °C' : 'N/A'],
          ['CONDIÇÃO DO MOTORISTA', d.condicao_motorista === 'Cansado' ? 'Cansado / Indisposto' : 'Descansado e Apto']]
            .forEach(([rot, val]) => {
              caixa(xPneus, yP, wPneus, 8.3);
              fonte(5.5, 'bold', CINZA); doc.text(rot, xPneus + 2.0, yP + 2.8);
              fonte(7.5, 'normal'); doc.text(val, xPneus + 2.0, yP + 6.3);
              yP += 8.3;
            });

          y += hSec2 + 2.5;

          // --- 4. ITENS DE VERIFICAÇÃO ---
          barraTitulo(M, y, W, '4. ITENS DE VERIFICAÇÃO (INSPEÇÃO GERAL)');
          y += 5.0;

          const colWItem = 95.5;
          const gapItem = 3.0;
          const hItem = 4.5;
          const itens = itensOf(d);

          const gruposUnicos = [...new Set(itens.map(i => i.grupo))];
          const colEsq = gruposUnicos.length ? gruposUnicos.slice(0, 2) : ['Documentos e Cabine', 'Elétrica e Luzes'];
          const colDir = gruposUnicos.length ? gruposUnicos.slice(2) : ['Mecânica e Fluidos', 'Baú e Carga'];

          [colEsq, colDir].forEach((grupos, cIdx) => {
            const curX = M + cIdx * (colWItem + gapItem);
            let curY = y;

            grupos.forEach(grp => {
              doc.setFillColor(240, 242, 248);
              doc.rect(curX, curY, colWItem, hItem, 'F');
              caixa(curX, curY, colWItem, hItem);
              doc.line(curX + 71.5, curY, curX + 71.5, curY + hItem);
              doc.line(curX + 79.5, curY, curX + 79.5, curY + hItem);
              doc.line(curX + 87.5, curY, curX + 87.5, curY + hItem);

              fonte(6.2, 'bold', ROXO);
              doc.text(String(grp).toUpperCase(), curX + 2.0, curY + 3.2);

              fonte(5.2, 'bold', CINZA);
              doc.text('OK', curX + 75.5, curY + 3.2, { align: 'center' });
              doc.text('NOK', curX + 83.5, curY + 3.2, { align: 'center' });
              doc.text('N/A', curX + 91.5, curY + 3.2, { align: 'center' });
              curY += hItem;

              itens.filter(i => i.grupo === grp).forEach(i => {
                caixa(curX, curY, colWItem, hItem);
                const isBad = (i.valor === 'NOK');
                if (isBad) {
                  doc.setFillColor(254, 226, 226);
                  doc.rect(curX, curY, colWItem, hItem, 'F');
                }
                doc.line(curX + 71.5, curY, curX + 71.5, curY + hItem);
                doc.line(curX + 79.5, curY, curX + 79.5, curY + hItem);
                doc.line(curX + 87.5, curY, curX + 87.5, curY + hItem);

                fonte(6.8, isBad ? 'bold' : 'normal', isBad ? [185, 28, 28] : [20, 20, 30]);
                doc.text(corta(i.nome, colWItem - 26), curX + 2.0, curY + 3.2);

                fonte(6.5, 'bold', isBad ? [185, 28, 28] : [20, 20, 30]);
                doc.text(i.valor === 'OK' ? '[X]' : '[ ]', curX + 75.5, curY + 3.2, { align: 'center' });
                doc.text(i.valor === 'NOK' ? '[X]' : '[ ]', curX + 83.5, curY + 3.2, { align: 'center' });
                doc.text(i.valor === 'NA' ? '[X]' : '[ ]', curX + 91.5, curY + 3.2, { align: 'center' });
                curY += hItem;
              });
            });
          });

          y += 17 * hItem + 2.5;

          // --- 5. OBSERVAÇÕES E LIBERAÇÃO ---
          barraTitulo(M, y, W, '5. OBSERVAÇÕES E LIBERAÇÃO DO VEÍCULO');
          y += 5.0;

          const boxH = 14.5;
          caixa(M, y, W, boxH);
          fonte(5.5, 'bold', CINZA);
          doc.text('OBSERVAÇÕES E PARECERES REGISTRADOS:', M + 2.0, y + 2.6);
          fonte(6.5, 'normal', [20, 20, 30]);

          const linhasFormatadas = formatarObservacoesParaPdf(d.obs, d);
          let curObsY = y + 5.8;
          for (const linha of linhasFormatadas) {
            const pedacos = doc.splitTextToSize(linha, W - 4);
            for (const pedaco of pedacos) {
              if (curObsY <= y + boxH - 1.2) {
                doc.text(pedaco, M + 2.0, curObsY);
                curObsY += 3.3;
              }
            }
          }
          y += boxH + 1.5;

          const libColor = d.liberacao === 'Liberado' ? [21, 128, 61] : d.liberacao === 'Ressalva' ? [180, 83, 9] : [185, 28, 28];
          const libBg = d.liberacao === 'Liberado' ? [220, 252, 231] : d.liberacao === 'Ressalva' ? [254, 243, 199] : [254, 226, 226];
          doc.setFillColor(...libBg);
          doc.rect(M, y, W, 7.5, 'F');
          caixa(M, y, W, 7.5);

          fonte(6.2, 'bold', CINZA);
          doc.text('PARECER FINAL DA VISTORIA:', M + 3.0, y + 4.8);
          fonte(9.5, 'bold', libColor);
          doc.text('[X] ' + (d.liberacao || 'LIBERADO').toUpperCase(), M + 60, y + 5.2);

          fonte(6.2, 'bold', CINZA);
          doc.text('Condição Motorista: ' + (d.condicao_motorista === 'Cansado' ? 'Cansado / Indisposto' : 'Descansado e Apto'), M + W - 3.0, y + 4.8, { align: 'right' });
          y += 7.5 + 2.5;

          // --- 6. ASSINATURAS ---
          barraTitulo(M, y, W, '6. TERMO DE RESPONSABILIDADE & ASSINATURAS');
          y += 5.0;

          fonte(5.5, 'normal', CINZA);
          doc.text('Declaramos que as informações acima conferem com o estado real do veículo e foram verificadas nesta data.', M + 2.0, y + 2.8);
          y += 3.8;

          const sigW = (W - 6) / 3;
          const sigDefs = [
            { k: 'ass_motorista', lbl: 'Motorista / Vendedor' },
            { k: 'ass_vistoriador', lbl: 'Vistoriador' },
            { k: 'ass_responsavel', lbl: 'Responsável pela Frota' }
          ];

          sigDefs.forEach((sig, i) => {
            const sX = M + i * (sigW + 3);
            caixa(sX, y, sigW, 20.0);

            if (sigs[sig.k]) {
              try {
                doc.addImage(sigs[sig.k], 'PNG', sX + 3, y + 0.8, sigW - 6, 11.2);
              } catch (e) { }
            }

            doc.setDrawColor(90, 90, 100);
            doc.setLineWidth(0.25);
            doc.line(sX + 4, y + 12.5, sX + sigW - 4, y + 12.5);

            fonte(6.5, 'bold', ROXO);
            doc.text(sig.lbl, sX + sigW / 2, y + 15.6, { align: 'center' });

            if (sig.k === 'ass_motorista' && d.motorista) {
              fonte(5.8, 'normal', [40, 40, 50]);
              doc.text(corta(d.motorista, sigW - 6), sX + sigW / 2, y + 18.5, { align: 'center' });
            } else if (sigs[sig.k]) {
              fonte(5.5, 'normal', [21, 128, 61]);
              doc.text('Assinado digitalmente', sX + sigW / 2, y + 18.5, { align: 'center' });
            } else {
              fonte(5.5, 'normal', CINZA);
              doc.text('Pendente', sX + sigW / 2, y + 18.5, { align: 'center' });
            }
          });

          // --- 7. RODAPÉ ---
          doc.setDrawColor(210, 210, 220);
          doc.setLineWidth(0.2);
          doc.line(M, 284, M + W, 284);

          fonte(5.5, 'normal', CINZA);
          doc.text('Gomex Distribuidora · Sistema Gomex Frota · Check-list Vistoria Veicular', M, 288);
          doc.text('Vistoria Nº ' + d.numero + ' · Placa: ' + (d.placa || '').toUpperCase() + ' · Pág. 1/1', M + W, 288, { align: 'right' });

          // Ação: Download ou Impressão
          const nomeArquivo = 'Vistoria_' + (d.numero || '000000') + '_' + (d.placa || '').toUpperCase() + '.pdf';
          if (isPrint) {
            doc.autoPrint();
            const url = URL.createObjectURL(doc.output('blob'));
            window.open(url, '_blank');
            toast('Abrindo documento para impressão...');
          } else {
            doc.save(nomeArquivo);
            toast('PDF Oficial baixado com sucesso!');
          }
        } catch (err) {
          toast('Erro gerando PDF: ' + err.message, 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      window.baixarPdfOficial = baixarPdfOficial;

      // ==============================================================================