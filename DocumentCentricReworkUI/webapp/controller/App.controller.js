// @ts-nocheck
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable @sap/ui5-jsdocs/no-jsdoc */
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/BusyDialog",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/m/Token",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/SearchField",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/commons/FileUploaderParameter",
    "sap/m/UploadCollectionParameter",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
], function (BaseController, JSONModel, MessageBox, MessageToast, DateFormat, BusyDialog, MessagePopover, MessageItem, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FileUploaderParameter, UploadCollectionParameter, FilterBar, FilterGroupItem, Input) {
    "use strict";
    var token;

    return BaseController.extend("com.sap.bpm.DocumentCentricReworkUI.controller.App", {

        onInit: function () {
            var oMdlCommon = this.getParentModel("mCommon");
            this.setModel(oMdlCommon, "mCommon");

            this.configureView();

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel, "attachmentsModel");
            this.loadAttachments();

            this.getContentDensityClass();
        },

        configureView: function () {

            var startupParameters = this.getComponentData().startupParameters;
            var approveButtonText = this.getMessage("SEND_FOR_APPROVAL");
            var terminateButtonText = this.getMessage("TERMINATE");

            var model = this.getModel();
            var sTitle = model.getProperty("/Title");
            var oMdlCommon = this.getParentModel("mCommon");
            oMdlCommon.setProperty("/sReworkTitle", this.getMessage("REWORK_TITLE") + " " + sTitle);

            var oThisController = this;

            /**
             * APPROVE BUTTON
             */
            // Implementation for the approve action
            var oApproveAction = {
                sBtnTxt: approveButtonText,
                onBtnPressed: function () {
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController.onPressRequestApproval(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "reworked"
                    );
                }
            };

            // Add 'Approve' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oApproveAction.sBtnTxt,
                label: oApproveAction.sBtnTxt,
                type: "Accept"
            },
                // Set the onClick function
                oApproveAction.onBtnPressed);

            /**
             * TERMINATE BUTTON
             */
            // Implementation for the terminate action
            var oTerminateAction = {
                sBtnTxt: terminateButtonText,
                onBtnPressed: function () {
                    var model = oThisController.getModel();
                    model.refresh(true);
                    var processContext = model.getData();

                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "terminated"
                    );
                }
            };

            // Add 'Terminate' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oTerminateAction.sBtnTxt,
                label: oTerminateAction.sBtnTxt,
                type: "Reject"
            },
                // Set the onClick function
                oTerminateAction.onBtnPressed);

        },

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        onPressRequestApproval: function (processContext, taskId, approvalStatus) {

            var errorExist = false,
                oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oModel = oThisController.getModel();

            oThisController.getView().setBusy(true);

            // Checking Requester Fields
            var requesterFields = [
                "FirstName",
                "LastName"
            ];
            var requesterValue;
            for (var i = 0; i < requesterFields.length; i++) {
                requesterValue = oModel.getProperty("/" + "Requester" + "/" + requesterFields[i]);
                if (requesterValue && requesterValue.trim() && requesterValue !== "" && requesterValue !== "undefined" && requesterValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + "oRequesterDetails" + "/" + requesterFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (requesterFields[i] === "FirstName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_FIRST_NAME"));
                    }
                    if (requesterFields[i] === "LastName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_LAST_NAME"));
                    }
                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "Error");
                }
            }

            //Checking Title
            var titleValue = oModel.getProperty("/Title");
            if (titleValue && titleValue.trim() && titleValue !== "" && titleValue !== "undefined" && titleValue !== "null") {
                oMdlCommon.setProperty("/sTitleState", "None");
            } else {
                oMdlCommon.setProperty("/sTitleStateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TITLE"));
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                oThisController._triggerComplete(processContext, taskId, approvalStatus);
            }

        },

        // This method is called when the confirm button is click by the end user
        _triggerComplete: function (processContext, taskId, approvalStatus) {

            var oThisController = this;

            this.openBusyDialog();

            var aObjects = oThisController.getModel("attachmentsModel").getData().objects;
            var aAttachments = [];
            var workflowBaseurl = this._getWorkflowRuntimeBaseURL();
            if (aObjects && aObjects.length) {
                for (var i = 0; i < aObjects.length; i++) {
                    aAttachments.push({
                        objectId: aObjects[i].object.succinctProperties["cmis:objectId"],
                        name: aObjects[i].object.succinctProperties["cmis:name"],
                    });
                }
            }
            $.ajax({
                // Call workflow API to get the xsrf token
                url: workflowBaseurl+"/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var token = data.getResponseHeader("X-CSRF-Token");

                    // form the context that will be updated
                    var oBasicData = {
                        context: {
                            "Title": processContext.Title,
                            "Requester": processContext.Requester,
                            "Attachments": aAttachments,
                            "comments": processContext.comments,
                            "approvalStatus": approvalStatus,
                            "step": processContext.step
                        },
                        "status": "COMPLETED"
                    };

                    $.ajax({
                        // Call workflow API to complete the task
                        url: workflowBaseurl+"/task-instances/" + taskId,
                        method: "PATCH",
                        contentType: "application/json",
                        // pass the updated context to the API
                        data: JSON.stringify(oBasicData),
                        headers: {
                            // pass the xsrf token retrieved earlier
                            "X-CSRF-Token": token
                        },
                        // refreshTask needs to be called on successful completion
                        success: function (result, xhr, data) {
                            oThisController._refreshTask();
                            oThisController.closeBusyDialog();
                        }

                    });
                }
            });

        },

        // Request Inbox to refresh the control once the task is completed
        _refreshTask: function () {
            var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
            this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
            console.log("task is refreshed");
        },

        /*
        * DOCUMENT SERVICE INTERACTIONS
        */
        loadAttachments: function () {
            // get workflow instance ID
            var workflowInstanceId = this.getModel("taskInstanceModel").getData().workflowInstanceId;
            var docServieBaseUrl = this._getDocServiceRuntimeBaseURL();
            var sAttachmentsUploadURL = docServieBaseUrl+"/WorkflowManagement/DocumentCentricApprovalProcess/"
                + workflowInstanceId + "/";

            var oUploadCollection = this.byId("UploadCollection");
            oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
            console.log("Upload URL: " + sAttachmentsUploadURL);

            var sUrl = sAttachmentsUploadURL + "?succinct=true";
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
                "headers": {
                    "ContentType": 'application/json',
                    "Accept": 'application/json',
                    "cache": false,
                    'X-CSRF-Token': 'Fetch'
                }
            };

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    token = request.getResponseHeader('X-Csrf-Token');
                    oThisController._mapAttachmentsModel(results);
                    oUploadCollection.setBusy(false);
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });
        },

        // assign data to attachments model
        _mapAttachmentsModel: function (data) {
            this.oAttachmentsModel.setData(data);
            this.oAttachmentsModel.refresh();
        },

        // set parameters that are rendered as a hidden input field and used in ajax requests
        onAttachmentsChange: function (oEvent) {
            var oUploadCollection = oEvent.getSource();

            var cmisActionHiddenFormParam = new UploadCollectionParameter({
                name: "cmisAction",
                value: "createDocument" // create file
            });
            oUploadCollection.addParameter(cmisActionHiddenFormParam);

            var objectTypeIdHiddenFormParam1 = new UploadCollectionParameter({
                name: "propertyId[0]",
                value: "cmis:objectTypeId"
            });
            oUploadCollection.addParameter(objectTypeIdHiddenFormParam1);

            var propertyValueHiddenFormParam1 = new UploadCollectionParameter({
                name: "propertyValue[0]",
                value: "cmis:document"
            });
            oUploadCollection.addParameter(propertyValueHiddenFormParam1);

            var objectTypeIdHiddenFormParam2 = new UploadCollectionParameter({
                name: "propertyId[1]",
                value: "cmis:name"
            });
            oUploadCollection.addParameter(objectTypeIdHiddenFormParam2);

            var propertyValueHiddenFormParam2 = new UploadCollectionParameter({
                name: "propertyValue[1]",
                value: oEvent.getParameter("files")[0].name
            });
            oUploadCollection.addParameter(propertyValueHiddenFormParam2);

        },

        // show message when user attempts to attach file with size more than 10 MB
        onFileSizeExceed: function (oEvent) {
            var maxSize = oEvent.getSource().getMaximumFileSize();
            var sFileSizeErrorText = this.getMessage("FILE_SIZE_EXCEEDED_ERROR");
            MessageToast.show(sFileSizeErrorText + " " + maxSize + " MB");
        },

        // set parameters and headers before upload
        onBeforeUploadStarts: function (oEvent) {
            var oUploadCollection = this.getView().byId("UploadCollection"),
                oFileUploader = oUploadCollection._getFileUploader();

            // use multipart content (multipart/form-data) for posting files
            oFileUploader.setUseMultipart(true);

            console.log("Before Upload starts");

            // ad csrf token to header of request
            var oTokenHeader = new UploadCollectionParameter({
                name: "X-CSRF-Token",
                value: token
            });
            oEvent.getParameters().addHeaderParameter(oTokenHeader);

        },

        // refresh attachments collection after file was uploaded
        onUploadComplete: function (oEvent) {

            // workaround to remove busy indicator
            var oUploadCollection = this.byId("UploadCollection"),
                cItems = oUploadCollection.aItems.length,
                i;

            for (i = 0; i < cItems; i++) {
                if (oUploadCollection.aItems[i]._status === "uploading") {
                    oUploadCollection.aItems[i]._percentUploaded = 100;
                    oUploadCollection.aItems[i]._status = oUploadCollection._displayStatus;
                    oUploadCollection._oItemToUpdate = null;
                    break;
                }
            }

            if (oEvent.getParameter("files")[0].status != 201) {
                var response = JSON.parse(oEvent.getParameter("files")[0].responseRaw);
                MessageToast.show(response.message);
            }

            oUploadCollection.getBinding("items").refresh();
            this.loadAttachments();
        },

        // attributes formatting functions
        formatTimestampToDate: function (timestamp) {
            var oFormat = DateFormat.getDateTimeInstance();
            return oFormat.format(new Date(timestamp));
        },

        formatFileLength: function (fileSizeInBytes) {
            var i = -1;
            var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
            do {
                fileSizeInBytes = fileSizeInBytes / 1024;
                i++;
            } while (fileSizeInBytes > 1024);

            return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
        },

        formatDownloadUrl: function (objectId) {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();

            return sAttachmentsUploadURL + "?objectId=" + objectId + "&cmisselector=content";
        },

        // delete document from temp folder based on users' input
        onDeletePressed: function (oEvent) {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();

            var item = oEvent.getSource().getBindingContext("attachmentsModel").getModel("attachmentsModel")
                .getProperty(oEvent.getSource().getBindingContext("attachmentsModel").getPath());
            var objectId = item.object.succinctProperties["cmis:objectId"];
            var fileName = item.object.succinctProperties["cmis:name"];

            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "delete");
            oFormData.append("objectId", objectId);

            var oSettings = {
                "url": sAttachmentsUploadURL,
                "method": "POST",
                "async": false,
                "data": oFormData,
                "cache": false,
                "contentType": false,
                "processData": false,
                "headers": {
                    'X-CSRF-Token': token
                }
            };

            $.ajax(oSettings)
                .done(function (results) {
                    MessageToast.show("File '" + fileName + "' is deleted");
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });

            this.loadAttachments();

        },

        /**
         * Convenience method for removing all required Input validation Error.
         * @public
         * @returns Remove errors from value help dialog.
         */
        onChange: function (oEvent) {
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            var oInput = oEvent.getSource();
            if (oInput.getProperty("value").length > 0 && oInput.getProperty("valueState") === "Error") {

                oInput.setProperty("valueState", "None");
                oInput.setProperty("valueStateText", "");
            }

        },
             _getWorkflowRuntimeBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);

            return appModulePath + "/workflowruntime/v1";
        },
        _getSCIMBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);

            return appModulePath + "/scim";
         },

         _getDocServiceRuntimeBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);

            return appModulePath + "/docservice";
        }


    });
});
