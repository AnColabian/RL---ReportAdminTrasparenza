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
    "reportmef/control/TableLayoutVariantManager",
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
    return Controller.extend("reportmef.controller.History", {
        Spreadsheet: Spreadsheet,
        models: models,
        onInit: function () {
            this.getView().setModel(models.createHistoryViewModel(), "historyViewModel");
            if (!this.getView().getModel("historyModel")) {
                this.getView().setModel(new JSONModel({ results: [] }), "historyModel");
            } else if (!Array.isArray(this.getView().getModel("historyModel").getProperty("/results"))) {
                this.getView().getModel("historyModel").setProperty("/results", []);
            }
            this.byId("resultsTable").setP13nTitle(this._i18n("p13nDialogTitle"));
            var oODataModel = this.getOwnerComponent().getModel();
            models._whenMetadataReady(oODataModel).then(function () {
                this._buildResultColumns("historyModel");
                var oVmHistory = this.byId("vmHistory");
                if (oVmHistory) {
                    this._oHistoryVariantManager = new TableLayoutVariantManager({
                        table: this.byId("resultsTable"),
                        variantManagement: oVmHistory,
                        persistencyKey: "HistoryTableVariants"
                    });
                }
            }.bind(this)).catch(function (oError) {
                MessageBox.error(this._i18n("msgMetadataError") + (oError && oError.message ? " (" + oError.message + ")" : ""));
            }.bind(this));
        },
        _buildResultColumns: function (sModelName) {
            var oTable = this.byId("resultsTable");
            var aDefinitions = models.getColumnDefinitions(this.getOwnerComponent().getModel());
            oTable.destroyColumns();
            aDefinitions.forEach(function (oDefinition) {
                var oColumn = new Column({
                    width: oDefinition.width,
                    hAlign: oDefinition.numeric ? "End" : "Begin",
                    label: new Label({ text: oDefinition.label }),
                    template: new Text({ text: "{" + sModelName + ">" + oDefinition.key + "}", wrapping: false }),
                    sortProperty: oDefinition.key,
                    filterProperty: oDefinition.key
                });
                oColumn.data("p13nKey", oDefinition.key);
                oTable.addColumn(oColumn);
            });
            return aDefinitions;
        },
        _getExportColumns: function () {
            return this.byId("resultsTable").getColumns().filter(function (oColumn) {
                return oColumn.getVisible() && !!oColumn.data("p13nKey");
            }).map(function (oColumn) {
                return {
                    label: oColumn.getLabel().getText(),
                    property: oColumn.data("p13nKey")
                };
            });
        },

        onHistoryVariantSave: function (oEvent) {
            oEvent.preventDefault();
            if (!this._oHistoryVariantManager) {
                return;
            }
            this._oHistoryVariantManager.saveVariantByName(oEvent.getParameters());
        },
        onExit: function () {
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
            }
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
                this._oP13nDialog = new sap.m.Dialog({
                    title: this._i18n("p13nDialogTitle"),
                    contentWidth: "34rem",
                    contentHeight: "42rem",
                    draggable: true,
                    resizable: true,
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.SearchField({
                                            width: "100%",
                                            liveChange: this._onP13nSearch.bind(this)
                                        })
                                    ]
                                }),
                                new sap.m.List({
                                    id: this.createId("p13nColumnsList"),
                                    mode: "MultiSelect",
                                    includeItemInSelection: true,
                                    items: {
                                        path: "p13nColumns>/items",
                                        template: new sap.m.StandardListItem({
                                            title: "{p13nColumns>label}"
                                        })
                                    },
                                    selectionChange: this._onP13nSelectionChange.bind(this)
                                })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "OK",
                        press: this._onP13nDialogOk.bind(this)
                    }),
                    endButton: new sap.m.Button({
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
            oBinding.filter([new sap.ui.model.Filter("label", sap.ui.model.FilterOperator.Contains, sValue)]);
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
            if (this._oHistoryVariantManager && this._oHistoryVariantManager.updateCurrentVariantState) {
                this._oHistoryVariantManager.updateCurrentVariantState({ columns: aColumnsState });
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
        onNavigateBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteWorklist");
        },
        onValueHelpUtente: function () {
            this._loadValueHelp("miFilterUtente", "lblUtente", function (fnSuccess, fnError) {
                return models.fetchHistoryUserHelp(this.getOwnerComponent().getModel(), fnSuccess, fnError);
            }.bind(this), {
                key: "utente",
                description: "utente",
                tokenKey: "utente",
                columns: [
                    { property: "utente", label: "lblUtente", width: "18rem" }
                ]
            });
        },
        onValueHelpUnitaEconomica: function () {
            this._loadValueHelp("miFilterUnitaEconomica", "lblUnitaEconomica", function (fnSuccess, fnError) {
                return models.fetchIdUniEconomicaHelp(this.getOwnerComponent().getModel(), "", fnSuccess, fnError);
            }.bind(this), {
                key: "numUniEconomicia",
                description: "numOgg",
                tokenKey: "numUniEconomicia",
                columns: [
                    { property: "numUniEconomicia", label: "vhdNumUniEcon", width: "12rem" },
                    { property: "soc", label: "vhdSocieta", width: "7rem" },
                    { property: "numOgg", label: "vhdNumOgg", width: "16rem" },
                    { property: "chiaveIntOggImm", label: "vhdChiaveIntOggImm", width: "16rem" }
                ]
            });
        },
        onValueHelpTipoOggetto: function () {
            this._loadValueHelp("miFilterTipoOggetto", "lblTipoOggetto", function (fnSuccess, fnError) {
                return models.fetchTipoOggettoHelp(this.getOwnerComponent().getModel(), fnSuccess, fnError);
            }.bind(this), {
                key: "tipoOggArc",
                description: "defTipoOggArc",
                tokenKey: "tipoOggArc",
                columns: [
                    { property: "tipoOggArc", label: "vhdTipoOggArc", width: "10rem" },
                    { property: "defTipoOggArc", label: "vhdDefTipoOggArc", width: "18rem" },
                    { property: "tipoOggSupGerArc", label: "vhdTipoOggSupGerArc", width: "12rem", flag: true },
                    { property: "tipoOggArcUniEcom", label: "vhdTipoOggArcUniEcon", width: "10rem", flag: true },
                    { property: "tipoOggArcTerr", label: "vhdTipoOggArcTerr", width: "8rem", flag: true },
                    { property: "tipoOggArcEdif", label: "vhdTipoOggArcEdif", width: "8rem", flag: true }
                ]
            });
        },
        onValueHelpOggettoArchitettonico: function () {
            this._loadValueHelp("miFilterOggettoArchitettonico", "lblOggettoArchitettonico", function (fnSuccess, fnError) {
                return models.fetchIdOggettoArcHelp(this.getOwnerComponent().getModel(), this.byId("miFilterOggettoArchitettonico").getValue().trim(), fnSuccess, fnError);
            }.bind(this), {
                key: "idOggArc",
                description: "def",
                tokenKey: "idOggArc",
                columns: [
                    { property: "idOggArc", label: "vhdIdOggArc", width: "14rem" },
                    { property: "tpOggArc", label: "vhdTpOggArc", width: "10rem" },
                    { property: "def", label: "vhdDefOggArc", width: "20rem" },
                    { property: "funzione", label: "vhdFunzione", width: "8rem" }
                ]
            });
        },
        _loadValueHelp: function (sField, sTitle, fnFetch, oConfig) {
            var oViewModel = this.getView().getModel("historyViewModel");
            if (oViewModel.getProperty("/busy")) {
                return;
            }
            oViewModel.setProperty("/busy", true);
            var fnError = function () {
                oViewModel.setProperty("/busy", false);
                MessageBox.error(this._i18n("msgValueHelpLoadError"));
            }.bind(this);
            try {
                fnFetch(function (oData) {
                    oViewModel.setProperty("/busy", false);
                    this._openValueHelpDialog({
                        field: sField,
                        title: this._i18n(sTitle),
                        key: oConfig.key,
                        descriptionKey: oConfig.description,
                        tokenKey: oConfig.tokenKey,
                        entries: oData.results || [],
                        columns: oConfig.columns
                    });
                }.bind(this), fnError);
            } catch (oError) {
                fnError(oError);
            }
        },
        _openValueHelpDialog: function (oConfig) {
            var oInput = this.byId(oConfig.field);
            var aEntries = oConfig.entries || [];
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
                this._oValueHelpSearchField = new sap.m.Input({
                    width: "100%",
                    placeholder: this._i18n("vhdSearchPlaceholder"),
                    change: this.onValueHelpSearch.bind(this)
                });
            }
            this._oValueHelpDialog.setFilterBar(new sap.ui.comp.filterbar.FilterBar({
                advancedMode: true,
                filterBarExpanded: true,
                useToolbar: false,
                showGoOnFB: false,
                showFilterConfiguration: false,
                filterItems: [
                    new sap.ui.comp.filterbar.FilterItem({
                        name: "globalSearch",
                        label: this._i18n("vhdSearch"),
                        control: this._oValueHelpSearchField
                    })
                ]
            }));
            this._oValueHelpSearchField.setValue("");
            var oTable = new Table({
                visibleRowCount: 5,
                columns: oConfig.columns.map(function (oColumn) {
                    return new Column({
                        label: new Label({ text: this._i18n(oColumn.label) }),
                        template: oColumn.flag ? new sap.m.CheckBox({
                            selected: "{= ${valueHelpData>" + oColumn.property + "} === 'X' }",
                            editable: false
                        }) : new Text({
                            text: "{valueHelpData>" + oColumn.property + "}"
                        }),
                        hAlign: oColumn.flag ? "Center" : "Begin",
                        width: oColumn.width
                    });
                }, this)
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
            var sTokenKey = this._oCurrentValueHelpConfig && this._oCurrentValueHelpConfig.tokenKey;
            aTokens.forEach(function (oToken) {
                if (!oToken.data("range")) {
                    oToken.setText(oToken.getKey());
                    if (sTokenKey) {
                        oToken.setTooltip(oToken.getKey());
                    }
                }
            });
            var oInput = this.byId(this._sCurrentValueHelpField);
            oInput.setTokens(aTokens);
            oInput.setValue("");
            this._oValueHelpDialog.close();
        },
        onValueHelpCancel: function () {
            this._oValueHelpDialog.close();
        },
        _getHistorySelections: function (sId) {
            var oInput = this.byId(sId);
            if (!oInput) {
                return [];
            }
            var aSelections = oInput.getTokens().map(function (oToken) {
                var oRange = oToken.data("range");
                return oRange || { operation: "EQ", value1: oToken.getKey() || oToken.getText(), exclude: false };
            });
            var sValue = oInput.getValue().trim();
            if (sValue) {
                aSelections.push({ operation: "EQ", value1: sValue, exclude: false });
            }
            return aSelections;
        },
        onExecute: function () {
            var oViewModel = this.getView().getModel("historyViewModel");
            if (oViewModel.getProperty("/busy")) {
                return;
            }
            var oFrom = this.byId("dpFilterDataDa");
            var oTo = this.byId("dpFilterDataA");
            if ((oFrom.getValue() && !oFrom.isValidValue()) || (oTo.getValue() && !oTo.isValidValue()) ||
                (oFrom.getDateValue() && oTo.getDateValue() && oFrom.getDateValue() > oTo.getDateValue())) {
                MessageBox.error(this._i18n("msgHistoryInvalidDates"));
                return;
            }
            var oSelection = {
                dateFrom: oFrom.getValue(),
                dateTo: oTo.getValue(),
                utente: this._getHistorySelections("miFilterUtente"),
                unitaEconomica: this._getHistorySelections("miFilterUnitaEconomica"),
                tipoOggetto: this._getHistorySelections("miFilterTipoOggetto"),
                oggettoArchitettonico: this._getHistorySelections("miFilterOggettoArchitettonico")
            };
            var fnError = function (oError) {
                oViewModel.setProperty("/busy", false);
                MessageBox.error(this._i18n("msgHistoryLoadError"));
            }.bind(this);
            this.byId("resultsTable").clearSelection();
            oViewModel.setProperty("/exportEnabled", false);
            oViewModel.setProperty("/busy", true);
            try {
                models.fetchHistoryData(this.getOwnerComponent().getModel(), oSelection, function (oData) {
                    var aResults = models.mapReportEntries(oData.results || []);
                    var oHistoryModel = this.getView().getModel("historyModel");
                    oHistoryModel.setSizeLimit(Math.max(100, aResults.length));
                    oHistoryModel.setProperty("/results", aResults);
                    oViewModel.setProperty("/busy", false);
                }.bind(this), fnError);
            } catch (oError) {
                fnError(oError);
            }
        },
        onResultsSelectionChange: function () {
            var oTable = this.byId("resultsTable");
            var oHistoryViewModel = this.getView().getModel("historyViewModel");
            var aSelectedIndices = oTable.getSelectedIndices();
            oHistoryViewModel.setProperty("/exportEnabled", aSelectedIndices.length > 0);
        },
        onExportSelection: function () {
            var oTable = this.byId("resultsTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            var aSelectedEntries = aSelectedIndices.map(function (iIndex) {
                var oContext = oTable.getContextByIndex(iIndex);
                return oContext && oContext.getObject();
            }).filter(function (oEntry) {
                return !!oEntry;
            });
            if (!aSelectedEntries.length || this.getView().getModel("historyViewModel").getProperty("/busy")) {
                return;
            }
            var aColumns = this._getExportColumns();
            if (!aColumns.length) {
                return;
            }
            var oSettings = {
                workbook: { columns: aColumns },
                dataSource: aSelectedEntries,
                fileName: this._i18n("storicoTitle") + "_" + this._formatExportTimestamp() + ".xlsx"
            };
            var oSheet = new this.Spreadsheet(oSettings);
            oSheet.build().catch(function () {
                MessageBox.error(this._i18n("msgHistoryExportError"));
            }.bind(this)).finally(function () {
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
        _i18n: function (sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});