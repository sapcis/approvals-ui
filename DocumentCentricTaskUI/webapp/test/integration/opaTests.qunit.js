/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/sap/bpm/DocumentCentricTaskUI/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
