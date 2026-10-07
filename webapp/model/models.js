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
        fetchReportData: function (oODataModel) {
            var oDeferred = jQuery.Deferred();
            oODataModel.read("/amministrTrasp", {
                filters: [new sap.ui.model.Filter("soc", sap.ui.model.FilterOperator.EQ, "1000")],
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
                            defOggArch: item.defOggArch || "",
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
        fetchSocietyHelp: function () {
            var oDeferred = jQuery.Deferred();
            var oODataModel = sap.ui.getCore().getComponent().getModel();
            oODataModel.read("/helpSocieta", {
                success: function (oData) {
                    var aSocieties = (oData.results || []).map(function (item) {
                        return {
                            code: item.soc,
                            text: item.soc + " - " + item.nomeSoc
                        };
                    });
                    oDeferred.resolve(aSocieties);
                },
                error: function (oError) {
                    oDeferred.reject(oError);
                }
            });
            return oDeferred.promise();
        },
        fetchTipoOggettoHelp: function () {
            var oDeferred = jQuery.Deferred();
            var oODataModel = sap.ui.getCore().getComponent().getModel();
            oODataModel.read("/helpTipoOggettoArc", {
                success: function (oData) {
                    var aTipiOggetto = (oData.results || []).map(function (item) {
                        return {
                            code: item.tipoOggArc,
                            text: item.tipoOggArc + " - " + item.defTipoOggArc
                        };
                    });
                    oDeferred.resolve(aTipiOggetto);
                },
                error: function (oError) {
                    oDeferred.reject(oError);
                }
            });
            return oDeferred.promise();
        },
        fetchIdUniEconomicaHelp: function (sSocieta) {
            var oDeferred = jQuery.Deferred();
            var oODataModel = sap.ui.getCore().getComponent().getModel();
            oODataModel.read("/helpIdUniEconomica", {
                filters: [new sap.ui.model.Filter("soc", sap.ui.model.FilterOperator.EQ, sSocieta)],
                success: function (oData) {
                    var aUniEconomiche = (oData.results || []).map(function (item) {
                        return {
                            key: item.numUniEconomicia,
                            text: item.numUniEconomicia
                        };
                    });
                    oDeferred.resolve(aUniEconomiche);
                },
                error: function (oError) {
                    oDeferred.reject(oError);
                }
            });
            return oDeferred.promise();
        },
        fetchIdOggettoArcHelp: function (sIdOggetto) {
            var oDeferred = jQuery.Deferred();
            var oODataModel = sap.ui.getCore().getComponent().getModel();
            oODataModel.read("/helpIdOggettoArc", {
                filters: [new sap.ui.model.Filter("idOggArc", sap.ui.model.FilterOperator.EQ, sIdOggetto)],
                success: function (oData) {
                    var aIdOggetti = (oData.results || []).map(function (item) {
                        return {
                            key: item.idOggArc,
                            text: item.idOggArc + " - " + item.def
                        };
                    });
                    oDeferred.resolve(aIdOggetti);
                },
                error: function (oError) {
                    oDeferred.reject(oError);
                }
            });
            return oDeferred.promise();
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