sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/models",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
], function (Controller, JSONModel, models, Spreadsheet, exportLibrary) {
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
        },
        onP13nPress: function (oEvent) {
            this.byId("resultsTable").openP13n(oEvent);
        },
        onValueHelpUnitaEconomica: function () {
            var sSocieta = this.getView().getModel("viewModel").getProperty("/filterSociety");
            this.getView().setBusy(true);
            models.fetchIdUniEconomicaHelp(this.getOwnerComponent().getModel(), sSocieta, function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterUnitaEconomica",
                    title: this._i18n("lblUnitaEconomica"),
                    key: "numUniEconomicia",
                    descriptionKey: "numOgg",
                    entries: oData.results || [],
                    columns: [
                        { property: "numUniEconomicia", label: "vhdNumUniEcon", width: "12rem" },
                        { property: "soc", label: "vhdSocieta", width: "7rem" },
                        { property: "numOgg", label: "vhdNumOgg", width: "16rem" },
                        { property: "chiaveIntOggImm", label: "vhdChiaveIntOggImm", width: "16rem" }
                    ]
                });
            }.bind(this), this._onValueHelpError.bind(this));
        },
        onValueHelpTipoOggetto: function () {
            this.getView().setBusy(true);
            models.fetchTipoOggettoHelp(this.getOwnerComponent().getModel(), function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterTipoOggetto",
                    title: this._i18n("lblTipoOggetto"),
                    key: "tipoOggArc",
                    descriptionKey: "defTipoOggArc",
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
            }.bind(this), this._onValueHelpError.bind(this));
        },
        onValueHelpOggettoArchitettonico: function () {
            var sIdOggetto = this.byId("miFilterOggettoArchitettonico").getValue().trim();
            this.getView().setBusy(true);
            models.fetchIdOggettoArcHelp(this.getOwnerComponent().getModel(), sIdOggetto, function (oData) {
                this.getView().setBusy(false);
                this._openValueHelpDialog({
                    field: "miFilterOggettoArchitettonico",
                    title: this._i18n("lblOggettoArchitettonico"),
                    key: "idOggArc",
                    descriptionKey: "def",
                    entries: oData.results || [],
                    columns: [
                        { property: "idOggArc", label: "vhdIdOggArc", width: "14rem" },
                        { property: "tpOggArc", label: "vhdTpOggArc", width: "10rem" },
                        { property: "def", label: "vhdDefOggArc", width: "20rem" },
                        { property: "funzione", label: "vhdFunzione", width: "8rem" }
                    ]
                });
            }.bind(this), this._onValueHelpError.bind(this));
        },
        _openValueHelpDialog: function (oConfig) {
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "reportamministrazionetrasparenza.view.fragment.ValueHelpDialog",
                    this
                );
                this.getView().addDependent(this._oValueHelpDialog);
                this._oValueHelpDialog.setModel(new JSONModel({ entries: [] }), "valueHelpData");
            }
            this._sCurrentValueHelpField = oConfig.field;
            var oTable = new sap.ui.table.Table({
                visibleRowCount: 8,
                columns: oConfig.columns.map(function (oColumn) {
                    return new sap.ui.table.Column({
                        label: new sap.m.Label({ text: this._i18n(oColumn.label) }),
                        template: oColumn.flag ? new sap.m.CheckBox({
                            selected: "{= ${valueHelpData>" + oColumn.property + "} === 'X' }",
                            editable: false
                        }) : new sap.m.Text({ text: "{valueHelpData>" + oColumn.property + "}", wrapping: false }),
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
            this._oValueHelpDialog.getModel("valueHelpData").setProperty("/entries", oConfig.entries);
            this._oValueHelpDialog.setKey(oConfig.key);
            this._oValueHelpDialog.setDescriptionKey(oConfig.descriptionKey || "");
            this._oValueHelpDialog.setRangeKeyFields([
                { label: oConfig.title, key: oConfig.key, type: "string" }
            ]);
            this._oValueHelpDialog.setTokens(this.byId(oConfig.field).getTokens().map(function (oToken) {
                return oToken.clone();
            }));
            this._oValueHelpDialog.setTitle(oConfig.title);
            this._oValueHelpDialog.update();
            this._oValueHelpDialog.open();
        },
        onValueHelpOk: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens") || [];
            var oInput = this.byId(this._sCurrentValueHelpField);
            oInput.setTokens(aTokens);
            this._oValueHelpDialog.close();
        },
        onValueHelpCancel: function () {
            this._oValueHelpDialog.close();
        },
        _onValueHelpError: function (oError) {
            this.getView().setBusy(false);
            var sDetails = oError.statusCode || oError.statusText || "";
            sap.m.MessageBox.error(this._i18n("msgValueHelpLoadError") + (sDetails ? " (" + sDetails + ")" : ""));
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
                sap.m.MessageBox.error("Servizio OData non disponibile.");
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
                    sap.m.MessageBox.error("Errore nel caricamento dei dati: " + (oError.statusText || oError.statusCode || ""));
                };
                models.fetchReportData(oODataModel, oSelection, fnLoadSuccess, fnLoadError);
            } catch (oError) {
                oViewModel.setProperty("/busy", false);
                sap.m.MessageBox.error(oError.message);
            }
        },
        _promptSaveAndSubmitBatch: function (oODataModel, aRawResults, oViewModel) {
            var self = this;
            sap.m.MessageBox.confirm(this._i18n("msgSaveReportBatch"), {
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        self._submitReportBatch(oODataModel, aRawResults, oViewModel);
                    } else {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },
        _submitReportBatch: function (oODataModel, aRawResults, oViewModel) {
            try {
                var oPayload = models.createReportBatchPayload(oODataModel, aRawResults);
                models.saveReportBatch(oODataModel, oPayload, function (oResponse) {
                    oViewModel.setProperty("/busy", false);
                    sap.m.MessageBox.success(this._i18n("msgReportBatchSaved") + " (ID: " + oPayload.batchId + ")");
                }.bind(this), function (oError) {
                    oViewModel.setProperty("/busy", false);
                    sap.m.MessageBox.error("Errore nel salvataggio del batch: " + (oError.statusText || oError.status || ""));
                });
            } catch (oError) {
                oViewModel.setProperty("/busy", false);
                sap.m.MessageBox.error("Errore nella preparazione del batch: " + oError.message);
            }
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
            var oReportModel = this.getOwnerComponent().getModel("reportModel");
            var aSelectedIndices = oTable.getSelectedIndices();
            var aAllEntries = oReportModel.getProperty("/results");
            var aSelectedEntries = aSelectedIndices.map(function (iIndex) {
                return aAllEntries[iIndex];
            });
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
                fileName: this._i18n("reportTitle") + "_" + this._formatExportTimestamp() + ".xlsx"
            };
            var oSheet = new Spreadsheet(oSettings);
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
        },
    });
});