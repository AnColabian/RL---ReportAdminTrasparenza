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
            }.bind(this), "utente", "utente");
        },
        onValueHelpUnitaEconomica: function () {
            this._loadValueHelp("miFilterUnitaEconomica", "lblUnitaEconomica", function (fnSuccess, fnError) {
                return models.fetchIdUniEconomicaHelp(this.getOwnerComponent().getModel(), "", fnSuccess, fnError);
            }.bind(this), "numUniEconomicia", "numOgg");
        },
        onValueHelpTipoOggetto: function () {
            this._loadValueHelp("miFilterTipoOggetto", "lblTipoOggetto", function (fnSuccess, fnError) {
                return models.fetchTipoOggettoHelp(this.getOwnerComponent().getModel(), fnSuccess, fnError);
            }.bind(this), "tipoOggArc", "defTipoOggArc");
        },
        onValueHelpOggettoArchitettonico: function () {
            this._loadValueHelp("miFilterOggettoArchitettonico", "lblOggettoArchitettonico", function (fnSuccess, fnError) {
                return models.fetchIdOggettoArcHelp(this.getOwnerComponent().getModel(),
                    this.byId("miFilterOggettoArchitettonico").getValue().trim(), fnSuccess, fnError);
            }.bind(this), "idOggArc", "def");
        },
        _loadValueHelp: function (sField, sTitle, fnFetch, sKey, sDescription) {
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
                    this._openValueHelpDialog(sField, this._i18n(sTitle), (oData.results || []).map(function (oEntry) {
                        return { key: oEntry[sKey], text: oEntry[sDescription] || oEntry[sKey] };
                    }));
                }.bind(this), fnError);
            } catch (oError) {
                fnError(oError);
            }
        },
        _openValueHelpDialog: function (sField, sTitle, aEntries) {
            this._sCurrentValueHelpField = sField;
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new ValueHelpDialog({
                    supportMultiselect: true,
                    supportRanges: true,
                    ok: this.onValueHelpOk.bind(this),
                    cancel: this.onValueHelpCancel.bind(this)
                });
                this.getView().addDependent(this._oValueHelpDialog);
            }
            var oTable = new Table({
                visibleRowCount: 5,
                columns: [
                    new Column({
                        label: new Label({ text: this._i18n("vhdColKey") }),
                        template: new Text({ text: "{valueHelpData>key}" }),
                        width: "8rem"
                    }),
                    new Column({
                        label: new Label({ text: this._i18n("vhdColText") }),
                        template: new Text({ text: "{valueHelpData>text}" }),
                        width: "20rem"
                    })
                ]
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
            var oInput = this.byId(this._sCurrentValueHelpField);
            this._oValueHelpDialog.setKey("key");
            this._oValueHelpDialog.setDescriptionKey("text");
            this._oValueHelpDialog.setTokens(oInput.getTokens().map(function (oToken) {
                return oToken.clone();
            }));
            this._oValueHelpDialog.setRangeKeyFields([
                { label: this._i18n("vhdColKey"), key: "key", type: "string" }
            ]);
            this._oValueHelpDialog.setTitle(sTitle);
            this._oValueHelpDialog.update();
            this._oValueHelpDialog.open();
        },
        onValueHelpOk: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens") || [];
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
            var aSelections = oInput.getTokens().map(function (oToken) {
                var oRange = oToken.data("range");
                return oRange || { operation: "EQ", value1: oToken.getKey() || oToken.getText(), exclude: false };
            });
            if (oInput.getValue().trim()) {
                aSelections.push({ operation: "EQ", value1: oInput.getValue().trim(), exclude: false });
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
            var fnError = function () {
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