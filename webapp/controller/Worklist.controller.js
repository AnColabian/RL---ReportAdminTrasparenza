sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/models",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/m/MessageBox",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/CheckBox",
    "sap/m/Input",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterItem",
    "reportamministrazionetrasparenza/control/TableLayoutVariantManager",
    "sap/m/Dialog",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Button",
    "sap/m/SearchField",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, models, Spreadsheet, exportLibrary, MessageBox, ValueHelpDialog, Table, Column, Label, Text, CheckBox, Input, FilterBar, FilterItem, 
    TableLayoutVariantManager, Dialog, List, StandardListItem, Button, SearchField, VBox, HBox, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("reportamministrazionetrasparenza.controller.Worklist", {
        Spreadsheet: Spreadsheet,
        models: models,
        onInit: function () {
            var oViewModel = models.createViewModel();
            oViewModel.setProperty("/filterSociety", "1000");
            this.getView().setModel(oViewModel, "viewModel");
            this.getView().setModel(models.createSocietyModel(), "societyModel");
            this.getView().setModel(models.createTipoOggettoModel(), "tipoOggettoModel");
            this.byId("resultsTable").setP13nTitle(this._i18n("p13nDialogTitle"));
            this._oWorklistVariantManager = new TableLayoutVariantManager({
                table: this.byId("resultsTable"),
                variantManagement: this.byId("vmWorklist"),
                persistencyKey: "WorklistTableVariants"
            });
        },
        onP13nPress: function () {
    var oTable = this.byId("resultsTable");
    var aColumns = oTable.getColumns().map(function (oCol, iIndex) {
        return {
            key: oCol.data("p13nKey"),
            label: oCol.getLabel() && oCol.getLabel().getText ? oCol.getLabel().getText() : oCol.data("p13nKey"),
            visible: oCol.getVisible(),
            order: iIndex
        };
    }).filter(function (oItem) {
        return !!oItem.key;
    });
    if (!this._oColumnsModel) {
        this._oColumnsModel = new JSONModel({ items: aColumns });
    } else {
        this._oColumnsModel.setProperty("/items", aColumns);
    }
    if (!this._oP13nDialog) {
        this._oP13nDialog = new Dialog({
            title: this._i18n("p13nDialogTitle"),
            contentWidth: "34rem",
            contentHeight: "42rem",
            draggable: true,
            resizable: true,
            content: [
                new VBox({
                    items: [
                        new HBox({
                            items: [
                                new SearchField({
                                    width: "100%",
                                    liveChange: this._onP13nSearch.bind(this)
                                })
                            ]
                        }),
                        new List({
                            id: this.createId("p13nColumnsList"),
                            mode: "MultiSelect",
                            includeItemInSelection: true,
                            items: {
                                path: "p13nColumns>/items",
                                template: new StandardListItem({
                                    title: "{p13nColumns>label}"
                                })
                            },
                            selectionChange: this._onP13nSelectionChange.bind(this)
                        })
                    ]
                })
            ],
            beginButton: new Button({
                text: "OK",
                press: this._onP13nDialogOk.bind(this)
            }),
            endButton: new Button({
                text: "Cancel",
                press: this._onP13nDialogCancel.bind(this)
            })
        });
        this.getView().addDependent(this._oP13nDialog);
        this._oP13nDialog.setModel(this._oColumnsModel, "p13nColumns");
    }
    this._syncP13nListSelection();
    this._oP13nDialog.open();
},
_onP13nSearch: function (oEvent) {
    var sValue = oEvent.getParameter("newValue") || "";
    var oList = this.byId("p13nColumnsList");
    var oBinding = oList.getBinding("items");
    if (!oBinding) {
        return;
    }
    if (!sValue) {
        oBinding.filter([]);
        return;
    }
    oBinding.filter([new Filter("label", FilterOperator.Contains, sValue)]);
},
_syncP13nListSelection: function () {
    var oList = this.byId("p13nColumnsList");
    var aItems = oList.getItems();
    var aData = this._oColumnsModel.getProperty("/items") || [];
    aItems.forEach(function (oItem) {
        var oCtx = oItem.getBindingContext("p13nColumns");
        if (!oCtx) {
            return;
        }
        var oRow = oCtx.getObject();
        oList.setSelectedItem(oItem, !!oRow.visible);
    });
    this._oColumnsSnapshot = JSON.parse(JSON.stringify(aData));
},
_onP13nSelectionChange: function (oEvent) {
    var oItem = oEvent.getParameter("listItem");
    var bSelected = oEvent.getParameter("selected");
    var oCtx = oItem.getBindingContext("p13nColumns");
    if (!oCtx) {
        return;
    }
    var sPath = oCtx.getPath() + "/visible";
    this._oColumnsModel.setProperty(sPath, bSelected);
},
_onP13nDialogOk: function () {
    var aColumnsState = this._oColumnsModel.getProperty("/items") || [];
    this._applyColumnsStateToTable(aColumnsState);
    if (this._oWorklistVariantManager && this._oWorklistVariantManager.updateCurrentVariantState) {
        this._oWorklistVariantManager.updateCurrentVariantState({ columns: aColumnsState });
    }
    this._oP13nDialog.close();
},
_onP13nDialogCancel: function () {
    if (this._oColumnsSnapshot) {
        this._oColumnsModel.setProperty("/items", JSON.parse(JSON.stringify(this._oColumnsSnapshot)));
    }
    this._oP13nDialog.close();
},
_applyColumnsStateToTable: function (aColumnsState) {
    var oTable = this.byId("resultsTable");
    oTable.getColumns().forEach(function (oCol) {
        var sKey = oCol.data("p13nKey");
        var oMatch = aColumnsState.find(function (oItem) { return oItem.key === sKey; });
        oCol.setVisible(!!(oMatch && oMatch.visible));
    });
    aColumnsState.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (oStateCol, iTarget) {
        var oCol = oTable.getColumns().find(function (oCurrent) {
            return oCurrent.data("p13nKey") === oStateCol.key;
        });
        if (oCol) {
            var iCurrent = oTable.indexOfColumn(oCol);
            if (iCurrent !== iTarget) {
                oTable.removeColumn(oCol);
                oTable.insertColumn(oCol, iTarget);
            }
        }
    });
},
        onValueHelpUnitaEconomica: function () {
            var sSocieta = this.getView().getModel("viewModel").getProperty("/filterSociety");
            var fnError = function (oError) {
                this.getView().setBusy(false);
                var sDetails = oError && (oError.statusCode || oError.statusText || oError.message || "");
                MessageBox.error(this._i18n("msgValueHelpLoadError") + (sDetails ? " (" + sDetails + ")" : ""));
            }.bind(this);
            this.getView().setBusy(true);
            models.fetchIdUniEconomicaHelp(this.getOwnerComponent().getModel(), sSocieta, function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterUnitaEconomica",
                    title: this._i18n("lblUnitaEconomica"),
                    key: "numUniEconomicia",
                    descriptionKey: "numOgg",
                    tokenKey: "numUniEconomicia",
                    entries: oData.results || [],
                    columns: [
                        { property: "numUniEconomicia", label: "vhdNumUniEcon", width: "12rem" },
                        { property: "soc", label: "vhdSocieta", width: "7rem" },
                        { property: "numOgg", label: "vhdNumOgg", width: "16rem" },
                        { property: "chiaveIntOggImm", label: "vhdChiaveIntOggImm", width: "16rem" }
                    ]
                });
            }.bind(this), fnError);
        },
        onValueHelpTipoOggetto: function () {
            var fnError = function (oError) {
                this.getView().setBusy(false);
                var sDetails = oError && (oError.statusCode || oError.statusText || oError.message || "");
                MessageBox.error(this._i18n("msgValueHelpLoadError") + (sDetails ? " (" + sDetails + ")" : ""));
            }.bind(this);
            this.getView().setBusy(true);
            models.fetchTipoOggettoHelp(this.getOwnerComponent().getModel(), function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterTipoOggetto",
                    title: this._i18n("lblTipoOggetto"),
                    key: "tipoOggArc",
                    descriptionKey: "defTipoOggArc",
                    tokenKey: "tipoOggArc",
                    entries: oData.results || [],
                    columns: [
                        { property: "tipoOggArc", label: "vhdTipoOggArc", width: "10rem" },
                        { property: "defTipoOggArc", label: "vhdDefTipoOggArc", width: "18rem" },
                        { property: "tipoOggSupGerArc", label: "vhdTipoOggSupGerArc", width: "12rem", flag: true },
                        { property: "tipoOggArcUniEcom", label: "vhdTipoOggArcUniEcon", width: "10rem", flag: true },
                        { property: "tipoOggArcTerr", label: "vhdTipoOggArcTerr", width: "8rem", flag: true },
                        { property: "tipoOggArcEdif", label: "vhdTipoOggArcEdif", width: "8rem", flag: true }
                    ]
                });
            }.bind(this), fnError);
        },
        onValueHelpOggettoArchitettonico: function () {
            var sIdOggetto = this.byId("miFilterOggettoArchitettonico").getValue().trim();
            var fnError = function (oError) {
                this.getView().setBusy(false);
                var sDetails = oError && (oError.statusCode || oError.statusText || oError.message || "");
                MessageBox.error(this._i18n("msgValueHelpLoadError") + (sDetails ? " (" + sDetails + ")" : ""));
            }.bind(this);
            this.getView().setBusy(true);
            models.fetchIdOggettoArcHelp(this.getOwnerComponent().getModel(), sIdOggetto, function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterOggettoArchitettonico",
                    title: this._i18n("lblOggettoArchitettonico"),
                    key: "idOggArc",
                    descriptionKey: "def",
                    tokenKey: "idOggArc",
                    entries: oData.results || [],
                    columns: [
                        { property: "idOggArc", label: "vhdIdOggArc", width: "14rem" },
                        { property: "tpOggArc", label: "vhdTpOggArc", width: "10rem" },
                        { property: "def", label: "vhdDefOggArc", width: "20rem" },
                        { property: "funzione", label: "vhdFunzione", width: "8rem" }
                    ]
                });
            }.bind(this), fnError);
        },
        onValueHelpCancel: function () {
            this._oValueHelpDialog.close();
        },
        _openValueHelpDialog: function (oConfig) {
            var oInput = this.byId(oConfig.field);
            var aEntries = oConfig.entries || [];
            var that = this;
            this._sCurrentValueHelpField = oConfig.field;
            this._oCurrentValueHelpConfig = {
                field: oConfig.field,
                title: oConfig.title,
                key: oConfig.key,
                descriptionKey: oConfig.descriptionKey || "",
                tokenKey: oConfig.tokenKey || oConfig.key,
                columns: oConfig.columns,
                entries: aEntries
            };
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new ValueHelpDialog({
                    supportMultiselect: true,
                    supportRanges: true,
                    supportRangesOnly: false,
                    ok: this.onValueHelpOk.bind(this),
                    cancel: this.onValueHelpCancel.bind(this)
                });
                this.getView().addDependent(this._oValueHelpDialog);
            }
            if (!this._oValueHelpSearchField) {
                this._oValueHelpSearchField = new Input({
                    width: "100%",
                    placeholder: this._i18n("vhdSearchPlaceholder"),
                    change: function (oEvent) {
                        var sQuery = oEvent.getSource().getValue();
                        var aFilteredEntries = models.filterValueHelpEntries(that._oCurrentValueHelpConfig.entries, sQuery);
                        var oValueHelpDataModel = new JSONModel({
                            entries: aFilteredEntries
                        });
                        oValueHelpDataModel.setSizeLimit(Math.max(100, aFilteredEntries.length));
                        that._oValueHelpDialog.setModel(oValueHelpDataModel, "valueHelpData");
                        that._oValueHelpDialog.update();
                    }
                });
            }
            this._oValueHelpDialog.setFilterBar(new FilterBar({
                advancedMode: true,
                filterBarExpanded: true,
                useToolbar: false,
                showGoOnFB: false,
                showFilterConfiguration: false,
                filterItems: [
                    new FilterItem({
                        name: "globalSearch",
                        label: this._i18n("vhdSearch"),
                        control: this._oValueHelpSearchField
                    })
                ]
            }));
            this._oValueHelpSearchField.setValue("");
            var oTable = new Table({
                visibleRowCount: 8,
                columns: oConfig.columns.map(function (oColumn) {
                    return new Column({
                        label: new Label({ text: that._i18n(oColumn.label) }),
                        template: oColumn.flag ? new CheckBox({
                            selected: "{= ${valueHelpData>" + oColumn.property + "} === 'X' }",
                            editable: false
                        }) : new Text({
                            text: "{valueHelpData>" + oColumn.property + "}",
                            wrapping: false
                        }),
                        hAlign: oColumn.flag ? "Center" : "Begin",
                        width: oColumn.width
                    });
                })
            });
            oTable.bindRows("valueHelpData>/entries");
            this._oValueHelpDialog.setTable(oTable);
            if (this._oValueHelpTable) {
                this._oValueHelpTable.destroy();
            }
            this._oValueHelpTable = oTable;
            var oValueHelpDataModel = new JSONModel({
                entries: aEntries
            });
            oValueHelpDataModel.setSizeLimit(Math.max(100, aEntries.length));
            this._oValueHelpDialog.setModel(oValueHelpDataModel, "valueHelpData");
            this._oValueHelpDialog.setKey(oConfig.key);
            this._oValueHelpDialog.setDescriptionKey(oConfig.descriptionKey || "");
            this._oValueHelpDialog.setTokens(oInput.getTokens().map(function (oToken) {
                return oToken.clone();
            }));
            this._oValueHelpDialog.setRangeKeyFields([
                { label: oConfig.title, key: oConfig.key, type: "string" }
            ]);
            this._oValueHelpDialog.setTitle(oConfig.title);
            this._oValueHelpDialog.update();
            this._oValueHelpDialog.open();
        },
        onValueHelpSearch: function (oEvent) {
            var sQuery = oEvent.getSource().getValue();
            var aFilteredEntries = models.filterValueHelpEntries(this._oCurrentValueHelpConfig.entries, sQuery);
            var oValueHelpDataModel = new JSONModel({
                entries: aFilteredEntries
            });
            oValueHelpDataModel.setSizeLimit(Math.max(100, aFilteredEntries.length));
            this._oValueHelpDialog.setModel(oValueHelpDataModel, "valueHelpData");
            this._oValueHelpDialog.update();
        },
        onValueHelpOk: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens") || [];
            aTokens.forEach(function (oToken) {
                if (!oToken.data("range")) {
                    oToken.setText(oToken.getKey());
                    oToken.setTooltip(oToken.getKey());
                }
            });
            var oInput = this.byId(this._sCurrentValueHelpField);
            oInput.setTokens(aTokens);
            oInput.setValue("");
            this._oValueHelpDialog.close();
        },
        _getReportSelections: function (sControlId) {
            var oInput = this.byId(sControlId);
            var aSelections = [];
            oInput.getTokens().forEach(function (oToken) {
                var oRange = oToken.data("range");
                if (oRange) {
                    aSelections.push({
                        operation: oRange.operation,
                        value1: oRange.value1,
                        value2: oRange.value2,
                        exclude: oRange.exclude === true
                    });
                } else if (oToken.getKey()) {
                    aSelections.push({
                        operation: "EQ",
                        value1: oToken.getKey(),
                        exclude: false
                    });
                }
            });
            var sValue = oInput.getValue().trim();
            if (sValue) {
                aSelections.push({
                    operation: "EQ",
                    value1: sValue,
                    exclude: false
                });
            }
            return aSelections;
        },
        onExecute: function () {
            var oComponent = this.getOwnerComponent();
            var oODataModel = oComponent.getModel();
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel.getProperty("/busy")) {
                return;
            }
            if (!oODataModel) {
                MessageBox.error("Servizio OData non disponibile.");
                return;
            }
            var oReportModel = oComponent.getModel("reportModel");
            if (!oReportModel) {
                oReportModel = models.createReportModel();
                oComponent.setModel(oReportModel, "reportModel");
            }
            var oSelection = {
                societa: oViewModel.getProperty("/filterSociety"),
                unitaEconomica: this._getReportSelections("miFilterUnitaEconomica"),
                tipoOggetto: this._getReportSelections("miFilterTipoOggetto"),
                oggettoArchitettonico: this._getReportSelections("miFilterOggettoArchitettonico")
            };
            var bIsTestMode = oViewModel.getProperty("/filterTest");
            try {
                oViewModel.setProperty("/busy", true);
                var fnLoadSuccess = function (oData) {
                    var aRawResults = oData.results || [];
                    oReportModel.setProperty("/results", models.mapReportEntries(aRawResults));
                    this.byId("resultsTable").clearSelection();
                    oViewModel.setProperty("/exportEnabled", false);
                    if (bIsTestMode) {
                        oViewModel.setProperty("/busy", false);
                    } else {
                        this._promptSaveAndSubmitBatch(oODataModel, aRawResults, oViewModel);
                    }
                }.bind(this);
                var fnLoadError = function (oError) {
                    oViewModel.setProperty("/busy", false);
                    MessageBox.error("Errore nel caricamento dei dati: " + (oError.statusText || oError.statusCode || ""));
                };
                models.fetchReportData(oODataModel, oSelection, fnLoadSuccess, fnLoadError);
            } catch (oError) {
                oViewModel.setProperty("/busy", false);
                MessageBox.error(oError.message);
            }
        },
        _promptSaveAndSubmitBatch: function (oODataModel, aRawResults, oViewModel) {
            var self = this;
            MessageBox.confirm(this._i18n("msgSaveReportBatch"), {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        self._submitReportBatch(oODataModel, aRawResults, oViewModel);
                    } else {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },
        _submitReportBatch: function (oODataModel, aRawResults, oViewModel) {
            oViewModel.setProperty("/busy", true);
            return Promise.resolve().then(function () {
                return oODataModel.metadataLoaded(true);
            }).then(function () {
                return oODataModel.getMetaModel().loaded();
            }).then(function () {
                var oPayload = models.createReportBatchPayload(oODataModel, aRawResults);
                oPayload = JSON.parse(JSON.stringify(oPayload).replaceAll("\\u0000", ""))
                return new Promise(function (resolve, reject) {
                    models.saveReportBatch(oODataModel, oPayload, function () {
                        resolve(oPayload);
                    }, reject);
                }).catch(function (oError) {
                    var sDetails = oError && (oError.statusText || oError.status || oError.message);
                    throw new Error("Errore nel salvataggio del batch: " + (sDetails || "Errore non specificato."));
                });
            }).then(function (oPayload) {
                oViewModel.setProperty("/busy", false);
                sap.m.MessageBox.success(this._i18n("msgReportBatchSaved") + " (ID: " + oPayload.batchId + ")");
            }.bind(this)).catch(function (oError) {
                oViewModel.setProperty("/busy", false);
                var sMessage = oError && oError.message ? oError.message : String(oError);
                sap.m.MessageBox.error(sMessage.indexOf("Errore nel salvataggio del batch:") === 0 ? sMessage : "Errore nella preparazione del batch: " + sMessage);
            });
        },
        _i18n: function (sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },
        onResultsSelectionChange: function () {
            var oTable = this.byId("resultsTable");
            var oViewModel = this.getView().getModel("viewModel");
            var aSelectedIndices = oTable.getSelectedIndices();
            oViewModel.setProperty("/exportEnabled", aSelectedIndices.length > 0);
        },
        onExportSelection: function () {
            var oTable = this.byId("resultsTable");
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel.getProperty("/busy")) {
                return;
            }
            var aSelectedEntries = oTable.getSelectedIndices().map(function (iIndex) {
                var oContext = oTable.getContextByIndex(iIndex);
                return oContext && oContext.getObject();
            }).filter(function (oEntry) {
                return !!oEntry;
            });
            var aColumns = oTable.getColumns().filter(function (oColumn) {
                return oColumn.getVisible();
            }).map(function (oColumn) {
                var oBindingInfo = oColumn.getTemplate().getBindingInfo("text");
                var oPart = oBindingInfo && oBindingInfo.parts && oBindingInfo.parts[0];
                return {
                    label: oColumn.getLabel().getText(),
                    property: oPart ? oPart.path : oColumn.data("p13nKey")
                };
            });
            if (!aSelectedEntries.length || !aColumns.length) {
                return;
            }
            var oSheet = new this.Spreadsheet({
                workbook: { columns: aColumns },
                dataSource: aSelectedEntries,
                fileName: this._i18n("reportTitle") + "_" + this._formatExportTimestamp() + ".xlsx"
            });
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },
        _formatExportTimestamp: function () {
            var oNow = new Date();
            var fnPad = function (iValue) {
                return iValue < 10 ? "0" + iValue : "" + iValue;
            };
            var sDay = fnPad(oNow.getDate());
            var sMonth = fnPad(oNow.getMonth() + 1);
            var sYear = fnPad(oNow.getFullYear() % 100);
            var sHour = fnPad(oNow.getHours());
            var sMinute = fnPad(oNow.getMinutes());
            return sDay + "-" + sMonth + "-" + sYear + "_" + sHour + "-" + sMinute;
        },
        onNavigateToHistory: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHistory");
        }
    });
});