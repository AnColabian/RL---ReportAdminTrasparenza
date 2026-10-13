/* global QUnit, sinon */
sap.ui.define([
    "reportamministrazionetrasparenza/model/models",
    "reportamministrazionetrasparenza/controller/History.controller",
    "sap/m/MessageBox",
    "sap/m/Token"
], function (models, History, MessageBox, Token) {
    "use strict";

    function createODataModel(sDateType) {
        return {
            metadataLoaded: function () { return Promise.resolve(); },
            getMetaModel: function () {
                return {
                    getODataEntitySet: function () { return { entityType: "History" }; },
                    getODataEntityType: function () { return {}; },
                    getODataProperty: function () { return { type: sDateType || "Edm.String" }; }
                };
            },
            read: sinon.spy()
        };
    }

    QUnit.module("Storico OData helpers");

    QUnit.test("Dates AND dimensions, multiple values OR, ranges and exclusions", function (assert) {
        var oOData = createODataModel();
        var oSelection = {
            dateFrom: "20260101", dateTo: "20260131",
            utente: [{ operation: "EQ", value1: "USER_A" }, { operation: "EQ", value1: "USER_B" }],
            unitaEconomica: [{ operation: "BT", value1: "100", value2: "200" }],
            tipoOggetto: [{ operation: "EQ", value1: "EXCLUDED", exclude: true }],
            oggettoArchitettonico: [{ operation: "EQ", value1: "OBJ" }]
        };
        return models.fetchHistoryData(oOData, oSelection, function () {}, function () {}).then(function () {
            var aArgs = oOData.read.firstCall.args;
            assert.strictEqual(aArgs[0], "/amministrTrasp");
            var oRoot = aArgs[1].filters[0];
            assert.ok(oRoot.bAnd);
            assert.strictEqual(oRoot.aFilters.length, 6);
            assert.strictEqual(oRoot.aFilters[0].sPath, "dtStorico");
            assert.strictEqual(oRoot.aFilters[0].sOperator, "GE");
            assert.strictEqual(oRoot.aFilters[1].oValue1, "20260131");
            assert.notOk(oRoot.aFilters[2].aFilters[0].bAnd);
            assert.strictEqual(oRoot.aFilters[2].aFilters[0].aFilters.length, 2);
            assert.strictEqual(oRoot.aFilters[3].aFilters[0].aFilters[0].sOperator, "BT");
            assert.strictEqual(oRoot.aFilters[4].aFilters[0].sOperator, "NE");
            assert.strictEqual(oRoot.aFilters[5].aFilters[0].aFilters[0].sPath, "idOggArc");
        });
    });

    QUnit.test("DateTime upper bound includes the whole final day", function (assert) {
        var oOData = createODataModel("Edm.DateTime");
        return models.fetchHistoryData(oOData, { dateFrom: "20260101", dateTo: "20260131" },
            function () {}, function () {}).then(function () {
            var aFilters = oOData.read.firstCall.args[1].filters[0].aFilters;
            assert.strictEqual(aFilters[0].oValue1.toISOString(), "2026-01-01T00:00:00.000Z");
            assert.strictEqual(aFilters[1].sOperator, "LT");
            assert.strictEqual(aFilters[1].oValue1.toISOString(), "2026-02-01T00:00:00.000Z");
        });
    });

    QUnit.test("Users are real, distinct, nonempty and loaded across pages", function (assert) {
        var oOData = createODataModel();
        var fnSuccess = sinon.spy();
        var fnError = sinon.spy();
        models.fetchHistoryUserHelp(oOData, fnSuccess, fnError);
        assert.strictEqual(oOData.read.firstCall.args[1].urlParameters.$select, "utente");
        oOData.read.firstCall.args[1].success({
            results: [{ utente: "A" }, { utente: "" }, { utente: "A" }],
            __next: "https://backend/service/amministrTrasp?$skiptoken=next%2Bpage&$select=utente"
        });
        assert.notOk(fnSuccess.called);
        assert.strictEqual(oOData.read.secondCall.args[0], "/amministrTrasp");
        assert.strictEqual(oOData.read.secondCall.args[1].urlParameters.$skiptoken, "next+page");
        assert.strictEqual(oOData.read.secondCall.args[1].urlParameters.$select, "utente");
        oOData.read.secondCall.args[1].success({ results: [{ utente: "B" }] });
        assert.deepEqual(fnSuccess.firstCall.args[0].results, [{ utente: "A" }, { utente: "B" }]);
        assert.notOk(fnError.called);
    });

    QUnit.test("Economic unit help permits no society, preserves report society filter", function (assert) {
        var oOData = createODataModel();
        models.fetchIdUniEconomicaHelp(oOData, "", function () {}, function () {});
        assert.deepEqual(oOData.read.firstCall.args[1].filters, []);
        models.fetchIdUniEconomicaHelp(oOData, "1000", function () {}, function () {});
        assert.strictEqual(oOData.read.secondCall.args[1].filters[0].oValue1, "1000");
    });

    QUnit.test("Metadata failures are reported before reading history", function (assert) {
        var oOData = createODataModel();
        var oError = new Error("Metadata unavailable");
        oOData.metadataLoaded = function (bRejectOnFailure) {
            assert.ok(bRejectOnFailure);
            return Promise.reject(oError);
        };
        var fnError = sinon.spy();
        return models.fetchHistoryData(oOData, {}, function () {}, fnError).then(function () {
            assert.ok(fnError.calledWith(oError));
            assert.notOk(oOData.read.called);
        });
    });

    QUnit.test("Page errors do not return partial history results", function (assert) {
        var oOData = createODataModel();
        var fnSuccess = sinon.spy();
        var fnError = sinon.spy();
        models.fetchHistoryUserHelp(oOData, fnSuccess, fnError);
        oOData.read.firstCall.args[1].success({
            results: [{ utente: "A" }],
            __next: "/amministrTrasp?$skiptoken=next"
        });
        oOData.read.secondCall.args[1].error({ statusCode: 500 });
        assert.ok(fnError.calledOnce);
        assert.notOk(fnSuccess.called);
    });

    QUnit.module("Storico controller", {
        beforeEach: function () {
            this.controller = new History();
            this.viewModel = models.createHistoryViewModel();
            this.historyModel = models.createHistoryModel();
            this.controls = {
                dpFilterDataDa: {
                    getValue: function () { return "20260101"; },
                    isValidValue: function () { return true; },
                    getDateValue: function () { return new Date(2026, 0, 1); }
                },
                dpFilterDataA: {
                    getValue: function () { return "20260131"; },
                    isValidValue: function () { return true; },
                    getDateValue: function () { return new Date(2026, 0, 31); }
                },
                resultsTable: {
                    clearSelection: sinon.spy(),
                    getSelectedIndices: function () { return [0]; },
                    getContextByIndex: function () {
                        return { getObject: function () { return { societa: "SORTED_ROW" }; } };
                    }
                }
            };
            ["miFilterUtente", "miFilterUnitaEconomica", "miFilterTipoOggetto", "miFilterOggettoArchitettonico"].forEach(function (sId) {
                this.controls[sId] = { getTokens: function () { return []; }, getValue: function () { return ""; } };
            }, this);
            sinon.stub(this.controller, "byId", function (sId) { return this.controls[sId]; }.bind(this));
            sinon.stub(this.controller, "getView", function () {
                return { getModel: function (sName) {
                    return sName === "historyViewModel" ? this.viewModel : this.historyModel;
                }.bind(this) };
            }.bind(this));
            sinon.stub(this.controller, "getOwnerComponent", function () {
                return { getModel: function () { return {}; } };
            });
            sinon.stub(this.controller, "_i18n", function (sKey) { return sKey; });
            this.error = sinon.stub(MessageBox, "error");
        },
        afterEach: function () {
            MessageBox.error.restore();
            if (models.fetchHistoryData.restore) {
                models.fetchHistoryData.restore();
            }
            this.controller.destroy();
        }
    });

    QUnit.test("Execute clears selection, sets busy, maps real results and handles empty results", function (assert) {
        var fnFetch = sinon.stub(models, "fetchHistoryData");
        this.controller.onExecute();
        assert.ok(this.viewModel.getProperty("/busy"));
        assert.ok(this.controls.resultsTable.clearSelection.calledOnce);
        assert.notOk(this.viewModel.getProperty("/exportEnabled"));
        this.controller.onExecute();
        assert.ok(fnFetch.calledOnce, "Concurrent execute ignored");
        fnFetch.firstCall.args[2]({ results: [{ soc: "1000", descrUniEcom: "Real description" }] });
        assert.strictEqual(this.historyModel.getProperty("/results/0/descrBenePatrimoniale"), "Real description");
        assert.notOk(this.viewModel.getProperty("/busy"));
        this.controller.onExecute();
        fnFetch.secondCall.args[2]({ results: [] });
        assert.deepEqual(this.historyModel.getProperty("/results"), []);
    });

    QUnit.test("Load failures reset busy and show a message", function (assert) {
        var fnFetch = sinon.stub(models, "fetchHistoryData");
        this.controller.onExecute();
        fnFetch.firstCall.args[3]({ statusCode: 500 });
        assert.notOk(this.viewModel.getProperty("/busy"));
        assert.ok(this.error.calledOnce);
        assert.notOk(this.viewModel.getProperty("/exportEnabled"));
    });

    QUnit.test("Invalid and reversed dates do not call the backend", function (assert) {
        var fnFetch = sinon.stub(models, "fetchHistoryData");
        this.controls.dpFilterDataDa.isValidValue = function () { return false; };
        this.controller.onExecute();
        assert.notOk(fnFetch.called);
        this.controls.dpFilterDataDa.isValidValue = function () { return true; };
        this.controls.dpFilterDataDa.getDateValue = function () { return new Date(2026, 1, 1); };
        this.controller.onExecute();
        assert.notOk(fnFetch.called);
        assert.strictEqual(this.error.callCount, 2);
    });

    QUnit.test("Typed values and range tokens remain usable filters", function (assert) {
        var oToken = new Token({ key: "A" });
        var oRange = new Token();
        oRange.data("range", { operation: "BT", value1: "B", value2: "C", exclude: true });
        this.controls.miFilterUtente.getTokens = function () { return [oToken, oRange]; };
        this.controls.miFilterUtente.getValue = function () { return " D "; };
        assert.deepEqual(this.controller._getHistorySelections("miFilterUtente"), [
            { operation: "EQ", value1: "A", exclude: false },
            { operation: "BT", value1: "B", value2: "C", exclude: true },
            { operation: "EQ", value1: "D", exclude: false }
        ]);
        oToken.destroy();
        oRange.destroy();
    });

    QUnit.test("All value helps request real helpers and populate the dialog", function (assert) {
        var fnOpen = sinon.stub(this.controller, "_openValueHelpDialog");
        [
            { handler: "onValueHelpUtente", helper: "fetchHistoryUserHelp", entry: { utente: "A" }, key: "A" },
            { handler: "onValueHelpUnitaEconomica", helper: "fetchIdUniEconomicaHelp", entry: { numUniEconomicia: "U", numOgg: "Unit" }, key: "U" },
            { handler: "onValueHelpTipoOggetto", helper: "fetchTipoOggettoHelp", entry: { tipoOggArc: "T", defTipoOggArc: "Type" }, key: "T" },
            { handler: "onValueHelpOggettoArchitettonico", helper: "fetchIdOggettoArcHelp", entry: { idOggArc: "O", def: "Object" }, key: "O" }
        ].forEach(function (oCase) {
            var fnFetch = sinon.stub(models, oCase.helper);
            try {
                this.controller[oCase.handler]();
                assert.ok(this.viewModel.getProperty("/busy"));
                var aArgs = fnFetch.firstCall.args;
                aArgs[aArgs.length - 2]({ results: [oCase.entry] });
                assert.notOk(this.viewModel.getProperty("/busy"));
                assert.strictEqual(fnOpen.lastCall.args[2][0].key, oCase.key);
            } finally {
                fnFetch.restore();
            }
        }, this);
    });

    QUnit.test("Value help failure resets busy and does not open a dialog", function (assert) {
        var fnFetch = sinon.stub(models, "fetchTipoOggettoHelp");
        var fnOpen = sinon.stub(this.controller, "_openValueHelpDialog");
        try {
            this.controller.onValueHelpTipoOggetto();
            fnFetch.firstCall.args[2]({});
            assert.notOk(this.viewModel.getProperty("/busy"));
            assert.ok(this.error.calledOnce);
            assert.notOk(fnOpen.called);
        } finally {
            fnFetch.restore();
        }
    });

    QUnit.test("Selection enables export and exports the sorted table context", function (assert) {
        var oSettings;
        var fnDestroy = sinon.spy();
        var oBuild = Promise.resolve();
        this.controller.Spreadsheet = function (oConfig) {
            oSettings = oConfig;
            this.build = function () { return oBuild; };
            this.destroy = fnDestroy;
        };
        this.controller.onResultsSelectionChange();
        assert.ok(this.viewModel.getProperty("/exportEnabled"));
        this.controller.onExportSelection();
        assert.deepEqual(oSettings.dataSource, [{ societa: "SORTED_ROW" }]);
        assert.ok(/\.xlsx$/.test(oSettings.fileName));
        return oBuild.then(function () {}).then(function () {
            assert.ok(fnDestroy.calledOnce);
        });
    });

    QUnit.start();
});
