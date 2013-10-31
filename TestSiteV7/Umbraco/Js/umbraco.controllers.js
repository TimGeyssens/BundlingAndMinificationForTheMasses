/*! umbraco - v0.0.1-TechnicalPReview - 2013-09-17
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

/**
 * @ngdoc controller
 * @name Umbraco.DashboardController
 * @function
 * 
 * @description
 * Controls the dashboards of the application
 * 
 */
 
function DashboardController($scope, $routeParams, dashboardResource) {
    $scope.dashboard = {};
    $scope.dashboard.name = $routeParams.section;
    
    dashboardResource.getDashboard($scope.dashboard.name).then(function(tabs){
   		$scope.dashboard.tabs = tabs;
    });
}


//register it
angular.module('umbraco').controller("Umbraco.DashboardController", DashboardController);

//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.ContentPickerController",
	function ($scope, eventsService, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	$scope.dialogTreeEventHandler = $({});

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();


		eventsService.publish("Umbraco.Dialogs.ContentPickerController.Select", args).then(function(args){
			if(dialogOptions && dialogOptions.multipicker){
				$(args.event.target.parentElement)
					.find("i.umb-tree-icon")
					.attr("class", "icon umb-tree-icon sprTree icon-check blue");
				
				$scope.select(args.node);
			}else{
				$scope.submit(args.node);					
			}
			
		});

	});
});
//used for the icon picker dialog
angular.module("umbraco")
    .controller("Umbraco.Dialogs.IconPickerController",
        function ($scope, iconHelper) {
            $scope.icons = iconHelper.getIcons("");
});
/**
 * @ngdoc controller
 * @name Umbraco.Dialogs.LegacyDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function LegacyDeleteController($scope, legacyResource, treeService, navigationService) {

    $scope.performDelete = function() {

        //mark it for deletion (used in the UI)
        $scope.currentNode.loading = true;

        legacyResource.deleteItem({            
            nodeId: $scope.currentNode.id,
            nodeType: $scope.currentNode.nodetype
        }).then(function () {
            $scope.currentNode.loading = false;
            //TODO: Need to sync tree, etc...
            treeService.removeNode($scope.currentNode);
            navigationService.hideMenu();
        });

    };

    $scope.cancel = function() {
        navigationService.hideDialog();
    };
}

angular.module("umbraco").controller("Umbraco.Dialogs.LegacyDeleteController", LegacyDeleteController);

angular.module("umbraco").controller("Umbraco.Dialogs.LoginController", function ($scope, userService, legacyJsLoader, $routeParams) {
    
    /**
     * @ngdoc function
     * @name signin
     * @methodOf MainController
     * @function
     *
     * @description
     * signs the user in
     */
    var d = new Date();
    var weekday = new Array("Super Sunday", "Manic Monday", "Tremendous Tuesday", "Wonderfull Wednesday", "Thunder Thursday", "Friendly Friday", "Shiny Saturday");
    
    $scope.today = weekday[d.getDay()];
    $scope.errorMsg = "";
    
    $scope.loginSubmit = function (login, password) {        
        if ($scope.loginForm.$invalid) {
            return;
        }

        userService.authenticate(login, password)
            .then(function (data) {
                //We need to load in the legacy tree js.
                legacyJsLoader.loadLegacyTreeJs($scope).then(
                    function(result) {
                        var iframe = $("#right");
                        if(iframe){
                            var url = decodeURIComponent($routeParams.url);
                            if(!url){
                                url ="dashboard.aspx";
                            }
                            iframe.attr("src", url);
                        }

                        $scope.submit(true);
                    });
            }, function (reason) {
                $scope.errorMsg = reason.errorMsg;
                
                //set the form inputs to invalid
                $scope.loginForm.username.$setValidity("auth", false);
                $scope.loginForm.password.$setValidity("auth", false);
            });
        
        //setup a watch for both of the model values changing, if they change
        // while the form is invalid, then revalidate them so that the form can 
        // be submitted again.
        $scope.loginForm.username.$viewChangeListeners.push(function () {
            if ($scope.loginForm.username.$invalid) {
                $scope.loginForm.username.$setValidity('auth', true);
            }
        });
        $scope.loginForm.password.$viewChangeListeners.push(function () {
            if ($scope.loginForm.password.$invalid) {
                $scope.loginForm.password.$setValidity('auth', true);
            }
        });
    };
});
//used for the macro picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.MacroPickerController", function ($scope, macroFactory, umbPropEditorHelper) {
	$scope.macros = macroFactory.all(true);
	$scope.dialogMode = "list";

	$scope.configureMacro = function(macro){
		$scope.dialogMode = "configure";
		$scope.dialogData.macro = macroFactory.getMacro(macro.alias);
	    //set the correct view for each item
		for (var i = 0; i < dialogData.macro.properties.length; i++) {
		    dialogData.macro.properties[i].editorView = umbPropEditorHelper.getViewPath(dialogData.macro.properties[i].view);
		}
	};
});
//used for the media picker dialog
angular.module("umbraco")
    .controller("Umbraco.Dialogs.MediaPickerController",
        function ($scope, mediaResource, umbRequestHelper, entityResource, $log, imageHelper, eventsService) {

            var dialogOptions = $scope.$parent.dialogOptions;
            $scope.options = {
                url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
                autoUpload: true,
                formData:{
                    currentFolder: -1
                }
            };

            $scope.submitFolder = function(e){
                if(e.keyCode === 13){
                    $scope.showFolderInput = false;

                    mediaResource
                    .addFolder($scope.newFolderName, $scope.options.formData.currentFolder)
                    .then(function(data){
                        
                        $scope.gotoFolder(data.id);
                    });
                }
            };

            $scope.gotoFolder = function(folderId){

                if(folderId > 0){
                    entityResource.getAncestors(folderId)
                        .then(function(anc){
                            anc.splice(0,1);  
                            $scope.path = anc;
                        });
                }else{
                    $scope.path = [];
                }
                
                //mediaResource.rootMedia()
                mediaResource.getChildren(folderId)
                    .then(function(data) {
                        $scope.images = data;
                        //update the thumbnail property
                        _.each($scope.images, function(img) {
                            img.thumbnail = imageHelper.getThumbnail({ imageModel: img, scope: $scope });
                        });
                    });

                $scope.options.formData.currentFolder = folderId;
            };
               

            $scope.$on('fileuploadstop', function(event, files){
                $scope.gotoFolder($scope.options.formData.currentFolder);
            });
            

            $scope.selectMediaItem = function(image) {
                if (image.contentTypeAlias.toLowerCase() == 'folder') {      
                    $scope.options.formData.currentFolder = image.id;
                    $scope.gotoFolder(image.id);
                }
                else if (image.contentTypeAlias.toLowerCase() == 'image') {

                    eventsService.publish("Umbraco.Dialogs.MediaPickerController.Select", image).then(function(image){
                        if(dialogOptions && dialogOptions.multipicker){
                            $scope.select(image);
                        }else{
                            $scope.submit(image);                  
                        }
                    });
                }
            };

            $scope.gotoFolder(-1);
        });
angular.module("umbraco").controller("Umbraco.Dialogs.RteEmbedController", function ($scope, $http) {
    $scope.url = "";
    $scope.width = 500;
    $scope.height = 300;
    $scope.constrain = true;
    $scope.preview = "";
    $scope.success = false;
    
    $scope.showPreview = function(){

        if ($scope.url != "") {
            
            $scope.preview = "<div class=\"umb-loader\">";
            $scope.success = false;

            $http({ method: 'GET', url: '/umbraco/UmbracoApi/RteEmbed/GetEmbed', params: { url: $scope.url, width: $scope.width, height: $scope.height } })
                .success(function(data) {
                    $scope.preview = data.Markup;
                    $scope.success = true;
                })
                .error(function() {
                    $scope.preview = "";
                });

        }

    };

    $scope.insert = function(){
        $scope.submit($scope.preview);
    };
});
//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.TreePickerController",
	function ($scope, eventsService, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	$scope.dialogTreeEventHandler = $({});
	$scope.section = dialogOptions.section | "content";

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Dialogs.TreePickerController.Select", args).then(function(args){
			if(dialogOptions && dialogOptions.multipicker){
				$(args.event.target.parentElement)
					.find("i.umb-tree-icon")
					.attr("class", "icon umb-tree-icon sprTree icon-check blue");
				
				$scope.select(args.node);
			}else{
				$scope.submit(args.node);					
			}
			
		});

	});
});
angular.module("umbraco")
    .controller("Umbraco.Dialogs.UserController", function ($scope, $location, userService, historyService) {
       
        $scope.user = userService.getCurrentUser();
        $scope.history = historyService.current;

        $scope.logout = function () {
	        userService.logout();
	        $scope.hide();
	        $location.path("/");
    	};

	    $scope.gotoHistory = function (link) {
		    $location.path(link);
		    $scope.$apply() 
		    $scope.hide();
		};
});
/**
 * @ngdoc controller
 * @name Umbraco.Dialogs.LegacyDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function YsodController($scope, legacyResource, treeService, navigationService) {
    
    if ($scope.error && $scope.error.data && $scope.error.data.StackTrace) {
        //trim whitespace
        $scope.error.data.StackTrace = $scope.error.data.StackTrace.trim();
    }

    $scope.closeDialog = function() {
        $scope.dismiss();
    };

}

angular.module("umbraco").controller("Umbraco.Dialogs.YsodController", YsodController);

/**
 * @ngdoc controller
 * @name Umbraco.LegacyController
 * @function
 * 
 * @description
 * A controller to control the legacy iframe injection
 * 
*/
function LegacyController($scope, $routeParams, $element) {

	$scope.legacyPath = decodeURIComponent($routeParams.url);
    
    //$scope.$on('$routeChangeSuccess', function () {
    //    var asdf = $element;
    //});
}

angular.module("umbraco").controller('Umbraco.LegacyController', LegacyController);

/**
 * @ngdoc controller
 * @name Umbraco.MainController
 * @function
 * 
 * @description
 * The main application controller
 * 
 */
function MainController($scope, $routeParams, $rootScope, $timeout, $http, $log, notificationsService, userService, navigationService, legacyJsLoader) {

    
    //detect if the current device is touch-enabled
    $scope.touchDevice = ("ontouchstart" in window || window.touch || window.navigator.msMaxTouchPoints===5 || window.DocumentTouch && document instanceof DocumentTouch);
    navigationService.touchDevice = $scope.touchDevice;

    //the null is important because we do an explicit bool check on this in the view
    //the avatar is by default the umbraco logo    
    $scope.authenticated = null;
    $scope.avatar = "assets/img/application/logo.png";

    //subscribes to notifications in the notification service
    $scope.notifications = notificationsService.current;
    $scope.$watch('notificationsService.current', function (newVal, oldVal, scope) {
        if (newVal) {
            $scope.notifications = newVal;
        }
    });

    $scope.removeNotification = function (index) {
        notificationsService.remove(index);
    };

    $scope.closeDialogs = function (event) {
        //only close dialogs if non-lin and non-buttons are clicked
        var el = event.target.nodeName;
        var pEl = event.target.parentElement.nodeName;
        var close = $(event.target).closest("#navigation");
        var parents = $(event.target).parents("#navigation");

        //SD: I've updated this so that we don't close the dialog when clicking inside of the dialog
        if (parents.length === 1) {
            return;
        }

        //SD: I've added a check for INPUT elements too
        if(el != "I" && el != "A" && el != "BUTTON" && pEl != "A" && pEl != "BUTTON" && el != "INPUT" && pEl != "INPUT"){
            $rootScope.$emit("closeDialogs", event);
        }
    };

    //fetch the authorized status         
    userService.isAuthenticated()
        .then(function (data) {
            
            //We need to load in the legacy tree js.
            legacyJsLoader.loadLegacyTreeJs($scope).then(
                function (result) {
                    //TODO: We could wait for this to load before running the UI ?
                });
            
            $scope.authenticated = data.authenticated;
            $scope.user = data.user;


/*
            var url = "http://www.gravatar.com/avatar/" + $scope.user.emailHash + ".json?404=404";
            $http.jsonp(url).then(function(response){
                $log.log("found: " + response);
            }, function(data){
                $log.log(data);
            });
*/

            /*    
            if($scope.user.avatar){
                $http.get($scope.user.avatar).then(function(){
                    //alert($scope.user.avatar);
                    $scope.avatar = $scope.user.avatar;
                });
            }*/

            
        }, function (reason) {
            notificationsService.error("An error occurred checking authentication.");
            $scope.authenticated = false;
            $scope.user = null;
        });
}


//register it
angular.module('umbraco').controller("Umbraco.MainController", MainController);

/*
angular.module("umbraco").run(function(eventsService){
    eventsService.subscribe("Umbraco.Dialogs.ContentPickerController.Select", function(a, b){
        a.node.name = "wat";
    });
});
*/

/**
 * @ngdoc controller
 * @name Umbraco.NavigationController
 * @function
 * 
 * @description
 * Handles the section area of the app
 * 
 * @param {navigationService} navigationService A reference to the navigationService
 */
function NavigationController($scope,$rootScope, $location, $log, $routeParams, navigationService, keyboardService, dialogService, historyService, sectionResource, angularHelper) {

    //Put the navigation service on this scope so we can use it's methods/properties in the view.
    // IMPORTANT: all properties assigned to this scope are generally available on the scope object on dialogs since
    //   when we create a dialog we pass in this scope to be used for the dialog's scope instead of creating a new one.
    $scope.nav = navigationService;
    $scope.routeParams = $routeParams;
    $scope.$watch("routeParams.section", function (newVal, oldVal) {
            $scope.currentSection = newVal;
    });

    //trigger search with a hotkey:
    keyboardService.bind("ctrl+shift+s", function(){
        $scope.nav.showTree("");
    });

    //the tree event handler i used to subscribe to the main tree click events
    $scope.treeEventHandler = $({});

    $scope.selectedId = navigationService.currentId;
    $scope.sections = navigationService.sections;
    
    sectionResource.getSections()
        .then(function(result) {
            $scope.sections = result;
        });

    //This reacts to clicks passed to the body element which emits a global call to close all dialogs
    $rootScope.$on("closeDialogs", function (event) {
        if (navigationService.ui.stickyNavigation) {
           navigationService.hideNavigation();
            angularHelper.safeApply($scope);
        }
    });
        
    //this reacts to the options item in the tree
    $scope.treeEventHandler.bind("treeOptionsClick", function (ev, args) {
        ev.stopPropagation();
        ev.preventDefault();
        
        $scope.currentNode = args.node;
        args.scope = $scope;

        navigationService.showMenu(ev, args);
    });

    //this reacts to tree items themselves being clicked
    //the tree directive should not contain any handling, simply just bubble events
    $scope.treeEventHandler.bind("treeNodeSelect", function (ev, args) {
        ev.stopPropagation();
        ev.preventDefault();
        
        var n = args.node;

        //here we need to check for some legacy tree code
        if (n.metaData && n.metaData["jsClickCallback"] && angular.isString(n.metaData["jsClickCallback"]) && n.metaData["jsClickCallback"] !== "") {
            //this is a legacy tree node!                
            var jsPrefix = "javascript:";
            var js;
            if (n.metaData["jsClickCallback"].startsWith(jsPrefix)) {
                js = n.metaData["jsClickCallback"].substr(jsPrefix.length);
            }
            else {
                js = n.metaData["jsClickCallback"];
            }
            try {
                var func = eval(js);
                //this is normally not necessary since the eval above should execute the method and will return nothing.
                if (func != null && (typeof func === "function")) {
                    func.call();
                }
            }
            catch(ex) {
                $log.error("Error evaluating js callback from legacy tree node: " + ex);
            }
        }
        else {
            //add action to the history service
            historyService.add({ name: n.name, link: n.routePath, icon: n.icon });
            //not legacy, lets just set the route value and clear the query string if there is one.
            $location.path(n.routePath).search("");
        }

        navigationService.hideNavigation();
    });

    /** Opens a dialog but passes in this scope instance to be used for the dialog */
    $scope.openDialog = function (currentNode, action, currentSection) {        
        navigationService.showDialog({
            scope: $scope,
            node: currentNode,
            action: action,
            section: currentSection
        });
    };
}

//register it
angular.module('umbraco').controller("Umbraco.NavigationController", NavigationController);

/**
 * @ngdoc controller
 * @name Umbraco.SearchController
 * @function
 * 
 * @description
 * Controls the search functionality in the site
 *  
 */
function SearchController($scope, searchService, $log, navigationService) {
    var currentTerm = "";
    $scope.deActivateSearch = function () {
        currentTerm = "";
    };

    $scope.performSearch = function (term) {
        if (term != undefined && term != currentTerm) {
            if (term.length > 3) {
                navigationService.ui.selectedSearchResult = -1;
                navigationService.showSearch();
                currentTerm = term;
                navigationService.ui.searchResults = searchService.search(term, navigationService.currentSection);
            } else {
                navigationService.ui.searchResults = [];
            }
        }
    };

    $scope.hideSearch = navigationService.hideSearch;

    $scope.iterateResults = function (direction) {
        if (direction == "up" && navigationService.ui.selectedSearchResult < navigationService.ui.searchResults.length)
            navigationService.ui.selectedSearchResult++;
        else if (navigationService.ui.selectedSearchResult > 0)
            navigationService.ui.selectedSearchResult--;
    };

    $scope.selectResult = function () {
        navigationService.showMenu(navigationService.ui.searchResults[navigationService.ui.selectedSearchResult], undefined);
    };
}
//register it
angular.module('umbraco').controller("Umbraco.SearchController", SearchController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.Content.CreateController
 * @function
 * 
 * @description
 * The controller for the content creation dialog
 */
function contentCreateController($scope, $routeParams, contentTypeResource, iconHelper) {

    contentTypeResource.getAllowedTypes($scope.currentNode.id).then(function(data) {
        $scope.allowedTypes = iconHelper.formatContentTypeIcons(data);
    });
}

angular.module('umbraco').controller("Umbraco.Editors.Content.CreateController", contentCreateController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function ContentDeleteController($scope, contentResource, treeService, navigationService) {

    $scope.performDelete = function() {

        //mark it for deletion (used in the UI)
        $scope.currentNode.loading = true;

        contentResource.deleteById($scope.currentNode.id).then(function () {
            $scope.currentNode.loading = false;

            //get the root node before we remove it
            var rootNode = treeService.getTreeRoot($scope.currentNode);

            //TODO: Need to sync tree, etc...
            treeService.removeNode($scope.currentNode);

            //ensure the recycle bin has child nodes now            
            var recycleBin = treeService.getDescendantNode(rootNode, -20);
            recycleBin.hasChildren = true;

            navigationService.hideMenu();
        });

    };

    $scope.cancel = function() {
        navigationService.hideDialog();
    };
}

angular.module("umbraco").controller("Umbraco.Editors.Content.DeleteController", ContentDeleteController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.Content.EditController
 * @function
 * 
 * @description
 * The controller for the content editor
 */
function ContentEditController($scope, $routeParams, contentResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, fileManager, editorContextService) {
       
    //initialize the file manager
    fileManager.clearFiles();

    if ($routeParams.create) {
        //we are creating so get an empty content item
        contentResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function(data) {
                $scope.loaded = true;
                $scope.content = data;
                editorContextService.setContext($scope.content);
            });
    }
    else {
        //we are editing so get the content item from the server
        contentResource.getById($routeParams.id)
            .then(function(data) {
                $scope.loaded = true;
                $scope.content = data;
                editorContextService.setContext($scope.content);

                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationManager.executeAndClearAllSubscriptions();
            });
    }

    //TODO: Need to figure out a way to share the saving and event broadcasting with all editors!

    $scope.saveAndPublish = function () {
        $scope.$broadcast("saving", { scope: $scope });
        
        var currentForm = angularHelper.getRequiredCurrentForm($scope);
        
        //don't continue if the form is invalid
        if (currentForm.$invalid) return;

        serverValidationManager.reset();
        
        contentResource.publish($scope.content, $routeParams.create, fileManager.getFiles())
            .then(function (data) {
                
                contentEditingHelper.handleSuccessfulSave({
                    scope: $scope,
                    newContent: data,
                    rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                });
                
            }, function (err) {

                contentEditingHelper.handleSaveError({
                    err: err,
                    redirectOnFailure: true,
                    allNewProps: contentEditingHelper.getAllProps(err.data),
                    rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, err.data)
                });
            });     
    };

    $scope.save = function () {
        $scope.$broadcast("saving", { scope: $scope });
            
        var currentForm = angularHelper.getRequiredCurrentForm($scope);

        //don't continue if the form is invalid
        if (currentForm.$invalid) return;

        serverValidationManager.reset();

        contentResource.save($scope.content, $routeParams.create, fileManager.getFiles())
            .then(function (data) {
                
                contentEditingHelper.handleSuccessfulSave({
                    scope: $scope,
                    newContent: data,
                    rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                });
                
            }, function (err) {
                contentEditingHelper.handleSaveError({
                    err: err,
                    allNewProps: contentEditingHelper.getAllProps(err.data),
                    allOrigProps: contentEditingHelper.getAllProps($scope.content)
                });
        });
    };

}

angular.module("umbraco").controller("Umbraco.Editors.Content.EditController", ContentEditController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.Content.EmptyRecycleBinController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function ContentEmptyRecycleBinController($scope, contentResource, treeService, navigationService) {

    $scope.performDelete = function() {

        //(used in the UI)
        $scope.currentNode.loading = true;

        contentResource.emptyRecycleBin($scope.currentNode.id).then(function () {
            $scope.currentNode.loading = false;
            //TODO: Need to sync tree, etc...
            treeService.removeChildNodes($scope.currentNode);
            navigationService.hideMenu();
        });

    };

    $scope.cancel = function() {
        navigationService.hideDialog();
    };
}

angular.module("umbraco").controller("Umbraco.Editors.Content.EmptyRecycleBinController", ContentEmptyRecycleBinController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function ContentSortController($scope, contentResource, treeService) {

    $scope.sortableModel = {
        itemsToSort: [],
        name: $scope.nav.ui.currentNode.name
    };

    contentResource.getChildren($scope.currentNode.id).then(function (data) {
        $scope.sortableModel.itemsToSort = [];
        for (var i = 0; i < data.items.length; i++) {
            $scope.sortableModel.itemsToSort.push({
                id: data.items[i].id,
                column1: data.items[i].name,
                column2: data.items[i].updateDate,
                column3: data.items[i].sortOrder
            });
        }
    });

    $scope.$on("umbItemSorter.ok", function(event) {
        $scope.nav.hideDialog();
    });
    $scope.$on("umbItemSorter.cancel", function (event) {
        $scope.nav.hideDialog();
    });

    $scope.$on("umbItemSorter.sorting", function (event, args) {

        var sortedIds = [];
        for (var i = 0; i < args.sortedItems.length; i++) {
            sortedIds.push(args.sortedItems[i].id);
        }
        contentResource.sort({ parentId: $scope.currentNode.id, sortedIds: sortedIds })
            .then(function () {
                $scope.sortableModel.complete = true;
                treeService.loadNodeChildren({ node: $scope.nav.ui.currentNode, section: $scope.nav.ui.currentSection });
            });

    });

}

angular.module("umbraco").controller("Umbraco.Editors.Content.SortController", ContentSortController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentType.EditController
 * @function
 * 
 * @description
 * The controller for the content type editor
 */
function ContentTypeEditController($scope, $routeParams, $log, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, entityResource) {
    
    $scope.tabs = [];
    $scope.page = {};
    $scope.contentType = {tabs: [], name: "My content type", alias:"myType", icon:"icon-folder", allowedChildren: [], allowedTemplate: []};
    $scope.contentType.tabs = [
            {name: "Content", properties:[ {name: "test"}]},
            {name: "Generic Properties", properties:[]}
        ];


        
    $scope.dataTypesOptions ={
    	group: "properties",
    	onDropHandler: function(item, args){
    		args.sourceScope.move(args);
    	},
    	onReleaseHandler: function(item, args){
    		var a = args;
    	}
    };

    $scope.tabOptions ={
    	group: "tabs",
    	drop: false,
    	nested: true,
    	onDropHandler: function(item, args){
    		
    	},
    	onReleaseHandler: function(item, args){
    		
    	}
    };

    $scope.propertiesOptions ={
    	group: "properties",
    	onDropHandler: function(item, args){
    		//alert("dropped on properties");
			//args.targetScope.ngModel.$modelValue.push({name: "bong"});
    	},
    	onReleaseHandler: function(item, args){
    		//alert("released from properties");
			//args.targetScope.ngModel.$modelValue.push({name: "bong"});
    	},
    };


    $scope.omg = function(){
    	alert("wat");
    };   

    entityResource.getAll("Datatype").then(function(data){
        $scope.page.datatypes = data;
    });
}

angular.module("umbraco").controller("Umbraco.Editors.ContentType.EditController", ContentTypeEditController);
function startUpVideosDashboardController($scope, xmlhelper, $log, $http) {
	//xmlHelper.parseFeed("http://umbraco.org/feeds/videos/getting-started").then(function(feed){
		
	//});
   $scope.videos = [];
   $http.get("dashboard/feedproxy.aspx?url=http://umbraco.org/feeds/videos/getting-started").then(function(data){
    	var feed = $(data.data);
    	$('item', feed).each(function (i, item) {
   				var video = {};
   				video.thumbnail = $(item).find('thumbnail').attr('url');
   				video.title = $("title", item).text();
   				video.link = $("guid", item).text();
   				$scope.videos.push(video);  		
    	});
   });
}
angular.module("umbraco").controller("Umbraco.Dashboard.StartupVideosController", startUpVideosDashboardController);

function ChangePasswordDashboardController($scope, xmlhelper, $log, userResource) {
    //this is the model we will pass to the service
    $scope.profile = {};

    $scope.changePassword = function (p) {   
        userResource.changePassword(p.oldPassword, p.newPassword).then(function () {
            alert("changed");
            $scope.passwordForm.$setValidity(true);
        }, function () {
          alert("not changed");
            //this only happens if there is a wrong oldPassword sent along
            $scope.passwordForm.oldpass.$setValidity("oldPassword", false);
        });
    }
}

angular.module("umbraco").controller("Umbraco.Dashboard.StartupChangePasswordController", ChangePasswordDashboardController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.DataType.EditController
 * @function
 * 
 * @description
 * The controller for the content editor
 */
function DataTypeEditController($scope, $routeParams, $location, dataTypeResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper) {

    //method used to configure the pre-values when we retreive them from the server
    function createPreValueProps(preVals) {
        $scope.preValues = [];
        for (var i = 0; i < preVals.length; i++) {
            $scope.preValues.push({
                hideLabel: preVals[i].hideLabel,
                alias: preVals[i].key,
                description: preVals[i].description,
                label: preVals[i].label,
                view: preVals[i].view,
                value: preVals[i].value
            });
        }
    }

    //set up the standard data type props
    $scope.properties = {
        selectedEditor: {
            alias: "selectedEditor",
            description: "Select a property editor",
            label: "Property editor"
        },
        selectedEditorId: {
            alias: "selectedEditorId",
            label: "Property editor GUID"
        }
    };
    
    //setup the pre-values as props
    $scope.preValues = [];

    if ($routeParams.create) {
        //we are creating so get an empty content item
        dataTypeResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function(data) {
                $scope.loaded = true;
                $scope.preValuesLoaded = true;
                $scope.content = data;
            });
    }
    else {
        //we are editing so get the content item from the server
        dataTypeResource.getById($routeParams.id)
            .then(function(data) {
                $scope.loaded = true;
                $scope.preValuesLoaded = true;
                $scope.content = data;
                createPreValueProps($scope.content.preValues);
                
                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationManager.executeAndClearAllSubscriptions();
            });
    }
    
    $scope.$watch("content.selectedEditor", function (newVal, oldVal) {
        //when the value changes, we need to dynamically load in the new editor
        if (newVal !== null && newVal !== undefined && newVal != oldVal) {
            //we are editing so get the content item from the server
            var currDataTypeId = $routeParams.create ? undefined : $routeParams.id;
            dataTypeResource.getPreValues(newVal, currDataTypeId)
                .then(function (data) {
                    $scope.preValuesLoaded = true;
                    $scope.content.preValues = data;
                    createPreValueProps($scope.content.preValues);
                });
        }
    });

    $scope.save = function () {
        $scope.$broadcast("saving", { scope: $scope });
    
        //ensure there is a form object assigned.
        var currentForm = angularHelper.getRequiredCurrentForm($scope);

        //don't continue if the form is invalid
        if (currentForm.$invalid) return;

        serverValidationManager.reset();
        
        dataTypeResource.save($scope.content, $scope.preValues, $routeParams.create)
            .then(function (data) {
                
                contentEditingHelper.handleSuccessfulSave({
                    scope: $scope,
                    newContent: data,
                    rebindCallback: function() {
                        createPreValueProps(data.preValues);
                    }
                });

            }, function (err) {
                
                //NOTE: in the case of data type values we are setting the orig/new props 
                // to be the same thing since that only really matters for content/media.
                contentEditingHelper.handleSaveError({
                    err: err,
                    allNewProps: $scope.preValues,
                    allOrigProps: $scope.preValues
                });
        });
    };

}

angular.module("umbraco").controller("Umbraco.Editors.DataType.EditController", DataTypeEditController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.Media.CreateController
 * @function
 * 
 * @description
 * The controller for the media creation dialog
 */
function mediaCreateController($scope, $routeParams, mediaTypeResource, iconHelper) {
    
    mediaTypeResource.getAllowedTypes($scope.currentNode.id).then(function(data) {
        $scope.allowedTypes = iconHelper.formatContentTypeThumbnails(data);
    });
    
}

angular.module('umbraco').controller("Umbraco.Editors.Media.CreateController", mediaCreateController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.Media.EditController
 * @function
 * 
 * @description
 * The controller for the media editor
 */
function mediaEditController($scope, $routeParams, mediaResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, fileManager, editorContextService) {

    //initialize the file manager
    fileManager.clearFiles();

    if ($routeParams.create) {

        mediaResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function (data) {
                $scope.loaded = true;
                $scope.content = data;

                editorContextService.setContext($scope.content);
            });
    }
    else {
        mediaResource.getById($routeParams.id)
            .then(function (data) {
                $scope.loaded = true;
                $scope.content = data;
                
                editorContextService.setContext($scope.content);
                
                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationManager.executeAndClearAllSubscriptions();

            });
    }
        
    $scope.save = function () {
        
        $scope.$broadcast("saving", { scope: $scope });

        var currentForm = angularHelper.getRequiredCurrentForm($scope);
        //don't continue if the form is invalid
        if (currentForm.$invalid) return;
        
        serverValidationManager.reset();

        mediaResource.save($scope.content, $routeParams.create, fileManager.getFiles())
            .then(function (data) {

                contentEditingHelper.handleSuccessfulSave({
                    scope: $scope,
                    newContent: data,
                    rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                });
                
            }, function (err) {
                
                contentEditingHelper.handleSaveError({
                    err: err,
                    redirectOnFailure: true,
                    allNewProps: contentEditingHelper.getAllProps(err.data),
                    rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, err.data)
                });
            });
    };
}

angular.module("umbraco")
    .controller("Umbraco.Editors.Media.EditController", mediaEditController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function MediaSortController($scope, mediaResource, treeService) {

    $scope.sortableModel = {
        itemsToSort: [],
        name: $scope.nav.ui.currentNode.name
    };

    mediaResource.getChildren($scope.currentNode.id).then(function (data) {
        $scope.sortableModel.itemsToSort = [];
        for (var i = 0; i < data.length; i++) {
            $scope.sortableModel.itemsToSort.push({
                id: data[i].id,
                column1: data[i].name,
                column2: data[i].updateDate,
                column3: data[i].sortOrder
            });
        }
    });

    $scope.$on("umbItemSorter.ok", function (event) {
        $scope.nav.hideDialog();
    });
    $scope.$on("umbItemSorter.cancel", function (event) {
        $scope.nav.hideDialog();
    });

    $scope.$on("umbItemSorter.sorting", function (event, args) {

        var sortedIds = [];
        for (var i = 0; i < args.sortedItems.length; i++) {
            sortedIds.push(args.sortedItems[i].id);
        }
        mediaResource.sort({ parentId: $scope.currentNode.id, sortedIds: sortedIds })
            .then(function () {
                $scope.sortableModel.complete = true;
                treeService.loadNodeChildren({ node: $scope.nav.ui.currentNode, section: $scope.nav.ui.currentSection });
            });

    });

}

angular.module("umbraco").controller("Umbraco.Editors.Media.SortController", MediaSortController);

angular.module("umbraco").controller("Umbraco.Editors.MultiValuesController",
    function ($scope, $timeout) {
       
        //NOTE: We need to make each item an object, not just a string because you cannot 2-way bind to a primitive.

        $scope.newItem = "";
        $scope.hasError = false;
       
        if (!angular.isArray($scope.model.value)) {
            //make an array from the dictionary
            var items = [];
            for (var i in $scope.model.value) { 
                items.push({value: $scope.model.value[i]});
            }
            //now make the editor model the array
            $scope.model.value = items;
        }

        $scope.remove = function(item, evt) {

            evt.preventDefault();

            $scope.model.value = _.reject($scope.model.value, function (x) {
                return x.value === item.value;
            });
            
        };

        $scope.add = function (evt) {
            
            evt.preventDefault();
            
            
            if ($scope.newItem) {
                if (!_.contains($scope.model.value, $scope.newItem)) {                
                    $scope.model.value.push({ value: $scope.newItem });
                    $scope.newItem = "";
                    $scope.hasError = false;
                    return;
                }
            }

            //there was an error, do the highlight (will be set back by the directive)
            $scope.hasError = true;            
        };

    });

function booleanEditorController($scope, $rootScope, assetsService) {
    $scope.renderModel = {
        value: false
    };
    if ($scope.model && $scope.model.value && ($scope.model.value.toString() === "1" || angular.lowercase($scope.model.value) === "true")) {
        $scope.renderModel.value = true;
    }

    $scope.$watch("renderModel.value", function (newVal) {
        $scope.model.value = newVal === true ? "1" : "0";
    });

}
angular.module("umbraco").controller("Umbraco.Editors.BooleanController", booleanEditorController);
angular.module("umbraco").controller("Umbraco.Editors.CheckboxListController",
    function($scope) {

        $scope.selectedItems = [];
                
        if (!angular.isObject($scope.model.config.items)) {
            throw "The model.config.items property must be either a dictionary";
        }
        
        //now we need to check if the value is null/undefined, if it is we need to set it to "" so that any value that is set
        // to "" gets selected by default
        if ($scope.model.value === null || $scope.model.value === undefined) {
            $scope.model.value = [];
        }

        for (var i in $scope.model.config.items) {
            var isChecked = _.contains($scope.model.value, i);
            $scope.selectedItems.push({ checked: isChecked, key: i, val: $scope.model.config.items[i] });
        }

        //update the model when the items checked changes
        $scope.$watch("selectedItems", function(newVal, oldVal) {

            $scope.model.value = [];
            for (var x = 0; x < $scope.selectedItems.length; x++) {
                if ($scope.selectedItems[x].checked) {
                    $scope.model.value.push($scope.selectedItems[x].key);
                }
            }

        }, true);

    });

angular.module("umbraco").controller("Umbraco.Editors.CodeMirrorController", 
    function ($scope, $rootScope, assetsService) {
    
    /*   
    require(
        [
            'css!../lib/codemirror/js/lib/codemirror.css',
            'css!../lib/codemirror/css/umbracoCustom.css',
            'codemirrorHtml'
        ],
        function () {

            var editor = CodeMirror.fromTextArea(
                                    document.getElementById($scope.alias), 
                                    {
                                        mode: CodeMirror.modes.htmlmixed, 
                                        tabMode: "indent"
                                    });

            editor.on("change", function(cm) {
                $rootScope.$apply(function(){
                    $scope.value = cm.getValue();   
                });
            });

        });*/
});
function ColorPickerController($scope) {
    $scope.selectItem = function (color) {
        $scope.model.value = color;
    };
}

angular.module("umbraco").controller("Umbraco.Editors.ColorPickerController", ColorPickerController);

//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco')
.controller("Umbraco.Editors.ContentPickerController",
	
	function($scope, dialogService, entityResource, $log, iconHelper){
		$scope.ids = $scope.model.value.split(',');
		$scope.renderModel = [];
		$scope.multipicker = true;

		entityResource.getDocumentsByIds($scope.ids).then(function(data){
			$(data).each(function(i, item){
				item.icon = iconHelper.convertFromLegacyIcon(item.icon);
				$scope.renderModel.push({name: item.name, id: item.id, icon: item.icon});
			});
		});

		$scope.openContentPicker =function(){
			var d = dialogService.contentPicker({scope: $scope, multipicker: $scope.multipicker, callback: populate});
		};

		$scope.remove =function(index){
			$scope.renderModel.splice(index, 1);
			$scope.ids.splice(index, 1);
			$scope.model.value = trim($scope.ids.join(), ",");
		};

		$scope.add =function(item){
			if($scope.ids.indexOf(item.id) < 0){
				item.icon = iconHelper.convertFromLegacyIcon(item.icon);
				$scope.renderModel.push({name: item.name, id: item.id, icon: item.icon});
				$scope.ids.push(item.id);
				$scope.model.value = trim($scope.ids.join(), ",");
			}	
		};

		$scope.clear = function(){
			$scope.ids = [];
			$scope.model.value = "";
			$scope.renderModel = [];
		}

		function trim(str, chr) {
			var rgxtrim = (!chr) ? new RegExp('^\\s+|\\s+$', 'g') : new RegExp('^'+chr+'+|'+chr+'+$', 'g');
			return str.replace(rgxtrim, '');
		}

		function populate(data){
			if(data.selection && angular.isArray(data.selection)){
				$(data.selection).each(function(i, item){
					$scope.add(item);
				});
			}else{
				$scope.clear();
				$scope.add(data);
			}
		}
});
angular.module("umbraco").controller("Umbraco.Editors.DatepickerController",
    function ($scope, notificationsService, assetsService) {

        //setup the default config
        var config = {
            pickDate: true,
            pickTime: true,
            format: "yyyy-MM-dd HH:mm:ss"
        };
        //map the user config
        angular.extend(config, $scope.model.config);
        //map back to the model
        $scope.model.config = config;

        assetsService.loadJs(
                'views/propertyeditors/datepicker/bootstrap-datetimepicker.min.js'
            ).then(
            function () {
                //The Datepicker js and css files are available and all components are ready to use.

                // Get the id of the datepicker button that was clicked
                var pickerId = $scope.model.alias;

                // Open the datepicker and add a changeDate eventlistener
                $("#" + pickerId).datetimepicker($scope.model.config).on("changeDate", function (e) {
                    // when a date is changed, update the model
                    if (e.localDate) {
                        if ($scope.model.config.format == "yyyy-MM-dd HH:mm:ss") {
                            $scope.model.value = e.localDate.toIsoDateTimeString();
                        }
                        else {
                            $scope.model.value = e.localDate.toIsoDateString();
                        }
                    }
                    else {
                        $scope.model.value = null;
                    }

                });
            });


        assetsService.loadCss(
                'views/propertyeditors/datepicker/bootstrap-datetimepicker.min.css'
            );
    });

angular.module("umbraco").controller("Umbraco.Editors.DropdownController",
    function($scope) {

        //setup the default config
        var config = {
            items: [],
            multiple: false
        };

        //map the user config
        angular.extend(config, $scope.model.config);
        //map back to the model
        $scope.model.config = config;
        
        if (angular.isArray($scope.model.config.items)) {
            //now we need to format the items in the array because we always want to have a dictionary
            var newItems = {};
            for (var i = 0; i < $scope.model.config.items.length; i++) {
                newItems[$scope.model.config.items[i]] = $scope.model.config.items[i];
            }
            $scope.model.config.items = newItems;
        }
        else if (!angular.isObject($scope.model.config.items)) {
            throw "The items property must be either an array or a dictionary";
        }
        
        //now we need to check if the value is null/undefined, if it is we need to set it to "" so that any value that is set
        // to "" gets selected by default
        if ($scope.model.value === null || $scope.model.value === undefined) {
            if ($scope.model.config.multiple) {
                $scope.model.value = [];
            }
            else {
                $scope.model.value = "";
            }
        }
        
    });

/**
 * @ngdoc controller
 * @name Umbraco.Editors.FileUploadController
 * @function
 * 
 * @description
 * The controller for the file upload property editor. It is important to note that the $scope.model.value
 *  doesn't necessarily depict what is saved for this property editor. $scope.model.value can be empty when we 
 *  are submitting files because in that case, we are adding files to the fileManager which is what gets peristed
 *  on the server. However, when we are clearing files, we are setting $scope.model.value to "{clearFiles: true}"
 *  to indicate on the server that we are removing files for this property. We will keep the $scope.model.value to 
 *  be the name of the file selected (if it is a newly selected file) or keep it to be it's original value, this allows
 *  for the editors to check if the value has changed and to re-bind the property if that is true.
 * 
*/
function fileUploadController($scope, $element, $compile, imageHelper, fileManager) {

    /** Clears the file collections when content is saving (if we need to clear) or after saved */
    function clearFiles() {        
        //clear the files collection (we don't want to upload any!)
        fileManager.setFiles($scope.id, []);
        //clear the current files
        $scope.files = [];
    }

    /** this method is used to initialize the data and to re-initialize it if the server value is changed */
    function initialize(index)
    {
        if (!index) {
            index = 1;
        }
        
        //this is used in order to tell the umb-single-file-upload directive to 
        //rebuild the html input control (and thus clearing the selected file) since
        //that is the only way to manipulate the html for the file input control.
        $scope.rebuildInput = {
            index: index
        };
        //clear the current files
        $scope.files = [];
        //store the original value so we can restore it if the user clears and then cancels clearing.
        $scope.originalValue = $scope.model.value;

        //create the property to show the list of files currently saved
        if ($scope.model.value != "") {

            var images = $scope.model.value.split(",");

            $scope.persistedFiles = _.map(images, function (item) {
                return { file: item, isImage: imageHelper.detectIfImageByExtension(item) };
            });
        }
        else {
            $scope.persistedFiles = [];
        }

        _.each($scope.persistedFiles, function (file) {
            file.thumbnail = imageHelper.getThumbnailFromPath(file.file);
        });

        $scope.clearFiles = false;
    }

    initialize();

    //listen for clear files changes to set our model to be sent up to the server
    $scope.$watch("clearFiles", function (isCleared) {
        if (isCleared == true) {
            $scope.model.value = "{clearFiles: true}";
            clearFiles();
        }
        else {
            //reset to original value
            $scope.model.value = $scope.originalValue;
        }
    });

    //listen for when a file is selected
    $scope.$on("filesSelected", function (event, args) {
        $scope.$apply(function () {
            //set the files collection
            fileManager.setFiles($scope.model.id, args.files);
            //clear the current files
            $scope.files = [];
            var newVal = "";
            for (var i = 0; i < args.files.length; i++) {
                //save the file object to the scope's files collection
                $scope.files.push({ id: $scope.model.id, file: args.files[i] });
                newVal += args.files[i].name + ",";
            }
            //set clear files to false, this will reset the model too
            $scope.clearFiles = false;
            //set the model value to be the concatenation of files selected. Please see the notes
            // in the description of this controller, it states that this value isn't actually used for persistence,
            // but we need to set it to something so that the editor and the server can detect that it's been changed.
            $scope.model.value = "{selectedFiles: '" + newVal.trimEnd(",") + "'}";
        });
    });
    
    //listen for when the model value has changed
    $scope.$watch("model.value", function(newVal, oldVal) {
        //cannot just check for !newVal because it might be an empty string which we 
        //want to look for.
        if (newVal !== null && newVal !== undefined && newVal !== oldVal) {
            //now we need to check if we need to re-initialize our structure which is kind of tricky
            // since we only want to do that if the server has changed the value, not if this controller
            // has changed the value. There's only 2 scenarios where we change the value internall so 
            // we know what those values can be, if they are not either of them, then we'll re-initialize.
            
            if (newVal !== "{clearFiles: true}" && newVal !== $scope.originalValue && !newVal.startsWith("{selectedFiles:")) {
                initialize($scope.rebuildInput.index + 1);
            }
        }
    });

};
angular.module("umbraco").controller('Umbraco.Editors.FileUploadController', fileUploadController);


angular.module("umbraco")
.controller("Umbraco.Editors.FolderBrowserController",
    function ($rootScope, $scope, assetsService, $routeParams, umbRequestHelper, mediaResource, imageHelper) {
        var dialogOptions = $scope.$parent.dialogOptions;
        $scope.options = {
            url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
            autoUpload: true,
            formData:{
                currentFolder: $routeParams.id
            }
        };

        $scope.loadChildren = function(id){
            mediaResource.getChildren(id)
                .then(function(data) {
                    $scope.images = data;
                    //update the thumbnail property
                    _.each($scope.images, function(img) {
                        img.thumbnail = imageHelper.getThumbnail({ imageModel: img, scope: $scope });
                    });
                });    
        };

        $scope.$on('fileuploadstop', function(event, files){
            $scope.loadChildren($scope.options.formData.currentFolder);
        });
        
        //init load
        $scope.loadChildren($routeParams.id);
    }
);
angular.module("umbraco")
.controller("Umbraco.Editors.GoogleMapsController",
    function ($rootScope, $scope, notificationsService, dialogService, assetsService, $log, $timeout) {
    
    assetsService.loadJs('http://www.google.com/jsapi')
        .then(function(){
            google.load("maps", "3",
                        {
                            callback: initMap,
                            other_params: "sensor=false"
                        });
    });

    function initMap(){
        //Google maps is available and all components are ready to use.
        var valueArray = $scope.model.value.split(',');
        var latLng = new google.maps.LatLng(valueArray[0], valueArray[1]);      
        var mapDiv = document.getElementById($scope.model.alias + '_map');
        var mapOptions = {
            zoom: $scope.model.config.zoom,
            center: latLng,
            mapTypeId: google.maps.MapTypeId[$scope.model.config.mapType]
        };
        var geocoder = new google.maps.Geocoder();
        var map = new google.maps.Map(mapDiv, mapOptions);

        var marker = new google.maps.Marker({
            map: map,
            position: latLng,
            draggable: true
        });

        google.maps.event.addListener(map, 'click', function(event) {

            dialogService.mediaPicker({scope: $scope, callback: function(data){
                var image = data.selection[0].src;

                var latLng = event.latLng;
                var marker = new google.maps.Marker({
                    map: map,
                    icon: image,
                    position: latLng,
                    draggable: true
                });

                google.maps.event.addListener(marker, "dragend", function(e){
                    var newLat = marker.getPosition().lat();
                    var newLng = marker.getPosition().lng();

                    codeLatLng(marker.getPosition(), geocoder);

                    //set the model value
                    $scope.model.vvalue = newLat + "," + newLng;
                });

            }});
        });

        $('a[data-toggle="tab"]').on('shown', function (e) {
            google.maps.event.trigger(map, 'resize');
        });
    }

    function codeLatLng(latLng, geocoder) {
        geocoder.geocode({'latLng': latLng},
            function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var location = results[0].formatted_address;
                        $rootScope.$apply(function () {
                            notificationsService.success("Peter just went to: ", location);
                        });
                }
            });
    }
});
'use strict';
//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module("umbraco").controller("Umbraco.Editors.GridController", 
  function($rootScope, $scope, dialogService, $log){
    //we most likely will need some iframe-motherpage interop here
    
    //we most likely will need some iframe-motherpage interop here
       $scope.openMediaPicker =function(){
               var d = dialogService.mediaPicker({scope: $scope, callback: renderImages});
       };

       $scope.openPropertyDialog =function(){
               var d = dialogService.property({scope: $scope, callback: renderProperty});
       };

       $scope.openMacroDialog =function(){
               var d = dialogService.macroPicker({scope: $scope, callback: renderMacro});
       };

       function renderProperty(data){
          $scope.currentElement.html("<h1>boom, property!</h1>"); 
       }

       function renderMacro(data){
       //   $scope.currentElement.html( macroFactory.renderMacro(data.macro, -1) ); 
       }
      
       function renderImages(data){
           var list = $("<ul class='thumbnails'></ul>")
           $.each(data.selection, function(i, image) {
               list.append( $("<li class='span2'><img class='thumbnail' src='" + image.src + "'></li>") );
           });

           $scope.currentElement.html( list[0].outerHTML); 
       }

       $(window).bind("umbraco.grid.click", function(event){

           $scope.$apply(function () {
               $scope.currentEditor = event.editor;
               $scope.currentElement = $(event.element);

               if(event.editor == "macro")
                   $scope.openMacroDialog();
               else if(event.editor == "image")
                   $scope.openMediaPicker();
               else
                   $scope.propertyDialog();
           });
       })
});
angular.module("umbraco")
    .controller("Umbraco.Editors.ListViewController", 
        function ($rootScope, $scope, $routeParams, contentResource, contentTypeResource) {
        
        $scope.options = {
            pageSize: 10,
            pageNumber: 1,
            filter: '',
            orderBy: 'id',
            orderDirection: "desc"
        };

        
        $scope.next = function(){
            if ($scope.options.pageNumber < $scope.listViewResultSet.totalPages) {
                $scope.options.pageNumber++;
                $scope.reloadView();   
            }
        };

        $scope.goToPage = function (pageNumber) {
            $scope.options.pageNumber = pageNumber + 1;
            $scope.reloadView();
        };

        $scope.sort = function(field){
            $scope.options.sortby = field;
            
            if(field !== $scope.options.sortby){
                if($scope.options.order === "desc"){
                    $scope.options.order = "asc";
                }else{
                    $scope.options.order = "desc";
                }
            }
            $scope.reloadView();
        };

        $scope.prev = function(){
            if ($scope.options.pageNumber > 1) {
                $scope.options.pageNumber--;
                $scope.reloadView();
            }
        };

        /*Loads the search results, based on parameters set in prev,next,sort and so on*/
        /*Pagination is done by an array of objects, due angularJS's funky way of monitoring state
        with simple values */
                
        $scope.reloadView = function(id) {
            contentResource.getChildren(id, $scope.options).then(function(data) {
                
                $scope.listViewResultSet = data;
                $scope.pagination = [];

                for (var i = $scope.listViewResultSet.totalPages - 1; i >= 0; i--) {
                    $scope.pagination[i] = { index: i, name: i + 1 };
                }

                if ($scope.options.pageNumber > $scope.listViewResultSet.totalPages) {
                    $scope.options.pageNumber = $scope.listViewResultSet.totalPages;
                }

            });
        };


        if($routeParams.id){
            $scope.pagination = new Array(100);
            $scope.listViewAllowedTypes = contentTypeResource.getAllowedTypes($routeParams.id);
            $scope.reloadView($routeParams.id);
        }
        
});

//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco').controller("Umbraco.Editors.MediaPickerController", 
	function($rootScope, $scope, dialogService, mediaResource, imageHelper, $log){
	// 
	//$( "#draggable" ).draggable();


	//saved value contains a list of images with their coordinates a Dot coordinates
	//this will be $scope.model.value...
	var sampleData = [
		{id: 1143, coordinates: {x:123,y:345}, center: {x:123,y:12}},
		{id: 1144, coordinates: {x:123,y:345}, center: {x:123,y:12}},
		{id: 1145, coordinates: {x:123,y:345}, center: {x:123,y:12}},
	];

	$scope.images = sampleData;
	$($scope.images).each(function(i,img){
		mediaResource.getById(img.id).then(function(media){
			//img.media = media;

			//shortcuts
			//TODO, do something better then this for searching
			img.src = imageHelper.getImagePropertyValue({imageModel: media});
			img.thumbnail = imageHelper.getThumbnailFromPath(img.src); 
		});
	});

 	//List of crops with name and size			
 	$scope.config = {
 		crops: [
	 		{name: "default", x:300,y:400},
	 		{name: "header", x:23,y:40},
	 		{name: "tiny", x:10,y:10}
 		]};


 		$scope.openMediaPicker =function(value){
 			var d = dialogService.mediaPicker({scope: $scope, callback: populate});
 		};

 		$scope.crop = function(image){
 			$scope.currentImage = image;
 		};

 		function populate(data){
 			$scope.model.value = data.selection;
 		}
 	});

function MultipleTextBoxController($scope) {

    if (!$scope.model.value) {
        $scope.model.value = [];
    }
    
    //add any fields that there isn't values for
    if ($scope.model.config.min > 0) {
        for (var i = 0; i < $scope.model.config.min; i++) {
            if ((i + 1) > $scope.model.value.length) {
                $scope.model.value.push({ value: "" });
            }
        }
    }

    $scope.add = function () {
        if ($scope.model.config.max <= 0 || $scope.model.value.length < $scope.model.config.max) {
            $scope.model.value.push({ value: "" });
        }
    };

    $scope.remove = function(index) {
        var remainder = [];
        for (var x = 0; x < $scope.model.value.length; x++) {
            if (x !== index) {
                remainder.push($scope.model.value[x]);
            }
        }
        $scope.model.value = remainder;
    };

}

angular.module("umbraco").controller("Umbraco.Editors.MultipleTextBoxController", MultipleTextBoxController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.ReadOnlyValueController
 * @function
 * 
 * @description
 * The controller for the readonlyvalue property editor. 
 *  This controller offer more functionality than just a simple label as it will be able to apply formatting to the 
 *  value to be displayed. This means that we also have to apply more complex logic of watching the model value when 
 *  it changes because we are creating a new scope value called displayvalue which will never change based on the server data.
 *  In some cases after a form submission, the server will modify the data that has been persisted, especially in the cases of 
 *  readonlyvalues so we need to ensure that after the form is submitted that the new data is reflected here.
*/
function ReadOnlyValueController($rootScope, $scope, $filter) {

    function formatDisplayValue() {
        
        if ($scope.model.config &&
        angular.isArray($scope.model.config) &&
        $scope.model.config.length > 0 &&
        $scope.model.config[0] &&
        $scope.model.config.filter) {

            if ($scope.model.config.format) {
                $scope.displayvalue = $filter($scope.model.config.filter)($scope.model.value, $scope.model.config.format);
            } else {
                $scope.displayvalue = $filter($scope.model.config.filter)($scope.model.value);
            }
        } else {
            $scope.displayvalue = $scope.model.value;
        }

    }

    //format the display value on init:
    formatDisplayValue();
    
    $scope.$watch("model.value", function (newVal, oldVal) {
        //cannot just check for !newVal because it might be an empty string which we 
        //want to look for.
        if (newVal !== null && newVal !== undefined && newVal !== oldVal) {
            //update the display val again
            formatDisplayValue();
        }
    });
}

angular.module('umbraco').controller("Umbraco.Editors.ReadOnlyValueController", ReadOnlyValueController);
angular.module("umbraco")
    .controller("Umbraco.Editors.RTEController",
    function($rootScope, $scope, dialogService, $log, imageHelper, assetsService, $timeout){

    assetsService.loadJs("lib/tinymce/tinymce.min.js", $scope).then(function(){
        //we need to add a timeout here, to force a redraw so TinyMCE can find
        //the elements needed
        $timeout(function(){
            tinymce.DOM.events.domLoaded = true;
            tinymce.init({
                mode: "exact",
                elements: $scope.model.alias+"_rte",
                skin: "umbraco",
                menubar : false,
                statusbar: false,
                height: 340,
                toolbar: "bold italic | styleselect | alignleft aligncenter alignright | bullist numlist | outdent indent | link image mediapicker iconpicker embeddialog",
                setup : function(editor) {
                        editor.on('blur', function(e) {
                            $scope.$apply(function() {
                                $scope.model.value = editor.getContent();
                            });
                        });

                        editor.addButton('mediapicker', {
                            icon: 'media',
                            tooltip: 'Media Picker',
                            onclick: function(){
                                dialogService.mediaPicker({scope: $scope, callback: function(img){
                                    
                                    if(img){
                                        var imagePropVal = imageHelper.getImagePropertyValue({imageModel: img, scope: $scope});
                                        var data = {
                                            src: (imagePropVal != null && imagePropVal != "") ? imagePropVal: "nothing.jpg",
                                            id: '__mcenew'
                                        };
                                        

                                        editor.insertContent(editor.dom.createHTML('img', data));
                                        
                                        $timeout(function(){
                                             var imgElm = editor.dom.get('__mcenew');
                                             var size = editor.dom.getSize(imgElm);
                                             $log.log(size);

                                             var newSize = imageHelper.scaleToMaxSize(500, size.w, size.h);
                                             var s = "width: " + newSize.width + "px; height:" + newSize.height + "px;";
                                             editor.dom.setAttrib(imgElm, 'style', s);
                                             editor.dom.setAttrib(imgElm, 'rel', newSize.width + "," + newSize.height);
                                             editor.dom.setAttrib(imgElm, 'id', null);
                                             
                                        }, 500);
                                    }
                                }});
                            }
                        });

                        editor.addButton('iconpicker', {
                            icon: 'media',
                            tooltip: 'Icon Picker',
                            onclick: function(){
                                dialogService.open({show: true, template: "views/common/dialogs/iconpicker.html", scope: $scope, callback: function(c){
                                   
                                    var data = {
                                        style: 'font-size: 60px'
                                    };

                                    var i = editor.dom.createHTML('i', data);
                                    tinyMCE.activeEditor.dom.addClass(i, c);
                                    editor.insertContent(i);
                                }});
                            }
                        });
                    
                        editor.addButton('embeddialog', {
                            icon: 'media',
                            tooltip: 'Embed',
                            onclick: function () {
                                dialogService.embedDialog({
                                    scope: $scope, callback: function (data) {
                                        editor.insertContent(data);
                                    }
                                });
                            }
                        });
                  }
            });
        }, 1);

    });
});
angular.module("umbraco")
.controller("Umbraco.Editors.TagsController",
    function ($rootScope, $scope, $log, assetsService) {
		
		assetsService.loadJs(
			'views/propertyeditors/tags/bootstrap-tags.custom.js'
			).then(function(){

			//// Get data from tagsFactory
			//$scope.tags = tagsResource.getTags("group");
			$scope.tags = [];

			// Initialize bootstrap-tags.js script
			var tags = $('#' + $scope.model.alias + "_tags").tags({
				tagClass: 'label-inverse'
			});

			$.each($scope.tags, function(index, tag) {
				tags.addTag(tag.label);
			});
		});

		assetsService.loadCss('views/propertyeditors/tags/bootstrap-tags.custom.css');
	}
);
//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco').controller("Umbraco.Editors.EmbeddedContentController", 
	function($rootScope, $scope, $log){
    
	$scope.showForm = false;
	$scope.fakeData = [];

	$scope.create = function(){
		$scope.showForm = true;
		$scope.fakeData = angular.copy($scope.model.config.fields);
	};

	$scope.show = function(){
		$scope.showCode = true;
	};

	$scope.add = function(){
		$scope.showForm = false;
		if ( !($scope.model.value instanceof Array)) {
			$scope.model.value = [];
		}

		$scope.model.value.push(angular.copy($scope.fakeData));
		$scope.fakeData = [];
	};
});
angular.module('umbraco').controller("Umbraco.Editors.UrlListController",
	function($rootScope, $scope, $filter) {

	    $scope.renderModel = _.map($scope.model.value.split(","), function(item) {
	        return {
	            url: item,
	            urlTarget : ($scope.config && $scope.config.target) ? $scope.config.target : "_blank" 
	        };
	    });

	});
angular.module('umbraco').controller("Umbraco.Editors.UserPickerController", 
	function($rootScope, $scope, $log, userResource){

    userResource.getAll().then(function (userArray) {
        $scope.users = userArray;
    });
    	    
    if ($scope.model.value === null || $scope.model.value === undefined) {
        $scope.model.value = "";
    }
});
/**
 * @ngdoc controller
 * @name Umbraco.Editors.Settings.Template.EditController
 * @function
 * 
 * @description
 * The controller for editing templates
 */
function TemplateEditController($scope, navigationService) {
    $scope.template = "<html><body><h1>Hej</h1></body></html>";
}

angular.module("umbraco").controller("Umbraco.Editors.Settings.Template.EditController", TemplateEditController);


})();