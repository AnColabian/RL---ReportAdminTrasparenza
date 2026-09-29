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
            this.getView().setModel(models.createViewModel(), "viewModel");
            this.getView().setModel(models.createSocietyModel(), "societyModel");
            this.getView().setModel(models.createTipoOggettoModel(), "tipoOggettoModel");
            this.byId("resultsTable").setP13nTitle(this._i18n("p13nDialogTitle"));
        },
        onP13nPress: function (oEvent) {
            this.byId("resultsTable").openP13n(oEvent);
        },
        onValueHelpUnitaEconomica: function () {
            this._sCurrentValueHelpField = "miFilterUnitaEconomica";
            this._sCurrentValueHelpTitle = this._i18n("lblUnitaEconomica");
            this._aCurrentValueHelpEntries = [
                { key: "U0001", text: "U0001 - Unità Economica Esempio 1" },
                { key: "U0002", text: "U0002 - Unità Economica Esempio 2" },
                { key: "U0003", text: "U0003 - Unità Economica Esempio 3" }
            ];
            this._openValueHelpDialog();
        },
        onValueHelpTipoOggetto: function () {
            this._sCurrentValueHelpField = "miFilterTipoOggetto";
            this._sCurrentValueHelpTitle = this._i18n("lblTipoOggetto");
            this._aCurrentValueHelpEntries = [
                { key: "BAUM", text: "BAUM - Immobile" },
                { key: "GEBAEUDE", text: "GEBAEUDE - Fabbricato" },
                { key: "GRUNDST", text: "GRUNDST - Terreno" }
            ];
            this._openValueHelpDialog();
        },
        onValueHelpOggettoArchitettonico: function () {
            this._sCurrentValueHelpField = "miFilterOggettoArchitettonico";
            this._sCurrentValueHelpTitle = this._i18n("lblOggettoArchitettonico");
            this._aCurrentValueHelpEntries = [
                { key: "OA0001", text: "OA0001 - Oggetto Architettonico Esempio 1" },
                { key: "OA0002", text: "OA0002 - Oggetto Architettonico Esempio 2" },
                { key: "OA0003", text: "OA0003 - Oggetto Architettonico Esempio 3" }
            ];
            this._openValueHelpDialog();
        },
        _openValueHelpDialog: function () {
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "reportamministrazionetrasparenza.view.fragment.ValueHelpDialog",
                    this
                );
                this.getView().addDependent(this._oValueHelpDialog);
            }
            var oTable = new sap.ui.table.Table({
                visibleRowCount: 5,
                columns: [
                    new sap.ui.table.Column({
                        label: new sap.m.Label({ text: this._i18n("vhdColKey") }),
                        template: new sap.m.Text({ text: "{valueHelpData>key}" }),
                        width: "8rem"
                    }),
                    new sap.ui.table.Column({
                        label: new sap.m.Label({ text: this._i18n("vhdColText") }),
                        template: new sap.m.Text({ text: "{valueHelpData>text}" }),
                        width: "20rem"
                    })
                ]
            });
            oTable.bindRows("valueHelpData>/entries");
            this._oValueHelpDialog.setTable(oTable);
            var oValueHelpDataModel = new JSONModel({
                entries: this._aCurrentValueHelpEntries
            });
            this._oValueHelpDialog.setModel(oValueHelpDataModel, "valueHelpData");
            var oInput = this.byId(this._sCurrentValueHelpField);
            this._oValueHelpDialog.setTokens(oInput.getTokens());
            this._oValueHelpDialog.setRangeKeyFields([
                { label: this._i18n("vhdColKey"), key: "key", type: "string" }
            ]);
            this._oValueHelpDialog.setTitle(this._sCurrentValueHelpTitle);
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
        onExecute: function () {
            var oComponent = this.getOwnerComponent();
            var oReportModel = oComponent.getModel("reportModel");
            if (!oReportModel) {
                oReportModel = models.createReportModel();
                oComponent.setModel(oReportModel, "reportModel");
            }
            oReportModel.setProperty("/results", models.createReportMockEntries());
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