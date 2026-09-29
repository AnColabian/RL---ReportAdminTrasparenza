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
        constructor: function (sId, mSettings) {
            Table.apply(this, arguments);
            this._oEngine = Engine.getInstance();
            this._initP13n();
        },
        _initP13n: function () {
            var aColumnsMetadata = this.getColumns().map(function (oColumn) {
                return {
                    key: oColumn.data("p13nKey"),
                    label: oColumn.getLabel().getText(),
                    path: oColumn.getTemplate().getBindingPath("text")
                };
            });
            this._oMetadataHelper = new MetadataHelper(aColumnsMetadata);
            this._oEngine.register(this, {
                helper: this._oMetadataHelper,
                controller: {
                    Columns: new SelectionController({
                        control: this,
                        targetAggregation: "columns"
                    }),
                    Sorter: new SortController({
                        control: this
                    })
                }
            });
            this._oEngine.attachStateChange(function (oEvent) {
                var oParams = oEvent.getParameters();
                if (oParams.control === this) {
                    this.onStateChange(oParams.state);
                }
            }.bind(this));
        },
        onStateChange: function (oState) {
            this.getColumns().forEach(function (oColumn) {
                oColumn.setVisible(oState.Columns.some(function (oSelectionState) {
                    return oColumn.data("p13nKey") === oSelectionState.key;
                }));
            });
            oState.Columns.forEach(this._moveColumn, this);
            var aSorters = [];
            oState.Sorter.forEach(function (oSortState) {
                aSorters.push(new Sorter(this._oMetadataHelper.getPath(oSortState.key), oSortState.descending));
            }.bind(this));
            var oBinding = this.getBinding("rows");
            if (oBinding) {
                oBinding.sort(aSorters);
            }
        },
        _moveColumn: function (oSelectionState, iIndex) {
            var oColumn = this.getColumns().find(function (oCol) {
                return oCol.data("p13nKey") === oSelectionState.key;
            });
            if (!oColumn) {
                return;
            }
            var iOldIndex = this.getColumns().indexOf(oColumn);
            if (iIndex !== iOldIndex) {
                this.removeColumn(oColumn);
                this.insertColumn(oColumn, iIndex);
            }
        },
        openP13n: function (oEvent) {
            this._oEngine.show(this, ["Columns", "Sorter"], {
                title: this._sP13nTitle,
                source: oEvent.getSource()
            });
        },
        setP13nTitle: function (sTitle) {
            this._sP13nTitle = sTitle;
        }
    });
});