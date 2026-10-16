sap.ui.define([
    "sap/ui/table/Table",
    "sap/m/p13n/Engine",
    "sap/m/p13n/MetadataHelper",
    "sap/m/p13n/SelectionController",
    "sap/m/p13n/SortController",
    "sap/ui/model/Sorter"
], function (Table, Engine, MetadataHelper, SelectionController, SortController, Sorter) {
    "use strict";
    return Table.extend("reportamministrazionetrasparenza.control.P13nGridTable", {
        metadata: {
            properties: {
                p13nTitle: { type: "string", defaultValue: "" },
                persistencyKey: { type: "string", defaultValue: "" }
            }
        },
        renderer: "sap.ui.table.TableRenderer",
        onBeforeRendering: function () {
            if (Table.prototype.onBeforeRendering) {
                Table.prototype.onBeforeRendering.apply(this, arguments);
            }
            this._initP13n();
            this._restorePersistedState();
            this._applyPendingState();
        },
        exit: function () {
            if (this._fnStateChange) {
                Engine.getInstance().detachStateChange(this._fnStateChange);
                this._fnStateChange = null;
            }
            if (Table.prototype.exit) {
                Table.prototype.exit.apply(this, arguments);
            }
        },
        openP13n: function (oEvent) {
            this._initP13n();
            return Engine.getInstance().show(this, ["Columns", "Sorter"], {
                contentHeight: "35rem",
                contentWidth: "32rem",
                source: oEvent ? oEvent.getSource() : this
            });
        },
        _initP13n: function () {
            if (this._bP13nRegistered || !this.getColumns().length) {
                return;
            }
            var aMetadata = this.getColumns().map(function (oColumn) {
                var oTemplate = oColumn.getTemplate();
                var oBindingInfo = oTemplate && oTemplate.getBindingInfo("text");
                var oPart = oBindingInfo && oBindingInfo.parts && oBindingInfo.parts[0];
                return {
                    key: oColumn.data("p13nKey"),
                    label: oColumn.getLabel().getText(),
                    path: oPart ? oPart.path : oColumn.data("p13nKey")
                };
            }).filter(function (oItem) {
                return !!oItem.key;
            });
            this._oMetadataHelper = new MetadataHelper(aMetadata);
            this._oEngine = Engine.getInstance();
            this._oEngine.register(this, {
                helper: this._oMetadataHelper,
                controller: {
                    Columns: new SelectionController({
                        control: this,
                        targetAggregation: "columns",
                        getKeyForItem: function (oColumn) {
                            return oColumn.data("p13nKey");
                        }
                    }),
                    Sorter: new SortController({
                        control: this
                    })
                }
            });
            this._fnStateChange = function (oEvent) {
                var oControl = oEvent.getParameter("control");
                if (oControl !== this) {
                    return;
                }
                var oState = oEvent.getParameter("state");
                this._oPendingState = oState;
                this._applyPendingState();
                this._persistState();
            }.bind(this);
            this._oEngine.attachStateChange(this._fnStateChange);
            this._bP13nRegistered = true;
        },
        _applyPendingState: function () {
            if (!this._oPendingState) {
                return;
            }
            var oState = this._oPendingState;
            this._oPendingState = null;
            if (Array.isArray(oState.Columns)) {
                this.getColumns().forEach(function (oColumn) {
                    var sKey = oColumn.data("p13nKey");
                    var bVisible = oState.Columns.some(function (oColumnState) {
                        return oColumnState.key === sKey;
                    });
                    oColumn.setVisible(bVisible);
                });
                oState.Columns.forEach(function (oColumnState, iIndex) {
                    var oColumn = this.getColumns().find(function (oCurrentColumn) {
                        return oCurrentColumn.data("p13nKey") === oColumnState.key;
                    });
                    if (oColumn && this.indexOfColumn(oColumn) !== iIndex) {
                        this.removeColumn(oColumn);
                        this.insertColumn(oColumn, iIndex);
                    }
                }, this);
            }
            if (Array.isArray(oState.Sorter)) {
                this._applySorters(oState.Sorter);
            }
        },
        _applySorters: function (aSorterState) {
            var aSorters = [];
            aSorterState.forEach(function (oSortState) {
                if (oSortState.sorted === false) {
                    return;
                }
                var oProperty = this._oMetadataHelper.getProperty(oSortState.key);
                if (oProperty) {
                    aSorters.push(new Sorter(oProperty.path, !!oSortState.descending));
                }
            }, this);
            var oBinding = this.getBinding("rows");
            if (oBinding) {
                oBinding.sort(aSorters);
            }
        },
        _getStorageKey: function () {
            var sPersistencyKey = this.getPersistencyKey();
            if (!sPersistencyKey) {
                return "";
            }
            return "reportamministrazionetrasparenza.p13n." + sPersistencyKey;
        },
        _persistState: function () {
            var sStorageKey = this._getStorageKey();
            if (!sStorageKey || !this._oEngine) {
                return;
            }
            this._oEngine.retrieveState(this).then(function (oState) {
                window.localStorage.setItem(sStorageKey, JSON.stringify(oState || {}));
            });
        },
        _restorePersistedState: function () {
            var sStorageKey = this._getStorageKey();
            if (!sStorageKey || !this._oEngine || this._bStateRestored) {
                return;
            }
            var sRawState = window.localStorage.getItem(sStorageKey);
            if (!sRawState) {
                this._bStateRestored = true;
                return;
            }
            try {
                var oState = JSON.parse(sRawState);
                this._oPendingState = oState;
                this._oEngine.applyState(this, oState);
            } catch (e) {
                window.localStorage.removeItem(sStorageKey);
            }
            this._bStateRestored = true;
        }
    });
});