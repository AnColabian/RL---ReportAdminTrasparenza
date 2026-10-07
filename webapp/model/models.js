sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (JSONModel, Device, Filter, FilterOperator) {
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
                societies: []
            });
            return oModel;
        },
        createTipoOggettoModel: function () {
            var oModel = new JSONModel({
                tipiOggetto: []
            });
            return oModel;
        },
        createReportModel: function () {
            var oModel = new JSONModel({
                results: []
            });
            return oModel;
        },
        fetchReportData: function (oODataModel, oSelection, fnSuccess, fnError) {
            var aFilters = [
                new Filter("soc", FilterOperator.EQ, oSelection.societa)
            ];
            var aFields = [
                { path: "uniEcon", selections: oSelection.unitaEconomica },
                { path: "tipoOggArc", selections: oSelection.tipoOggetto },
                { path: "idOggArc", selections: oSelection.oggettoArchitettonico }
            ];
            aFields.forEach(function (oField) {
                var oFilter = this._createReportFieldFilter(oField.path, oField.selections);
                if (oFilter) {
                    aFilters.push(oFilter);
                }
            }, this);
            return oODataModel.read("/amministrTrasp", {
                filters: [new Filter({ filters: aFilters, and: true })],
                success: fnSuccess,
                error: fnError
            });
        },
        _createReportFieldFilter: function (sPath, aSelections) {
            var aIncluded = [];
            var aExcluded = [];
            var mInverseOperators = {
                EQ: "NE",
                NE: "EQ",
                BT: "NB",
                NB: "BT",
                LT: "GE",
                LE: "GT",
                GT: "LE",
                GE: "LT",
                Contains: "NotContains",
                StartsWith: "NotStartsWith",
                EndsWith: "NotEndsWith"
            };
            (aSelections || []).forEach(function (oSelection) {
                var sOperator = oSelection.operation;
                if (oSelection.exclude) {
                    sOperator = mInverseOperators[sOperator];
                }
                if (!sOperator || !FilterOperator[sOperator]) {
                    throw new Error("Operatore filtro non supportato per " + sPath + ": " + oSelection.operation);
                }
                var oFilter = new Filter(sPath, FilterOperator[sOperator], oSelection.value1, oSelection.value2);
                if (oSelection.exclude) {
                    aExcluded.push(oFilter);
                } else {
                    aIncluded.push(oFilter);
                }
            });
            var aFilters = aExcluded.slice();
            if (aIncluded.length) {
                aFilters.unshift(new Filter({ filters: aIncluded, and: false }));
            }
            return aFilters.length ? new Filter({ filters: aFilters, and: true }) : null;
        },
        mapReportEntries: function (aEntries) {
            return aEntries.map(function (oItem) {
                return {
                    societa: oItem.soc,
                    unitaEconomica: oItem.uniEcon,
                    compendio: oItem.compendio,
                    descrizTipoComp: oItem.descrComp,
                    definizioneUE: oItem.defUniEcon,
                    descrBenePatrimoniale: oItem.descrUniEcom,
                    descrNaturaGiuridica: oItem.desNatGiur,
                    descrTitoloUtilizzo: oItem.desTitUtil,
                    via: oItem.viaBe,
                    numeroCivico: oItem.numCivicoBe,
                    cap: oItem.capBe,
                    localita: oItem.locBe,
                    regione: oItem.regBe,
                    chiavePaesiRegioni: oItem.paeseRegBe,
                    oggettoArchitett: oItem.idOggArc,
                    tipoOggArchitett: oItem.tipoOggArc,
                    defOggArch: oItem.defOggArc,
                    funzione: oItem.funz,
                    businessPartner: oItem.busPartner,
                    denominazioneDitta: oItem.denomDitta,
                    descrTpEdifTerr: oItem.desTpEdTer,
                    descrBeneCulturale: oItem.descr3,
                    idCatCatastale: oItem.IdCat,
                    percentRivalutaz: oItem.percRiv,
                    coeffRivalutaz: oItem.coeffRiv,
                    notaAddizionaleImmobile: oItem.desAdd,
                    stAccatastam: oItem.stAccatast,
                    tipoCatasto: oItem.tipoCatasto,
                    denominatore: oItem.denominatore,
                    tipoParticella: oItem.tipoPart,
                    codComCatTav: oItem.codComCat,
                    codiceBelfiore: oItem.codBelf,
                    foglio: oItem.foglio,
                    graffatoFoglio: oItem.graffFoglio,
                    sezioneUrbana: oItem.sezUrb,
                    sezioneAmministr: oItem.sezAmmin,
                    particellaCatasto: oItem.part,
                    sub: oItem.sub,
                    graffMapSub: oItem.grMapSub,
                    descrClasse: oItem.descr4,
                    variazioneDal: oItem.variazDal || "",
                    variazioneAl: oItem.variazAl || "",
                    superficieMq: oItem.dim1,
                    cubaturaMc: oItem.dim2,
                    rendita: oItem.rendAcq,
                    dataRivRend: oItem.dataAcqRend || "",
                    tipoDiCalcolo: oItem.tipoCalc,
                    valOggArch: oItem.valOggArch,
                    redditoDominicale: oItem.redDomAcq,
                    redditoAgrario: oItem.redAgrAcq,
                    note: oItem.note
                };
            });
        },
        fetchHistoryData: function (sDateFrom, sDateTo) {
            var oDeferred = jQuery.Deferred();
            var oODataModel = sap.ui.getCore().getComponent().getModel();
            var aFilters = [];
            if (sDateFrom) {
                aFilters.push(new sap.ui.model.Filter("dtStorico", sap.ui.model.FilterOperator.GE, sDateFrom));
            }
            if (sDateTo) {
                aFilters.push(new sap.ui.model.Filter("dtStorico", sap.ui.model.FilterOperator.LE, sDateTo));
            }
            oODataModel.read("/amministrTrasp", {
                filters: aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, true)] : [],
                success: function (oData) {
                    var aResults = oData.results || [];
                    var aTransformedData = aResults.map(function (item) {
                        return {
                            societa: item.soc || "",
                            unitaEconomica: item.uniEcon || "",
                            compendio: item.compendio || "",
                            descrizTipoComp: item.descrComp || "",
                            definizioneUE: item.defUniEcon || "",
                            descrBenePatrimoniale: item.descrComp || "",
                            descrNaturaGiuridica: item.desNatGiur || "",
                            descrTitoloUtilizzo: item.desTitUtil || "",
                            via: item.viaBe || "",
                            numeroCivico: item.numCivicoBe || "",
                            cap: item.capBe || "",
                            localita: item.locBe || "",
                            regione: item.regBe || "",
                            chiavePaesiRegioni: item.paeseRegBe || "",
                            oggettoArchitett: item.idOggArc || "",
                            tipoOggArchitett: item.tipoOggArc || "",
                            defOggArch: item.defOggArc || "",
                            funzione: item.funz || "",
                            businessPartner: item.busPartner || "",
                            denominazioneDitta: item.denomDitta || "",
                            descrTpEdifTerr: item.desTpEdTer || "",
                            descrBeneCulturale: item.descr3 || "",
                            idCatCatastale: item.IdCat || "",
                            percentRivalutaz: item.percRiv ? item.percRiv.toString() : "0",
                            coeffRivalutaz: item.coeffRiv ? item.coeffRiv.toString() : "0",
                            notaAddizionaleImmobile: item.desAdd || "",
                            stAccatastam: item.stAccatast || "",
                            tipoCatasto: item.tipoCatasto || "",
                            denominatore: item.denominatore || "",
                            tipoParticella: item.tipoPart || "",
                            codComCatTav: item.codComCat || "",
                            codiceBelfiore: item.codBelf || "",
                            foglio: item.foglio || "",
                            graffatoFoglio: item.graffFoglio || "",
                            sezioneUrbana: item.sezUrb || "",
                            sezioneAmministr: item.sezAmmin || "",
                            particellaCatasto: item.part || "",
                            sub: item.sub || "",
                            graffMapSub: item.grMapSub || "",
                            descrClasse: item.descr4 || "",
                            variazioneDal: item.variazDal || "",
                            variazioneAl: item.variazAl || "",
                            superficieMq: item.dim1 ? item.dim1.toString() : "0",
                            cubaturaMc: item.dim2 ? item.dim2.toString() : "0",
                            rendita: item.rendAcq ? item.rendAcq.toString() : "0",
                            dataRivRend: item.dataAcqRend || "",
                            tipoDiCalcolo: item.tipoCalc || "",
                            valOggArch: item.valOggArch ? item.valOggArch.toString() : "0",
                            redditoDominicale: item.redDomAcq ? item.redDomAcq.toString() : "0",
                            redditoAgrario: item.redAgrAcq ? item.redAgrAcq.toString() : "0",
                            note: item.note || ""
                        };
                    });
                    oDeferred.resolve(aTransformedData);
                },
                error: function (oError) {
                    oDeferred.reject(oError);
                }
            });
            return oDeferred.promise();
        },
        fetchSocietyHelp: function (oODataModel, fnSuccess, fnError) {
            return oODataModel.read("/helpSocieta", {
                success: fnSuccess,
                error: fnError
            });
        },
        fetchTipoOggettoHelp: function (oODataModel, fnSuccess, fnError) {
            return oODataModel.read("/helpTipoOggettoArc", {
                success: fnSuccess,
                error: fnError
            });
        },
        fetchIdUniEconomicaHelp: function (oODataModel, sSocieta, fnSuccess, fnError) {
            return oODataModel.read("/helpIdUniEconomica", {
                filters: [new Filter("soc", FilterOperator.EQ, sSocieta)],
                success: fnSuccess,
                error: fnError
            });
        },
        fetchIdOggettoArcHelp: function (oODataModel, sIdOggetto, fnSuccess, fnError) {
            var aFilters = [];
            if (sIdOggetto) {
                aFilters.push(new Filter("idOggArc", FilterOperator.EQ, sIdOggetto));
            }
            return oODataModel.read("/helpIdOggettoArc", {
                filters: aFilters,
                success: fnSuccess,
                error: fnError
            });
        },
        createHistoryViewModel: function () {
            var oModel = new JSONModel({
                busy: false,
                filterDataStoricizzazioneFrom: null,
                filterDataStoricizzazioneTo: null,
                filterUtente: [],
                filterLayoutVariant: "",
                exportEnabled: false
            });
            return oModel;
        },
        createHistoryModel: function () {
            var oModel = new JSONModel({
                results: []
            });
            return oModel;
        }
    };
});