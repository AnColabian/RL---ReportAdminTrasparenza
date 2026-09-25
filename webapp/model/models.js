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
                filterLayoutVariant: ""
            });
            return oModel;
        },
        createSocietyModel: function () {
            var oModel = new JSONModel({
                societies: [
                    { code: "1000", text: "1000 - Società Esempio 1" },
                    { code: "2000", text: "2000 - Società Esempio 2" }
                ]
            });
            return oModel;
        },
        createTipoOggettoModel: function () {
            var oModel = new JSONModel({
                tipiOggetto: [
                    { code: "BAUM", text: "BAUM - Immobile" },
                    { code: "GEBAEUDE", text: "GEBAEUDE - Fabbricato" },
                    { code: "GRUNDST", text: "GRUNDST - Terreno" }
                ]
            });
            return oModel;
        }
    };
});