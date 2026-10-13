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
        renderer: "sap.ui.table.TableRenderer",
        onBeforeRendering: function () {
            if (Table.prototype.onBeforeRendering) {
                Table.prototype.onBeforeRendering.apply(this, arguments);
            }
            this._initP13n();
            this._applyPendingState();
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
                    var bVisible = oState.Columns.some(function (oColumnState) {
                        return oColumnState.key === oColumn.data("p13nKey");
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
            } else {
                this._oPendingSorter = aSorters;
            }
        },
        _onStateChange: function (oEvent) {
            if (oEvent.getParameter("control") !== this) {
                return;
            }
            this._oPendingState = oEvent.getParameter("state");
            this._applyPendingState();
        },
        openP13n: function (oEvent) {
            this._initP13n();
            if (!this._bP13nRegistered) {
                return Promise.resolve();
            }
            if (!this._bStateChangeAttached) {
                this._oEngine.attachStateChange(this._onStateChange, this);
                this._bStateChangeAttached = true;
            }
            return this._oEngine.show(this, ["Columns", "Sorter"], {
                title: this._sP13nTitle || "Layout tabella",
                source: oEvent ? oEvent.getSource() : this
            });
        },
        setP13nTitle: function (sTitle) {
            this._sP13nTitle = sTitle;
        },
        exit: function () {
            if (this._oEngine && this._bStateChangeAttached) {
                this._oEngine.detachStateChange(this._onStateChange, this);
            }
            if (this._oMetadataHelper) {
                this._oMetadataHelper.destroy();
            }
            this._oMetadataHelper = null;
            this._oEngine = null;
            this._bP13nRegistered = false;
            this._bStateChangeAttached = false;
            this._oPendingState = null;
            this._oPendingSorter = null;
            if (Table.prototype.exit) {
                Table.prototype.exit.apply(this, arguments);
            }
        }
    });
});