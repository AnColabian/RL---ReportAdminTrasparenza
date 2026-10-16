sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/models",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageBox",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text"
], function (Controller, JSONModel, models, Spreadsheet, MessageBox, ValueHelpDialog, Table, Column, Label, Text) {
    "use strict";
    return Controller.extend("reportamministrazionetrasparenza.controller.History", {
        Spreadsheet: Spreadsheet,
        models: models,
        onInit: function () {
            this.getView().setModel(models.createHistoryViewModel(), "historyViewModel");
            this.getView().setModel(models.createHistoryModel(), "historyModel");
            this.byId("resultsTable").setP13nTitle(this._i18n("p13nDialogTitle"));
        },
        onExit: function () {
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
            }
        },
        onP13nPress: function (oEvent) {
            this.byId("resultsTable").openP13n(oEvent);
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
            var aColumns = [
                { label: this._i18n("colSocieta"), property: "societa" },
                { label: this._i18n("colUnitaEconomica"), property: "unitaEconomica" },
                { label: this._i18n("colCompendio"), property: "compendio" },
                { label: this._i18n("colDescrizTipoComp"), property: "descrizTipoComp" },
                { label: this._i18n("colDefinizioneUE"), property: "definizioneUE" },
                { label: this._i18n("colDescrBenePatrimoniale"), property: "descrBenePatrimoniale" },
                { label: this._i18n("colDescrNaturaGiuridica"), property: "descrNaturaGiuridica" },
                { label: this._i18n("colDescrTitoloUtilizzo"), property: "descrTitoloUtilizzo" },
                { label: this._i18n("colVia"), property: "via" },
                { label: this._i18n("colNumeroCivico"), property: "numeroCivico" },
                { label: this._i18n("colCap"), property: "cap" },
                { label: this._i18n("colLocalita"), property: "localita" },
                { label: this._i18n("colRegione"), property: "regione" },
                { label: this._i18n("colChiavePaesiRegioni"), property: "chiavePaesiRegioni" },
                { label: this._i18n("colOggettoArchitett"), property: "oggettoArchitett" },
                { label: this._i18n("colTipoOggArchitett"), property: "tipoOggArchitett" },
                { label: this._i18n("colDefOggArch"), property: "defOggArch" },
                { label: this._i18n("colFunzione"), property: "funzione" },
                { label: this._i18n("colBusinessPartner"), property: "businessPartner" },
                { label: this._i18n("colDenominazioneDitta"), property: "denominazioneDitta" },
                { label: this._i18n("colDescrTpEdifTerr"), property: "descrTpEdifTerr" },
                { label: this._i18n("colDescrBeneCulturale"), property: "descrBeneCulturale" },
                { label: this._i18n("colIdCatCatastale"), property: "idCatCatastale" },
                { label: this._i18n("colPercentRivalutaz"), property: "percentRivalutaz" },
                { label: this._i18n("colCoeffRivalutaz"), property: "coeffRivalutaz" },
                { label: this._i18n("colNotaAddizionaleImmobile"), property: "notaAddizionaleImmobile" },
                { label: this._i18n("colStAccatastam"), property: "stAccatastam" },
                { label: this._i18n("colTipoCatasto"), property: "tipoCatasto" },
                { label: this._i18n("colDenominatore"), property: "denominatore" },
                { label: this._i18n("colTipoParticella"), property: "tipoParticella" },
                { label: this._i18n("colCodComCatTav"), property: "codComCatTav" },
                { label: this._i18n("colCodiceBelfiore"), property: "codiceBelfiore" },
                { label: this._i18n("colFoglio"), property: "foglio" },
                { label: this._i18n("colGraffatoFoglio"), property: "graffatoFoglio" },
                { label: this._i18n("colSezioneUrbana"), property: "sezioneUrbana" },
                { label: this._i18n("colSezioneAmministr"), property: "sezioneAmministr" },
                { label: this._i18n("colParticellaCatasto"), property: "particellaCatasto" },
                { label: this._i18n("colSub"), property: "sub" },
                { label: this._i18n("colGraffMapSub"), property: "graffMapSub" },
                { label: this._i18n("colDescrClasse"), property: "descrClasse" },
                { label: this._i18n("colVariazioneDal"), property: "variazioneDal" },
                { label: this._i18n("colVariazioneAl"), property: "variazioneAl" },
                { label: this._i18n("colSuperficieMq"), property: "superficieMq" },
                { label: this._i18n("colCubaturaMc"), property: "cubaturaMc" },
                { label: this._i18n("colRendita"), property: "rendita" },
                { label: this._i18n("colDataRivRend"), property: "dataRivRend" },
                { label: this._i18n("colTipoDiCalcolo"), property: "tipoDiCalcolo" },
                { label: this._i18n("colValOggArch"), property: "valOggArch" },
                { label: this._i18n("colRedditoDominicale"), property: "redditoDominicale" },
                { label: this._i18n("colRedditoAgrario"), property: "redditoAgrario" },
                { label: this._i18n("colNote"), property: "note" }
            ];
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