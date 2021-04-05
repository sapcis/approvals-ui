/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ibpm/demo/DocumentCentricStartUI/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
