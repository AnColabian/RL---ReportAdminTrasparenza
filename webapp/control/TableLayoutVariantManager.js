sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/ui/comp/variants/VariantItem"
], function (BaseObject, JSONModel, VariantItem) {
    "use strict";
    return BaseObject.extend("reportamministrazionetrasparenza.control.TableLayoutVariantManager", {
        constructor: function (mSettings) {
            this._oTable = mSettings.table;
            this._oVariant = mSettings.variantManagement;
            this._sPersistencyKey = mSettings.persistencyKey;
            this._sStorageKey = "reportamministrazionetrasparenza.layoutVariants." + this._sPersistencyKey;
            this._oModel = new JSONModel({
                defaultKey: "STANDARD",
                currentKey: "STANDARD",
                variants: [
                    { key: "STANDARD", name: "Standard", executeOnSelect: true, readOnly: true }
                ]
            });
            this._oVariant.setModel(this._oModel, "layoutVariants");
            this._bindVariantControl();
            this._restoreOrInit();
        },
        _bindVariantControl: function () {
            this._oVariant.bindAggregation("variantItems", {
                path: "layoutVariants>/variants",
                template: new VariantItem({
                    key: "{layoutVariants>key}",
                    text: "{layoutVariants>name}",
                    global: false
                })
            });
            this._oVariant.attachSelect(this._onSelect.bind(this));
            this._oVariant.attachSave(this._onSave.bind(this));
            this._oVariant.attachManage(this._onManage.bind(this));
        },
        _restoreOrInit: function () {
            var sRaw = window.localStorage.getItem(this._sStorageKey);
            if (!sRaw) {
                this._persist();
                this.applyVariant("STANDARD");
                return;
            }
            try {
                var oData = JSON.parse(sRaw);
                if (!oData || !Array.isArray(oData.variants) || !oData.states) {
                    this._persist();
                    this.applyVariant("STANDARD");
                    return;
                }
                this._oModel.setData(oData);
                this._applyVariantKey(oData.currentKey || "STANDARD");
            } catch (e) {
                this._persist();
                this.applyVariant("STANDARD");
            }
        },
        _persist: function () {
            window.localStorage.setItem(this._sStorageKey, JSON.stringify(this._oModel.getData()));
        },
        _onSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            this.applyVariant(sKey);
        },
        _onSave: function (oEvent) {
            var sName = oEvent.getParameter("name");
            var bOverwrite = oEvent.getParameter("overwrite");
            var sKey = oEvent.getParameter("key");
            var oData = this._oModel.getData();
            var oState = this._captureTableState();
            if (bOverwrite && sKey && sKey !== "STANDARD") {
                var oExisting = oData.variants.find(function (oItem) { return oItem.key === sKey; });
                if (oExisting) {
                    oExisting.name = sName;
                    oData.states[sKey] = oState;
                    oData.currentKey = sKey;
                    this._oModel.refresh(true);
                    this._persist();
                    this._applyVariantKey(sKey);
                    return;
                }
            }
            var sNewKey = "V_" + Date.now();
            oData.variants.push({ key: sNewKey, name: sName, executeOnSelect: true, readOnly: false });
            if (!oData.states) {
                oData.states = {};
            }
            oData.states[sNewKey] = oState;
            oData.currentKey = sNewKey;
            this._oModel.refresh(true);
            this._persist();
            this._applyVariantKey(sNewKey);
        },
        _onManage: function (oEvent) {
            var aDeleted = oEvent.getParameter("deleted") || [];
            var aRenamed = oEvent.getParameter("renamed") || [];
            var sDef = oEvent.getParameter("def");
            var oData = this._oModel.getData();
            aDeleted.forEach(function (sKey) {
                if (sKey === "STANDARD") {
                    return;
                }
                oData.variants = oData.variants.filter(function (oItem) { return oItem.key !== sKey; });
                if (oData.states && oData.states[sKey]) {
                    delete oData.states[sKey];
                }
                if (oData.currentKey === sKey) {
                    oData.currentKey = "STANDARD";
                }
            });
            aRenamed.forEach(function (oRename) {
                var oVariant = oData.variants.find(function (oItem) { return oItem.key === oRename.key; });
                if (oVariant && oVariant.key !== "STANDARD") {
                    oVariant.name = oRename.name;
                }
            });
            if (sDef) {
                oData.defaultKey = sDef;
            }
            this._oModel.refresh(true);
            this._persist();
            this._applyVariantKey(oData.currentKey);
        },
        _applyVariantKey: function (sKey) {
            var oData = this._oModel.getData();
            var sResolved = sKey || "STANDARD";
            var bExists = oData.variants.some(function (oItem) { return oItem.key === sResolved; });
            if (!bExists) {
                sResolved = "STANDARD";
            }
            oData.currentKey = sResolved;
            this._oModel.refresh(true);
            this._persist();
            this.applyVariant(sResolved);
        },
        applyVariant: function (sKey) {
            var oData = this._oModel.getData();
            var oState = sKey === "STANDARD" ? this._getStandardState() : oData.states && oData.states[sKey];
            if (!oState) {
                oState = this._getStandardState();
            }
            this._applyTableState(oState);
            oData.currentKey = sKey;
            this._oModel.refresh(true);
            this._persist();
        },
        _captureTableState: function () {
            var aColumns = this._oTable.getColumns().map(function (oCol, iIndex) {
                return {
                    key: oCol.data("p13nKey"),
                    visible: oCol.getVisible(),
                    order: iIndex
                };
            }).filter(function (oItem) {
                return !!oItem.key;
            });
            return { columns: aColumns };
        },
        _getStandardState: function () {
            if (!this._oStandardState) {
                this._oStandardState = this._captureTableState();
            }
            return JSON.parse(JSON.stringify(this._oStandardState));
        },
        _applyTableState: function (oState) {
            var aStateColumns = (oState && oState.columns) || [];
            if (!aStateColumns.length) {
                return;
            }
            this._oTable.getColumns().forEach(function (oCol) {
                var sKey = oCol.data("p13nKey");
                var oMatch = aStateColumns.find(function (oItem) { return oItem.key === sKey; });
                oCol.setVisible(!!(oMatch && oMatch.visible));
            });
            aStateColumns.sort(function (a, b) { return a.order - b.order; }).forEach(function (oStateCol, iTarget) {
                var oCol = this._oTable.getColumns().find(function (oCurrent) {
                    return oCurrent.data("p13nKey") === oStateCol.key;
                });
                if (oCol) {
                    var iCurrent = this._oTable.indexOfColumn(oCol);
                    if (iCurrent !== iTarget) {
                        this._oTable.removeColumn(oCol);
                        this._oTable.insertColumn(oCol, iTarget);
                    }
                }
            }, this);
        },
        updateCurrentVariantState: function (oState) {
            var oData = this._oModel.getData();
            var sCurrent = oData.currentKey || "STANDARD";
            if (!oData.states) {
                oData.states = {};
            }
            if (sCurrent === "STANDARD") {
                this._oStandardState = JSON.parse(JSON.stringify(oState));
            } else {
                oData.states[sCurrent] = JSON.parse(JSON.stringify(oState));
            }
            this._oModel.refresh(true);
            this._persist();
        }
    });
});