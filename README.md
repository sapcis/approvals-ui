# Document Centric Approval Process using SAP Cloud Platform Workflow Management
## Overview
Document Centric Approval Process enables customers to automate approval or review of documents  involving multiple business users from different organizations. Upon creating a request, user defines multiple approvals steps and specifies step names, Approver, Watcher (optionally), due date and comment for Approver (optionally) for each approval step. Moreover, requestor uploads one or more attachments for further review by approver(s). 

The following steps are included as a part of Document Centric Approval Process:

•	Business user (Requester) uploads one or more documents, invites approvers/reviewers and starts a workflow.

•	Approvers are notified via email.

•	Approvers accesses My Inbox to claim their tasks, review the document and choose one of the following decisions. 

 
 **Approve**:  Upon selecting “Approve” option, Requester and Watcher (if specified) are notified via email about acceptance of the request               by a given Approver on a given step and the next approval step is initialized (if present).
 
 **Reject**:   Upon selecting “Reject” option, Requester is notified via email about rejection of the request and the process is     terminated;
  
 **Rework**: 	Upon selecting “Rework” option, Requester is notified via email that the request needs to be reworked. Requester then accesses the task in My Inbox app, modifies the request in accordance with Approver’s comments and sends request for reapproval by clicking on “Send for Approval” button. Alternatively, Requester can choose “Terminate” option which triggers termination of the process.	

Approver can also get expert opinion by sharing the task with another business user using the “Forward” action. Approver then selects a user from the list, specifies the comment for that user (optionally) and forwards the request. The user to whom the request was forwarded can now access the task in My Inbox applicationp and review the request. This user doesn’t have permissions to edit or complete the request and can only specify a comment (optionally) and send the request back to Approver by clicking on “Update” button.

When the request is accepted by all Approvers, email notification is sent out to Requester informing about full approval and the process is completed.
There are two Mutlitarget Application Projects and one process visibility scenario available in this scenario.
## Pre-Requisites

### DocumentApproval
The following modules are available in this multi target application project.
#### Document Approval - Workflow Module
A workflow model enable multiple approval or review steps in a sequencial way and process the decision of task owners.

#### Document Centric Task UI - SAP UI5 module
Approval or review taskuis using SAP UI5 and integtrated with SAP Cloud Platform Document Management.
#### Document Centric Start UI - SAP UI5 module
Workflow start ui to create a document review or approval request and attach one or more documents. The start UI integrated with SAP Cloud Platform Document Management and Identity Authentication Service. 
#### Document Centric Rework UI - SAP UI5 module
Rework of request using SAP UI5 and integrated with SAP Cloud Platform Document Manaagement.

### CustomUI - Fiori Launchpad module
A fiori launch pad module include My Inbox, Start UI application and Process Visibility Workspace.

### Document Approval - Process Visibility scenario
Real time visibility into document centric approval process with key performance indicators.

## Build and Deploy Multi Target Applications
1. Unzip file into your local folder
2. Import the project DocumentApprovalProcess.zip into SAP Business Application Studio.
3. [Build the project and deploy the archive](https://help.sap.com/viewer/9d1db9835307451daa8c930fbd9ab264/Cloud/en-US/97ef204c568c4496917139cee61224a6.html)  to your cloud platform account.

