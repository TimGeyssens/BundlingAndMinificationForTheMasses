/*! umbraco - v0.0.1-TechnicalPReview - 2013-10-11
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
	function ($scope, eventsService, entityResource, searchService, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	$scope.dialogTreeEventHandler = $({});
	$scope.results = [];

	$scope.selectResult = function(result){
		entityResource.getById(result.id, "Document").then(function(ent){
			if(dialogOptions && dialogOptions.multipicker){
				
				$scope.showSearch = false;
				$scope.results = [];
				$scope.term = "";
				$scope.oldTerm = undefined;

				$scope.select(ent);
			}else{
				$scope.submit(ent);
			}
		});
	};

	$scope.performSearch = function(){
		if($scope.term){
			if($scope.oldTerm !== $scope.term){
				$scope.results = [];
				searchService.searchContent({term: $scope.term, results: $scope.results});
				$scope.showSearch = true;
				$scope.oldTerm = $scope.term;
			}
		}else{
			$scope.oldTerm = "";
			$scope.showSearch = false;
			$scope.results = [];
		}
	};


	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Dialogs.ContentPickerController.Select", args).then(function(args){
			if(dialogOptions && dialogOptions.multipicker){
				
				var c = $(args.event.target.parentElement);
				if(!args.node.selected){
					args.node.selected = true;
					c.find("i.umb-tree-icon").hide()
					.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
				}else{
					args.node.selected = false;
					c.find(".temporary").remove();
					c.find("i.umb-tree-icon").show();
				}

				$scope.select(args.node);

			}else{
				$scope.submit(args.node);					
			}
			
		});

	});
});
angular.module("umbraco")
    .controller("Umbraco.Dialogs.HelpController", function ($scope, $location, $routeParams) {
        $scope.section = $routeParams.section;
        if(!$scope.section){
            $scope.section ="content";
        }
    });
//used for the icon picker dialog
angular.module("umbraco")
    .controller("Umbraco.Dialogs.IconPickerController",
        function ($scope, iconHelper) {
            iconHelper.getIcons("").then(function(icons){
            	$scope.icons = icons;
            });
});
/**
 * @ngdoc controller
 * @name Umbraco.Dialogs.InsertMacroController
 * @function
 * 
 * @description
 * The controller for the custom insert macro dialog. Until we upgrade the template editor to be angular this 
 * is actually loaded into an iframe with full html.
 */
function InsertMacroController($scope, entityResource, macroResource, umbPropEditorHelper, macroService, formHelper) {

    /** changes the view to edit the params of the selected macro */
    function editParams() {
        //get the macro params if there are any
        macroResource.getMacroParameters($scope.selectedMacro.id)
            .then(function (data) {

                //go to next page if there are params otherwise we can just exit
                if (!angular.isArray(data) || data.length === 0) {
                    //we can just exist!
                    submitForm();

                } else {
                    $scope.wizardStep = "paramSelect";
                    $scope.macroParams = data;
                    
                    //fill in the data if we are editing this macro
                    if ($scope.dialogData && $scope.dialogData.macroData && $scope.dialogData.macroData.marcoParamsDictionary) {
                        _.each($scope.dialogData.macroData.marcoParamsDictionary, function (val, key) {
                            var prop = _.find($scope.macroParams, function (item) {
                                return item.alias == key;
                            });
                            if (prop) {
                                prop.value = val;
                            }
                        });

                    }
                }
            });
    }

    /** submit the filled out macro params */
    function submitForm() {
        
        //collect the value data, close the dialog and send the data back to the caller

        //create a dictionary for the macro params
        var paramDictionary = {};
        _.each($scope.macroParams, function (item) {
            paramDictionary[item.alias] = item.value;
        });
        
        //need to find the macro alias for the selected id
        var macroAlias = $scope.selectedMacro.alias;

        //get the syntax based on the rendering engine
        var syntax;
        if ($scope.dialogData.renderingEngine && $scope.dialogData.renderingEngine === "WebForms") {
            syntax = macroService.generateWebFormsSyntax({ macroAlias: macroAlias, marcoParamsDictionary: paramDictionary });
        }
        else if ($scope.dialogData.renderingEngine && $scope.dialogData.renderingEngine === "Mvc") {
            syntax = macroService.generateMvcSyntax({ macroAlias: macroAlias, marcoParamsDictionary: paramDictionary });
        }
        else {
            syntax = macroService.generateMacroSyntax({ macroAlias: macroAlias, marcoParamsDictionary: paramDictionary });
        }

        $scope.submit({ syntax: syntax, macroAlias: macroAlias, marcoParamsDictionary: paramDictionary });
    }

    $scope.macros = [];
    $scope.selectedMacro = null;
    $scope.wizardStep = "macroSelect";
    $scope.macroParams = [];
    
    $scope.submitForm = function () {
        
        if (formHelper.submitForm({ scope: $scope })) {
        
            formHelper.resetForm({ scope: $scope });

            if ($scope.wizardStep === "macroSelect") {
                editParams();
            }
            else {
                submitForm();
            }

        }
    };

    //here we check to see if we've been passed a selected macro and if so we'll set the
    //editor to start with parameter editing
    if ($scope.dialogData && $scope.dialogData.macroData) {
        $scope.wizardStep = "paramSelect";
    }
    
    //get the macro list - pass in a filter if it is only for rte
    entityResource.getAll("Macro", ($scope.dialogData && $scope.dialogData.richTextEditor && $scope.dialogData.richTextEditor === true) ? "UseInEditor=true" : null)
        .then(function (data) {

            $scope.macros = data;

            //check if there's a pre-selected macro and if it exists
            if ($scope.dialogData && $scope.dialogData.macroData && $scope.dialogData.macroData.macroAlias) {
                var found = _.find(data, function (item) {
                    return item.alias === $scope.dialogData.macroData.macroAlias;
                });
                if (found) {
                    //select the macro and go to next screen
                    $scope.selectedMacro = found.id;
                    editParams();
                    return;
                }
            }
            //we don't have a pre-selected macro so ensure the correct step is set
            $scope.wizardStep = "macroSelect";
        });


}

angular.module("umbraco").controller("Umbraco.Dialogs.InsertMacroController", InsertMacroController);

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

//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.LinkPickerController",
	function ($scope, eventsService, entityResource, contentResource, $log) {
	var dialogOptions = $scope.$parent.dialogOptions;
	
	$scope.dialogTreeEventHandler = $({});
	$scope.target = {};

	if(dialogOptions.currentTarget){
		$scope.target = dialogOptions.currentTarget;

		//if we a node ID, we fetch the current node to build the form data
		if($scope.target.id){

			if(!$scope.target.path) {
			    entityResource.getPath($scope.target.id, "Document").then(function (path) {
			        $scope.target.path = path;
			    });
			}

			contentResource.getNiceUrl($scope.target.id).then(function(url){
				$scope.target.url = angular.fromJson(url);
			});
		}
	}


	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Dialogs.LinkPickerController.Select", args).then(function(args){
				var c = $(args.event.target.parentElement);

				//renewing
				if(args.node !== $scope.target){
					if($scope.selectedEl){
						$scope.selectedEl.find(".temporary").remove();
						$scope.selectedEl.find("i.umb-tree-icon").show();
					}

					$scope.selectedEl = c;
					$scope.target = args.node;
					$scope.target.name = args.node.name;

					$scope.selectedEl.find("i.umb-tree-icon")
					 .hide()
					 .after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
					
					if(args.node.id < 0){
						$scope.target.url = "/";
					}else{
						contentResource.getNiceUrl(args.node.id).then(function(url){
							$scope.target.url = angular.fromJson(url);
						});
					}
				}else{
					$scope.target = undefined;
					//resetting
					if($scope.selectedEl){
						$scope.selectedEl.find(".temporary").remove();
						$scope.selectedEl.find("i.umb-tree-icon").show();
					}
				}
		});

	});
});
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
        
        //if the login and password are not empty we need to automatically 
        // validate them - this is because if there are validation errors on the server
        // then the user has to change both username & password to resubmit which isn't ideal,
        // so if they're not empty , we'l just make sure to set them to valid.
        if (login && password && login.length > 0 && password.length > 0) {
            $scope.loginForm.username.$setValidity('auth', true);
            $scope.loginForm.password.$setValidity('auth', true);
        }
        
        
        if ($scope.loginForm.$invalid) {
            return;
        }

        userService.authenticate(login, password)
            .then(function (data) {
                
                var iframe = $("#right");
                if (iframe) {
                    var url = decodeURIComponent($routeParams.url);
                    if (!url) {
                        url = "dashboard.aspx";
                    }
                    iframe.attr("src", url);
                }

                $scope.submit(true);
                
                
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
                    entityResource.getAncestors(folderId, "media")
                        .then(function(anc){
                           // anc.splice(0,1);  
                            $scope.path = anc;
                        });
                }else{
                    $scope.path = [];
                }
                


                //mediaResource.rootMedia()
                mediaResource.getChildren(folderId)
                    .then(function(data) {
                        
                        $scope.images = [];
                        $scope.searchTerm = "";
                        $scope.images = data.items;
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
            
            $scope.clickHandler = function(image, ev){
                

                if (image.contentTypeAlias.toLowerCase() == 'folder') {      
                    $scope.options.formData.currentFolder = image.id;
                    $scope.gotoFolder(image.id);
                }else if (image.contentTypeAlias.toLowerCase() == 'image') {
                    eventsService.publish("Umbraco.Dialogs.MediaPickerController.Select", image).then(function(image){
                        if(dialogOptions && dialogOptions.multipicker){
                            $scope.select(image);
                            image.cssclass = ($scope.dialogData.selection.indexOf(image) > -1) ? "selected" : "";
                        }else{
                            $scope.submit(image);                 
                        }
                    });
                }

                ev.preventDefault();
            };

            $scope.selectMediaItem = function(image) {
                if (image.contentTypeAlias.toLowerCase() == 'folder') {      
                    $scope.options.formData.currentFolder = image.id;
                    $scope.gotoFolder(image.id);
                }else if (image.contentTypeAlias.toLowerCase() == 'image') {

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
//used for the member picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.MemberPickerController",
	function ($scope, eventsService, searchService, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	$scope.dialogTreeEventHandler = $({});
	$scope.results = [];

	$scope.performSearch = function(){
		if($scope.term){
			if($scope.oldTerm !== $scope.term){
				$scope.results = [];
				searchService.searchMembers({term: $scope.term, results: $scope.results});
				$scope.showSearch = true;
				$scope.oldTerm = $scope.term;
			}
		}else{
			$scope.oldTerm = "";
			$scope.showSearch = false;
			$scope.results = [];
		}
	};


	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		if(args.node.nodetype === "member-folder"){
			return;
		}
		
		eventsService.publish("Umbraco.Dialogs.MemberPickerController.Select", args).then(function(args){
			if(dialogOptions && dialogOptions.multipicker){
				
				var c = $(args.event.target.parentElement);
				if(!args.node.selected){
					args.node.selected = true;
					c.find("i.umb-tree-icon").hide()
					.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
				}else{
					args.node.selected = false;
					c.find(".temporary").remove();
					c.find("i.umb-tree-icon").show();
				}
				$scope.select(args.node);

			}else{
				$scope.submit(args.node);					
			}
			
		});

	});
});
angular.module("umbraco").controller("Umbraco.Dialogs.RteEmbedController", function ($scope, $http) {
    $scope.form = {};
    $scope.form.url = "";
    $scope.form.width = 360;
    $scope.form.height = 240;
    $scope.form.constrain = true;
    $scope.form.preview = "";
    $scope.form.success = false;
    $scope.form.info = "";
    $scope.form.supportsDimensions = false;
    
    var origWidth = 500;
    var origHeight = 300;
    
    $scope.showPreview = function(){

        if ($scope.form.url != "") {
            $scope.form.show = true;
            $scope.form.preview = "<div class=\"umb-loader\" style=\"height: 10px; margin: 10px 0px;\"></div>";
            $scope.form.info = "";
            $scope.form.success = false;

            $http({ method: 'GET', url: '/umbraco/UmbracoApi/RteEmbed/GetEmbed', params: { url: $scope.form.url, width: $scope.form.width, height: $scope.form.height } })
                .success(function (data) {
                    
                    $scope.form.preview = "";
                    
                    switch (data.Status) {
                        case 0:
                            //not supported
                            $scope.form.info = "Not Supported";
                            break;
                        case 1:
                            //error
                            $scope.form.info = "Computer says no";
                            break;
                        case 2:
                            $scope.form.preview = data.Markup;
                            $scope.form.supportsDimensions = data.SupportsDimensions;
                            $scope.form.success = true;
                            break;
                    }
                })
                .error(function() {
                    $scope.form.preview = "";
                    $scope.form.info = "Computer says no";
                });

        }

    };

    $scope.changeSize = function (type) {
        var width, height;
        
        if ($scope.form.constrain) {
            width = parseInt($scope.form.width, 10);
            height = parseInt($scope.form.height, 10);
            if (type == 'width') {
                origHeight = Math.round((width / origWidth) * height);
                $scope.form.height = origHeight;
            } else {
                origWidth = Math.round((height / origHeight) * width);
                $scope.form.width = origWidth;
            }
        }
        if ($scope.form.url != "") {
            $scope.showPreview();
        }

    };
    
    $scope.insert = function(){
        $scope.submit($scope.form.preview);
    };
});
//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Dialogs.TreePickerController",
	function ($scope, entityResource, eventsService, $log, searchService) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	$scope.dialogTreeEventHandler = $({});
	$scope.section = dialogOptions.section;
	$scope.treeAlias = dialogOptions.treeAlias;
	$scope.multiPicker = dialogOptions.multiPicker;
	
	//search defaults
	$scope.searcher = searchService.searchContent;
	$scope.entityType ="Document";
	$scope.results = [];

	if(dialogOptions.treeAlias === "member"){
		$scope.searcher = searchService.searchMembers;
		$scope.entityType = "Member";
	}else if(dialogOptions.treeAlias === "media"){
		$scope.searcher = searchService.searchMedia;
		$scope.entityType = "Media";
	}

	function select(id){
		entityResource.getById(id, $scope.entityType).then(function(ent){
			if($scope.multiPicker){
				
				$scope.showSearch = false;
				$scope.results = [];
				$scope.term = "";
				$scope.oldTerm = undefined;

				$scope.select(ent);
			}else{
				$scope.submit(ent);
			}
		});
	}

	$scope.selectResult = function(result){
		select(result.id);
	};

	$scope.performSearch = function(){
		if($scope.term){
			if($scope.oldTerm !== $scope.term){
				$scope.results = [];
				
				$scope.searcher.call(null, {term: $scope.term, results: $scope.results});
				
				$scope.showSearch = true;
				$scope.oldTerm = $scope.term;
			}
		}else{
			$scope.oldTerm = "";
			$scope.showSearch = false;
			$scope.results = [];
		}
	};

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Dialogs.TreePickerController.Select", args).then(function(args){
			
			select(args.node.id);

			if($scope.multiPicker){
				var c = $(args.event.target.parentElement);
				if(!args.node.selected){
					args.node.selected = true;
					c.find("i.umb-tree-icon").hide()
					.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
				}else{
					args.node.selected = false;
					c.find(".temporary").remove();
					c.find("i.umb-tree-icon").show();
				}
			}
		});
	});
});
angular.module("umbraco")
    .controller("Umbraco.Dialogs.UserController", function ($scope, $location, userService, historyService) {
       
        $scope.user = userService.getCurrentUser();
        $scope.history = historyService.current;

        $scope.logout = function () {
            userService.logout().then(function() {
                $scope.hide();                
            });
    	};

	    $scope.gotoHistory = function (link) {
		    $location.path(link);
	        $scope.$apply();
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
/** This controller is simply here to launch the login dialog when the route is explicitly changed to /login */
angular.module('umbraco').controller("Umbraco.LoginController", function ($scope, userService, $location) {

    userService._showLoginDialog();
    
    //when a user is authorized redirect - this will only be handled here when we are actually on the /login route
    $scope.$on("authenticated", function(evt, data) {
        $location.path("/").search("");
    });

});

/**
 * @ngdoc controller
 * @name Umbraco.MainController
 * @function
 * 
 * @description
 * The main application controller
 * 
 */
function MainController($scope, $location, $routeParams, $rootScope, $timeout, $http, $log, notificationsService, userService, navigationService, legacyJsLoader) {

    var legacyTreeJsLoaded = false;
    
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
        //only close dialogs if non-link and non-buttons are clicked
        var el = event.target.nodeName;
        var els = ["INPUT","A","BUTTON"];

        if(els.indexOf(el) >= 0){return;}

        var parents = $(event.target).parents("a,button");
        if(parents.length > 0){
            return;
        }

        //SD: I've updated this so that we don't close the dialog when clicking inside of the dialog
        var nav = $(event.target).parents("#navigation");
        if (nav.length === 1) {
            return;
        }

        $rootScope.$emit("closeDialogs", event);
    };

    //when a user logs out or timesout
    $scope.$on("notAuthenticated", function() {

        $scope.authenticated = null;
        $scope.user = null;

    });
    
    //when a user is authorized setup the data
    $scope.$on("authenticated", function (evt, data) {

        //We need to load in the legacy tree js but only once no matter what user has logged in 
        if (!legacyTreeJsLoaded) {
            legacyJsLoader.loadLegacyTreeJs($scope).then(
                function (result) {
                    legacyTreeJsLoaded = true;

                    //TODO: We could wait for this to load before running the UI ?
                });
        }

        $scope.authenticated = data.authenticated;
        $scope.user = data.user;

        //if the user has changed we need to redirect to the root so they don't try to continue editing the
        //last item in the URL
        if (data.lastUserId && data.lastUserId !== data.user.id) {
            $location.path("/").search("");
        }

        //var url = "http://www.gravatar.com/avatar/" + $scope.user.emailHash + ".json?404=404";
        //$http.jsonp(url).then(function(response){
        //    $log.log("found: " + response);
        //}, function(data){
        //    $log.log(data);
        //});

        //if($scope.user.avatar){
        //    $http.get($scope.user.avatar).then(function(){
        //        //alert($scope.user.avatar);
        //        $scope.avatar = $scope.user.avatar;
        //    });
        //}

    });

}


//register it
angular.module('umbraco').controller("Umbraco.MainController", MainController);

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

    $scope.$watch(function () {
        //watch the route parameters section
        return $routeParams.section;
    }, function(newVal, oldVal) {
        $scope.currentSection = newVal;
    });

    //trigger search with a hotkey:
    keyboardService.bind("ctrl+shift+s", function(){
        $scope.nav.showSearch();
    });

    //the tree event handler i used to subscribe to the main tree click events
    $scope.treeEventHandler = $({});
    $scope.selectedId = navigationService.currentId;
    
    
    

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

        if(args.event && args.event.altKey){
            args.skipDefault = true;
        }

        navigationService.showMenu(ev, args);
    });

    //this reacts to the options item in the tree
    $scope.searchShowMenu = function (ev, args) {
        
        $scope.currentNode = args.node;
        args.scope = $scope;

        //always skip default
        args.skipDefault = true;

        navigationService.showMenu(ev, args);
    };

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
        else if(n.routePath){
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
    navigationService.ui.search = searchService.results;

    $scope.deActivateSearch = function () {
        currentTerm = "";
    };

    $scope.performSearch = function (term) {
        if (term != undefined && term != currentTerm) {
                navigationService.ui.selectedSearchResult = -1;
                navigationService.showSearch();
                currentTerm = term;
                searchService.search(term);
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
angular.module("umbraco")
	.controller("Umbraco.Editors.Content.CopyController",
	function ($scope, eventsService, contentResource, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	
	$scope.dialogTreeEventHandler = $({});
	var node = dialogOptions.currentNode;

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Editors.Content.CopyController.Select", args).then(function(args){
			var c = $(args.event.target.parentElement);
			if($scope.selectedEl){
				$scope.selectedEl.find(".temporary").remove();
				$scope.selectedEl.find("i.umb-tree-icon").show();
			}

			c.find("i.umb-tree-icon").hide()
			.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
			
			$scope.target = args.node;
			$scope.selectedEl = c;
		});
	});

	$scope.copy = function(){
		contentResource.copy({parentId: $scope.target.id, id: node.id, relateToOriginal: $scope.relate})
			.then(function(){
				$scope.error = false;
				$scope.success = true;
			},function(err){
				$scope.success = false;
				$scope.error = err;
			});
	};
});
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
function ContentEditController($scope, $routeParams, $q, $timeout, $window, contentResource, navigationService, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, fileManager, formHelper) {
    
    if ($routeParams.create) {
        //we are creating so get an empty content item
        contentResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function(data) {
                $scope.loaded = true;
                $scope.content = data;
            });
    }
    else {
        //we are editing so get the content item from the server
        contentResource.getById($routeParams.id)
            .then(function(data) {
                $scope.loaded = true;
                $scope.content = data;

                navigationService.syncPath(data.path.split(","));
                
                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationManager.executeAndClearAllSubscriptions();
            });
    }

    $scope.unPublish = function () {
        
        if (formHelper.submitForm({ scope: $scope, statusMessage: "Unpublishing...", skipValidation: true })) {

            contentResource.unPublish($scope.content.id)
                .then(function (data) {
                    
                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                    });

                    navigationService.syncPath(data.path.split(","));
                });
        }
        
    };

    $scope.saveAndPublish = function() {

        if (formHelper.submitForm({ scope: $scope, statusMessage: "Publishing..." })) {
            
            contentResource.publish($scope.content, $routeParams.create, fileManager.getFiles())
                .then(function(data) {

                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                    });

                    navigationService.syncPath(data.path.split(","));

                }, function(err) {

                    contentEditingHelper.handleSaveError({
                        err: err,
                        redirectOnFailure: true,
                        allNewProps: contentEditingHelper.getAllProps(err.data),
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, err.data)
                    });
                });
        }

    };

    $scope.preview = function(content){
            if(!content.id){
                $scope.save().then(function(data){
                      $window.open('dialogs/preview.aspx?id='+data.id,'umbpreview');  
                });
            }else{
                $window.open('dialogs/preview.aspx?id='+content.id,'umbpreview');
            }    
    };

    $scope.save = function() {
        var deferred = $q.defer();

        if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

            contentResource.save($scope.content, $routeParams.create, fileManager.getFiles())
                .then(function(data) {

                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                    });

                    navigationService.syncPath(data.path.split(","));

                    deferred.resolve(data);
                }, function(err) {
                    contentEditingHelper.handleSaveError({
                        err: err,
                        allNewProps: contentEditingHelper.getAllProps(err.data),
                        allOrigProps: contentEditingHelper.getAllProps($scope.content)
                    });

                    deferred.reject(err);
                });
        }
        else {
            deferred.reject();
        }

        return deferred.promise;
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

//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Editors.Content.MoveController",
	function ($scope, eventsService, contentResource, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	
	$scope.dialogTreeEventHandler = $({});
	var node = dialogOptions.currentNode;

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Editors.Content.MoveController.Select", args).then(function(args){
			var c = $(args.event.target.parentElement);
			if($scope.selectedEl){
				$scope.selectedEl.find(".temporary").remove();
				$scope.selectedEl.find("i.umb-tree-icon").show();
			}

			c.find("i.umb-tree-icon").hide()
			.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
			
			$scope.target = args.node;
			$scope.selectedEl = c;
		});
	});

	$scope.move = function(){
		contentResource.move({parentId: $scope.target.id, id: node.id})
			.then(function(){
				$scope.error = false;
				$scope.success = true;
			},function(err){
				$scope.success = false;
				$scope.error = err;
			});
	};
});
/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function ContentSortController($scope, contentResource, treeService) {
    contentResource.getChildren($scope.currentNode.id).then(function (data) {
        $scope.pagesToSort = [];
        for (var i = 0; i < data.items.length; i++) {
            $scope.pagesToSort.push({
                id: data.items[i].id,
                name: data.items[i].name,
                updateDate: data.items[i].updateDate,
                sortOrder: data.items[i].sortOrder
            });
        }
    });

    $scope.sortOptions ={
        group: "pages",
        containerSelector: 'table',
        itemPath: '> tbody',
        itemSelector: 'tr',
        placeholder: '<tr class="placeholder"/>',
        clone: "<tr />",
        mode: "table",
        onSortHandler: function(item, args){


            args.scope.changeIndex(args.oldIndex, args.newIndex);
        }
    };

/*
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
    });*/

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
    $scope.videos = [];
    $scope.init = function(url){
        var proxyUrl = "dashboard/feedproxy.aspx?url=" + url; 
        $http.get(proxyUrl).then(function(data){
              var feed = $(data.data);
              $('item', feed).each(function (i, item) {
                  var video = {};
                  video.thumbnail = $(item).find('thumbnail').attr('url');
                  video.title = $("title", item).text();
                  video.link = $("guid", item).text();
                  $scope.videos.push(video);      
              });
        });
    };
}
angular.module("umbraco").controller("Umbraco.Dashboard.StartupVideosController", startUpVideosDashboardController);

function startupLatestEditsController($scope) {
    
}
angular.module("umbraco").controller("Umbraco.Dashboard.StartupLatestEditsController", startupLatestEditsController);

function MediaFolderBrowserDashboardController($rootScope, $scope, assetsService, $routeParams, $timeout, $element, $location, umbRequestHelper, mediaResource, imageHelper) {
        var dialogOptions = $scope.$parent.dialogOptions;

        $scope.filesUploading = [];
        $scope.options = {
            url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
            autoUpload: true,
            disableImageResize: /Android(?!.*Chrome)|Opera/
            .test(window.navigator.userAgent),
            previewMaxWidth: 200,
            previewMaxHeight: 200,
            previewCrop: true,
            formData:{
                currentFolder: -1
            }
        };


        $scope.loadChildren = function(){
            mediaResource.getChildren(-1)
                .then(function(data) {
                    $scope.images = data.items;
                });    
        };

        $scope.$on('fileuploadstop', function(event, files){
            $scope.loadChildren($scope.options.formData.currentFolder);
            $scope.queue = [];
            $scope.filesUploading = [];
        });

        $scope.$on('fileuploadprocessalways', function(e,data) {
            var i;
            $scope.$apply(function() {
                $scope.filesUploading.push(data.files[data.index]);
            });
        });

        // All these sit-ups are to add dropzone area and make sure it gets removed if dragging is aborted! 
        $scope.$on('fileuploaddragover', function(event, files) {
            if (!$scope.dragClearTimeout) {
                $scope.$apply(function() {
                    $scope.dropping = true;
                });
            } else {
                $timeout.cancel($scope.dragClearTimeout);
            }
            $scope.dragClearTimeout = $timeout(function () {
                $scope.dropping = null;
                $scope.dragClearTimeout = null;
            }, 300);
        });
        
        //init load
        $scope.loadChildren();
}
angular.module("umbraco").controller("Umbraco.Dashboard.MediaFolderBrowserDashboardController", MediaFolderBrowserDashboardController);


function ChangePasswordDashboardController($scope, xmlhelper, $log, userResource, formHelper) {
    //this is the model we will pass to the service
    $scope.profile = {};

    $scope.changePassword = function(p) {

        if (formHelper.submitForm({ scope: $scope })) {
            userResource.changePassword(p.oldPassword, p.newPassword).then(function() {

                formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                //TODO: This is temporary - server validation will work automatically with the val-server directives.
                $scope.passwordForm.$setValidity(true);
            }, function () {
                //TODO: This is temporary - server validation will work automatically with the val-server directives.
                //this only happens if there is a wrong oldPassword sent along
                $scope.passwordForm.oldpass.$setValidity("oldPassword", false);
            });
        }
    };
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
function DataTypeEditController($scope, $routeParams, $location, dataTypeResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, formHelper) {

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
            label: "Property editor alias"
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

    $scope.save = function() {

        if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {
            
            dataTypeResource.save($scope.content, $scope.preValues, $routeParams.create)
                .then(function(data) {

                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        rebindCallback: function() {
                            createPreValueProps(data.preValues);
                        }
                    });

                }, function(err) {

                    //NOTE: in the case of data type values we are setting the orig/new props 
                    // to be the same thing since that only really matters for content/media.
                    contentEditingHelper.handleSaveError({
                        err: err,
                        allNewProps: $scope.preValues,
                        allOrigProps: $scope.preValues
                    });
                });
        }

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
        $scope.allowedTypes = iconHelper.formatContentTypeIcons(data);
    });
    
}

angular.module('umbraco').controller("Umbraco.Editors.Media.CreateController", mediaCreateController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.ContentDeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function MediaDeleteController($scope, mediaResource, treeService, navigationService) {

    $scope.performDelete = function() {

        //mark it for deletion (used in the UI)
        $scope.currentNode.loading = true;

        mediaResource.deleteById($scope.currentNode.id).then(function () {
            $scope.currentNode.loading = false;

            //get the root node before we remove it
            var rootNode = treeService.getTreeRoot($scope.currentNode);

            //TODO: Need to sync tree, etc...
            treeService.removeNode($scope.currentNode);

            //ensure the recycle bin has child nodes now            
            var recycleBin = treeService.getDescendantNode(rootNode, -21);
            if(recycleBin){
                recycleBin.hasChildren = true;
            }
            
            navigationService.hideMenu();

        },function() {
            $scope.currentNode.loading = false;
        });
    };

    $scope.cancel = function() {
        navigationService.hideDialog();
    };
}

angular.module("umbraco").controller("Umbraco.Editors.Media.DeleteController", MediaDeleteController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.Media.EditController
 * @function
 * 
 * @description
 * The controller for the media editor
 */
function mediaEditController($scope, $routeParams, mediaResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, fileManager, formHelper) {

    if ($routeParams.create) {

        mediaResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function (data) {
                $scope.loaded = true;
                $scope.content = data;

            });
    }
    else {
        mediaResource.getById($routeParams.id)
            .then(function (data) {
                $scope.loaded = true;
                $scope.content = data;
                                
                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationManager.executeAndClearAllSubscriptions();

            });
    }
    
    $scope.save = function () {

        if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

            mediaResource.save($scope.content, $routeParams.create, fileManager.getFiles())
                .then(function(data) {

                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                    });

                }, function(err) {

                    contentEditingHelper.handleSaveError({
                        err: err,
                        redirectOnFailure: true,
                        allNewProps: contentEditingHelper.getAllProps(err.data),
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, err.data)
                    });
                });
        }
        
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
        for (var i = 0; i < data.items.length; i++) {
            $scope.sortableModel.itemsToSort.push({
                id: data.items[i].id,
                column1: data.items[i].name,
                column2: data.items[i].updateDate,
                column3: data.items[i].sortOrder
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

/**
 * @ngdoc controller
 * @name Umbraco.Editors.Member.CreateController
 * @function
 * 
 * @description
 * The controller for the member creation dialog
 */
function memberCreateController($scope, $routeParams, memberTypeResource, iconHelper) {
    
    memberTypeResource.getTypes($scope.currentNode.id).then(function (data) {
        $scope.allowedTypes = iconHelper.formatContentTypeIcons(data);
    });
    
}

angular.module('umbraco').controller("Umbraco.Editors.Member.CreateController", memberCreateController);
/**
 * @ngdoc controller
 * @name Umbraco.Editors.Member.DeleteController
 * @function
 * 
 * @description
 * The controller for deleting content
 */
function MemberDeleteController($scope, memberResource, treeService, navigationService) {

    $scope.performDelete = function() {

        //mark it for deletion (used in the UI)
        $scope.currentNode.loading = true;

        memberResource.deleteByKey($scope.currentNode.id).then(function () {
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

angular.module("umbraco").controller("Umbraco.Editors.Member.DeleteController", MemberDeleteController);

/**
 * @ngdoc controller
 * @name Umbraco.Editors.Member.EditController
 * @function
 * 
 * @description
 * The controller for the member editor
 */
function MemberEditController($scope, $routeParams, $location, $q, $window, memberResource, entityResource, notificationsService, angularHelper, serverValidationManager, contentEditingHelper, fileManager, formHelper) {
    
    if ($routeParams.create) {
        //we are creating so get an empty member item
        memberResource.getScaffold($routeParams.doctype)
            .then(function(data) {
                $scope.loaded = true;
                $scope.content = data;
            });
    }
    else {
        //so, we usually refernce all editors with the Int ID, but with members we have
        //a different pattern, adding a route-redirect here to handle this: 
        //isNumber doesnt work here since its seen as a string

        //TODO: Why is this here - I don't understand why this would ever be an integer? This will not work when we support non-umbraco membership providers.

        if ($routeParams.id && $routeParams.id.length < 9) {
            entityResource.getById($routeParams.id, "Member").then(function(entity) {
                $location.path("member/member/edit/" + entity.key);
            });
        }
        else {
            //we are editing so get the content item from the server
            memberResource.getByKey($routeParams.id)
                .then(function(data) {
                    $scope.loaded = true;
                    $scope.content = data;

                    //in one particular special case, after we've created a new item we redirect back to the edit
                    // route but there might be server validation errors in the collection which we need to display
                    // after the redirect, so we will bind all subscriptions which will show the server validation errors
                    // if there are any and then clear them so the collection no longer persists them.
                    serverValidationManager.executeAndClearAllSubscriptions();
                });
        }

    }

    $scope.save = function() {

        if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {
            
            memberResource.save($scope.content, $routeParams.create, fileManager.getFiles())
                .then(function(data) {

                    formHelper.resetForm({ scope: $scope, notifications: data.notifications });

                    contentEditingHelper.handleSuccessfulSave({
                        scope: $scope,
                        newContent: data,
                        //specify a custom id to redirect to since we want to use the GUID
                        redirectId: data.key,
                        rebindCallback: contentEditingHelper.reBindChangedProperties($scope.content, data)
                    });

                }, function (err) {
                    
                    contentEditingHelper.handleSaveError({
                        err: err,
                        allNewProps: contentEditingHelper.getAllProps(err.data),
                        allOrigProps: contentEditingHelper.getAllProps($scope.content)
                    });

                });
        }
        
    };

}

angular.module("umbraco").controller("Umbraco.Editors.Member.EditController", MemberEditController);

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

    function setupViewModel() {
        $scope.renderModel = {
            value: false
        };
        if ($scope.model && $scope.model.value && ($scope.model.value.toString() === "1" || angular.lowercase($scope.model.value) === "true")) {
            $scope.renderModel.value = true;
        }
    }

    setupViewModel();

    $scope.$watch("renderModel.value", function (newVal) {
        $scope.model.value = newVal === true ? "1" : "0";
    });
    
    //here we declare a special method which will be called whenever the value has changed from the server
    //this is instead of doing a watch on the model.value = faster
    $scope.model.onValueChanged = function (newVal, oldVal) {
        //update the display val again if it has changed from the server
        setupViewModel();
    };

}
angular.module("umbraco").controller("Umbraco.PropertyEditors.BooleanController", booleanEditorController);
angular.module("umbraco").controller("Umbraco.PropertyEditors.ChangePasswordController",
    function($scope) {
        
        function resetModel() {
            //the model config will contain an object, if it does not we'll create defaults
            //NOTE: We will not support doing the password regex on the client side because the regex on the server side
            //based on the membership provider cannot always be ported to js from .net directly.        
            /*
            {
                hasPassword: true/false,
                requiresQuestionAnswer: true/false,
                enableReset: true/false,
                enablePasswordRetrieval: true/false,
                minPasswordLength: 10
            }
            */

            //set defaults if they are not available
            if (!$scope.model.config || $scope.model.config.hasPassword === undefined) {
                $scope.model.config.hasPassword = false;
            }
            if (!$scope.model.config || $scope.model.config.enablePasswordRetrieval === undefined) {
                $scope.model.config.enablePasswordRetrieval = true;
            }
            if (!$scope.model.config || $scope.model.config.requiresQuestionAnswer === undefined) {
                $scope.model.config.requiresQuestionAnswer = false;
            }
            if (!$scope.model.config || $scope.model.config.enableReset === undefined) {
                $scope.model.config.enableReset = true;
            }
            if (!$scope.model.config || $scope.model.config.minPasswordLength === undefined) {
                $scope.model.config.minPasswordLength = 0;
            }
            
            //set the model defaults
            if (!angular.isObject($scope.model.value)) {
                //if it's not an object then just create a new one
                $scope.model.value = {
                    newPassword: "",
                    oldPassword: null,
                    reset: null,
                    answer: null
                };
            }
            else {
                //just reset the values we need to
                $scope.model.value.newPassword = "";
                $scope.model.value.oldPassword = null;
                $scope.model.value.reset = null;
                $scope.model.value.answer = null;
            }

            //the value to compare to match passwords
            $scope.model.confirm = "";
        }

        resetModel();

        //if there is no password saved for this entity , it must be new so we do not allow toggling of the change password, it is always there
        //with validators turned on.
        $scope.changing = !$scope.model.config.hasPassword;

        $scope.doChange = function() {
            $scope.changing = true;
            //if there was a previously generated password displaying, clear it
            $scope.model.value.generatedPassword = null;
        };

        $scope.cancelChange = function() {
            $scope.changing = false;
        };
        
        //listen for the saved event, when that occurs we'll 
        //change to changing = false;
        $scope.$on("formSubmitted", function () {
            $scope.changing = false;
            resetModel();
        });
        
    });

angular.module("umbraco").controller("Umbraco.PropertyEditors.CheckboxListController",
    function($scope) {
        
        if (!angular.isObject($scope.model.config.items)) {
            throw "The model.config.items property must be either a dictionary";
        }

        function setupViewModel() {
            $scope.selectedItems = [];

            //now we need to check if the value is null/undefined, if it is we need to set it to "" so that any value that is set
            // to "" gets selected by default
            if ($scope.model.value === null || $scope.model.value === undefined) {
                $scope.model.value = [];
            }

            for (var i in $scope.model.config.items) {
                var isChecked = _.contains($scope.model.value, i);
                $scope.selectedItems.push({ checked: isChecked, key: i, val: $scope.model.config.items[i] });
            }
        }

        setupViewModel();
        

        //update the model when the items checked changes
        $scope.$watch("selectedItems", function(newVal, oldVal) {

            $scope.model.value = [];
            for (var x = 0; x < $scope.selectedItems.length; x++) {
                if ($scope.selectedItems[x].checked) {
                    $scope.model.value.push($scope.selectedItems[x].key);
                }
            }

        }, true);
        
        //here we declare a special method which will be called whenever the value has changed from the server
        //this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //update the display val again if it has changed from the server
            setupViewModel();
        };

    });

angular.module("umbraco").controller("Umbraco.PropertyEditors.CodeMirrorController",
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

angular.module("umbraco").controller("Umbraco.PropertyEditors.ColorPickerController", ColorPickerController);

//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco')
.controller("Umbraco.PropertyEditors.ContentPickerController",
	
	function($scope, dialogService, entityResource, $log, iconHelper){
		$scope.ids = $scope.model.value.split(',');

		$scope.renderModel = [];
		$scope.cfg = {multiPicker: false, entityType: "Document", type: "content", treeAlias: "content", filter: ""};

		if($scope.model.config){
			$scope.cfg = angular.extend($scope.cfg, $scope.model.config);
		}

		if($scope.cfg.type === "member"){
			$scope.cfg.entityType = "Member";
		}else if($scope.cfg.type === "media"){
			$scope.cfg.entityType = "Media";
		}

		entityResource.getByIds($scope.ids, $scope.cfg.entityType).then(function(data){
			$(data).each(function(i, item){
				item.icon = iconHelper.convertFromLegacyIcon(item.icon);
				$scope.renderModel.push({name: item.name, id: item.id, icon: item.icon});
			});
		});

		$scope.openContentPicker =function(){
			var d = dialogService.treePicker({
								section: $scope.cfg.type,
								treeAlias: $scope.cfg.type,
								scope: $scope, 
								multiPicker: $scope.cfg.multiPicker,
								filter: $scope.cfg.filter, 
								callback: populate});
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

	    $scope.clear = function() {
	        $scope.ids = [];
	        $scope.model.value = "";
	        $scope.renderModel = [];
	    };

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
angular.module("umbraco").controller("Umbraco.PropertyEditors.DatepickerController",
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

        function applyDate(e){
                // when a date is changed, update the model
                if (e.localDate) {
                    if ($scope.model.config.format == "yyyy-MM-dd HH:mm:ss") {
                        $scope.$apply(function(){
                            $scope.model.value = e.localDate.toIsoDateTimeString();
                        });
                    }else{
                        $scope.model.value = e.localDate.toIsoDateString();
                    }
                }
        }

        assetsService.loadJs(
                'views/propertyeditors/datepicker/bootstrap-datetimepicker.min.js'
            ).then(
            function () {
                //The Datepicker js and css files are available and all components are ready to use.

                // Get the id of the datepicker button that was clicked
                var pickerId = $scope.model.alias;
                // Open the datepicker and add a changeDate eventlistener
                $("#" + pickerId)
                    .datetimepicker($scope.model.config)
                    .on("changeDate", applyDate)
                    .on("hide", applyDate);

            });


        assetsService.loadCss(
                'views/propertyeditors/datepicker/bootstrap-datetimepicker.min.css'
            );
    });

angular.module("umbraco").controller("Umbraco.PropertyEditors.DropdownController",
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
function fileUploadController($scope, $element, $compile, imageHelper, fileManager, umbRequestHelper) {

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
            
            var thumbnailUrl = umbRequestHelper.getApiUrl(
                        "mediaApiBaseUrl",
                        "GetBigThumbnail",
                        [{ originalImagePath: file.file }]);

            file.thumbnail = thumbnailUrl;
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
angular.module("umbraco").controller('Umbraco.PropertyEditors.FileUploadController', fileUploadController);


angular.module("umbraco")
.directive("umbUploadPreview",function($parse){
        return {
            link: function(scope, element, attr, ctrl) {
               var fn = $parse(attr.umbUploadPreview),
                                   file = fn(scope);
                if (file.preview) {
                    element.append(file.preview);
               }
            }
        };
})
.controller("Umbraco.PropertyEditors.FolderBrowserController",
    function ($rootScope, $scope, assetsService, $routeParams, $timeout, $element, $location, umbRequestHelper, mediaResource, imageHelper) {
        var dialogOptions = $scope.$parent.dialogOptions;

        $scope.filesUploading = [];
        $scope.options = {
            url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
            autoUpload: true,
            disableImageResize: /Android(?!.*Chrome)|Opera/
            .test(window.navigator.userAgent),
            previewMaxWidth: 200,
            previewMaxHeight: 200,
            previewCrop: true,
            formData:{
                currentFolder: $routeParams.id
            }
        };


        $scope.loadChildren = function(id){
            mediaResource.getChildren(id)
                .then(function(data) {
                    $scope.images = data.items;
                });    
        };

        $scope.$on('fileuploadstop', function(event, files){
            $scope.loadChildren($scope.options.formData.currentFolder);
            $scope.queue = [];
            $scope.filesUploading = [];
        });

        $scope.$on('fileuploadprocessalways', function(e,data) {
            var i;
            $scope.$apply(function() {
                $scope.filesUploading.push(data.files[data.index]);
            });
        });

        // All these sit-ups are to add dropzone area and make sure it gets removed if dragging is aborted! 
        $scope.$on('fileuploaddragover', function(event, files) {
            if (!$scope.dragClearTimeout) {
                $scope.$apply(function() {
                    $scope.dropping = true;
                });
            } else {
                $timeout.cancel($scope.dragClearTimeout);
            }
            $scope.dragClearTimeout = $timeout(function () {
                $scope.dropping = null;
                $scope.dragClearTimeout = null;
            }, 300);
        });
        
        //init load
        $scope.loadChildren($routeParams.id);
});

angular.module("umbraco")
.controller("Umbraco.PropertyEditors.GoogleMapsController",
    function ($rootScope, $scope, notificationsService, dialogService, assetsService, $log, $timeout) {

        assetsService.loadJs('http://www.google.com/jsapi')
            .then(function () {
                google.load("maps", "3",
                            {
                                callback: initMap,
                                other_params: "sensor=false"
                            });
            });

        function initMap() {
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

            google.maps.event.addListener(map, 'click', function (event) {

                dialogService.mediaPicker({
                    scope: $scope, callback: function (data) {
                        var image = data.selection[0].src;

                        var latLng = event.latLng;
                        var marker = new google.maps.Marker({
                            map: map,
                            icon: image,
                            position: latLng,
                            draggable: true
                        });

                        google.maps.event.addListener(marker, "dragend", function (e) {
                            var newLat = marker.getPosition().lat();
                            var newLng = marker.getPosition().lng();

                            codeLatLng(marker.getPosition(), geocoder);

                            //set the model value
                            $scope.model.vvalue = newLat + "," + newLng;
                        });

                    }
                });
            });

            $('a[data-toggle="tab"]').on('shown', function (e) {
                google.maps.event.trigger(map, 'resize');
            });
        }

        function codeLatLng(latLng, geocoder) {
            geocoder.geocode({ 'latLng': latLng },
                function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var location = results[0].formatted_address;
                        $rootScope.$apply(function () {
                            notificationsService.success("Peter just went to: ", location);
                        });
                    }
                });
        }

        //here we declare a special method which will be called whenever the value has changed from the server
        //this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //update the display val again if it has changed from the server
            initMap();
        };
    });
'use strict';
//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module("umbraco").controller("Umbraco.PropertyEditors.GridController",
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
    .controller("Umbraco.PropertyEditors.ListViewController", 
        function ($rootScope, $scope, $routeParams, contentResource, contentTypeResource, notificationsService, iconHelper) {

        $scope.selected = [];
        $scope.actionInProgress = false;
            
        $scope.options = {
            pageSize: 10,
            pageNumber: 1,
            filter: '',
            orderBy: 'Id',
            orderDirection: "desc"
        };

        
        $scope.next = function(){
            if ($scope.options.pageNumber < $scope.listViewResultSet.totalPages) {
                $scope.options.pageNumber++;
                $scope.reloadView($scope.contentId);
            }
        };

        $scope.goToPage = function (pageNumber) {
            $scope.options.pageNumber = pageNumber + 1;
            $scope.reloadView($scope.contentId);
        };

        $scope.sort = function (field) {
        
            $scope.options.orderBy = field;
            
          
            if ($scope.options.orderDirection === "desc") {
                $scope.options.orderDirection = "asc";
            }else{
                $scope.options.orderDirection = "desc";
            }
            
           
            $scope.reloadView($scope.contentId);
        };

        $scope.prev = function(){
            if ($scope.options.pageNumber > 1) {
                $scope.options.pageNumber--;
                $scope.reloadView($scope.contentId);
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

        var updateSelected = function (action, id) {
            if (action === 'add' && $scope.selected.indexOf(id) === -1) {
                $scope.selected.push(id);
            }
            if (action === 'remove' && $scope.selected.indexOf(id) !== -1) {
                $scope.selected.splice($scope.selected.indexOf(id), 1);
            }
        };

        $scope.updateSelection = function ($event, item) {
            if(item.selected){
                item.selected = false;
                var index = $scope.selected.indexOf(item.id);
                if(index){
                    $scope.selected.splice(index, 1);
                }
            }else{
                item.selected = true;
                $scope.selected.push(item.id);
            }
        };

        $scope.selectAll = function ($event) {
            var checkbox = $event.target;
            var action = (checkbox.checked ? 'add' : 'remove');

            for (var i = 0; i < $scope.listViewResultSet.items.length; i++) {
                var entity = $scope.listViewResultSet.items[i];
                entity.selected = checkbox.checked;
                updateSelected(action, entity.id);
            }
        };

        $scope.getSelectedClass = function (entity) {
            return $scope.isSelected(entity.id) ? 'selected' : '';
        };

        $scope.isSelected = function (id) {
            return $scope.selected.indexOf(id) >= 0;
        };

        $scope.isSelectedAll = function () {
            if ($scope.listViewResultSet != null)
                return $scope.selected.length === $scope.listViewResultSet.items.length;
            else
                return false;
        };

        $scope.isAnythingSelected = function() {
            return $scope.selected.length > 0;
        };

        $scope.getIcon = function(entry){
            return iconHelper.convertFromLegacyIcon(entry.icon);
        };

        $scope.delete = function () {

            if (confirm("Sure you want to delete?") == true) {
                $scope.actionInProgress = true;
                $scope.bulkStatus = "Starting with delete";
                var current = 1;
                var total = $scope.selected.length;
                for (var i = 0; i < $scope.selected.length; i++) {
                    $scope.bulkStatus = "Deleted doc " + current + " out of " + total + " documents";
                    contentResource.deleteById($scope.selected[i]).then(function(data) {
                        if (current == total) {
                            notificationsService.success("Bulk action", "Deleted " + total + "documents");
                            $scope.bulkStatus = "";
                            $scope.selected = [];
                            $scope.reloadView($scope.contentId);
                            $scope.actionInProgress = false;
                        }
                        current++;
                    });
                }
            }

        };

        $scope.publish = function () {
            $scope.actionInProgress = true;
            $scope.bulkStatus = "Starting with publish";
            var current = 1;
            var total = $scope.selected.length;
            for (var i = 0; i < $scope.selected.length; i++) {
                $scope.bulkStatus = "Publishing " + current + " out of " + total + " documents";
                
                contentResource.publishById($scope.selected[i])
                    .then(function(content){
                        if (current == total) {
                            notificationsService.success("Bulk action", "Published " + total + "documents");
                            $scope.bulkStatus = "";
                            $scope.reloadView($scope.contentId);
                            $scope.actionInProgress = false;
                        }
                        current++;
                    });
              
            }
        };
 
        $scope.unpublish = function () {
            $scope.actionInProgress = true;
            $scope.bulkStatus = "Starting with publish";
            var current = 1;
            var total = $scope.selected.length;
            for (var i = 0; i < $scope.selected.length; i++) {
                $scope.bulkStatus = "Unpublishing " + current + " out of " + total + " documents";
                
                contentResource.unPublish($scope.selected[i])
                    .then(function(content){
                        
                        if (current == total) {
                            notificationsService.success("Bulk action", "Published " + total + "documents");
                            $scope.bulkStatus = "";
                            $scope.reloadView($scope.contentId);
                            $scope.actionInProgress = false;
                        }

                        current++;
                    });
            }
        };
            
        if ($routeParams.id) {
            $scope.pagination = new Array(100);
            $scope.listViewAllowedTypes = contentTypeResource.getAllowedTypes($routeParams.id);
            $scope.reloadView($routeParams.id);

            $scope.contentId = $routeParams.id;

        }
        
});

//this controller simply tells the dialogs service to open a mediaPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco').controller("Umbraco.PropertyEditors.MediaPickerController",
    function($rootScope, $scope, dialogService, mediaResource, imageHelper, $log) {


        function setupViewModel() {
            $scope.images = [];
            $scope.ids = [];

            if ($scope.model.value) {
                $scope.ids = $scope.model.value.split(',');

                mediaResource.getByIds($scope.ids).then(function (medias) {
                    //img.media = media;
                    _.each(medias, function (media, i) {
                        //shortcuts
                        //TODO, do something better then this for searching
                        var img = {};
                        img.src = imageHelper.getImagePropertyValue({ imageModel: media });
                        img.thumbnail = imageHelper.getThumbnailFromPath(img.src);
                        $scope.images.push(img);
                    });
                });
            }
        }

        setupViewModel();

        $scope.remove = function(index) {
            $scope.images.splice(index, 1);
            $scope.ids.splice(index, 1);
            $scope.sync();
        };

        $scope.add = function() {
            dialogService.mediaPicker({
                multipicker: true,
                callback: function(data) {
                    _.each(data.selection, function(media, i) {
                        //shortcuts
                        //TODO, do something better then this for searching

                        var img = {};
                        img.id = media.id;
                        img.src = imageHelper.getImagePropertyValue({ imageModel: media });
                        img.thumbnail = imageHelper.getThumbnailFromPath(img.src);
                        $scope.images.push(img);
                        $scope.ids.push(img.id);
                    });

                    $scope.sync();
                }
            });
        };

        $scope.sync = function() {
            $scope.model.value = $scope.ids.join();
        };

        //here we declare a special method which will be called whenever the value has changed from the server
        //this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //update the display val again if it has changed from the server
            setupViewModel();
        };

    });
//this controller simply tells the dialogs service to open a memberPicker window
//with a specified callback, this callback will receive an object with a selection on it
angular.module('umbraco')
.controller("Umbraco.PropertyEditors.MemberPickerController",
	
	function($scope, dialogService, entityResource, $log, iconHelper){
		$scope.ids = $scope.model.value.split(',');
		$scope.renderModel = [];
		$scope.multipicker = true;

		entityResource.getByIds($scope.ids, "Member").then(function(data){
			$(data).each(function(i, item){
				item.icon = iconHelper.convertFromLegacyIcon(item.icon);
				$scope.renderModel.push({name: item.name, id: item.id, icon: item.icon});
			});
		});

		$scope.openMemberPicker =function(){
			var d = dialogService.memberPicker({scope: $scope, multipicker: $scope.multipicker, callback: populate});
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

	    $scope.clear = function() {
	        $scope.ids = [];
	        $scope.model.value = "";
	        $scope.renderModel = [];
	    };

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

angular.module("umbraco").controller("Umbraco.PropertyEditors.MultipleTextBoxController", MultipleTextBoxController);

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

angular.module('umbraco').controller("Umbraco.PropertyEditors.ReadOnlyValueController", ReadOnlyValueController);
angular.module("umbraco")
    .controller("Umbraco.PropertyEditors.RelatedLinksController",
        function ($rootScope, $scope, dialogService) {

            if (!$scope.model.value) {
                $scope.model.value = [];
            }
            
            $scope.newCaption = '';
            $scope.newLink = 'http://';
            $scope.newNewWindow = false;
            $scope.newInternal = null;
            $scope.newInternalName = '';
            $scope.addExternal = true;
            
            //$scope.relatedLinks = [
            //    { caption: 'Google', link: "http://google.com", newWindow: false, edit:false },
            //    { caption: 'Umbraco', link: "http://umbraco.com", newWindow: false, edit: false },
            //    { caption: 'Nibble', link: "http://nibble.be", newWindow: false, edit: false }
            //];

            $scope.internal = function ($event) {
                var d = dialogService.contentPicker({ scope: $scope, multipicker: false, callback: select });

                $event.preventDefault();
            };

            $scope.edit = function (idx) {
                for (var i = 0; i < $scope.model.value.length; i++) {
                    $scope.model.value[i].edit = false;
                }
                $scope.model.value[idx].edit = true;
            };

            $scope.cancelEdit = function(idx) {
                $scope.model.value[idx].edit = false;
            };
            
            $scope.delete = function (idx) {
                
                $scope.model.value.splice($scope.model.value[idx], 1);
                
            };

            $scope.add = function () {

                if ($scope.addExternal) {
                    var newExtLink = new function() {
                        this.caption = $scope.newCaption;
                        this.link = $scope.newLink;
                        this.newWindow = $scope.newNewWindow;
                        this.edit = false;
                    };
                    $scope.model.value.push(newExtLink);
                } else {
                    var newIntLink = new function () {
                        this.caption = $scope.newCaption;
                        this.link = $scope.newLink;
                        this.newWindow = $scope.newNewWindow;
                        this.internal = $scope.newInternal;
                        this.edit = false;
                    };
                    $scope.model.value.push(newIntLink);
                }
                $scope.newCaption = '';
                $scope.newLink = 'http://';
                $scope.newNewWindow = false;
                $scope.newInternal = null;
                $scope.newInternalName = '';
                
               
            };

            $scope.switch = function ($event) {
                $scope.addExternal = !$scope.addExternal;
                $event.preventDefault();
            };
            
            function select(data) {
                $scope.newInternal = data.id;
                $scope.newInternalName = data.name;
            }

            

        });
angular.module("umbraco")
    .controller("Umbraco.PropertyEditors.RTEController",
    function ($rootScope, $element, $scope, dialogService, $log, imageHelper, assetsService, $timeout, tinyMceService, angularHelper) {

        tinyMceService.configuration().then(function(tinyMceConfig){

            //config value from general tinymce.config file
            var validElements = tinyMceConfig.validElements;

            //These are absolutely required in order for the macros to render inline
            //we put these as extended elements because they get merged on top of the normal allowed elements by tiny mce
            var extendedValidElements = "@[id|class|style],-div[id|dir|class|align|style],ins[datetime|cite],-ul[class|style],-li[class|style]";

            var invalidElements = tinyMceConfig.inValidElements;
            var plugins = _.map(tinyMceConfig.plugins, function(plugin){ 
                                            if(plugin.useOnFrontend){
                                                return plugin.name;   
                                            }
                                        }).join(" ");
            
            var editorConfig = $scope.model.config.editor;
            if(!editorConfig || angular.isString(editorConfig)){
                editorConfig = tinyMceService.defaultPrevalues();
            }

            //config value on the data type
            var toolbar = editorConfig.toolbar.join(" | ");
            
            assetsService.loadJs("lib/tinymce/tinymce.min.js", $scope).then(function () {
                
                /** Loads in the editor */
                function loadTinyMce() {
                    
                    //we need to add a timeout here, to force a redraw so TinyMCE can find
                    //the elements needed
                    $timeout(function () {
                        tinymce.DOM.events.domLoaded = true;
                        tinymce.init({
                            mode: "exact",
                            elements: $scope.model.alias + "_rte",
                            skin: "umbraco",
                            plugins: plugins,
                            valid_elements: validElements,
                            invalid_elements: invalidElements,
                            extended_valid_elements: extendedValidElements,
                            menubar: false,
                            statusbar: false,
                            height: editorConfig.dimensions.height,
                            toolbar: toolbar,
                            relative_urls: false,
                            setup: function (editor) {

                                //We need to listen on multiple things here because of the nature of tinymce, it doesn't 
                                //fire events when you think!
                                //The change event doesn't fire when content changes, only when cursor points are changed and undo points
                                //are created. the blur event doesn't fire if you insert content into the editor with a button and then 
                                //press save. 
                                //We have a couple of options, one is to do a set timeout and check for isDirty on the editor, or we can 
                                //listen to both change and blur and also on our own 'saving' event. I think this will be best because a 
                                //timer might end up using unwanted cpu and we'd still have to listen to our saving event in case they clicked
                                //save before the timeout elapsed.
                                editor.on('change', function (e) {
                                    angularHelper.safeApply($scope, function () {
                                        $scope.model.value = editor.getContent();
                                    });
                                });
                                editor.on('blur', function (e) {
                                    angularHelper.safeApply($scope, function () {
                                        $scope.model.value = editor.getContent();
                                    });
                                });
                                //listen for formSubmitting event (the result is callback used to remove the event subscription)
                                var unsubscribe = $scope.$on("formSubmitting", function () {

                                    //TODO: Here we should parse out the macro rendered content so we can save on a lot of bytes in data xfer
                                    // we do parse it out on the server side but would be nice to do that on the client side before as well.
                                    $scope.model.value = editor.getContent();
                                });

                                //when the element is disposed we need to unsubscribe!
                                // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom 
                                // element might still be there even after the modal has been hidden.
                                $element.bind('$destroy', function () {
                                    unsubscribe();
                                });

                                //Create the insert media plugin
                                tinyMceService.createMediaPicker(editor, $scope);

                                //Create the embedded plugin
                                tinyMceService.createInsertEmbeddedMedia(editor, $scope);

                                //Create the insert link plugin
                                tinyMceService.createLinkPicker(editor, $scope);

                                //Create the insert macro plugin
                                tinyMceService.createInsertMacro(editor, $scope);
                            }
                        });
                    }, 1);
                }
                
                loadTinyMce();

                //here we declare a special method which will be called whenever the value has changed from the server
                //this is instead of doing a watch on the model.value = faster
                $scope.model.onValueChanged = function (newVal, oldVal) {
                    //update the display val again if it has changed from the server
                    //TODO: Perhaps we don't need to re-load the whole editor, can probably just re-set the value ?
                    loadTinyMce();
                };
            });
        });

    });
angular.module("umbraco").controller("Umbraco.PrevalueEditors.RteController",
    function ($scope, $timeout, tinyMceService, stylesheetResource) {
        var cfg = tinyMceService.defaultPrevalues();

        if($scope.model.value){
            if(angular.isString($scope.model.value)){
                $scope.model.value = cfg;
            }
        }else{
            $scope.model.value = cfg;
        }

        tinyMceService.configuration().then(function(config){
            $scope.tinyMceConfig = config;
        });
            
        stylesheetResource.getAll().then(function(stylesheets){
            $scope.stylesheets = stylesheets;
        });

        $scope.selected = function(alias, lookup){
            return lookup.indexOf(alias) >= 0;
        };

        $scope.selectCommand = function(command){
            var index = $scope.model.value.toolbar.indexOf(command.frontEndCommand);

            if(command.selected && index === -1){
                $scope.model.value.toolbar.push(command.frontEndCommand);
            }else if(index >= 0){
                $scope.model.value.toolbar.splice(index, 1);
            }
        };

        $scope.selectStylesheet = function(css){
            var index = $scope.model.value.stylesheets.indexOf(css.path);

            if(css.selected && index === -1){
                $scope.model.value.stylesheets.push(css.path);
            }else if(index >= 0){
                $scope.model.value.stylesheets.splice(index, 1);
            }
        };
    });

angular.module("umbraco")
.controller("Umbraco.PropertyEditors.TagsController",
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
angular.module('umbraco').controller("Umbraco.PropertyEditors.EmbeddedContentController",
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
angular.module('umbraco').controller("Umbraco.PropertyEditors.UrlListController",
	function($rootScope, $scope, $filter) {

        function formatDisplayValue() {
            $scope.renderModel = _.map($scope.model.value.split(","), function (item) {
                return {
                    url: item,
                    urlTarget: ($scope.config && $scope.config.target) ? $scope.config.target : "_blank"
                };
            });
        }

	    formatDisplayValue();
	    
	    //here we declare a special method which will be called whenever the value has changed from the server
	    //this is instead of doing a watch on the model.value = faster
	    $scope.model.onValueChanged = function(newVal, oldVal) {
	        //update the display val again
	        formatDisplayValue();
	    };

	});
angular.module('umbraco').controller("Umbraco.PropertyEditors.UserPickerController",
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