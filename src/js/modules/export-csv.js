      // EXPORTAÇÃO CSV PARA EXCEL
      // ==============================================================================
      const csvCell = v => {
        let s = String(v ?? '');
        if (/^[=+\-@]/.test(s)) s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
      };

      $('btnExport').addEventListener('click', () => {
        if (state.visaoAtual === 'frotacad') {
          exportarFrotaVeiculosCsv();
          return;
        }
        if (state.visaoAtual === 'gastos') {
          if (typeof exportarCsvGastos === 'function') exportarCsvGastos();
          return;
        }
        if (!state.filtered.length) { toast('Não há vistorias para exportar com esses filtros.', 'error'); return; }
        const headers = ['Nº vistoria', 'Data', 'Hora', 'Veículo', 'Placa', 'Km', 'Motorista', 'Tipo', 'Combustível', 'Situação', 'Avarias', 'Itens reprovados', 'Dano em pneu', 'Observações'];
        const rows = state.filtered.map(c => [
          c.numero, formatarData(c.data), c.hora, c.veiculo, (c.placa || '').toUpperCase(), c.km, c.motorista,
          c.tipo, c.combustivel, (STATUS[c.liberacao] || {}).label || c.liberacao, avariasOf(c).length, nokOf(c).length, c.pneu_dano || 'Não', c.obs
        ].map(csvCell).join(';'));
        const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Gomex_Vistorias_' + isoLocal(new Date()) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast(state.filtered.length + ' ' + (state.filtered.length === 1 ? 'vistoria exportada' : 'vistorias exportadas'));
      });

      // ==============================================================================