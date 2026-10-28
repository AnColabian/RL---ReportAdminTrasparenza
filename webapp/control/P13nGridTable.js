sap.ui.define([
    "sap/ui/table/Table",
    "sap/m/p13n/Engine",
    "sap/m/p13n/MetadataHelper",
    "sap/m/p13n/SelectionController"
], function (Table, Engine, MetadataHelper, SelectionController) {
    "use strict";
    return Table.extend("reportmef.control.P13nGridTable", {
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
            if (!this.getColumns().length) {
                return;
            }
            this._initP13n();
            this._restoreColumnsState();
            this._applyPendingColumnsState();
        },
        exit: function () {
            if (this._fnStateChange && this._oEngine) {
                this._oEngine.detachStateChange(this._fnStateChange);
                this._fnStateChange = null;
            }
            if (Table.prototype.exit) {
                Table.prototype.exit.apply(this, arguments);
            }
        },
        openP13n: function (oEvent) {
            this._initP13n();
            return this._oEngine.show(this, ["Columns"], {
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
                return {
                    key: oColumn.data("p13nKey"),
                    label: oColumn.getLabel().getText()
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
                    })
                }
            });
            this._fnStateChange = function (oEvent) {
                var oControl = oEvent.getParameter("control");
                if (oControl !== this) {
                    return;
                }
                var oState = oEvent.getParameter("state");
                if (!oState || !Array.isArray(oState.Columns)) {
                    return;
                }
                this._oPendingColumnsState = oState.Columns;
                this._applyPendingColumnsState();
                this._persistColumnsState(oState.Columns);
            }.bind(this);
            this._oEngine.attachStateChange(this._fnStateChange);
            this._bP13nRegistered = true;
        },
        _applyPendingColumnsState: function () {
            if (!Array.isArray(this._oPendingColumnsState)) {
                return;
            }
            var aColumnsState = this._oPendingColumnsState;
            this._oPendingColumnsState = null;
            var aCurrentColumns = this.getColumns();
            aCurrentColumns.forEach(function (oColumn) {
                var sKey = oColumn.data("p13nKey");
                var bVisible = aColumnsState.some(function (oColumnState) {
                    return oColumnState.key === sKey;
                });
                oColumn.setVisible(bVisible);
            });
            aColumnsState.forEach(function (oColumnState, iTargetIndex) {
                var oColumn = this.getColumns().find(function (oCurrentColumn) {
                    return oCurrentColumn.data("p13nKey") === oColumnState.key;
                });
                if (oColumn) {
                    var iCurrentIndex = this.indexOfColumn(oColumn);
                    if (iCurrentIndex !== iTargetIndex) {
                        this.removeColumn(oColumn);
                        this.insertColumn(oColumn, iTargetIndex);
                    }
                }
            }, this);
        },
        _getStorageKey: function () {
            var sPersistencyKey = this.getPersistencyKey();
            if (!sPersistencyKey) {
                return "";
            }
            return "reportmef.p13n.columns." + sPersistencyKey;
        },
        _persistColumnsState: function (aColumnsState) {
            var sStorageKey = this._getStorageKey();
            if (!sStorageKey) {
                return;
            }
            window.localStorage.setItem(sStorageKey, JSON.stringify(aColumnsState));
        },
        _restoreColumnsState: function () {
            if (this._bColumnsStateRestored) {
                return;
            }
            var sStorageKey = this._getStorageKey();
            if (!sStorageKey) {
                this._bColumnsStateRestored = true;
                return;
            }
            var sRawState = window.localStorage.getItem(sStorageKey);
            if (!sRawState) {
                this._bColumnsStateRestored = true;
                return;
            }
            try {
                var aColumnsState = JSON.parse(sRawState);
                if (Array.isArray(aColumnsState)) {
                    this._oPendingColumnsState = aColumnsState;
                }
            } catch (e) {
                window.localStorage.removeItem(sStorageKey);
            }
            this._bColumnsStateRestored = true;
        }
    });
});