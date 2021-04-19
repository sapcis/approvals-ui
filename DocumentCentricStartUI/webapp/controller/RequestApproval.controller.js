sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
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
    "sap/ui/core/format/DateFormat",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
], function (BaseController, MessageToast, JSONModel, MessageBox, MessagePopover, MessageItem, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FileUploaderParameter, UploadCollectionParameter, DateFormat, FilterBar, FilterGroupItem, Input) {
    "use strict";

    var tempFolderObjId,
        token;

    return BaseController.extend("com.sap.bpm.DocumentCentricStartUI.controller.ExpenditureRequest", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.sap.bpm.DocumentCentricStartUI.view.ExpenditureRequest
         */
        onInit: function () {
            var oThisController = this;
            var oMdlCommon = oThisController.getParentModel("mCommon");
            oThisController.getView().setModel(oMdlCommon);

            // document service interaction
            this.oAttachmentsModel = new JSONModel();
            this.setModel(this.oAttachmentsModel);

            // this.byId("approvalStepDP").setMinDate(new Date(new Date().getTime() + (3600 * 1000 * 24)));

            // this.getUserData(sap.ushell.Container.getService("UserInfo").getUser().getEmail());

        },
        /**
        * Called when the rendering of the ComponentContainer is completed
        */
        onAfterRendering: function () {
            // check if 'WorkflowManagement' folder exists
            this.checkIfFolderExists("WorkflowManagement");
            // this.onAddApprovalStep();
        },

        /*
        * Called upon desctuction of the View
        */
        onExit: function () {
            var tempFolderName = this.getParentModel("mCommon").getProperty("/sRequestId");
            // delete temporary folder if it exists
            this.checkIfFolderExists(tempFolderName);
        },

        // get user data based on the email value
        getUserData: function (sEmail) {
            var oThisController = this;

            var oView = oThisController.getView();
            oView.setBusy(true);

            var sUrl = '/comsapbpmDocumentCentricStartUI/scim/service/scim/Users?filter=emails eq "' + sEmail + '"';
            var oSettings = {
                "url": sUrl,
                "method": "GET"
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    if (results.totalResults == 1) {
                        oThisController._presetRequesterFields(results.Resources[0]);
                    } else if (results.totalResults < 1) {
                        console.log("Couldn't find user with email " + sEmail + " in SCIM service");
                    } else {
                        console.log("More than 1 user has email " + sEmail + " in SCIM service");
                    }
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
        // attempt to preset Requester fields
        _presetRequesterFields: function (data) {
            var oMdlCommon = this.getParentModel("mCommon");

            var sEmailID = "";
            var emails = data.emails;
            for (var j = 0; j < emails.length; j++) {
                if (emails[j].primary) {
                    sEmailID = emails[j].value;
                }
            }

            oMdlCommon.setProperty("/oRequesterDetails/sRequesterFirstName", data.name.givenName);
            oMdlCommon.setProperty("/oRequesterDetails/sRequesterLastName", data.name.familyName);
            oMdlCommon.setProperty("/oRequesterDetails/sRequesterEmail", sEmailID);
            oMdlCommon.setProperty("/oRequesterDetails/sRequesterUserId", data.userName);
            oMdlCommon.refresh();
        },

        // add row on "Add Approval Step" button press
        // onAddApprovalStep: function () {
            // var oApprovalSteps = this.getParentModel("mCommon").getProperty("/oApprovalSteps");

            // oApprovalSteps.push({
            //     StepId: "step" + new Date().getTime(),
            //     StepPosition: oApprovalSteps.length,
            //     StepNumber: oApprovalSteps.length + 1,
            //     StepName: "",
            //     Approver: "",
            //     Watcher: "",
            //     DueDate: "",
            //     CommentForApprover: ""
            // });

            // this.getParentModel("mCommon").setProperty("/oApprovalSteps", oApprovalSteps);
        //     this.getParentModel("mCommon").refresh();

        //     this.getView().byId("processflow1").updateModel();
        // },

        // remove row on "Delete Approval Step" button press
        // handleDeleteApprovalStep: function (oEvent) {
        //     var oApprovalSteps = this.getParentModel("mCommon").getProperty("/oApprovalSteps");
        //     var oApprovalStep = oEvent.getSource().getBindingContext("mCommon").getObject();
        //     var deletedIndex;
        //     for (var i = 0; i < oApprovalSteps.length; i++) {
        //         if (oApprovalSteps[i] == oApprovalStep) {
        //             deletedIndex = i;
        //             oApprovalSteps.splice(i, 1);
        //             this.getParentModel("mCommon").refresh();
        //             break;
        //         }
        //     }

        //     for (var j = 0; j < oApprovalSteps.length; j++) {
        //         if (oApprovalSteps[j].StepPosition > deletedIndex) {
        //             this.getParentModel("mCommon").setProperty("/oApprovalSteps/" + j + "/StepPosition", oApprovalSteps[j].StepPosition - 1);
        //             this.getParentModel("mCommon").setProperty("/oApprovalSteps/" + j + "/StepNumber", oApprovalSteps[j].StepNumber - 1);
        //             this.getParentModel("mCommon").refresh();
        //         }
        //     }

        //     this.getView().byId("processflow1").updateModel();
        // },

        /*
        * DOCUMENT SERVICE INTERACTIONS
        */
        // check if folder with a given name exists
        checkIfFolderExists: function (folderName) {

            var oUploadCollection = this.byId("UploadCollection");
            oUploadCollection.setBusy(true);
            var responseStatusCode;

            if (folderName == "WorkflowManagement") {
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/";
            } else if (folderName == "DocumentCentricApprovalProcess") {
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/";
            } else {
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/" + folderName + "/";
            }
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                "async": false,
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
                    responseStatusCode = request.status;
                })
                .fail(function (err) {
                    token = err.getResponseHeader('X-Csrf-Token');
                    responseStatusCode = err.status;
                    if (responseStatusCode != 404) {
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    }
                });

            if (folderName == "WorkflowManagement") {
                if (responseStatusCode == 404) {
                    this.createFolder(folderName);
                } else if (responseStatusCode == 200) {
                    console.log("folder 'root/WorkflowManagement' already exisits");
                    this.checkIfFolderExists("DocumentCentricApprovalProcess");
                } else {
                    console.log("something is wrong");
                }
            } else if (folderName == "DocumentCentricApprovalProcess") {
                if (responseStatusCode == 404) {
                    this.createFolder(folderName);
                } else if (responseStatusCode == 200) {
                    console.log("folder with a name 'DocumentCentricApprovalProcess' already exisits");
                    var tempFolderName = this.getParentModel("mCommon").getProperty("/sRequestId");
                    this.createFolder(tempFolderName);
                } else {
                    console.log("something is wrong");
                }
            } else {
                if (responseStatusCode == 200) {
                    this.deleteTempFolder();
                } else if (responseStatusCode == 404) {
                    console.log("temporary folder is already deleted");
                } else {
                    console.log("something is wrong");
                }
            }
        },

        // create folder with a given name
        createFolder: function (folderName) {

            var oThisController = this;

            if (folderName == "WorkflowManagement") {
                console.log("creating a folder 'root/WorkflowManagement'");
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/";
            } else if (folderName == "DocumentCentricApprovalProcess") {
                console.log("creating a folder 'root/WorkflowManagement/DocumentCentricApprovalProcess'");
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/";
            } else {
                var oUploadCollection = oThisController.byId("UploadCollection");
                var sAttachmentsUploadURL = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/" + folderName + "/";
                oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
                console.log("creating temporary folder with a name '" + folderName + "'");
                var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/";
            }

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "createFolder");
            oFormData.append("succinct", "true");
            oFormData.append("propertyId[0]", "cmis:name");
            oFormData.append("propertyValue[0]", folderName);
            oFormData.append("propertyId[1]", "cmis:objectTypeId");
            oFormData.append("propertyValue[1]", "cmis:folder");

            var oSettings = {
                "url": sUrl,
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
                    if (folderName == "WorkflowManagement") {
                        oThisController.checkIfFolderExists("DocumentCentricApprovalProcess");
                    } else if (folderName == "DocumentCentricApprovalProcess") {
                        var tempFolderName = oThisController.getParentModel("mCommon").getProperty("/sRequestId");
                        oThisController.createFolder(tempFolderName);
                    } else {
                        tempFolderObjId = results.succinctProperties["cmis:objectId"];
                        oThisController.loadAttachments();
                    }
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

        loadAttachments: function () {
            var oUploadCollection = this.byId("UploadCollection");
            var sAttachmentsUploadURL = oUploadCollection.getUploadUrl();
            console.log("Upload URL: " + sAttachmentsUploadURL);
            var sUrl = sAttachmentsUploadURL + "?succinct=true";
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                // "async": false
            };

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
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
            var sAttachmentsUploadURL = this.byId("UploadCollection").getUploadUrl();
            var item = oEvent.getSource().getBindingContext().getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
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

        // delete temp folder (cleanup)
        deleteTempFolder: function () {
            console.log("deleting temporary folder with a objId '" + tempFolderObjId + "'");

            var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/";
            var oThisController = this;

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "deleteTree");
            oFormData.append("objectId", tempFolderObjId);

            var oSettings = {
                "url": sUrl,
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

        // create permanent folder
        createTargetFolder: function (targetFolderName) {
            console.log("creating a permanent folder 'WorkflowManagement/DocumentCentricApprovalProcess/" + targetFolderName + "/'");

            var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/";

            var oFormData = new window.FormData();
            oFormData.append("cmisAction", "createFolder");
            oFormData.append("succinct", "true");
            oFormData.append("propertyId[0]", "cmis:name");
            oFormData.append("propertyValue[0]", targetFolderName);
            oFormData.append("propertyId[1]", "cmis:objectTypeId");
            oFormData.append("propertyValue[1]", "cmis:folder");

            var oSettings = {
                "url": sUrl,
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

            var oThisController = this;

            $.ajax(oSettings)
                .done(function (results) {
                    var targetFolderId = results.succinctProperties["cmis:objectId"];
                    var oUploadCollection = oThisController.byId("UploadCollection");
                    var sAttachmentsUploadURL = "/comsapbpmDocumentCentricStartUI/docservice/WorkflowManagement/DocumentCentricApprovalProcess/" + targetFolderName + "/";
                    oUploadCollection.setUploadUrl(sAttachmentsUploadURL);
                    oThisController.oAttachmentsModel.refresh(true);
                    oThisController.moveFiles(targetFolderId);
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

        // move files from temporary folder to permanent
        moveFiles: function (targetFolderId) {
            var oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oAttachmentsModel = oThisController.getModel();
            var sUrl = "/comsapbpmDocumentCentricStartUI/docservice/";

            var aObjects = oAttachmentsModel.getData().objects;
            var countMoves = 0;

            for (var i = 0; i < aObjects.length; i++) {
                var oFormData = new window.FormData();
                oFormData.append("cmisAction", "move");
                oFormData.append("objectId", aObjects[i].object.succinctProperties["cmis:objectId"]);
                oFormData.append("sourceFolderId", tempFolderObjId);
                oFormData.append("targetFolderId", targetFolderId);

                var oSettings = {
                    "url": sUrl,
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

                var oThisController = this;

                $.ajax(oSettings)
                    .done(function (results) {
                        console.log("file with id '" + aObjects[i].object.succinctProperties["cmis:objectId"] +
                            "' is moved to permanent folder")
                    })
                    .fail(function (err) {
                        if (err !== undefined) {
                            var oErrorResponse = $.parseJSON(err.responseText);
                            MessageToast.show(oErrorResponse.message, {
                                duration: 6000
                            });
                        } else {
                            ;
                            MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                        }
                    });

                countMoves++;
            }

            if (countMoves == aObjects.length) {
                oThisController.deleteTempFolder();
            }
        },

        /**
        * VALUE HELP / SCIM INTEGRATION
        */

        onValueHelpRequested: function (oEvent) {
            this.selectedValueHelp = oEvent.getSource();
            var sInputField = oEvent.getSource().data().inputCustomData;

            if (sInputField === "ApproverValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var oColumns = oMdlCommon.getProperty("/oApproverValueHelpType/cols");
                this.getUsers(oColumns, sInputField);
            } else if (sInputField === "WatcherValueHelpType") {
                var oMdlCommon = this.getParentModel("mCommon");
                var oColumns = oMdlCommon.getProperty("/oWatcherValueHelpType/cols");
                this.getUsers(oColumns, sInputField);
            }
        },

        getUsers: function (oColumns, sInputField) {
            var oThisController = this;

            var oView = oThisController.getView();
            oView.setBusy(true);

            var sUrl = "/comsapbpmDocumentCentricStartUI/scim/service/scim/Users/";
            var oSettings = {
                "url": sUrl,
                "method": "GET"
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    var loadBatches = results.totalResults / 100;

                    oThisController._mapUsers(oColumns, sInputField, results.Resources, loadBatches, 0);
                    oView.setBusy(false);

                    for (var j = 1; j < loadBatches; j++) {
                        oThisController.getUsersAdd(j, oColumns, sInputField);
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

        getUsersAdd: function (iteration, oColumns, sInputField) {
            var oThisController = this;

            var oView = oThisController.getView();
            oView.setBusy(true);

            var startIndex = (100 * iteration) + 1;

            var sUrl = "/comsapbpmDocumentCentricStartUI/scim/service/scim/Users?startIndex=" + startIndex;
            var oSettings = {
                "url": sUrl,
                "method": "GET",
                "async": false
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    var loadBatches = results.totalResults / 100;
                    oThisController._mapUsers(oColumns, sInputField, results.Resources, loadBatches, iteration);
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

        _mapUsers: function (oColumns, sInputField, oUsers, loadBatches, numberOfAdditionalLoads) {

            var oMdlCommon = this.getParentModel("mCommon");
            var oInputDataPath = "/" + sInputField;
            var aUsers = oMdlCommon.getProperty(oInputDataPath);

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

            oMdlCommon.setProperty(oInputDataPath, aUsers);
            oMdlCommon.refresh();

            if (numberOfAdditionalLoads + 1 > loadBatches) {
                this.fnCreateFragment(oColumns, oInputDataPath);
            }

        },

        fnCreateFragment: function (oColumns, oInputData) {

            var oMdlCommon = this.getParentModel("mCommon");

            oMdlCommon = this.getParentModel("mCommon");
            oMdlCommon.setProperty("/oDialog/sFilterLabel", this.getMessage("USER"));
            oMdlCommon.setProperty("/oDialog/sDialogDes", "UserName");
            oMdlCommon.setProperty("/oDialog/sDialogKey", "EmailID");
            oMdlCommon.setProperty("/oDialog/sTitle", this.getMessage("USERS"));

            this._oBasicSearchField = new SearchField({
                showSearchButton: false
            });

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment("com.sap.bpm.DocumentCentricStartUI.view.BusinessValueHelp", this);
                this.getView().addDependent(this._oValueHelpDialog);
            }

            var oThisController = this;
            var oFilterBar = new FilterBar("businessValueHelpFilterBar", {
                search: function () {
                    oThisController.onFilterBarSearch();
                }
            });
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);
            oFilterBar.setAdvancedMode(true);

            var oUsersFilterGroupItemUserName = new FilterGroupItem({
                groupName: "Users",
                name: "UserName",
                label: this.getMessage("USER_NAME"),
                visibleInFilterBar: true,
                control: new Input("filterBarUserNameIntput", {
                    name: "UserName"
                })
            });
            oFilterBar.addFilterGroupItem(oUsersFilterGroupItemUserName);

            var oUsersFilterGroupItemEmail = new FilterGroupItem({
                groupName: "Users",
                name: "EmailID",
                label: this.getMessage("EMAIL_ADDRESS"),
                visibleInFilterBar: true,
                control: new Input("filterBarEmailIntput", {
                    name: "EmailID"
                })
            });
            oFilterBar.addFilterGroupItem(oUsersFilterGroupItemEmail);

            var oUsersFilterGroupItemFirstname = new FilterGroupItem({
                groupName: "Users",
                name: "FirstName",
                label: this.getMessage("FIRST_NAME"),
                visibleInFilterBar: true,
                control: new Input("filterBarFirstNameIntput", {
                    name: "FirstName"
                })
            });
            oFilterBar.addFilterGroupItem(oUsersFilterGroupItemFirstname);

            var oUsersFilterGroupItemLastName = new FilterGroupItem({
                groupName: "Users",
                name: "LastName",
                label: this.getMessage("LAST_NAME"),
                visibleInFilterBar: true,
                control: new Input("filterBarLastNameIntput", {
                    name: "LastName"
                })
            });
            oFilterBar.addFilterGroupItem(oUsersFilterGroupItemLastName);

            this._oValueHelpDialog.setFilterBar(oFilterBar);

            // Binding  Data to the Table 
            this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                oTable.setModel(oMdlCommon);

                var oNewModel = new JSONModel();
                oNewModel.setData({
                    cols: oColumns
                });
                oTable.setModel(oNewModel, "columns");

                if (oTable.bindRows) {
                    oTable.bindAggregation("rows", oInputData);
                }

                if (oTable.bindItems) {

                    oTable.bindAggregation("items", oInputData, function () {
                        return new ColumnListItem({
                            cells: oColumns.map(function (column) {
                                return new Label({
                                    text: "{" + column.template + "}"
                                });
                            })
                        });
                    });
                }
                this._oValueHelpDialog.update();
            }.bind(this));
            this.closeBusyDialog();
            this._oValueHelpDialog.open();

        },

        onValueHelpOkPress: function (oEvent) {

            var oMdlCommon = this.getParentModel("mCommon");
            var aTokens = oEvent.getParameter("tokens");
            var aCustomData = aTokens[0].getAggregation("customData");
            var oSelectedRowData;

            for (var i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() == "row") {
                    oSelectedRowData = aCustomData[i].getValue()
                    break;
                }
            }

            var sInputField = this.selectedValueHelp.data().inputCustomData;
            var sPath = this.selectedValueHelp.getBindingContext("mCommon").getPath();

            if (sInputField === "ApproverValueHelpType") {
                this.selectedValueHelp.setValue(oSelectedRowData.UserName);
                oMdlCommon.setProperty(sPath + "/ApproverData", oSelectedRowData);

                var errorExist = oMdlCommon.getProperty(sPath + "/ApproverState");
                if (errorExist === "Error") {
                    oMdlCommon.setProperty(sPath + "/ApproverState", "None");
                    oMdlCommon.setProperty(sPath + "/ApproverStateText", "");

                }
            } else if (sInputField === "WatcherValueHelpType") {
                this.selectedValueHelp.setValue(oSelectedRowData.UserName);
                oMdlCommon.setProperty(sPath + "/WatcherData", oSelectedRowData);
            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            var oMdlCommon = this.getParentModel("mCommon");
            oMdlCommon.setProperty("/ApproverValueHelpType", []);
            oMdlCommon.setProperty("/WatcherValueHelpType", []);
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null; // make it falsy so that it can be created next time
            }
            oMdlCommon.refresh();
        },

        onFilterBarSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = sap.ui.getCore().byId("businessValueHelpFilterBar")._retrieveCurrentSelectionSet();

            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

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

            this._filterTable(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTable: function (oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;

            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }

                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oValueHelpDialog.update();
            });
        },

        handleDueDateChange: function (oEvent) {

            this.onChange(oEvent);

            var sValue = oEvent.getParameter("value"),
                oneDay = 24 * 60 * 60 * 1000,
                dueDate = new Date(sValue),
                currentDate = new Date(),
                diffInDays = Math.round(Math.abs((dueDate - currentDate) / oneDay));

            var dateFormattingOptions = { year: 'numeric', month: 'long', day: 'numeric' };
            var formattedDueDate = dueDate.toLocaleDateString("en-US", dateFormattingOptions);

            var sPath = oEvent.getSource().getBindingContext("mCommon").getPath();

            var oMdlCommon = this.getParentModel("mCommon");
            oMdlCommon.setProperty(sPath + "/DueDuration", diffInDays);
            oMdlCommon.setProperty(sPath + "/DueDateFormatted", formattedDueDate);
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

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        onPressRequestApproval: function (oEvent) {

            var errorExist = false,
                oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon");

            oThisController.getView().setBusy(true);

            // Checking Requester Fields
            var requesterFields = [
                "sRequesterFirstName",
                "sRequesterLastName",
                "sRequesterOrganization",
                "sRequesterEmail",
                "sRequesterComment",
                "sRequestMaterials"
                // ,
                // "sRequesterUserId",
                // "sRequestDescription"
            ];
            var requesterValue;
            for (var i = 0; i < requesterFields.length; i++) {
                requesterValue = oMdlCommon.getProperty("/" + "oRequesterDetails" + "/" + requesterFields[i]);
                if (requesterValue && requesterValue.trim() && requesterValue !== "" && requesterValue !== "undefined" && requesterValue !==
                    "null") {
                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (requesterFields[i] === "sRequesterFirstName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_FIRST_NAME"));
                    }
                    if (requesterFields[i] === "sRequesterLastName") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_LAST_NAME"));
                    }
                    if (requesterFields[i] === "sRequesterEmail") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_EMAIL"));
                    }
                    if (requesterFields[i] === "sRequestMaterials") {
                        oMdlCommon.setProperty("/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_REQ_MATERIAL"));
                    }

                    oMdlCommon.setProperty("/" + requesterFields[i] + "State", "Error");

                }
            }

            //Checking Request Materials
            // var reqMaterialValue = oMdlCommon.getProperty("/sRequestMaterialsState");
            // var reqMaterialValue = oMdlCommon.getProperty("/oRequesterDetails/sRequestMaterials");

            // if (reqMaterialValue && reqMaterialValue.trim() && reqMaterialValue !== "" && reqMaterialValue !== "undefined" && reqMaterialValue !== "null") {
            //     oMdlCommon.setProperty("/sRequestMaterialsState", "None");
            // } else {
            //     errorExist = true;
            //     oMdlCommon.setProperty("/sRequestMaterialsState", "Error");
            //     oMdlCommon.setProperty("/sRequestMaterialsStateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_REQ_MATERIAL"));
            // }

            // Checking Aproval Steps Fields
            // var oApprovalSteps = oMdlCommon.getProperty("/oApprovalSteps");
            // if (oApprovalSteps.length < 1) {
            //     MessageBox.error(oThisController.getMessage("APPROVAL_STEPS_LENGTH_ERROR"));
            // } else {
            //     var approvalStepFields = [
            //         "StepName",
            //         "Approver",
            //         "DueDate"
            //     ]
            //     var approvalStepValue;
            //     for (var j = 0; j < oApprovalSteps.length; j++) {
            //         for (var i = 0; i < approvalStepFields.length; i++) {
            //             approvalStepValue = oMdlCommon.getProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i]);
            //             if (approvalStepValue && approvalStepValue.trim() && approvalStepValue !== "" && approvalStepValue !== "undefined" && approvalStepValue !==
            //                 "null") {
            //                 oMdlCommon.setProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i] + "State", "None");
            //             } else {
            //                 errorExist = true;
            //                 if (approvalStepFields[i] === "StepName") {
            //                     oMdlCommon.setProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_STEP_NAME"));
            //                 }
            //                 if (approvalStepFields[i] === "Approver") {
            //                     oMdlCommon.setProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_APPROVER"));
            //                 }
            //                 if (approvalStepFields[i] === "DueDate") {
            //                     oMdlCommon.setProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_DUE_DATE"));
            //                 }

            //                 oMdlCommon.setProperty("/" + "oApprovalSteps" + "/" + j + "/" + approvalStepFields[i] + "State", "Error");
            //             }
            //         }
            //     }
            // }

            // Email Validation
            var requesterEmail = oMdlCommon.getProperty("/oRequesterDetails/sRequesterEmail");

            var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
            if (requesterEmail && !mailregex.test(requesterEmail)) {
                var invalidReqEmail = oThisController.getMessage("INVALID_EMAIL_ERROR")
                errorExist = true;
                oMdlCommon.setProperty("/sRequesterEmailState", "Error");
                oMdlCommon.setProperty("/sRequesterEmailStateText", invalidReqEmail);
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                this.initiateRequestApprovalProcess();
            }

        },

        /**
        * WORKFLOW SERVICE INTEGRATION
        */
        /**
        * Convenience method for accessing the workflow service.
        * @public
        * @returns start workflow instance.
        */

        initiateRequestApprovalProcess: function () {
            this.getView().setBusy(false);
            this.fetchToken();
        },

        fetchToken: function () {
            var oThisController = this;
            oThisController.getView().setBusy(true);
            $.ajax({
                url: "/comsapbpmDocumentCentricStartUI/workflowruntime/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var workflowtoken = data.getResponseHeader("X-CSRF-Token");

                    // Values entered by the user stored in the payload and push to the server.
                    oThisController.startInstance(workflowtoken);

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

        startInstance: function (workflowtoken) {

            var oThisController = this,
                oMdlCommon = oThisController.getParentModel("mCommon"),
                oAttachmentsModel = oThisController.getModel();
            var sUrl = "/comsapbpmDocumentCentricStartUI/workflowruntime/v1/workflow-instances";

            var aObjects = oAttachmentsModel.getData().objects;
            var aAttachments = [];

            for (var i = 0; i < aObjects.length; i++) {
                aAttachments.push({
                    objectId: aObjects[i].object.succinctProperties["cmis:objectId"],
                    name: aObjects[i].object.succinctProperties["cmis:name"],
                });
            }

            // var oApprovalSteps = oMdlCommon.getProperty("/oApprovalSteps");
            // var aApprovalSteps = [];

            // for (var j = 0; j < oApprovalSteps.length; j++) {
            //     aApprovalSteps.push({
            //         StepName: oApprovalSteps[j].StepName,
            //         StepNumber: oApprovalSteps[j].StepNumber,
            //         ApproverData: oApprovalSteps[j].ApproverData,
            //         WatcherData: oApprovalSteps[j].WatcherData ? oApprovalSteps[j].WatcherData : {},
            //         DueDuration: oApprovalSteps[j].DueDuration,
            //         DueDate: oApprovalSteps[j].DueDate,
            //         DueDateFormatted: oApprovalSteps[j].DueDateFormatted,
            //         CommentForApprover: oApprovalSteps[j].CommentForApprover
            //     });
            // }

            var sDefinitionId = oMdlCommon.getProperty("/sDefinitionId");
            var sPayload = {
                "definitionId": sDefinitionId,
                "context": {
                    "RequestId": oMdlCommon.getProperty("/sRequestId").toString(),
                    "Title": oMdlCommon.getProperty("/sTitle"),
                    "Requester": {
                        "FirstName": oMdlCommon.getProperty("/oRequesterDetails/sRequesterFirstName"),
                        "LastName": oMdlCommon.getProperty("/oRequesterDetails/sRequesterLastName"),
                        "Email": oMdlCommon.getProperty("/oRequesterDetails/sRequesterEmail"),
                        "UserId": oMdlCommon.getProperty("/oRequesterDetails/sRequesterUserId"),
                        "Comments": oMdlCommon.getProperty("/oRequesterDetails/sRequesterComment"),
                        "Organization": oMdlCommon.getProperty("/oRequesterDetails/sRequesterOrganization")
                    },
                    "RequestDetails" : {
                        "Description" :  oMdlCommon.getProperty("/oRequesterDetails/sRequestDescription"),
                        "Materials" :  oMdlCommon.getProperty("/oRequesterDetails/sRequestMaterials"),
                        "NetAmount" :  oMdlCommon.getProperty("/oRequesterDetails/sRequestNetAmount")
                    },
                    // "ApprovalSteps": aApprovalSteps,
                    "Attachments": aAttachments
                }
            };

            $.ajax({
                url: sUrl,
                method: "POST",
                dataType: "json",
                crossDomain: false,
                contentType: "application/json",
                data: JSON.stringify(sPayload),
                cache: true,
                headers: { // pass the xsrf token retrieved earlier
                    "X-CSRF-Token": workflowtoken

                },
                success: function (data) {
                    var workflowId = data.id;
                    oThisController.createTargetFolder(workflowId);
                    oMdlCommon.setProperty("/sWorkflowId", workflowId);
                    oMdlCommon.setProperty("/oEnable/sInput", false);
                    oMdlCommon.setProperty("/oEnable/sInput", false);
                    oMdlCommon.setProperty("/oEnable/bRegister", false);
                    var currRequestTitle = oMdlCommon.getProperty("/sRequestId");
                    oMdlCommon.refresh(true);
                    oThisController.getView().setBusy(false);
                    MessageBox.success("Заявка '" + currRequestTitle + "' отправлена на утверждение.");

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    oThisController.getView().setBusy(false);
                    var sErrorText = oThisController.getMessage("WORKFLOW_SERVICE_ERROR");
                    MessageBox.error(sErrorText + "\n Error: " + errorThrown + ".");
                    return;
                }
            });
        },

    });
});