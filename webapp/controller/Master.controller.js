sap.ui.define([
	"../Constants",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"sap/f/library",
	"sap/ui/core/routing/History"
], 
function (Constants, JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, History) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Master", {
		onInit: function () {
			var oOwnerComponent = this.getOwnerComponent();

			this.oView = this.getView();

			this.oRouter = oOwnerComponent.getRouter();

			var oModel = new sap.ui.model.json.JSONModel();

			var complete_url = window.location.href;
			var pieces = complete_url.split("?");
			var params = pieces[1].split("&");
			var userNameValuePath;
			$.each(params, function (key, value) {
				var param_value = value.split("=");
				userNameValuePath = param_value[1];
			});

			this._username = userNameValuePath.split("/")[2];

			$.ajax({
				type: "GET",
				contentType: false,
				url: Constants.BASE_URL + Constants.USERS_PATH + "/" + this._username,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					oModel.setProperty("/modelData", data);
				}
			});

			this.oView.setModel(oModel, "users");

			this._bDescendingSort = false;
			this.oProductsTable = this.oView.byId("usersTable");

			this.oRouter = this.getOwnerComponent().getRouter();
		},

		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {

				if (sQuery.toString().search(" ") !== -1) {
					// search full name
					var splittedQuery = sQuery.split(" ");
					oTableSearchState.push(new Filter({
						filters: [
							new Filter({
								filters: [
									new Filter("firstName", FilterOperator.Contains, splittedQuery[0]),
									new Filter("lastName", FilterOperator.Contains, splittedQuery[1])
								],
								and: true | false
							}),
							new Filter({
								filters: [
									new Filter("firstName", FilterOperator.Contains, splittedQuery[1]),
									new Filter("lastName", FilterOperator.Contains, splittedQuery[0])
								],
								and: true | false
							})
						],
						or: true | false
					}));

				} else {
					// search first name or last name
					oTableSearchState.push(new Filter({
						filters: [
							new Filter("firstName", FilterOperator.Contains, sQuery),
							new Filter("lastName", FilterOperator.Contains, sQuery)
						],
						or: true | false
					}));
				}
			}
			var oTable = this.byId("usersTable");
			var oBinding = oTable.getBinding("items");

			oBinding.filter(oTableSearchState);
		},

		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProductsTable.getBinding("items"),
				oSorter = new Sorter("programName", this._bDescendingSort);

			oBinding.sort(oSorter);
		},

		onSynchronize: function (oEvent) {
			this.onInit();
		},

		onLogout: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			
			$.ajax({
				type: "GET",
				url: Constants.BASE_URL + Constants.LOGOUT_PATH //Clear SSO cookies: SAP Provided service to do that 
			}).done(function () {
				oRouter.navTo("login");
				window.location.reload();
			});
		},

		onPressed: function (oEvent) {
			var userPath = oEvent.getSource().getBindingContext("users").getPath(),
				user = userPath.split("/").slice(-1).pop();
			var programName;
			var users = this.oView.getModel("users").getData().modelData;
			
			var userId = this.oProductsTable.getBinding("items").oList[user].id;
			
			for (var i = 0; i < users.length; i++) {
				if (users[i].id === userId) {
					programName = users[i].programName;
				}
			}
			var oFCL = this.oView.getParent().getParent();
			oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);
			this.oRouter.navTo("detail", {
				layout: oFCL.getLayout(),
				user: userId,
				programName: programName
			});
		}
	});
});