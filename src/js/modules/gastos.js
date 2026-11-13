      // MÓDULO DE CUSTOS, PEÇAS, INSUMOS E GALERIA DA FROTA (COM CÓDIGO DE PRODUTO E SUPABASE)
      // ==============================================================================
      const GASTOS_CATALOGO_KEY = 'gomex_frota_catalogo_produtos_v1';
      const GASTOS_LANCAMENTOS_KEY = 'gomex_frota_lancamentos_gastos_v1';
      const GALERIA_VEICULOS_KEY = 'gomex_frota_galeria_veiculos_v1';
      const HIST_MANUT_ALL_KEY = 'gomex_frota_historico_manutencoes_v1';
      const FROTA_VEICULOS_KEY = 'gomex_frota_cadastro_veiculos_v1';
      const OCORRENCIAS_FROTA_KEY = 'gomex_frota_ocorrencias_v1';
      const AGENDAMENTOS_FROTA_KEY = 'gomex_frota_agendamentos_v1';

      const VEICULOS_PADRAO_FROTA = [
        {
          "id": "veic_4_ARS6B73",
          "nro_frota": "4",
          "placa": "ARS6B73",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "Jackson",
          "rota": "217",
          "km_inicial": 307493,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X7AP009283",
          "obs": "Nº Frota: 4 · Chassi: 9BWNF07X7AP009283 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_5_AUD9066",
          "nro_frota": "5",
          "placa": "AUD9066",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTK56117",
          "obs": "Nº Frota: 5 · Chassi: WF0XXXTBFBTK56117 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_6_ATE5817",
          "nro_frota": "6",
          "placa": "ATE5817",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X8BP013506",
          "obs": "Nº Frota: 6 · Chassi: 9BWNF07X8BP013506 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_7_ATJ7180",
          "nro_frota": "7",
          "placa": "ATJ7180",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "Jefferson",
          "rota": "240",
          "km_inicial": 235336,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "9BWNF07X0BP013466",
          "obs": "Nº Frota: 7 · Chassi: 9BWNF07X0BP013466 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_8_ARJ4116",
          "nro_frota": "8",
          "placa": "ARJ4116",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X2AP002516",
          "obs": "Nº Frota: 8 · Chassi: 9BWNF07X2AP002516 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_9_AUY9346",
          "nro_frota": "9",
          "placa": "AUY9346",
          "modelo": "TRANSIT Furgão LONGO PRATA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRATA",
          "chassi": "WFDXXXTBFBTJ28898",
          "obs": "Nº Frota: 9 · Chassi: WFDXXXTBFBTJ28898 · Cor: PRATA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_10_AUE5535",
          "nro_frota": "10",
          "placa": "AUE5535",
          "modelo": "TRANSIT Furgão CURTO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL29243",
          "obs": "Nº Frota: 10 · Chassi: WF0XXXTBFBTL29243 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_12_AVD9290",
          "nro_frota": "12",
          "placa": "AVD9290",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTT17636",
          "obs": "Nº Frota: 12 · Chassi: WF0XXXTBFBTT17636 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_13_AVP7240",
          "nro_frota": "13",
          "placa": "AVP7240",
          "modelo": "TRANSIT Furgão LONGO PRATA 11/11",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRATA",
          "chassi": "WF0XXXTBFBTY74667",
          "obs": "Nº Frota: 13 · Chassi: WF0XXXTBFBTY74667 · Cor: PRATA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_15_ATA4077",
          "nro_frota": "15",
          "placa": "ATA4077",
          "modelo": "TRANSIT Furgão LONGO BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXT9FATD13941",
          "obs": "Nº Frota: 15 · Chassi: WF0XXXT9FATD13941 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_16_AUE5311",
          "nro_frota": "16",
          "placa": "AUE5311",
          "modelo": "TRANSIT Furgão CURTO 11/11 - AUE531",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL28858",
          "obs": "Nº Frota: 16 · Chassi: WF0XXXTBFBTL28858 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_17_AVS3076",
          "nro_frota": "17",
          "placa": "AVS3076",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "WF0XXXTBFBTS14384",
          "obs": "Nº Frota: 17 · Chassi: WF0XXXTBFBTS14384 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_18_ARJ3228",
          "nro_frota": "18",
          "placa": "ARJ3228",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X2AP002063",
          "obs": "Nº Frota: 18 · Chassi: 9BWNF07X2AP002063 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_20_ARA8711",
          "nro_frota": "20",
          "placa": "ARA8711",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/09",
          "ano": "2009",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X59P023419",
          "obs": "Nº Frota: 20 · Chassi: 9BWNF07X59P023419 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_21_AQB7182",
          "nro_frota": "21",
          "placa": "AQB7182",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/08",
          "ano": "2008",
          "motorista": "LEONARDO CESAR ALVARENGA WEIRICH",
          "rota": "229",
          "km_inicial": 274526,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWFF07XX8P025699",
          "obs": "Nº Frota: 21 · Chassi: 9BWFF07XX8P025699 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_22_AQC1D04",
          "nro_frota": "22",
          "placa": "AQC1D04",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/08",
          "ano": "2008",
          "motorista": "Wesley Honorato Dos Santos",
          "rota": "206",
          "km_inicial": 280355,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWFF07X78P025708",
          "obs": "Nº Frota: 22 · Chassi: 9BWFF07X78P025708 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_23_ASR3401",
          "nro_frota": "23",
          "placa": "ASR3401",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9BP002790",
          "obs": "Nº Frota: 23 · Chassi: 9BWNF07X9BP002790 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_24_ASR3203",
          "nro_frota": "24",
          "placa": "ASR3203",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X1BP003187",
          "obs": "Nº Frota: 24 · Chassi: 9BWNF07X1BP003187 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_25_ASQ3A29",
          "nro_frota": "25",
          "placa": "ASQ3A29",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "Gabriel Vinicius Dick",
          "rota": "224",
          "km_inicial": 223443,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF05X5BP003127",
          "obs": "Nº Frota: 25 · Chassi: 9BWNF05X5BP003127 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_26_ARO3871",
          "nro_frota": "26",
          "placa": "ARO3871",
          "modelo": "TRANSIT Furgão LONGO Vw/Kombi",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF05X5BP003127",
          "obs": "Nº Frota: 26 · Chassi: 9BWNF05X5BP003127 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_27_ATF8557",
          "nro_frota": "27",
          "placa": "ATF8557",
          "modelo": "TRANSIT Furgão LONGO BRANCA 10/10",
          "ano": "2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTAFATY71694",
          "obs": "Nº Frota: 27 · Chassi: WF0XXXTAFATY71694 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_28_ASF1725",
          "nro_frota": "28",
          "placa": "ASF1725",
          "modelo": "TRANSIT Furgão CURTO BRANCA 09/09",
          "ano": "2009",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXT9F9TM76227",
          "obs": "Nº Frota: 28 · Chassi: WF0XXXT9F9TM76227 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_29_AUD9069",
          "nro_frota": "29",
          "placa": "AUD9069",
          "modelo": "TRANSIT Furgão CURTO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL28878",
          "obs": "Nº Frota: 29 · Chassi: WF0XXXTBFBTL28878 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_31_AUE5530",
          "nro_frota": "31",
          "placa": "AUE5530",
          "modelo": "TRANSIT Furgão CURTO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL29301",
          "obs": "Nº Frota: 31 · Chassi: WF0XXXTBFBTL29301 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_32_AUE8413",
          "nro_frota": "32",
          "placa": "AUE8413",
          "modelo": "TRANSIT Furgão CURTO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL29840",
          "obs": "Nº Frota: 32 · Chassi: WF0XXXTBFBTL29840 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_33_AVD8J86",
          "nro_frota": "33",
          "placa": "AVD8J86",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTT23428",
          "obs": "Nº Frota: 33 · Chassi: WF0XXXTBFBTT23428 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_34_AVD8856",
          "nro_frota": "34",
          "placa": "AVD8856",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTJ28813",
          "obs": "Nº Frota: 34 · Chassi: WF0XXXTBFBTJ28813 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_35_AUY6057",
          "nro_frota": "35",
          "placa": "AUY6057",
          "modelo": "TRANSIT Furgão LONGO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTT17880",
          "obs": "Nº Frota: 35 · Chassi: WF0XXXTBFBTT17880 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_36_AUY1520",
          "nro_frota": "36",
          "placa": "AUY1520",
          "modelo": "TRANSIT Furgão LONGO PRATA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTT17665",
          "obs": "Nº Frota: 36 · Chassi: WF0XXXTBFBTT17665 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_39_AWM5868",
          "nro_frota": "39",
          "placa": "AWM5868",
          "modelo": "VOLKS/CAMINHAO 5-150",
          "ano": "2013/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "9531M32P4DR316745",
          "obs": "Nº Frota: 39 · Chassi: 9531M32P4DR316745 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_40_AZF3052",
          "nro_frota": "40",
          "placa": "AZF3052",
          "modelo": "FORD/TRANSIT TRANSIT 350L",
          "ano": "2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "WFOFXPTDFDTP26758",
          "obs": "Nº Frota: 40 · Chassi: WFOFXPTDFDTP26758 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_41_AZD3676",
          "nro_frota": "41",
          "placa": "AZD3676",
          "modelo": "FORD TRANSIT",
          "ano": "2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "WF0FXFXPTDFDTR25037",
          "obs": "Nº Frota: 41 · Chassi: WF0FXFXPTDFDTR25037 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_42_AZD3677",
          "nro_frota": "42",
          "placa": "AZD3677",
          "modelo": "FORD TRANSIT",
          "ano": "2012/2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "9531M32P4DR316745",
          "obs": "Nº Frota: 42 · Chassi: 9531M32P4DR316745 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_50_AYR7G87",
          "nro_frota": "50",
          "placa": "AYR7G87",
          "modelo": "RENAULT MASTER Furgão",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "93YMAF4LEFJ429908",
          "obs": "Nº Frota: 50 · Chassi: 93YMAF4LEFJ429908 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_51_AYT0G34",
          "nro_frota": "51",
          "placa": "AYT0G34",
          "modelo": "RENAULT MASTER Furgão",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "93YMAF4LEFJ312332",
          "obs": "Nº Frota: 51 · Chassi: 93YMAF4LEFJ312332 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_52_AYS0241",
          "nro_frota": "52",
          "placa": "AYS0241",
          "modelo": "Caminhão SCANIA P250",
          "ano": "2014",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "AZUL",
          "chassi": "9BSP6X200E3862369",
          "obs": "Nº Frota: 52 · Chassi: 9BSP6X200E3862369 · Cor: AZUL · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_53_AYY9607",
          "nro_frota": "53",
          "placa": "AYY9607",
          "modelo": "VW/GOL CONFORTILINE",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAA45U6FT067168",
          "obs": "Nº Frota: 53 · Chassi: 9BWAA45U6FT067168 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_54_AYY9598",
          "nro_frota": "54",
          "placa": "AYY9598",
          "modelo": "VW/GOL CONFORTILINE",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAA45U2FT066602",
          "obs": "Nº Frota: 54 · Chassi: 9BWAA45U2FT066602 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_55_AYY9599",
          "nro_frota": "55",
          "placa": "AYY9599",
          "modelo": "VW/GOL CONFORTILINE",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "9BWAA45U6FT066568",
          "obs": "Nº Frota: 55 · Chassi: 9BWAA45U6FT066568 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_56_AYY9604",
          "nro_frota": "56",
          "placa": "AYY9604",
          "modelo": "VW/GOL CONFORTILINE",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAA45U3FT066527",
          "obs": "Nº Frota: 56 · Chassi: 9BWAA45U3FT066527 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_57_AZO2983",
          "nro_frota": "57",
          "placa": "AZO2983",
          "modelo": "VW/GOL CONFORTILINE",
          "ano": "2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "9BWAA45U4FP177922",
          "obs": "Nº Frota: 57 · Chassi: 9BWAA45U4FP177922 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_58_AZO2984",
          "nro_frota": "58",
          "placa": "AZO2984",
          "modelo": "VW/VOYAGE CONFORTILINE",
          "ano": "2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "9BWDA45U1FT117231",
          "obs": "Nº Frota: 58 · Chassi: 9BWDA45U1FT117231 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_61_AZU6981",
          "nro_frota": "61",
          "placa": "AZU6981",
          "modelo": "VOLKSWAGEN GOL CL MB",
          "ano": "2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRATA",
          "chassi": "9BWAA45U5FP568366",
          "obs": "Nº Frota: 61 · Chassi: 9BWAA45U5FP568366 · Cor: PRATA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_62_AZU6980",
          "nro_frota": "62",
          "placa": "AZU6980",
          "modelo": "VOLKSWAGEN GOL CL MB",
          "ano": "2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRATA",
          "chassi": "9BWAA45UXFP192005",
          "obs": "Nº Frota: 62 · Chassi: 9BWAA45UXFP192005 · Cor: PRATA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_63_BAH9445",
          "nro_frota": "63",
          "placa": "BAH9445",
          "modelo": "RENAULT FUR L3H2",
          "ano": "2016/2017",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YMAFELEHJ256212",
          "obs": "Nº Frota: 63 · Chassi: 93YMAFELEHJ256212 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_64_BAE7C17",
          "nro_frota": "64",
          "placa": "BAE7C17",
          "modelo": "TOYOTA COROLLA XEI FLEX",
          "ano": "2015/2016",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BRBDWHE6G0295742",
          "obs": "Nº Frota: 64 · Chassi: 9BRBDWHE6G0295742 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_65_ARI4753",
          "nro_frota": "65",
          "placa": "ARI4753",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X2AP001317",
          "obs": "Nº Frota: 65 · Chassi: 9BWNF07X2AP001317 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_66_AZG7707",
          "nro_frota": "66",
          "placa": "AZG7707",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 11/12",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X2CP009520",
          "obs": "Nº Frota: 66 · Chassi: 9BWNF07X2CP009520 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_67_AVD8571",
          "nro_frota": "67",
          "placa": "AVD8571",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 12/12",
          "ano": "2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9CP026282",
          "obs": "Nº Frota: 67 · Chassi: 9BWNF07X9CP026282 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_69_IOM8A79",
          "nro_frota": "69",
          "placa": "IOM8A79",
          "modelo": "KOMBI FURG. 1.4 FLEX 08/08 IOM8A79",
          "ano": "2008",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWFF07X98P019148",
          "obs": "Nº Frota: 69 · Chassi: 9BWFF07X98P019148 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_71_ATT5531",
          "nro_frota": "71",
          "placa": "ATT5531",
          "modelo": "FREELANDER 2 SE I6",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETA",
          "chassi": "",
          "obs": "Nº Frota: 71 · Cor: PRETA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_72_BAE7C18",
          "nro_frota": "72",
          "placa": "BAE7C18",
          "modelo": "TOYOTA COROLLA XEI FLEX",
          "ano": "2015/2016",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETA",
          "chassi": "9BRBDWHE6G0297911",
          "obs": "Nº Frota: 72 · Chassi: 9BRBDWHE6G0297911 · Cor: PRETA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_73_AVU7716",
          "nro_frota": "73",
          "placa": "AVU7716",
          "modelo": "NISSAN TIIDA",
          "ano": "2012/2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "3N1BC1CD8DK195934",
          "obs": "Nº Frota: 73 · Chassi: 3N1BC1CD8DK195934 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_74_AUD6A81",
          "nro_frota": "74",
          "placa": "AUD6A81",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 11/12",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X4CP004674",
          "obs": "Nº Frota: 74 · Chassi: 9BWNF07X4CP004674 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_75_AZV7659",
          "nro_frota": "75",
          "placa": "AZV7659",
          "modelo": "CRUZE LT 1.8 AUTOMATICO FLEX",
          "ano": "2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BGPB68NOFB217081",
          "obs": "Nº Frota: 75 · Chassi: 9BGPB68NOFB217081 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_77_IOT9B39",
          "nro_frota": "77",
          "placa": "IOT9B39",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/09",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "",
          "obs": "Nº Frota: 77 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_78_IOX8063",
          "nro_frota": "78",
          "placa": "IOX8063",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/09",
          "ano": "2008/2009",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07XX9P002985",
          "obs": "Nº Frota: 78 · Chassi: 9BWNF07XX9P002985 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_79_AYM9958",
          "nro_frota": "79",
          "placa": "AYM9958",
          "modelo": "FIAT DOBLO CARGO 1.4 FLEX",
          "ano": "2014",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BD223153E2038594",
          "obs": "Nº Frota: 79 · Chassi: 9BD223153E2038594 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_80_IVU6547",
          "nro_frota": "80",
          "placa": "IVU6547",
          "modelo": "FIAT FIORINO 1.4 FLEX",
          "ano": "2014/2015",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BD265122F9019069",
          "obs": "Nº Frota: 80 · Chassi: 9BD265122F9019069 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_81_IOT9B64",
          "nro_frota": "81",
          "placa": "IOT9B64",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/09",
          "ano": "2008/2009",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X49P000004",
          "obs": "Nº Frota: 81 · Chassi: 9BWNF07X49P000004 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_82_IOU0H28",
          "nro_frota": "82",
          "placa": "IOU0H28",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 08/09",
          "ano": "2008/2009",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X39P000852",
          "obs": "Nº Frota: 82 · Chassi: 9BWNF07X39P000852 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_83_IPS9800",
          "nro_frota": "83",
          "placa": "IPS9800",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/09",
          "ano": "2009",
          "motorista": "Wesley Aparecido Da Roaa",
          "rota": "203",
          "km_inicial": 300986,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X19P027239",
          "obs": "Nº Frota: 83 · Chassi: 9BWNF07X19P027239 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_84_IPV0C73",
          "nro_frota": "84",
          "placa": "IPV0C73",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9AP001704",
          "obs": "Nº Frota: 84 · Chassi: 9BWNF07X9AP001704 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_85_IQJ8E28",
          "nro_frota": "85",
          "placa": "IQJ8E28",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 09/10",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X4AP017051",
          "obs": "Nº Frota: 85 · Chassi: 9BWNF07X4AP017051 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_87_IRE8E13",
          "nro_frota": "87",
          "placa": "IRE8E13",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 87 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_88_IRX2C55",
          "nro_frota": "88",
          "placa": "IRX2C55",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 11/12",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9CP001897",
          "obs": "Nº Frota: 88 · Chassi: 9BWNF07X9CP001897 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_89_IST7D96",
          "nro_frota": "89",
          "placa": "IST7D96",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 12/12",
          "ano": "2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9CP023267",
          "obs": "Nº Frota: 89 · Chassi: 9BWNF07X9CP023267 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_91_IST6C52",
          "nro_frota": "91",
          "placa": "IST6C52",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 12/12",
          "ano": "2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X7CP023266",
          "obs": "Nº Frota: 91 · Chassi: 9BWNF07X7CP023266 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_92_IRF3C89",
          "nro_frota": "92",
          "placa": "IRF3C89",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9BP012462",
          "obs": "Nº Frota: 92 · Chassi: 9BWNF07X9BP012462 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_93_IRE8E05",
          "nro_frota": "93",
          "placa": "IRE8E05",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X7BP012511",
          "obs": "Nº Frota: 93 · Chassi: 9BWNF07X7BP012511 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_94_IUB0H75",
          "nro_frota": "94",
          "placa": "IUB0H75",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 12/13",
          "ano": "2012/2013",
          "motorista": "Emerson 222",
          "rota": "222",
          "km_inicial": 187264,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X4DP010363",
          "obs": "Nº Frota: 94 · Chassi: 9BWNF07X4DP010363 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_95_IRX2C68",
          "nro_frota": "95",
          "placa": "IRX2C68",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 11/12",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07XXCP001973",
          "obs": "Nº Frota: 95 · Chassi: 9BWNF07XXCP001973 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_96_MMJ9099",
          "nro_frota": "96",
          "placa": "MMJ9099",
          "modelo": "I/CHRYSLER 300C SRTB",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "",
          "obs": "Nº Frota: 96 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_97_BDP9G05",
          "nro_frota": "97",
          "placa": "BDP9G05",
          "modelo": "VW POLO CL ADA",
          "ano": "2019/2020",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAH5BZ9LP074752",
          "obs": "Nº Frota: 97 · Chassi: 9BWAH5BZ9LP074752 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_98_CPN8C43",
          "nro_frota": "98",
          "placa": "CPN8C43",
          "modelo": "Caminhão VW 15.180",
          "ano": "2009/2010",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "9533172S5AO11537",
          "obs": "Nº Frota: 98 · Chassi: 9533172S5AO11537 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_99_NYA4975",
          "nro_frota": "99",
          "placa": "NYA4975",
          "modelo": "FORD CARGO 1319",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 99 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_100_NYA4J75",
          "nro_frota": "100",
          "placa": "NYA4J75",
          "modelo": "FORD CARGO",
          "ano": "2012/2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BFXEB1BXDBS10049",
          "obs": "Nº Frota: 100 · Chassi: 9BFXEB1BXDBS10049 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_101_LUH6G52",
          "nro_frota": "101",
          "placa": "LUH6G52",
          "modelo": "GOLF GTI",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETO",
          "chassi": "",
          "obs": "Nº Frota: 101 · Cor: PRETO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_102_BCW8A43",
          "nro_frota": "102",
          "placa": "BCW8A43",
          "modelo": "VW GTI 350 TSI 2.0 230CV 16V AUT.",
          "ano": "2019",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAV7AU0K4000159",
          "obs": "Nº Frota: 102 · Chassi: 9BWAV7AU0K4000159 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_103_BDZ1H47",
          "nro_frota": "103",
          "placa": "BDZ1H47",
          "modelo": "TOYOTA XEI",
          "ano": "2020",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BRB33BE7L2022170",
          "obs": "Nº Frota: 103 · Chassi: 9BRB33BE7L2022170 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_104_BDO3G59",
          "nro_frota": "104",
          "placa": "BDO3G59",
          "modelo": "MERCEDEZS BENZ SPRINTER 313 STREET CHASSI",
          "ano": "2019",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "8AC906135KE175688",
          "obs": "Nº Frota: 104 · Chassi: 8AC906135KE175688 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_105_BEY9C48",
          "nro_frota": "105",
          "placa": "BEY9C48",
          "modelo": "MERCEDES BENZ ATEGO 1719",
          "ano": "2021",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BM95815MB205407",
          "obs": "Nº Frota: 105 · Chassi: 9BM95815MB205407 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_106_AUD9B28",
          "nro_frota": "106",
          "placa": "AUD9B28",
          "modelo": "TRANSIT Furgão CURTO BRANCA 11/11",
          "ano": "2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "WF0XXXTBFBTL28858",
          "obs": "Nº Frota: 106 · Chassi: WF0XXXTBFBTL28858 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_107_RHB4G63",
          "nro_frota": "107",
          "placa": "RHB4G63",
          "modelo": "POLO TSI 2021/21 RHB4G63",
          "ano": "2021",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCO",
          "chassi": "9BWAH5BZXMP061266",
          "obs": "Nº Frota: 107 · Chassi: 9BWAH5BZXMP061266 · Cor: BRANCO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_108_BCV1B15",
          "nro_frota": "108",
          "placa": "BCV1B15",
          "modelo": "NISSAN 18SL",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "3N1BC1CD5CK219413",
          "obs": "Nº Frota: 108 · Chassi: 3N1BC1CD5CK219413 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_109_RHN4C29",
          "nro_frota": "109",
          "placa": "RHN4C29",
          "modelo": "GOL",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAG45UXNT087937",
          "obs": "Nº Frota: 109 · Chassi: 9BWAG45UXNT087937 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_110_RHN4C07",
          "nro_frota": "110",
          "placa": "RHN4C07",
          "modelo": "VW 1.0",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAG45UNT087991",
          "obs": "Nº Frota: 110 · Chassi: 9BWAG45UNT087991 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_111_RHN9A28",
          "nro_frota": "111",
          "placa": "RHN9A28",
          "modelo": "GOL",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 111 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_112_RHN9A40",
          "nro_frota": "112",
          "placa": "RHN9A40",
          "modelo": "GOL",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 112 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_113_RHN9A52",
          "nro_frota": "113",
          "placa": "RHN9A52",
          "modelo": "VW/GOL CONFORTILINE 2021/2022",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 113 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_114_RHN9C40",
          "nro_frota": "114",
          "placa": "RHN9C40",
          "modelo": "GOL",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 114 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_115_ABL1E73",
          "nro_frota": "115",
          "placa": "ABL1E73",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 11/12",
          "ano": "2011/2012",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X5CP015554",
          "obs": "Nº Frota: 115 · Chassi: 9BWNF07X5CP015554 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_116_AOI4C05",
          "nro_frota": "116",
          "placa": "AOI4C05",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 06/07",
          "ano": "2006/2007",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWFF07X17P005761",
          "obs": "Nº Frota: 116 · Chassi: 9BWFF07X17P005761 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_117_AOI4B86",
          "nro_frota": "117",
          "placa": "AOI4B86",
          "modelo": "KOMBI Furgão 1.4 FLEX BRANCA 06/07",
          "ano": "2006/2007",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWFF07X37P005888",
          "obs": "Nº Frota: 117 · Chassi: 9BWFF07X37P005888 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_118_RHQ9F75",
          "nro_frota": "118",
          "placa": "RHQ9F75",
          "modelo": "POLO TSI BRANCO 2021/2022",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAH5BZ8NP026503",
          "obs": "Nº Frota: 118 · Chassi: 9BWAH5BZ8NP026503 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_119_RHS0B22",
          "nro_frota": "119",
          "placa": "RHS0B22",
          "modelo": "I/VOLVO XC40 T5H RDESIGN",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "VERMELHA",
          "chassi": "YV1XZBBCFN2694672",
          "obs": "Nº Frota: 119 · Chassi: YV1XZBBCFN2694672 · Cor: VERMELHA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_120_IUI7J59",
          "nro_frota": "120",
          "placa": "IUI7J59",
          "modelo": "KOMBI Furgão",
          "ano": "2013/2014",
          "motorista": "Welder Wester Da Silva",
          "rota": "214",
          "km_inicial": 173855,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X5EP001351",
          "obs": "Nº Frota: 120 · Chassi: 9BWNF07X5EP001351 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_121_AXF7J73",
          "nro_frota": "121",
          "placa": "AXF7J73",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 13/14",
          "ano": "2013/2014",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07X9EP007170",
          "obs": "Nº Frota: 121 · Chassi: 9BWNF07X9EP007170 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_122_ASO8H31",
          "nro_frota": "122",
          "placa": "ASO8H31",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 10/11",
          "ano": "2010/2011",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWNF07XXBP002071",
          "obs": "Nº Frota: 122 · Chassi: 9BWNF07XXBP002071 · Cor: BRANCA · UF: PRR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_123_RHY4G89",
          "nro_frota": "123",
          "placa": "RHY4G89",
          "modelo": "MB 815",
          "ano": "2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BM951102NB268140",
          "obs": "Nº Frota: 123 · Chassi: 9BM951102NB268140 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_124_EWP8I81",
          "nro_frota": "124",
          "placa": "EWP8I81",
          "modelo": "MERCEDES-BENZ/GLA 250 GLA 250",
          "ano": "2019",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETA",
          "chassi": "",
          "obs": "Nº Frota: 124 · Cor: PRETA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_125_AZJ6I40",
          "nro_frota": "125",
          "placa": "AZJ6I40",
          "modelo": "HB 20",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "",
          "obs": "Nº Frota: 125 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_126_RHV8A22",
          "nro_frota": "126",
          "placa": "RHV8A22",
          "modelo": "I/FORD MUSTANG MACH1",
          "ano": "2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "VERMELHA",
          "chassi": "",
          "obs": "Nº Frota: 126 · Cor: VERMELHA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_127_AVZ9A25",
          "nro_frota": "127",
          "placa": "AVZ9A25",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 12/13",
          "ano": "2012/2013",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 127 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_128_BAL3C34",
          "nro_frota": "128",
          "placa": "BAL3C34",
          "modelo": "KOMBI FURGAO 1.4 FLEX BRANCA 13/14",
          "ano": "2013/2014",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 128 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_129_SEJ3C54",
          "nro_frota": "129",
          "placa": "SEJ3C54",
          "modelo": "VW NIVUS",
          "ano": "2023",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 129 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_130_EBP2I49",
          "nro_frota": "130",
          "placa": "EBP2I49",
          "modelo": "I/ BMW M135I XDRIV",
          "ano": "2020/2021",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "AZUL",
          "chassi": "WBA7L1106M7F97484",
          "obs": "Nº Frota: 130 · Chassi: WBA7L1106M7F97484 · Cor: AZUL · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_131_BDA4G12",
          "nro_frota": "131",
          "placa": "BDA4G12",
          "modelo": "HONDA CIVIC EXL CVT",
          "ano": "2019",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "AZUL",
          "chassi": "93HFC264KZ211239",
          "obs": "Nº Frota: 131 · Chassi: 93HFC264KZ211239 · Cor: AZUL · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_132_DTC6H54",
          "nro_frota": "132",
          "placa": "DTC6H54",
          "modelo": "VW POLO HL",
          "ano": "",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "",
          "obs": "Nº Frota: 132 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_133_TAZ6C00",
          "nro_frota": "133",
          "placa": "TAZ6C00",
          "modelo": "I/VOLVO XC60 T8 ULT DARK",
          "ano": "2024",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "CINZA",
          "chassi": "LYVUZH6C9RB916974",
          "obs": "Nº Frota: 133 · Chassi: LYVUZH6C9RB916974 · Cor: CINZA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_134_TAY3D65",
          "nro_frota": "134",
          "placa": "TAY3D65",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62007SJ122730",
          "obs": "Nº Frota: 134 · Chassi: 93YF62007SJ122730 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_135_TAY3D64",
          "nro_frota": "135",
          "placa": "TAY3D64",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62007SJ122713",
          "obs": "Nº Frota: 135 · Chassi: 93YF62007SJ122713 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_136_TAY3D63",
          "nro_frota": "136",
          "placa": "TAY3D63",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62008SJ122686",
          "obs": "Nº Frota: 136 · Chassi: 93YF62008SJ122686 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_137_TAY3D62",
          "nro_frota": "137",
          "placa": "TAY3D62",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62008SJ122669",
          "obs": "Nº Frota: 137 · Chassi: 93YF62008SJ122669 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_138_TAY3D69",
          "nro_frota": "138",
          "placa": "TAY3D69",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62007SJ122775",
          "obs": "Nº Frota: 138 · Chassi: 93YF62007SJ122775 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_139_TAY3D68",
          "nro_frota": "139",
          "placa": "TAY3D68",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "Magno Cristiano De LIMA",
          "rota": "211",
          "km_inicial": 58550,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62007SJJ122758",
          "obs": "Nº Frota: 139 · Chassi: 93YF62007SJJ122758 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_140_TAY3D67",
          "nro_frota": "140",
          "placa": "TAY3D67",
          "modelo": "RENAULT Furgão L3",
          "ano": "2024/2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YF62004SJ122734",
          "obs": "Nº Frota: 140 · Chassi: 93YF62004SJ122734 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_141_TBH2F54",
          "nro_frota": "141",
          "placa": "TBH2F54",
          "modelo": "VW / POLO TRACK MA",
          "ano": "2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAG5R17STO78162",
          "obs": "Nº Frota: 141 · Chassi: 9BWAG5R17STO78162 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_142_TBI4B51",
          "nro_frota": "142",
          "placa": "TBI4B51",
          "modelo": "VW POLO CL AB",
          "ano": "2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAH5BZ8ST663104",
          "obs": "Nº Frota: 142 · Chassi: 9BWAH5BZ8ST663104 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_143_TBI4B57",
          "nro_frota": "143",
          "placa": "TBI4B57",
          "modelo": "VW POLO CL AB",
          "ano": "2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "9BWAH5BZ9ST662740",
          "obs": "Nº Frota: 143 · Chassi: 9BWAH5BZ9ST662740 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_144_TBK3I17",
          "nro_frota": "144",
          "placa": "TBK3I17",
          "modelo": "RENAULT CHASSI CAB",
          "ano": "2025/2026",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "93YU62S05TJ210990",
          "obs": "Nº Frota: 144 · Chassi: 93YU62S05TJ210990 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_145_RHV0A25",
          "nro_frota": "145",
          "placa": "RHV0A25",
          "modelo": "PORSCHE CAYENNE CP PHE",
          "ano": "2025",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BEGE",
          "chassi": "WP1BE29Y8SDA68555",
          "obs": "Nº Frota: 145 · Chassi: WP1BE29Y8SDA68555 · Cor: BEGE · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_146_FIL0E51",
          "nro_frota": "146",
          "placa": "FIL0E51",
          "modelo": "TOYOTA TOYOTA/CCROSS XRX HYBRID",
          "ano": "2021/2022",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "",
          "chassi": "",
          "obs": "Nº Frota: 146 · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_147_TLT9J49",
          "nro_frota": "147",
          "placa": "TLT9J49",
          "modelo": "HARLEY DAVIDSON",
          "ano": "2024",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETA",
          "chassi": "9321YBK75RD023258",
          "obs": "Nº Frota: 147 · Chassi: 9321YBK75RD023258 · Cor: PRETA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_148_BBB000",
          "nro_frota": "148",
          "placa": "BBB000",
          "modelo": "MUSTANG MACH 1 PRETO",
          "ano": "1969",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "PRETO",
          "chassi": "",
          "obs": "Nº Frota: 148 · Cor: PRETO · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        },
        {
          "id": "veic_149_SEU7D32",
          "nro_frota": "149",
          "placa": "SEU7D32",
          "modelo": "CAMINHAO MERCEDES BENZ ACCELO 817",
          "ano": "2022/2023",
          "motorista": "",
          "rota": "",
          "km_inicial": 0,
          "meta_oleo_km": 10000,
          "cor": "BRANCA",
          "chassi": "",
          "obs": "Nº Frota: 149 · Cor: BRANCA · UF: PR",
          "ativo": true,
          "created_at": "2026-11-04"
        }
      ];

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
      }

      function salvarGastosLocalStorage() {
        try {
          garantirCodigosProdutos();
          localStorage.setItem(GASTOS_CATALOGO_KEY, JSON.stringify(gastosState.produtos));
          localStorage.setItem(GASTOS_LANCAMENTOS_KEY, JSON.stringify(gastosState.lancamentos));
          localStorage.setItem(HIST_MANUT_ALL_KEY, JSON.stringify(gastosState.historico_manutencoes || {}));
          localStorage.setItem(GALERIA_VEICULOS_KEY, JSON.stringify(gastosState.galeria || []));
          localStorage.setItem(FROTA_VEICULOS_KEY, JSON.stringify(gastosState.veiculos || []));
          localStorage.setItem(OCORRENCIAS_FROTA_KEY, JSON.stringify(gastosState.ocorrencias || []));
          localStorage.setItem(AGENDAMENTOS_FROTA_KEY, JSON.stringify(gastosState.agendamentos || []));
        } catch (e) { }
      }

      async function sincronizarGastosComServidor(modo = 'pull') {
        if (modo === 'pull') {
          try {
            const res = await fetch('/api/frota-gastos', { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
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
              if (data.permissoes && typeof data.permissoes === 'object') {
                if (!window.state) window.state = {};
                window.state.permissoes = { ...(window.state.permissoes || {}), ...data.permissoes };
                try { localStorage.setItem('gomex_permissoes_v1', JSON.stringify(window.state.permissoes)); } catch (e) { }
                if (typeof aplicarPermissoesUi === 'function') aplicarPermissoesUi();
                if (typeof renderAdminPermissoes === 'function' && window.state.visaoPrincipal === 'admin') renderAdminPermissoes();
              }
              if (mudou) {
                salvarGastosLocalStorage();
                renderGastosView();
                if (typeof renderGaleriaView === 'function') renderGaleriaView();
                if (typeof atualizarPaineisFrota === 'function') atualizarPaineisFrota();
                if (typeof renderOcorrenciasView === 'function') renderOcorrenciasView();
                if (typeof renderAgendamentosView === 'function') renderAgendamentosView();
              }
              return true;
            }
          } catch (e) { }

          // Fallback direto no Supabase (tabela parametros)
          try {
            const r = await fetch(SUPABASE_URL + '/rest/v1/parametros?id=in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1,frota_ocorrencias_v1,frota_agendamentos_servicos_v1,frota_permissoes_usuarios_v1)&select=*', {
              headers: authHeaders(),
              cache: 'no-store'
            });
            if (r.ok) {
              const rows = await r.json();
              if (Array.isArray(rows) && rows.length) {
                for (const row of rows) {
                  if (row.id === 'frota_catalogo_produtos_v1' && row.descricao) {
                    const p = JSON.parse(row.descricao);
                    if (Array.isArray(p) && p.length) { gastosState.produtos = p; garantirCodigosProdutos(); }
                  }
                  if (row.id === 'frota_lancamentos_gastos_v1' && row.descricao) {
                    const l = JSON.parse(row.descricao);
                    if (Array.isArray(l)) gastosState.lancamentos = l;
                  }
                  if (row.id === 'frota_historico_manutencoes_v1' && row.descricao) {
                    const m = JSON.parse(row.descricao);
                    if (m && typeof m === 'object') gastosState.historico_manutencoes = m;
                  }
                  if (row.id === 'frota_galeria_veiculos_v1' && row.descricao) {
                    const g = JSON.parse(row.descricao);
                    if (Array.isArray(g)) gastosState.galeria = g;
                  }
                  if (row.id === 'frota_cadastro_veiculos_v1' && row.descricao) {
                    const vc = JSON.parse(row.descricao);
                    if (Array.isArray(vc)) gastosState.veiculos = vc;
                  }
                  if (row.id === 'frota_ocorrencias_v1' && row.descricao) {
                    const oc = JSON.parse(row.descricao);
                    if (Array.isArray(oc)) gastosState.ocorrencias = oc;
                  }
                  if (row.id === 'frota_agendamentos_servicos_v1' && row.descricao) {
                    const ag = JSON.parse(row.descricao);
                    if (Array.isArray(ag)) gastosState.agendamentos = ag;
                  }
                  if (row.id === 'frota_permissoes_usuarios_v1' && row.descricao) {
                    try {
                      const p = JSON.parse(row.descricao);
                      if (p && typeof p === 'object') {
                        if (!window.state) window.state = {};
                        window.state.permissoes = { ...(window.state.permissoes || {}), ...p };
                        try { localStorage.setItem('gomex_permissoes_v1', JSON.stringify(window.state.permissoes)); } catch (e) { }
                        if (typeof aplicarPermissoesUi === 'function') aplicarPermissoesUi();
                        if (typeof renderAdminPermissoes === 'function' && window.state.visaoPrincipal === 'admin') renderAdminPermissoes();
                      }
                    } catch (e) { }
                  }
                }
                salvarGastosLocalStorage();
                renderGastosView();
                if (typeof renderGaleriaView === 'function') renderGaleriaView();
                if (typeof atualizarPaineisFrota === 'function') atualizarPaineisFrota();
                if (typeof renderOcorrenciasView === 'function') renderOcorrenciasView();
                if (typeof renderAgendamentosView === 'function') renderAgendamentosView();
              }
            }
          } catch (e) { }
          return false;
        }

        // PUSH (Salvar todas as coleções no servidor local e no Supabase)
        salvarGastosLocalStorage();
        try {
          const res = await fetch('/api/frota-gastos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              produtos: gastosState.produtos,
              lancamentos: gastosState.lancamentos,
              historico_manutencoes: gastosState.historico_manutencoes,
              galeria: gastosState.galeria,
              veiculos: gastosState.veiculos,
              ocorrencias: gastosState.ocorrencias,
              agendamentos: gastosState.agendamentos,
              permissoes: (window.state && window.state.permissoes) ? window.state.permissoes : undefined
            })
          });
          if (res.ok) return true;
        } catch (e) { }

        // Fallback direto no Supabase (tabela parametros)
        try {
          const totalInvestido = gastosState.lancamentos.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
          const rowsToUpsert = [
            {
              id: 'frota_catalogo_produtos_v1',
              valor: gastosState.produtos.length,
              descricao: JSON.stringify(gastosState.produtos)
            },
            {
              id: 'frota_lancamentos_gastos_v1',
              valor: Number(totalInvestido.toFixed(2)),
              descricao: JSON.stringify(gastosState.lancamentos)
            },
            {
              id: 'frota_historico_manutencoes_v1',
              valor: Object.keys(gastosState.historico_manutencoes || {}).length,
              descricao: JSON.stringify(gastosState.historico_manutencoes || {})
            },
            {
              id: 'frota_galeria_veiculos_v1',
              valor: (gastosState.galeria || []).length,
              descricao: JSON.stringify(gastosState.galeria || [])
            },
            {
              id: 'frota_cadastro_veiculos_v1',
              valor: (gastosState.veiculos || []).length,
              descricao: JSON.stringify(gastosState.veiculos || [])
            },
            {
              id: 'frota_ocorrencias_v1',
              valor: (gastosState.ocorrencias || []).length,
              descricao: JSON.stringify(gastosState.ocorrencias || [])
            },
            {
              id: 'frota_agendamentos_servicos_v1',
              valor: (gastosState.agendamentos || []).length,
              descricao: JSON.stringify(gastosState.agendamentos || [])
            }
          ];
          if (window.state && window.state.permissoes && typeof window.state.permissoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_permissoes_usuarios_v1',
              valor: Object.keys(window.state.permissoes).length,
              descricao: JSON.stringify(window.state.permissoes)
            });
          }
          await fetch(SUPABASE_URL + '/rest/v1/parametros', {
            method: 'POST',
            headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(rowsToUpsert)
          });
          return true;
        } catch (e) { }
        return false;
      }

      carregarGastosLocalStorage();
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
          if (typeof renderGaleriaView === 'function') renderGaleriaView();
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

      // ==============================================================================
      // MODAL 2: CATÁLOGO DE PRODUTOS, PEÇAS & INSUMOS DA FROTA (COM CÓDIGO)
      // ==============================================================================
      function abrirModalCatalogoProdutos() {
        garantirCodigosProdutos();
        limparFormCatalogoProduto();
        renderTabelaCatalogoProdutos();
        $('modalCatalogoProdutos').classList.add('open');
      }
      window.abrirModalCatalogoProdutos = abrirModalCatalogoProdutos;

      function fecharModalCatalogoProdutos() {
        $('modalCatalogoProdutos').classList.remove('open');
      }
      window.fecharModalCatalogoProdutos = fecharModalCatalogoProdutos;

      function limparFormCatalogoProduto() {
        $('catProdEditId').value = '';
        if ($('catProdCodigo')) $('catProdCodigo').value = sugerirProximoCodigoProduto();
        $('catProdNome').value = '';
        $('catProdCategoria').value = 'Óleo & Lubrificantes';
        $('catProdUnidade').value = 'L';
        $('catProdPreco').value = '';
        $('catFormTitle').textContent = 'Cadastrar Novo Produto / Peça';
        $('btnSalvarCatProdLabel').textContent = 'Cadastrar';
        $('btnCancelarEdicaoProd').hidden = true;
      }
      window.limparFormCatalogoProduto = limparFormCatalogoProduto;

      async function salvarProdutoNoCatalogo() {
        const nome = ($('catProdNome').value || '').trim();
        if (!nome) {
          toast('Informe o nome do produto ou peça.', 'error');
          $('catProdNome').focus();
          return;
        }
        const codigo = ($('catProdCodigo')?.value || '').trim() || sugerirProximoCodigoProduto();
        const categoria = $('catProdCategoria').value || 'Outros';
        const unidade = $('catProdUnidade').value || 'un';
        const preco_base = parseNumeroMoeda($('catProdPreco').value);
        const editId = $('catProdEditId').value;

        if (editId) {
          const idx = gastosState.produtos.findIndex(p => String(p.id) === String(editId));
          if (idx !== -1) {
            gastosState.produtos[idx] = { ...gastosState.produtos[idx], codigo, nome, categoria, unidade, preco_base };
          }
          toast('Produto [' + codigo + '] atualizado no catálogo!');
        } else {
          gastosState.produtos.push({
            id: 'prod_' + Date.now(),
            codigo,
            nome,
            categoria,
            unidade,
            preco_base
          });
          toast('Produto [' + codigo + '] "' + nome + '" adicionado ao catálogo!');
        }

        await sincronizarGastosComServidor('push');
        limparFormCatalogoProduto();
        renderTabelaCatalogoProdutos();
        renderGastosView();
      }
      window.salvarProdutoNoCatalogo = salvarProdutoNoCatalogo;

      function editarProdutoCatalogo(id) {
        const p = gastosState.produtos.find(x => String(x.id) === String(id));
        if (!p) return;
        $('catProdEditId').value = p.id;
        if ($('catProdCodigo')) $('catProdCodigo').value = p.codigo || '';
        $('catProdNome').value = p.nome || '';
        $('catProdCategoria').value = p.categoria || 'Outros';
        $('catProdUnidade').value = p.unidade || 'un';
        $('catProdPreco').value = p.preco_base ? Number(p.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
        $('catFormTitle').textContent = 'Editando Produto [' + (p.codigo || '') + ']: ' + p.nome;
        $('btnSalvarCatProdLabel').textContent = 'Salvar Alteração';
        $('btnCancelarEdicaoProd').hidden = false;
        $('catProdNome').focus();
      }
      window.editarProdutoCatalogo = editarProdutoCatalogo;

      async function excluirProdutoCatalogo(id) {
        const p = gastosState.produtos.find(x => String(x.id) === String(id));
        if (!p) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Remover Produto do Catálogo',
          subtitulo: 'Catálogo de peças & insumos',
          mensagem: `Deseja remover <strong>"[${esc(p.codigo || '')}] ${esc(p.nome)}"</strong> do catálogo fixo de produtos?`,
          aviso: 'Os lançamentos já registrados no histórico não serão afetados.',
          textoConfirmar: 'Remover Produto',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;
        gastosState.produtos = gastosState.produtos.filter(x => String(x.id) !== String(id));
        await sincronizarGastosComServidor('push');
        renderTabelaCatalogoProdutos();
        renderGastosView();
        toast('Produto removido do catálogo.');
      }
      window.excluirProdutoCatalogo = excluirProdutoCatalogo;

      function renderTabelaCatalogoProdutos() {
        const tbody = $('catProdutosTableBody');
        if (!tbody) return;
        garantirCodigosProdutos();
        const q = ($('catBuscaProd')?.value || '').toLowerCase().trim();

        const filtrados = gastosState.produtos.filter(p => {
          if (!q) return true;
          return ((p.codigo || '') + ' ' + p.nome + ' ' + p.categoria + ' ' + p.unidade).toLowerCase().includes(q);
        });

        if ($('catTotalProdCount')) $('catTotalProdCount').textContent = gastosState.produtos.length;

        if (!filtrados.length) {
          tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:20px">Nenhum produto encontrado no catálogo.</td></tr>';
          return;
        }

        tbody.innerHTML = filtrados.map(p => {
          const usos = gastosState.lancamentos.filter(g => g.produto_id === p.id || g.produto_nome === p.nome).length;
          return '<tr>' +
            '<td style="white-space:nowrap"><span class="prod-code-badge">' + esc(p.codigo || '—') + '</span></td>' +
            '<td><strong style="color:var(--ink);font-size:13.5px">' + esc(p.nome) + '</strong></td>' +
            '<td style="white-space:nowrap">' + badgeCategoriaProduto(p.categoria) + '</td>' +
            '<td style="white-space:nowrap"><span class="badge-km" style="white-space:nowrap;padding:3px 8px">' + esc(UNIDADE_LABELS[p.unidade] || p.unidade) + '</span></td>' +
            '<td style="font-weight:700;color:var(--ok);white-space:nowrap">' + (p.preco_base ? fmtMoeda(p.preco_base) : '—') + '</td>' +
            '<td style="white-space:nowrap">' + usos + 'x</td>' +
            '<td style="text-align:right;white-space:nowrap">' +
            '<div style="display:inline-flex;gap:6px">' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:30px;width:30px;color:var(--accent-hi)" onclick="editarProdutoCatalogo(\'' + esc(p.id) + '\')" title="Editar produto">' + icon('edit') + '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:30px;width:30px;color:var(--bad)" onclick="excluirProdutoCatalogo(\'' + esc(p.id) + '\')" title="Excluir produto">' + icon('trash') + '</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
        }).join('');
      }
      window.renderTabelaCatalogoProdutos = renderTabelaCatalogoProdutos;

      // ==============================================================================