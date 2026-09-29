sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";
    return {
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        createViewModel: function () {
            var oModel = new JSONModel({
                busy: false,
                filterSociety: "1000",
                filterUnitaEconomicaFrom: "",
                filterUnitaEconomicaTo: "",
                filterTipoOggetto: [],
                filterOggettoFrom: "",
                filterOggettoTo: "",
                filterTest: true,
                filterLayoutVariant: "",
                exportEnabled: false
            });
            return oModel;
        },
        createSocietyModel: function () {
            var oModel = new JSONModel({
                societies: [
                    { code: "1000", text: "1000 - Società Esempio 1" },
                    { code: "2000", text: "2000 - Società Esempio 2" }
                ]
            });
            return oModel;
        },
        createTipoOggettoModel: function () {
            var oModel = new JSONModel({
                tipiOggetto: [
                    { code: "BAUM", text: "BAUM - Immobile" },
                    { code: "GEBAEUDE", text: "GEBAEUDE - Fabbricato" },
                    { code: "GRUNDST", text: "GRUNDST - Terreno" }
                ]
            });
            return oModel;
        },

        createReportModel: function () {
            var oModel = new JSONModel({
                results: []
            });
            return oModel;
        },
        createReportMockEntries: function () {
            return [
                {
                    societa: "1000",
                    unitaEconomica: "UE01",
                    compendio: "12345",
                    descrizTipoComp: "",
                    definizioneUE: "Unità Economica (A)",
                    descrBenePatrimoniale: "FORESTA REGIONALE",
                    descrNaturaGiuridica: "PATRIMONIO DEMANIALE",
                    descrTitoloUtilizzo: "",
                    via: "Magenta",
                    numeroCivico: "1",
                    cap: "20123",
                    localita: "Milano",
                    regione: "MI",
                    chiavePaesiRegioni: "IT",
                    oggettoArchitett: "0000000000161",
                    tipoOggArchitett: "0IRF",
                    defOggArch: "",
                    funzione: "",
                    businessPartner: "",
                    denominazioneDitta: "",
                    descrTpEdifTerr: "RESIDENZE UNIVERSITARIE",
                    descrBeneCulturale: "",
                    idCatCatastale: "",
                    percentRivalutaz: "0",
                    coeffRivalutaz: "0",
                    notaAddizionaleImmobile: "",
                    stAccatastam: "SI",
                    tipoCatasto: "O",
                    denominatore: "",
                    tipoParticella: "",
                    codComCatTav: "",
                    codiceBelfiore: "A100",
                    foglio: "",
                    graffatoFoglio: "",
                    sezioneUrbana: "",
                    sezioneAmministr: "",
                    particellaCatasto: "",
                    sub: "",
                    graffMapSub: "",
                    descrClasse: "",
                    variazioneDal: "",
                    variazioneAl: "",
                    superficieMq: "0",
                    cubaturaMc: "0",
                    rendita: "0",
                    dataRivRend: "",
                    tipoDiCalcolo: "",
                    valOggArch: "0",
                    redditoDominicale: "0",
                    redditoAgrario: "0",
                    note: ""
                },
                {
                    societa: "1000",
                    unitaEconomica: "UE01",
                    compendio: "12345",
                    descrizTipoComp: "",
                    definizioneUE: "Unità Economica (A)",
                    descrBenePatrimoniale: "FORESTA REGIONALE",
                    descrNaturaGiuridica: "PATRIMONIO DEMANIALE",
                    descrTitoloUtilizzo: "",
                    via: "Magenta",
                    numeroCivico: "1",
                    cap: "20123",
                    localita: "Milano",
                    regione: "MI",
                    chiavePaesiRegioni: "IT",
                    oggettoArchitett: "0000000000170",
                    tipoOggArchitett: "0IRF",
                    defOggArch: "test",
                    funzione: "F107",
                    businessPartner: "",
                    denominazioneDitta: "",
                    descrTpEdifTerr: "RESIDENZE UNIVERSITARIE",
                    descrBeneCulturale: "",
                    idCatCatastale: "F1",
                    percentRivalutaz: "0",
                    coeffRivalutaz: "0",
                    notaAddizionaleImmobile: "",
                    stAccatastam: "SI",
                    tipoCatasto: "O",
                    denominatore: "",
                    tipoParticella: "",
                    codComCatTav: "Milano",
                    codiceBelfiore: "A100",
                    foglio: "12",
                    graffatoFoglio: "",
                    sezioneUrbana: "2",
                    sezioneAmministr: "",
                    particellaCatasto: "4",
                    sub: "4",
                    graffMapSub: "",
                    descrClasse: "NONA",
                    variazioneDal: "",
                    variazioneAl: "",
                    superficieMq: "0",
                    cubaturaMc: "0",
                    rendita: "10",
                    dataRivRend: "",
                    tipoDiCalcolo: "FD",
                    valOggArch: "0",
                    redditoDominicale: "0",
                    redditoAgrario: "0",
                    note: ""
                }
            ];
        }
    };
});