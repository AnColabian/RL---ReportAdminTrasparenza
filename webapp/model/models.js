sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/thirdparty/jquery"
], function (JSONModel, Device, Filter, FilterOperator, jQuery) {
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
        fetchHistoryData: function (oODataModel, oSelection, fnSuccess, fnError) {
            return oODataModel.metadataLoaded(true).then(function () {
                return this._fetchHistoryData(oODataModel, oSelection, fnSuccess, fnError);
            }.bind(this)).catch(fnError);
        },
        _fetchHistoryData: function (oODataModel, oSelection, fnSuccess, fnError) {
            var aFilters = [];
            var oMetaModel = oODataModel.getMetaModel();
            var oEntitySet = oMetaModel.getODataEntitySet("amministrTrasp");
            var oEntityType = oEntitySet && oMetaModel.getODataEntityType(oEntitySet.entityType);
            var oDateProperty = oEntityType && oMetaModel.getODataProperty(oEntityType, "dtStorico");
            var fnDateValue = function (sDate) {
                if (oDateProperty && (oDateProperty.type === "Edm.DateTime" || oDateProperty.type === "Edm.DateTimeOffset")) {
                    return new Date(Date.UTC(Number(sDate.slice(0, 4)), Number(sDate.slice(4, 6)) - 1, Number(sDate.slice(6, 8))));
                }
                return sDate;
            };
            if (oSelection.dateFrom) {
                aFilters.push(new Filter("dtStorico", FilterOperator.GE, fnDateValue(oSelection.dateFrom)));
            }
            if (oSelection.dateTo) {
                var vDateTo = fnDateValue(oSelection.dateTo);
                if (vDateTo instanceof Date) {
                    vDateTo.setUTCDate(vDateTo.getUTCDate() + 1);
                    aFilters.push(new Filter("dtStorico", FilterOperator.LT, vDateTo));
                } else {
                    aFilters.push(new Filter("dtStorico", FilterOperator.LE, vDateTo));
                }
            }
            [
                { path: "utente", selections: oSelection.utente },
                { path: "uniEcon", selections: oSelection.unitaEconomica },
                { path: "tipoOggArc", selections: oSelection.tipoOggetto },
                { path: "idOggArc", selections: oSelection.oggettoArchitettonico }
            ].forEach(function (oField) {
                var oFilter = this._createReportFieldFilter(oField.path, oField.selections);
                if (oFilter) {
                    aFilters.push(oFilter);
                }
            }, this);
            return this._readHistoryPages(oODataModel, {
                filters: aFilters.length ? [new Filter({ filters: aFilters, and: true })] : []
            }, fnSuccess, fnError);
        },
        _readHistoryPages: function (oODataModel, mParameters, fnSuccess, fnError) {
            var aEntries = [];
            var fnRead = function (sPath, mOptions) {
                return oODataModel.read(sPath, Object.assign({}, mOptions, {
                    success: function (oData) {
                        aEntries = aEntries.concat(oData.results || []);
                        if (oData.__next) {
                            var aNext = /(?:^|\/)amministrTrasp(\?.+)$/.exec(oData.__next);
                            if (!aNext) {
                                fnError(new Error("Pagina successiva dello storico non valida."));
                                return;
                            }
                            fnRead("/amministrTrasp" + aNext[1], {});
                        } else {
                            fnSuccess({ results: aEntries });
                        }
                    },
                    error: fnError
                }));
            };
            return fnRead("/amministrTrasp", mParameters);
        },
        fetchHistoryUserHelp: function (oODataModel, fnSuccess, fnError) {
            return this._readHistoryPages(oODataModel, {
                urlParameters: { "$select": "utente" }
            }, function (oData) {
                var aUsers = (oData.results || []).map(function (oEntry) {
                    return oEntry.utente;
                }).filter(function (sUser, iIndex, aValues) {
                    return !!sUser && aValues.indexOf(sUser) === iIndex;
                });
                fnSuccess({ results: aUsers.map(function (sUser) {
                    return { utente: sUser };
                }) });
            }, fnError);
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
                filters: sSocieta ? [new Filter("soc", FilterOperator.EQ, sSocieta)] : [],
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
                filterDataStoricizzazioneFrom: "",
                filterDataStoricizzazioneTo: "",
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
        },
        createReportBatchPayload: function (oODataModel, aEntries) {
            var oNow = new Date();
            var sDate = String(oNow.getFullYear()) + String(oNow.getMonth() + 1).padStart(2, "0") + String(oNow.getDate()).padStart(2, "0");
            var sTime = String(oNow.getHours()).padStart(2, "0") + String(oNow.getMinutes()).padStart(2, "0") + String(oNow.getSeconds()).padStart(2, "0");
            var sBatchId = "BATCH" + sDate + sTime;
            var oMetaModel = oODataModel.getMetaModel();
            var oEntitySet = oMetaModel.getODataEntitySet("amministrTrasp");
            var oEntityType = oEntitySet && oMetaModel.getODataEntityType(oEntitySet.entityType);
            if (!oEntityType) {
                throw new Error("Metadata di amministrTrasp non disponibile.");
            }
            var aRows = aEntries.map(function (oEntry) {
                var oRow = {};
                oEntityType.property.forEach(function (oProperty) {
                    var vValue = oEntry[oProperty.name];
                    if (vValue === undefined) {
                        return;
                    }
                    if (oProperty.type === "Edm.Time" && vValue !== null && typeof vValue === "object") {
                        var iSeconds = Math.floor(vValue.ms / 1000);
                        if (!Number.isFinite(iSeconds) || iSeconds < 0) {
                            throw new Error("Ora di storicizzazione non valida.");
                        }
                        vValue = "PT" + String(Math.floor(iSeconds / 3600)).padStart(2, "0") + "H" + String(Math.floor(iSeconds % 3600 / 60)).padStart(2, "0") + "M" + String(iSeconds % 60).padStart(2, "0") + "S";
                    }
                    oRow[oProperty.name] = vValue;
                });
                return oRow;
            });
            return {
                batchId: sBatchId,
                toRighe: aRows
            };
        },
        saveReportBatch: function (oODataModel, oPayload, fnSuccess, fnError) {
            var sServiceUrl = oODataModel.getServiceUrl().replace(/\/$/, "");
            oODataModel.refreshSecurityToken(function () {
                jQuery.ajax({
                    url: sServiceUrl + "/amministrTraspBatch",
                    method: "POST",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-Token": oODataModel.getSecurityToken()
                    },
                    data: JSON.stringify(oPayload),
                    success: fnSuccess,
                    error: fnError
                });
            }, fnError, true);
        },
    };
});