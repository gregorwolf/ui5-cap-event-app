sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/InputBase",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/UIComponent"
],
/**
 * @param {typeof import('sap/ui/core/mvc/Controller').default} Controller
 * @param {typeof import('sap/m/MessageBox').default} MessageBox
 * @param {typeof import('sap/m/MessageToast').default} MessageToast
 * @param {typeof import('sap/m/InputBase').default} InputBase
 * @param {typeof import('sap/ui/model/Filter').default} Filter
 * @param {typeof import('sap/ui/model/FilterOperator').default} FilterOperator
 * @param {typeof import('sap/ui/core/UIComponent').default} UIComponent
 */
function (Controller, MessageBox, MessageToast, InputBase, Filter, FilterOperator, UIComponent) {
	"use strict";

	// sap.ui.eventregistration.form.controller.Registration
	class RegistrationController extends Controller {

		constructor(/** @type {(string | object[])} */ arg) {
			super(arg);
			/** @type {import('sap/base/i18n/ResourceBundle').default} */ // @ts-ignore
			this.oBundle = {};
			/** @type {import('sap/ui/model/Model').default} */ // @ts-ignore
			this.oDataModel = {};
		}

		onInit() {

			// keep the reference to the OData model
			this.oDataModel = this.getOwnerComponent().getModel();

			// load previous data
			var oBinding = /** @type {import("sap/ui/model/odata/v4/ODataListBinding").default} */ (this.oDataModel.bindList("/Person"));
			var oIsDraftFilter = new Filter("IsActiveEntity", FilterOperator.EQ, false);
			var oHasNoDraftSiblingFilter = new Filter("SiblingEntity/IsActiveEntity", FilterOperator.EQ, null);
			var oDraftORNoDraftSiblingFilter = new Filter({
				filters: [oIsDraftFilter, oHasNoDraftSiblingFilter], 
				and: false
			});
			oBinding.filter(oDraftORNoDraftSiblingFilter);
			oBinding.requestContexts(0, 2).then((/** @type {import("sap/ui/model/odata/v4/Context").default[]} */ aContexts) => { // there should be only one. Request two to detect error situations.
				this.onExistingDataLoaded(aContexts);
				// @ts-ignore
			}).catch((oError) => {
				if (oError.status === 401 || oError.status === 403) { // 401 Unauthorized when user cancels login dialog, 403 Forbidden, when giving wrong credentials
					// navigate without hash change
					var targets = UIComponent.getRouterFor(this).getTargets();
					if (targets) {
						targets.display("notAuthorized")
					}
				}
			});

			// store the reference to the i18n bundle
			var oResourceModel = /** @type {import('sap/ui/model/resource/ResourceModel').default} */ (this.getOwnerComponent().getModel("i18n"));
			this.oBundle = /** @type {import('sap/base/i18n/ResourceBundle').default} */ (oResourceModel.getResourceBundle());

			// listen to focusleave and enter on the fields to validate the user input
			var aControls = sap.ui.getCore().byFieldGroupId("RegForm");
			aControls.forEach((/** @type {import("sap/ui/core/Control").default} */ oControl) => {
				oControl.addEventDelegate({
					onsapfocusleave: this.validateControl.bind(this, oControl),
					onsapenter: this.validateControl.bind(this, oControl)
				});
			});

			// put focus in firstName and scroll to top again
			this.getView().addEventDelegate({
				onAfterShow: () => {
					this.byId("firstName").focus();
					/** @type {import("sap/m/Page").default} */ (this.byId("page")).scrollTo(0);
				}
			})

		}

		onExistingDataLoaded(/** @type {import("sap/ui/model/odata/v4/Context").default[]} */ aContexts) {
			// CREATE
			if (!aContexts || aContexts.length === 0) { // no data for this user yet
				var oBinding = /** @type {import("sap/ui/model/odata/v4/ODataListBinding").default} */ (this.oDataModel.bindList("/Person"));
				oBinding.attachCreateCompleted((/** @type {import("sap/ui/base/Event").default} */ oEvent) => {
					if (oEvent.getParameter("success")) {
						this.getView().bindObject({path: oEvent.getParameter("context").getPath()});
					} else {
						var sText = this.oBundle.getText("emptyCreateErrorText");
						var sTitle = this.oBundle.getText("emptyCreateErrorTitle");
						MessageBox.error(sText, {
							title: sTitle
						});
					}
				});
				oBinding.create({}, true /* bSkipRefresh */); // automatically in draft mode

				MessageToast.show(this.oBundle.getText("existingDataNotFound"), {duration: 5000});

			// UPDATE
			} else { // data found which can be accessed
				// detect error situation with multiple datasets for one person
				if (aContexts.length > 1) {
					if (aContexts[0].getObject().Email !== aContexts[1].getObject().Email) { // only admins can see data of other users
						MessageBox.error(this.oBundle.getText("adminsStayOut"));
					} else {
						MessageBox.error(this.oBundle.getText("moreThanOneDatasetFound"));
					}
					return;
				}
				var oContext = aContexts[0];

				// ensure it is in draft state
				var isActive = oContext.getProperty("IsActiveEntity"); // = non-draft
				if (isActive) { // bring to draft/edit mode
					var oOperation = /** @type {import("sap/ui/model/odata/v4/ODataContextBinding").default} */ (this.oDataModel.bindContext(
						"EventRegistrationService.draftEdit(...)",
						oContext
					));
					oOperation.execute()
					.then((/** @type {import("sap/ui/model/odata/v4/Context").default} */ oUpdatedContext) => {
						this.getView().bindObject({path: oUpdatedContext.getPath()});
						MessageToast.show(this.oBundle.getText("existingDataLoaded"), {duration: 5000});
					})
					.catch(function() {
						alert("draft edit failure");
					});
				} else { // already in draft/edit mode
					this.getView().bindObject({path: oContext.getPath()});
					MessageToast.show(this.oBundle.getText("existingDraftLoaded"), {duration: 5000});
				}

				var oSubmitButton = /** @type {import("sap/m/Button").default} */ (this.byId("submitButton"));
			oSubmitButton.setText(this.oBundle.getText("updateButtonText"));
			}
		}

		contextAvailable(/** @type {string} */ sPath) {
			this.getView().bindElement({path: sPath});
		}

		addFamilyMember() {
			var oListBinding = /** @type {import("sap/ui/model/odata/v4/ODataListBinding").default} */ (this.byId("familyMembersTable").getBinding("items"));
			oListBinding.create({});
		}

		deleteFamilyMember(/** @type {import("sap/ui/base/Event").default} */ oEvent) {
			var oEventSource = /** @type {import("sap/ui/core/Control").default} */ (oEvent.getSource());
			var oContext = /** @type {import("sap/ui/model/odata/v4/Context").default} */ (oEventSource.getBindingContext());
			oContext.delete("$auto").then(function () {
				// deletion success
			}.bind(this), function () {
				// TODO: ignore deletion failure?
			});
		}

		validateControl(/** @type {import("sap/ui/core/Control").default} */ oControl) {
			if (oControl instanceof InputBase) {
				if (oControl.getRequired() && !oControl.getValue()) {
					oControl.fireValidationError({
						element: oControl,
						property: "value",
						message: this.oBundle.getText("enterValue")
					});
				}
			}
		}


		/**
		 * @typedef Employee
		 * @property {string} FirstName
		 * @property {string} LastName
		 * @property {string} Birthday
		 * @property {FamilyMember[]} FamilyMembers
		 */

		/**
		 * @typedef FamilyMember
		 * @property {string} FirstName
		 * @property {string} LastName
		 * @property {string} Birthday
		 */

		validateData() {
			var oBindingContext = this.getView().getBindingContext();
			if (!oBindingContext) {
				return [];
			}
			var oNewObject = /** @type {Employee} */ (oBindingContext.getObject());

			// determine field names for validation dialog
			var oBundle = this.oBundle;
			var mFields = {
				LastName: oBundle.getText("name"),
				FirstName: oBundle.getText("firstName"),
				Birthday: oBundle.getText("dateOfBirth")
			}

			// check for missing fields
			var aMissing = [];
			/** @type {('FirstName'|'LastName'|'Birthday')} */
			var prop;
			for (prop in mFields) {
				if (!oNewObject[prop]) {
					aMissing.push(mFields[prop]);
				}
			}

			// loop FamilyMembers
			for (var i = 0; i < oNewObject.FamilyMembers.length; i++) {
				var oFamilyMember = oNewObject.FamilyMembers[i]
				var bSomethingThere = !!(oFamilyMember.LastName || oFamilyMember.FirstName || oFamilyMember.Birthday);
				var bSomethingMissing = !(oFamilyMember.LastName && oFamilyMember.FirstName && oFamilyMember.Birthday);
				if (bSomethingThere && bSomethingMissing) {
					aMissing.push(oBundle.getText("validationFamilyMember", [i + 1]));
				}
			}

			// show validation errors (red borders) for all registration form controls with missing data
			if (aMissing.length > 0) {
				var aControls = sap.ui.getCore().byFieldGroupId("RegForm");
				aControls.forEach((/** @type {import("sap/ui/core/Control").default} */ oControl) => {
					this.validateControl(oControl);
				});
			}

			return aMissing;
		}

		onSubmit() {
			// run validation and report validation errors
			var aMissing = this.validateData();
			if (aMissing.length > 0) {
				var sText = this.oBundle.getText("validationText");
				var sTitle = this.oBundle.getText("validationTitle");
				MessageBox.alert(sText + "\n- " + aMissing.join("\n- "), {title: sTitle});
				return;
			}

			var oContext = this.getView().getBindingContext();
			if (!oContext) {
				return;
			}

			/* omit this block as failing "draftActivate" is not expected (no data checks in backend) aand a failing PATCH would not be dramatic
			// ensure there are no pending changes (because otherwise with a failing "save" the last PATCH which might be in the same batch would also fail)
			if (oContext.hasPendingChanges()) {
				this.oDataModel.submitBatch("$auto"); // TODO: would we have to wait for the result?
			}
			*/

			// disable the "Submit" button to prevent double clicks from saving data twice
			var oSubmitButton = /** @type {import("sap/m/Button").default} */ (this.byId("submitButton"));
			oSubmitButton.setEnabled(false);

			// trigger OData operation for persisting the draft as real data
			var oOperation = /** @type {import("sap/ui/model/odata/v4/ODataContextBinding").default} */ (this.oDataModel.bindContext(
				"EventRegistrationService.draftActivate(...)",
				oContext
			));
			oOperation.execute()
			.then(() => {
				// navigate without hash change
				var targets = UIComponent.getRouterFor(this).getTargets();
				if (targets) {
					targets.display("confirmation");
				}
			})
			.catch(() => {
				this.showErrorDialog()
			});
		}

		showErrorDialog() {
			var sText = this.oBundle.getText("submitErrorText");
			var sTitle = this.oBundle.getText("submitErrorTitle");
			var oSubmitButton = /** @type {import("sap/m/Button").default} */ (this.byId("submitButton"));
			oSubmitButton.setEnabled(true);
			MessageBox.error(sText, {
				title: sTitle
			});
		}

	}

	return RegistrationController;

});