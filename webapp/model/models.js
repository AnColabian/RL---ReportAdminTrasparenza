sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/thirdparty/jquery",
    "sap/ui/core/format/DateFormat"
], function (JSONModel, Device, Filter, FilterOperator, jQuery, DateFormat) {
    "use strict";
    var ENTITY_SET = "strfMef";
    var BATCH_ENTITY_SET = "strfMefBatch";
    var DEFAULT_BATCH_NAVIGATION = "toRighe";
    // Nomi candidati dei campi filtro su strfMef: viene usato il primo presente nel metadata.
    var FILTER_FIELDS = {
        utente: ["utente", "uname", "user"],
        unitaEconomica: ["uniEcon", "numUniEconomicia", "uniEconomica", "idUniEcon"],
        tipoOggetto: ["tipoOggArc", "tpOggArc"],
        oggettoArchitettonico: ["idOggArc", "oggArc"]
    };
    var oDateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yyyy", UTC: true });
    var oDateTimeFormat = DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy HH:mm:ss", UTC: true });
    return {
        ENTITY_SET: ENTITY_SET,
        BATCH_ENTITY_SET: BATCH_ENTITY_SET,
        
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
        _whenMetadataReady: function (oODataModel) {
            return Promise.resolve().then(function () {
                return oODataModel.metadataLoaded(true);
            }).then(function () {
                return oODataModel.getMetaModel().loaded();
            });
        },
        getEntityType: function (oODataModel, sEntitySet) {
            var oMetaModel = oODataModel && oODataModel.getMetaModel && oODataModel.getMetaModel();
            var oEntitySet = oMetaModel && oMetaModel.getODataEntitySet(sEntitySet || ENTITY_SET);
            return oEntitySet ? oMetaModel.getODataEntityType(oEntitySet.entityType) : null;
        },
        resolvePropertyName: function (oEntityType, aCandidates) {
            var aProperties = oEntityType && Array.isArray(oEntityType.property) ? oEntityType.property : null;
            if (!aProperties) {
                return aCandidates[0];
            }
            var aNames = aProperties.map(function (oProperty) { return oProperty.name; });
            var sMatch = aCandidates.find(function (sName) { return aNames.indexOf(sName) !== -1; });
            if (sMatch) {
                return sMatch;
            }
            var aLower = aNames.map(function (sName) { return sName.toLowerCase(); });
            var iIndex = -1;
            aCandidates.some(function (sName) {
                iIndex = aLower.indexOf(sName.toLowerCase());
                return iIndex !== -1;
            });
            return iIndex !== -1 ? aNames[iIndex] : null;
        },
        _pushFieldFilters: function (aFilters, oEntityType, oSelection, aKeys) {
            aKeys.forEach(function (sKey) {
                var aSelections = oSelection[sKey] || [];
                if (!aSelections.length) {
                    return;
                }
                var sPath = this.resolvePropertyName(oEntityType, FILTER_FIELDS[sKey]);
                if (!sPath) {
                    throw new Error("Il campo filtro '" + sKey + "' non esiste in " + ENTITY_SET + ".");
                }
                var oFilter = this._createReportFieldFilter(sPath, aSelections);
                if (oFilter) {
                    aFilters.push(oFilter);
                }
            }, this);
        },
        fetchReportData: function (oODataModel, oSelection, fnSuccess, fnError) {
            return this._whenMetadataReady(oODataModel).then(function () {
                var oEntityType = this.getEntityType(oODataModel);
                var aFilters = [
                    new Filter("soc", FilterOperator.EQ, oSelection.societa)
                ];
                this._pushFieldFilters(aFilters, oEntityType, oSelection, ["unitaEconomica", "tipoOggetto", "oggettoArchitettonico"]);
                return this._readHistoryPages(oODataModel, {
                    filters: [new Filter({ filters: aFilters, and: true })]
                }, fnSuccess, fnError);
            }.bind(this)).catch(fnError);
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
        formatValue: function (vValue) {
            if (vValue === null || vValue === undefined) {
                return "";
            }
            if (vValue instanceof Date) {
                var bHasTime = vValue.getUTCHours() || vValue.getUTCMinutes() || vValue.getUTCSeconds();
                return bHasTime ? oDateTimeFormat.format(vValue) : oDateFormat.format(vValue);
            }
            if (typeof vValue === "object" && typeof vValue.ms === "number") {
                var iSeconds = Math.floor(vValue.ms / 1000);
                return [Math.floor(iSeconds / 3600), Math.floor(iSeconds % 3600 / 60), iSeconds % 60].map(function (i) {
                    return String(i).padStart(2, "0");
                }).join(":");
            }
            if (typeof vValue === "object") {
                return "";
            }
            if (typeof vValue === "boolean") {
                return vValue ? "X" : "";
            }
            return vValue;
        },
        mapReportEntries: function (aEntries) {
            var that = this;
            return (aEntries || []).map(function (oItem) {
                var oRow = {};
                Object.keys(oItem || {}).forEach(function (sKey) {
                    if (sKey.indexOf("__") === 0) {
                        return;
                    }
                    var vValue = oItem[sKey];
                    if (vValue && typeof vValue === "object" && vValue.__deferred) {
                        return;
                    }
                    oRow[sKey] = that.formatValue(vValue);
                });
                return oRow;
            });
        },
        getColumnDefinitions: function (oODataModel) {
            var oEntityType = this.getEntityType(oODataModel);
            if (!oEntityType || !Array.isArray(oEntityType.property)) {
                return [];
            }
            var mNumeric = { "Edm.Decimal": true, "Edm.Double": true, "Edm.Int16": true, "Edm.Int32": true, "Edm.Int64": true, "Edm.Single": true, "Edm.Byte": true };
            return oEntityType.property.filter(function (oProperty) {
                return oProperty["sap:visible"] !== "false";
            }).map(function (oProperty) {
                var sLabel = oProperty["sap:label"] || oProperty["sap:heading"] || oProperty["sap:quickinfo"] || oProperty.name;
                var iMaxLength = parseInt(oProperty.maxLength, 10) || 10;
                var iWidth = Math.max(6, Math.min(18, Math.ceil(Math.max(sLabel.length * 0.55, Math.min(iMaxLength, 40) * 0.5)) + 2));
                return {
                    key: oProperty.name,
                    label: sLabel,
                    type: oProperty.type,
                    numeric: !!mNumeric[oProperty.type],
                    width: iWidth + "rem"
                };
            });
        },
        fetchHistoryData: function (oODataModel, oSelection, fnSuccess, fnError) {
            return Promise.resolve().then(function () {
                return oODataModel.metadataLoaded(true);
            }).then(function () {
                return oODataModel.getMetaModel().loaded();
            }).then(function () {
                return this._fetchHistoryData(oODataModel, oSelection, fnSuccess, fnError);
            }.bind(this)).catch(fnError);
        },
        _fetchHistoryData: function (oODataModel, oSelection, fnSuccess, fnError) {
            var aFilters = [
                new Filter("soc", FilterOperator.EQ, "1000")
            ];
            var oMetaModel = oODataModel.getMetaModel();
            var oEntityType = this.getEntityType(oODataModel);
            var oDateProperty = oEntityType && oMetaModel.getODataProperty(oEntityType, "dtStorico");
            var fnDateValue = function (sDate) {
                if (oDateProperty && (oDateProperty.type === "Edm.DateTime" || oDateProperty.type === "Edm.DateTimeOffset")) {
                    return new Date(Date.UTC(Number(sDate.slice(0, 4)), Number(sDate.slice(4, 6)) - 1, Number(sDate.slice(6, 8))));
                }
                return sDate;
            };
            if (oSelection.dateFrom && oSelection.dateTo) {
                var vDateFrom = fnDateValue(oSelection.dateFrom);
                var vDateTo = fnDateValue(oSelection.dateTo);
                if (vDateTo instanceof Date) {
                    vDateTo.setUTCDate(vDateTo.getUTCDate() + 1);
                }
                aFilters.push(new Filter("dtStorico", FilterOperator.BT, vDateFrom, vDateTo));
            } else if (oSelection.dateFrom) {
                aFilters.push(new Filter("dtStorico", FilterOperator.GE, fnDateValue(oSelection.dateFrom)));
            } else if (oSelection.dateTo) {
                var vSingleDateTo = fnDateValue(oSelection.dateTo);
                if (vSingleDateTo instanceof Date) {
                    vSingleDateTo.setUTCDate(vSingleDateTo.getUTCDate() + 1);
                    aFilters.push(new Filter("dtStorico", FilterOperator.LT, vSingleDateTo));
                } else {
                    aFilters.push(new Filter("dtStorico", FilterOperator.LE, vSingleDateTo));
                }
            }
            this._pushFieldFilters(aFilters, oEntityType, oSelection, ["utente", "unitaEconomica", "tipoOggetto", "oggettoArchitettonico"]);
            return this._readHistoryPages(oODataModel, {
                filters: [new Filter({ filters: aFilters, and: true })]
            }, fnSuccess, fnError);
        },
        _readHistoryPages: function (oODataModel, mParameters, fnSuccess, fnError) {
            var aEntries = [];
            var fnRead = function (sPath, mOptions) {
                return oODataModel.read(sPath, Object.assign({}, mOptions, {
                    success: function (oData) {
                        aEntries = aEntries.concat(oData.results || []);
                        if (oData.__next) {
                            var aNext = new RegExp("(?:^|/)" + ENTITY_SET + "(\\?.+)$").exec(oData.__next);
                            if (!aNext) {
                                fnError(new Error("Pagina successiva dello storico non valida."));
                                return;
                            }
                            var mNextParameters = Object.create(null);
                            new URLSearchParams(aNext[1]).forEach(function (sValue, sName) {
                                mNextParameters[sName] = sValue;
                            });
                            fnRead("/" + ENTITY_SET, { urlParameters: mNextParameters });
                        } else {
                            fnSuccess({ results: aEntries });
                        }
                    },
                    error: fnError
                }));
            };
            return fnRead("/" + ENTITY_SET, mParameters);
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
                fnSuccess({
                    results: aUsers.map(function (sUser) {
                        return { utente: sUser };
                    })
                });
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
            var oEntityType = this.getEntityType(oODataModel);
            if (!oEntityType) {
                throw new Error("Metadata di " + ENTITY_SET + " non disponibile.");
            }
            var aRows = aEntries.map(function (oEntry) {
                var oRow = {};
                oEntityType.property.forEach(function (oProperty) {
                    var vValue = oEntry[oProperty.name];
                    if (vValue === undefined) {
                        return;
                    }
                    if (typeof vValue === "string" && vValue.indexOf("\\") !== -1) {
                        vValue = "";
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
            var oPayload = {
                batchId: sBatchId
            };
            oPayload[this.getBatchNavigationName(oODataModel)] = aRows;
            return oPayload;
        },
        getBatchNavigationName: function (oODataModel) {
            var oBatchType = this.getEntityType(oODataModel, BATCH_ENTITY_SET);
            var aNavigations = oBatchType && oBatchType.navigationProperty;
            return aNavigations && aNavigations.length ? aNavigations[0].name : DEFAULT_BATCH_NAVIGATION;
        },
        saveReportBatch: function (oODataModel, oPayload, fnSuccess, fnError) {
            var sServiceUrl = oODataModel.getServiceUrl().replace(/\/$/, "");
            oODataModel.metadataLoaded(true).then(function () {
                return new Promise(function (resolve, reject) {
                    oODataModel.refreshSecurityToken(function () {
                        jQuery.ajax({
                            url: sServiceUrl + "/" + BATCH_ENTITY_SET,
                            method: "POST",
                            contentType: "application/json",
                            headers: {
                                "X-CSRF-Token": oODataModel.getSecurityToken()
                            },
                            data: JSON.stringify(oPayload),
                            success: resolve,
                            error: reject
                        });
                    }, reject, true);
                });
            }).then(fnSuccess).catch(fnError);
        },
        filterValueHelpTable: function (oTable, sValue) {
            var oBinding = oTable && oTable.getBinding("rows");
            if (!oBinding) {
                return;
            }
            var sQuery = String(sValue || "").trim().toLocaleUpperCase();
            if (!sQuery) {
                oBinding.filter([], "Application");
                return;
            }
            var aEntries = oTable.getModel("valueHelpData").getProperty("/entries") || [];
            var aProperties = [];
            aEntries.forEach(function (oEntry) {
                Object.keys(oEntry).forEach(function (sProperty) {
                    var vValue = oEntry[sProperty];
                    if ((typeof vValue === "string" || typeof vValue === "number") && aProperties.indexOf(sProperty) === -1) {
                        aProperties.push(sProperty);
                    }
                });
            });
            var aFilters = aProperties.map(function (sProperty) {
                return new Filter({
                    path: sProperty,
                    test: function (vValue) {
                        return vValue !== null && vValue !== undefined && String(vValue).toLocaleUpperCase().indexOf(sQuery) !== -1;
                    }
                });
            });
            oBinding.filter(aFilters.length ? [new Filter({ filters: aFilters, and: false })] : [], "Application");
        },
        filterValueHelpEntries: function (aEntries, sQuery) {
            var sNormalizedQuery = String(sQuery || "").trim().toLocaleUpperCase();
            if (!sNormalizedQuery) {
                return aEntries || [];
            }
            return (aEntries || []).filter(function (oEntry) {
                return Object.keys(oEntry || {}).some(function (sProperty) {
                    var vValue = oEntry[sProperty];
                    return (typeof vValue === "string" || typeof vValue === "number") && String(vValue).toLocaleUpperCase().indexOf(sNormalizedQuery) !== -1;
                });
            });
        },
    };
});