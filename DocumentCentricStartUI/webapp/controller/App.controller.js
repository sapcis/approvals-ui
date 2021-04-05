/* eslint-disable no-undef */
sap.ui.define([
    "./BaseController"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController) {
        "use strict";

        return BaseController.extend("ibpm.demo.DocumentCentricStartUI.controller.App", {
            onInit: function () {
                this.fnInitializeApp();
                this.getContentDensityClass();
            }
        });
    });
