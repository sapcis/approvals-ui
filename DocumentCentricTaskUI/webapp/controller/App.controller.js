sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/BusyDialog",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/TextArea",
], function (BaseController, JSONModel, MessageBox, MessageToast, DateFormat, BusyDialog, Fragment, syncStyleClass, Filter, FilterOperator, VBox, Text, TextArea) {
    "use strict";
    var workflowInstanceId,
        token;

    return BaseController.extend("com.sap.bpm.DocumentCentricTaskUI.controller.App", {
        onInit: function () {

            this.getContentDensityClass();

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel, "attachmentsModel");
            this.loadAttachments();

            this.checkProcessor();

            this.configureView();
        },

        configureView: function () {

            var startupParameters = this.getComponentData().startupParameters;
            var approveText = this.getMessage("APPROVE");
            var rejectText = this.getMessage("REJECT");
            // var reworkText = this.getMessage("REWORK");
            // var forwardText = this.getMessage("FORWARD");
            var updateText = this.getMessage("UPDATE");

            var taskInstanceModel = this.getModel("taskInstanceModel");
            var sSubject = taskInstanceModel.getData().subject;
            this.byId("approvePageHeader").setObjectTitle(sSubject);

            var oThisController = this;

            // console.log(this.getModel().getProperty("/approvalStatus"))
            if (this.getModel().getProperty("/approvalStatus") != "forward") {

                /**
                 * APPROVE BUTTON
                 */
                // Implementation for the approve action
                var oApproveAction = {
                    sBtnTxt: approveText,
                    onBtnPressed: function () {
                        var model = oThisController.getModel();
                        model.refresh(true);
                        var processContext = model.getData();

                        // Call a local method to perform further action
                        oThisController._triggerComplete(
                            processContext,
                            startupParameters.taskModel.getData().InstanceID,
                            "approve"
                        );
                    }
                };

                // Add 'Approve' action to the task
                startupParameters.inboxAPI.addAction({
                    action: oApproveAction.sBtnTxt,
                    label: oApproveAction.sBtnTxt,
                    type: "Accept"
                },
                    // Set the onClick function
                    oApproveAction.onBtnPressed);

                /**
                * REJECT BUTTON
                */
                // Implementation for the reject action
                var oRejectAction = {
                    sBtnTxt: rejectText,
                    onBtnPressed: function () {
                        var model = oThisController.getModel();
                        model.refresh(true);
                        var processContext = model.getData();

                        // Call a local method to perform further action
                        oThisController._triggerComplete(
                            processContext,
                            startupParameters.taskModel.getData().InstanceID,
                            "reject"
                        );
                    }
                };

                // Add 'Reject' action to the task
                startupParameters.inboxAPI.addAction({
                    action: oRejectAction.sBtnTxt,
                    label: oRejectAction.sBtnTxt,
                    type: "Reject"
                },
                    // Set the onClick function
                    oRejectAction.onBtnPressed);

                /**
                * REWORK BUTTON
                */
                // Implementation for the rework action
                // var oReworkAction = {
                //     sBtnTxt: reworkText,
                //     onBtnPressed: function () {
                //         var model = oThisController.getModel();
                //         model.refresh(true);
                //         var processContext = model.getData();

                //         // Call a local method to perform further action
                //         oThisController._triggerComplete(
                //             processContext,
                //             startupParameters.taskModel.getData().InstanceID,
                //             "rework"
                //         );
                //     }
                // };

                // Add 'Rework' action to the task
                // startupParameters.inboxAPI.addAction({
                //     action: oReworkAction.sBtnTxt,
                //     label: oReworkAction.sBtnTxt
                // },
                //     // Set the onClick function
                //     oReworkAction.onBtnPressed);

                /**
                * FORWARD BUTTON
                */
                // Implementation for the forward action
                // var oForwardAction = {
                //     sBtnTxt: forwardText,
                //     onBtnPressed: function () {
                //         var model = oThisController.getModel();
                //         model.refresh(true);
                //         var processContext = model.getData();

                //         // Call a local method to perform further action
                //         oThisController.getUsers(
                //             processContext,
                //             startupParameters.taskModel.getData().InstanceID,
                //             "forward"
                //         );
                //     }
                // };

                // // Add 'Forward' action to the task
                // startupParameters.inboxAPI.addAction({
                //     action: oForwardAction.sBtnTxt,
                //     label: oForwardAction.sBtnTxt
                // },
                //     // Set the onClick function
                //     oForwardAction.onBtnPressed);
            } else {
                /**
                * UPDATE BUTTON
                */
                // Implementation for the update action
                var oUpdateAction = {
                    sBtnTxt: updateText,
                    onBtnPressed: function () {
                        var model = oThisController.getModel();
                        model.refresh(true);
                        var processContext = model.getData();

                        // Call a local method to perform further action
                        oThisController.setNewProcessor(
                            processContext,
                            startupParameters.taskModel.getData().InstanceID,
                            "updated", null, null
                        );
                    }
                };

                // Add 'Update' action to the task
                startupParameters.inboxAPI.addAction({
                    action: oUpdateAction.sBtnTxt,
                    label: oUpdateAction.sBtnTxt
                },
                    // Set the onClick function
                    oUpdateAction.onBtnPressed);
            }
        },

        // This method is called when the confirm button is click by the end user
        _triggerComplete: function (processContext, taskId, approvalStatus) {

            var oThisController = this;

            this.openBusyDialog();

            $.ajax({
                // Call workflow API to get the xsrf token
                url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/xsrf-token",
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
                            "comments": processContext.comments,
                            "approvalStatus": approvalStatus,
                            "step": {
                                "isHistoryProcessed": false
                            }
                        },
                        "status": "COMPLETED"
                    };

                    $.ajax({
                        // Call workflow API to complete the task
                        url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/task-instances/" + taskId,
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

        // get users for forward request
        getUsers: function (processContext, taskId, approvalStatus) {
            var oThisController = this;

            var oView = oThisController.getView();
            var oModel = this.getModel();
            var aUsers = oModel.setProperty("/Users", []);
            oView.setBusy(true);

            var sUrl = "/comsapbpmDocumentCentricTaskUI/scim/service/scim/Users/";
            var oSettings = {
                "url": sUrl,
                "method": "GET"
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    var loadBatches = results.totalResults / 100;

                    oThisController._mapUsers(processContext, taskId, approvalStatus, results.Resources, loadBatches, 0);
                    oView.setBusy(false);

                    for (var j = 1; j < loadBatches; j++) {
                        oThisController.getUsersAdd(processContext, taskId, approvalStatus, j);
                    }
                })
                .fail(function (err) {
                    oView.setBusy(false);
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

        getUsersAdd: function (processContext, taskId, approvalStatus, iteration) {
            var oThisController = this;

            var oView = oThisController.getView();
            oView.setBusy(true);

            var startIndex = (100 * iteration) + 1;

            var sUrl = "/comsapbpmDocumentCentricTaskUI/scim/service/scim/Users?startIndex=" + startIndex;
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                "async": false
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    var loadBatches = results.totalResults / 100;
                    oThisController._mapUsers(processContext, taskId, approvalStatus, results.Resources, loadBatches, iteration);
                    oView.setBusy(false);
                })
                .fail(function (err) {
                    oView.setBusy(false);
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

        _mapUsers: function (processContext, taskId, approvalStatus, oUsers, loadBatches, numberOfAdditionalLoads) {

            var oModel = this.getModel();
            var aUsers = oModel.getProperty("/Users");

            for (var i = 0; i < oUsers.length; i++) {

                var sEmailID = "";
                var emails = oUsers[i].emails;
                for (var j = 0; j < emails.length; j++) {
                    if (emails[j].primary) {
                        sEmailID = emails[j].value;
                    }
                }
                aUsers.push({
                    UserName: oUsers[i].userName,
                    EmailID: sEmailID,
                    FirstName: oUsers[i].name.givenName != null ? oUsers[i].name.givenName : "",
                    LastName: oUsers[i].name.familyName != null ? oUsers[i].name.familyName : "",
                    UniqueID: oUsers[i].userUuid
                });
            }

            oModel.setProperty("/Users", aUsers);
            oModel.refresh();

            if (numberOfAdditionalLoads + 1 > loadBatches) {
                this._createUserSelectDialog(processContext, taskId, approvalStatus);
            }

        },

        _createUserSelectDialog: function (processContext, taskId, approvalStatus) {

            var sRequestID = this.getModel().getProperty("/RequestId");

            var oThisController = this;

            if (!this._oUserSelectDialog) {
                Fragment.load({
                    name: "com.sap.bpm.DocumentCentricTaskUI.view.UserSelectDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oUserSelectDialog = oDialog;
                    this._oUserSelectDialog.setModel(this.getModel());
                    // this.getView().addDependent(this._oUserSelectDialog);
                    this._configUserSelectDialog();
                    this._oUserSelectDialog.open();
                    this._oUserSelectDialog.attachConfirm(function (oEvent) {
                        var aContexts = oEvent.getParameter("selectedContexts");
                        if (aContexts && aContexts.length) {
                            var oUserData = aContexts.map(function (oContext) { return oContext.getObject(); })

                            var forwardConfirmBoxContent = new VBox({
                                items: [
                                    new Text({
                                        text: 'Forward Request ' + sRequestID + ' to ' + oUserData[0].FirstName + ' ' + oUserData[0].LastName + '?'
                                    }),
                                    new TextArea({
                                        value: '{/forwardComment}',
                                        placeholder: "add comment (optional)"
                                    }).addStyleClass('textarea')
                                ]
                            });

                            this.getModel().setProperty("/forwardComment", "");
                            forwardConfirmBoxContent.setModel(oThisController.getModel());

                            MessageBox.confirm(forwardConfirmBoxContent, {
                                title: "Forward",
                                styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
                                onClose: function (oAction) {
                                    if (oAction === MessageBox.Action.OK) {
                                        var sForwardComment = forwardConfirmBoxContent.getModel().getProperty('/forwardComment');
                                        oThisController.setNewProcessor(processContext, taskId, approvalStatus, oUserData, sForwardComment);
                                    }
                                }
                            });
                        }
                    })
                }.bind(this));
            } else {
                this._configUserSelectDialog();
                this._oUserSelectDialog.open();
            }
        },

        _configUserSelectDialog: function () {

            // Set growing property
            this._oUserSelectDialog.setGrowing(true);

            // Set style classes
            var sResponsiveStyleClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
            this._oUserSelectDialog.toggleStyleClass(sResponsiveStyleClasses, true);

            // clear the old search filter
            this._oUserSelectDialog.getBinding("items").filter([]);

            // toggle compact style
            syncStyleClass("sapUiSizeCompact", this.getView(), this._oUserSelectDialog);
        },

        onUserSearch: function (oEvent) {
            var sSearchQuery = oEvent.getParameter("value");

            var aFilters = [];

            aFilters.push(new Filter({
                filters: [
                    new Filter({
                        path: "UserName",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    }),
                    new Filter({
                        path: "EmailID",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    }),
                    new Filter({
                        path: "FirstName",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    }),
                    new Filter({
                        path: "LastName",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    })
                ],
                and: false
            }));

            var oFilter = new Filter({
                filters: aFilters,
                and: true
            });

            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter(oFilter);
        },

        onUserDialogClose: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },

        // set new processor by patching task instance and 
        setNewProcessor: function (processContext, taskId, approvalStatus, oUserData, sComment) {

            var oThisController = this;

            this.openBusyDialog();

            $.ajax({
                // Call workflow API to get the xsrf token
                url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var token = data.getResponseHeader("X-CSRF-Token");

                    var oBasicData;
                    if (approvalStatus == "forward") {
                        oBasicData = {
                            "processor": oUserData[0].UserName
                        };
                    } else {
                        oBasicData = {
                            "processor": oThisController.getModel().getProperty("/step/approvalStepData/ApproverUserName")
                        };
                    }

                    $.ajax({
                        // Call workflow API to complete the task
                        url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/task-instances/" + taskId,
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
                            oThisController.updateWorkflowContext(approvalStatus, sComment, oUserData);
                        }
                    });
                }
            });
        },

        // update workflow context
        updateWorkflowContext: function (approvalStatus, sComment, oUserData) {

            var aApprovalHistory = this.getModel().getProperty("/approvalHistory"),
                sUserName,
                sDecisionText;
            if (approvalStatus == "forward") {
                sUserName = this.getModel("taskInstanceModel").getProperty("/processor") == null ? this.getModel().getProperty("/step/approvalStepData/ApproverUserName") : this.getModel("taskInstanceModel").getProperty("/processor");
                sDecisionText = "forwarded to " + oUserData[0].UserName;
            } else {
                sUserName = this.getModel("taskInstanceModel").getProperty("/processor") == null ? this.getModel().getProperty("/step/approvalStepData/ForwardedUserData/UserName") : this.getModel("taskInstanceModel").getProperty("/processor");
                sComment = this.getModel().getProperty("/comments");
                sDecisionText = approvalStatus;
            }
            aApprovalHistory.push({
                "UserName": sUserName,
                "WatcherUserName": this.getModel().getProperty("/step/approvalStepData/WatcherUserName"),
                "StepName": this.getModel().getProperty("/step/approvalStepData/StepName"),
                "Decision": sDecisionText,
                "Comments": sComment
            });

            var oThisController = this;

            $.ajax({
                url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    var workflowtoken = data.getResponseHeader("X-CSRF-Token");

                    var oBasicData;
                    if (approvalStatus == "forward") {
                        oBasicData = {
                            "approvalStatus": approvalStatus,
                            "approvalHistory": aApprovalHistory,
                            "step": {
                                "approvalStepData": {
                                    "ForwardedUserData": oUserData[0],
                                    "ForwardComment": sComment
                                },
                                "isHistoryProcessed": false
                            }
                        };
                    } else {
                        oBasicData = {
                            "approvalStatus": approvalStatus,
                            "approvalHistory": aApprovalHistory,
                            "step": {
                                "isHistoryProcessed": false
                            }
                        };
                    }

                    $.ajax({
                        // Call workflow API to update the context
                        url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/workflow-instances/" + workflowInstanceId + "/context",
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
                            oThisController.getModel().setProperty("comments", "")
                            // oThisController._refreshTask();
                            oThisController._updateTaskList();
                            oThisController.closeBusyDialog();
                        }
                    });

                },
                error: function (jqXHR, textStatus, errorThrown) {

                    //MessageBox.error("Error occurred while fetching work-flow access token.");
                    var sErrorText = oThisController.getMessage("WORKFLOW_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.oBusyDialog.close();
                    return;

                }
            });
        },

        _updateTaskList: function () {
            this.getComponentData().startupParameters.inboxInternal.updateTaskList();
        },

        // Request Inbox to refresh the control once the task is completed
        _refreshTask: function () {
            var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
            this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
            console.log("task is refreshed");
        },

        // check if task processor is different from original (check if processor was changed from Monitor Workflow Instances app)
        checkProcessor: function () {
            var sCurrentProcessor = this.getModel("taskInstanceModel").getProperty("/processor");

            if (sCurrentProcessor != null) {
                var sApprovalStatus = this.getModel().getProperty("/approvalStatus") != null ? this.getModel().getProperty("/approvalStatus") : "",
                    isHistoryProcessed = this.getModel().getProperty("/step/isHistoryProcessed"),
                    sOriginalProcessor;

                if (sApprovalStatus == "forward") {
                    sOriginalProcessor = this.getModel().getProperty("/step/approvalStepData/ForwardedUserData/UserName");
                } else {
                    sOriginalProcessor = this.getModel().getProperty("/step/approvalStepData/ApproverUserName");
                }

                if (sCurrentProcessor != sOriginalProcessor && !isHistoryProcessed) {
                    this.onDetectDifferentProcessor(sCurrentProcessor);
                }
            }

        },

        // update workflow context when different from original processor detected
        onDetectDifferentProcessor: function (sCurrentProcessor) {

            var aApprovalHistory = this.getModel().getProperty("/approvalHistory");

            aApprovalHistory.push({
                "UserName": "",
                "WatcherUserName": this.getModel().getProperty("/step/approvalStepData/WatcherUserName"),
                "StepName": this.getModel().getProperty("/step/approvalStepData/StepName"),
                "Decision": "forwarded to " + sCurrentProcessor,
                "Comments": ""
            });

            var oThisController = this;

            $.ajax({
                url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    var workflowtoken = data.getResponseHeader("X-CSRF-Token");

                    var oBasicData = {
                        "approvalHistory": aApprovalHistory,
                        "step": {
                            "isHistoryProcessed": true
                        }
                    };

                    $.ajax({
                        // Call workflow API to update the context
                        url: "/comsapbpmDocumentCentricTaskUI/workflowruntime/v1/workflow-instances/" + workflowInstanceId + "/context",
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
                            oThisController.getModel().setProperty("comments", "")
                            // oThisController._refreshTask();
                            oThisController.getModel().refresh();
                            oThisController.closeBusyDialog();
                        }
                    });

                },
                error: function (jqXHR, textStatus, errorThrown) {

                    //MessageBox.error("Error occurred while fetching work-flow access token.");
                    var sErrorText = oThisController.getMessage("WORKFLOW_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.oBusyDialog.close();
                    return;

                }
            });
        },

        /**
         * DOCUMENT SERVICE INTEGRATION
         */

        loadAttachments: function () {
            // get workflow ID
            var taskInstanceModel = this.getModel("taskInstanceModel");
            workflowInstanceId = taskInstanceModel.getData().workflowInstanceId;

            var sUrl = "/comsapbpmDocumentCentricTaskUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/"
                + workflowInstanceId + "/?succinct=true";

            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
            };
            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
                    oThisController._mapAttachmentsModel(results);
                })
                .fail(function (err) {
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show("Unknown error!");
                    }
                });
        },

        // assign data to attachments model
        _mapAttachmentsModel: function (data) {
            this.oAttachmentsModel.setData(data);
            this.oAttachmentsModel.refresh();
            this.getView().setBusy(false);
        },

        // formatting functions
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
            return "/comsapbpmDocumentCentricTaskUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/"
                + workflowInstanceId + "?objectId=" + objectId + "&cmisselector=content";
        },

    });
});