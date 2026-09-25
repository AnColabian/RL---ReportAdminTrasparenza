sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Token",
    "sap/ui/model/json/JSONModel",
    "../model/models"
], function (Controller, Token, JSONModel, models) {
    "use strict";
    return Controller.extend("reportamministrazionetrasparenza.controller.Worklist", {
        onInit: function () {
            this.getView().setModel(models.createViewModel(), "viewModel");
            this.getView().setModel(models.createSocietyModel(), "societyModel");
            this.getView().setModel(models.createTipoOggettoModel(), "tipoOggettoModel");
        },
        onValueHelpUnitaEconomica: function (oEvent) {
            this._sCurrentValueHelpField = "miFilterUnitaEconomica";
            this._sCurrentValueHelpProperty = "filterUnitaEconomica";
            this._openValueHelpDialog();
        },
        onValueHelpTipoOggetto: function (oEvent) {
            var oInput = oEvent.getSource();
            oInput.addToken(new Token({ key: "BAUM", text: "BAUM - Immobile" }));
        },
        onValueHelpOggettoArchitettonico: function (oEvent) {
            var oInput = oEvent.getSource();
            oInput.addToken(new Token({ key: "TEST", text: "TEST" }));
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
                        template: new sap.m.Text({ text: "{key}" }),
                        width: "8rem"
                    }),
                    new sap.ui.table.Column({
                        label: new sap.m.Label({ text: this._i18n("vhdColText") }),
                        template: new sap.m.Text({ text: "{text}" }),
                        width: "20rem"
                    })
                ]
            });
            oTable.bindRows("valueHelpData>/entries");
            this._oValueHelpDialog.setTable(oTable);
            var oValueHelpDataModel = new JSONModel({
                entries: [
                    { key: "U0001", text: "U0001 - Unità Economica Esempio 1" },
                    { key: "U0002", text: "U0002 - Unità Economica Esempio 2" },
                    { key: "U0003", text: "U0003 - Unità Economica Esempio 3" }
                ]
            });
            this._oValueHelpDialog.setModel(oValueHelpDataModel, "valueHelpData");
            var oInput = this.byId(this._sCurrentValueHelpField);
            var aTokens = oInput.getTokens().map(function (oToken) {
                return { key: oToken.getKey(), value1: oToken.getKey() };
            });
            this._oValueHelpDialog.setTokens(oInput.getTokens());
            this._oValueHelpDialog.setRangeKeyFields([
                { label: this._i18n("vhdColKey"), key: "key", type: "string" }
            ]);
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
        },
        _i18n: function (sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});