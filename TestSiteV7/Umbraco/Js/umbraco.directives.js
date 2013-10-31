/*! umbraco - v0.0.1-TechnicalPReview - 2013-09-17
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

angular.module("umbraco.directives", ["umbraco.directives.editors", "umbraco.directives.html", "umbraco.directives.validation"]);
angular.module("umbraco.directives.editors", []);
angular.module("umbraco.directives.html", []);
angular.module("umbraco.directives.validation", []);
/**
 * @ngdoc directive
 * @name umbraco.directives.directive:autoScale
 * @element div
 * @function
 *
 * @description
 * Resize div's automatically to fit to the bottom of the screen, as an optional parameter an y-axis offset can be set
 * So if you only want to scale the div to 70 pixels from the bottom you pass "70"
 *
 * @example
   <example module="umbraco.directives">
     <file name="index.html">
         <div auto-scale="70" class="input-block-level"></div>
     </file>
   </example>
 */
angular.module("umbraco.directives")
  .directive('autoScale', function ($window) {
    return function (scope, el, attrs) {

      var totalOffset = 0;
      var offsety = parseInt(attrs.autoScale, 10);
      var window = angular.element($window);
      if (offsety !== undefined){
        totalOffset += offsety;
      }

      setTimeout(function () {
        el.height(window.height() - (el.offset().top + totalOffset));
      }, 500);

      window.bind("resize", function () {
        el.height(window.height() - (el.offset().top + totalOffset));
      });

    };
  });
angular.module('umbraco.directives.editors').directive('ace', function(assetsService) {
  var ACE_EDITOR_CLASS = 'ace-editor';

  function loadAceEditor(element, mode) {
    assetsService.loadJs("lib/ace/noconflict/ace.js").then(function(){
        var editor = ace.edit($(element).find('.' + ACE_EDITOR_CLASS)[0]);
        editor.session.setMode("ace/mode/" + mode);
        editor.renderer.setShowPrintMargin(false);
        return editor;
    });
  }

  function valid(editor) {
    return (Object.keys(editor.getSession().getAnnotations()).length === 0);
  }

  return {
    restrict: 'A',
    require: '?ngModel',
    transclude: true,
    template: '<div class="transcluded" ng-transclude></div><div class="' + ACE_EDITOR_CLASS + '"></div>',

    link: function(scope, element, attrs, ngModel) {
      function read() {
        ngModel.$setViewValue(editor.getValue());
        textarea.val(editor.getValue());
      }

      var textarea = $(element).find('textarea');
      textarea.hide();

      var mode = attrs.ace;
      var editor = loadAceEditor(element, mode);
      scope.ace = editor;

      if (!ngModel)
      {
        return; // do nothing if no ngModel
      }

      ngModel.$render = function() {
        var value = ngModel.$viewValue || '';
        editor.getSession().setValue(value);
        textarea.val(value);
      };

      editor.getSession().on('changeAnnotation', function() {
        if (valid(editor)) {
          scope.$apply(read);
        }
      });

      editor.getSession().setValue(textarea.val());

      read();

    }
  };
});

/**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbSort
 * @element div
 * @function
 *
 * @description
 * Resize div's automatically to fit to the bottom of the screen, as an optional parameter an y-axis offset can be set
 * So if you only want to scale the div to 70 pixels from the bottom you pass "70"
 *
 * @example
   <example module="umbraco.directives">
     <file name="index.html">
         <div umb-sort="70" class="input-block-level"></div>
     </file>
   </example>
 */
angular.module("umbraco.directives")
  .value('umbSortContextInternal',{})
  .directive('umbSort', function($log,umbSortContextInternal) {
          return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                var adjustment;
            
                $log.log(element);
                var cfg = scope.$eval(element.attr('umb-sort')) || {};

                scope.model = ngModel;

                scope.opts = cfg;
                scope.opts.containerSelector= cfg.containerSelector || ".umb-" + cfg.group + "-container",
                scope.opts.nested= cfg.nested || true,
                scope.opts.drop= cfg.drop || true,
                scope.opts.drag= cfg.drag || true,
                scope.opts.isValidTarget = function(item, container) {
                        if(container.el.is(".umb-" + scope.opts.group + "-container")){
                            return true;
                        }
                        return false;
                     };


                element.addClass("umb-sort");
                element.addClass("umb-" + cfg.group + "-container");

                scope.opts.onDrag = function (item, position)  {
                    item.css({
                          left: position.left - adjustment.left,
                          top: position.top - adjustment.top
                        });
                };


                scope.opts.onDrop = function (item, targetContainer, _super)  {
                      var children = $("li", targetContainer.el);
                      var targetScope = $(targetContainer.el[0]).scope();
                      var targetIndex = children.index(item);

                      if(targetScope.opts.onDropHandler){
                          var args = {
                            sourceScope: umbSortContextInternal.sourceScope,
                            sourceIndex: umbSortContextInternal.sourceIndex,
                            sourceContainer: umbSortContextInternal.sourceContainer,

                            targetScope: targetScope,
                            targetIndex: targetIndex,
                            targetContainer: targetContainer
                          };   

                          targetScope.opts.onDropHandler.call(this, item, args);
                      }

                      if(umbSortContextInternal.sourceScope.opts.onReleaseHandler){
                          var _args = {
                            sourceScope: umbSortContextInternal.sourceScope,
                            sourceIndex: umbSortContextInternal.sourceIndex,
                            sourceContainer: umbSortContextInternal.sourceContainer,

                            targetScope: targetScope,
                            targetIndex: targetIndex,
                            targetContainer: targetContainer
                          };

                          umbSortContextInternal.sourceScope.opts.onReleaseHandler.call(this, item, _args);
                      }

                      var clonedItem = $('<li/>').css({height: 0});
                      item.before(clonedItem);
                      clonedItem.animate({'height': item.height()});
                      
                      
                         item.animate(clonedItem.position(), function  () {
                           clonedItem.detach();
                           _super(item);
                         });
                };

                scope.changeIndex = function(from, to){
                    scope.$apply(function(){
                      var i = ngModel.$modelValue.splice(from, 1)[0];
                      ngModel.$modelValue.splice(to, 0, i);
                    });
                };

                scope.move = function(args){
                    var from = args.sourceIndex;
                    var to = args.targetIndex;

                    if(args.sourceContainer === args.targetContainer){
                        scope.changeIndex(from, to);
                    }else{
                      scope.$apply(function(){
                        var i = args.sourceScope.model.$modelValue.splice(from, 1)[0];
                        args.targetScope.model.$modelvalue.splice(to,0, i);
                      });
                    }
                };

                scope.opts.onDragStart = function (item, container, _super) {
                      var children = $("li", container.el);
                      var offset = item.offset();
                      
                      umbSortContextInternal.sourceIndex = children.index(item);
                      umbSortContextInternal.sourceScope = $(container.el[0]).scope();
                      umbSortContextInternal.sourceContainer = container;

                      //current.item = ngModel.$modelValue.splice(current.index, 1)[0];

                      var pointer = container.rootGroup.pointer;
                      adjustment = {
                        left: pointer.left - offset.left,
                        top: pointer.top - offset.top
                      };

                      _super(item, container);
                };
                  
                element.sortable( scope.opts );
             }
          };

        });

/**
* @ngdoc directive
* @name umbraco.directives.directive:hexBgColor
* @restrict A
* @description Used to set a hex background color on an element, this will detect valid hex and when it is valid it will set the color, otherwise
* a color will not be set.
**/
function hexBgColor() {
    return {        
        restrict: "A",
        link: function (scope, element, attr, formCtrl) {

            var origColor = null;
            if (attr.hexBgOrig) {
                //set the orig based on the attribute if there is one
                origColor = attr.hexBgOrig;
            }
            
            attr.$observe("hexBgColor", function (newVal) {
                if (newVal) {
                    if (!origColor) {
                        //get the orig color before changing it
                        origColor = element.css("border-color");
                    }
                    //validate it
                    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(newVal)) {
                        element.css("background-color", "#" + newVal);
                        return;
                    }
                }
                element.css("background-color", origColor);
            });

        }
    };
}
angular.module('umbraco.directives').directive("hexBgColor", hexBgColor);
/**
* @ngdoc directive
* @name umbraco.directives.directive:headline
**/
angular.module("umbraco.directives")
  .directive('hotkey', function ($window, keyboardService, $log) {
      return function (scope, el, attrs) {
          var keyCombo = attrs["hotkey"];
          keyboardService.bind(keyCombo, function() {
              var element = $(el);
              if(element.is("a,button,input[type='button'],input[type='submit']")){
                element.click();
              }else{
                element.focus();
              }
          });
          
      };
  });
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbProperty
* @restrict E
**/
angular.module("umbraco.directives.html")
    .directive('umbControlGroup', function () {
        return {
            scope: {
                label: "@",
                description: "@",
                hideLabel: "@",
                alias: "@"
            },
            transclude: true,
            restrict: 'E',
            replace: true,        
            templateUrl: 'views/directives/html/umb-control-group.html'
        };
    });
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbProperty
* @restrict E
**/
angular.module("umbraco.directives.html")
    .directive('umbPane', function () {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,        
            templateUrl: 'views/directives/html/umb-pane.html'
        };
    });
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbPanel
* @restrict E
**/
angular.module("umbraco.directives.html")
	.directive('umbPanel', function(){
		return {
			restrict: 'E',
			replace: true,
			transclude: 'true',
			templateUrl: 'views/directives/html/umb-panel.html'
		};
	});
/**
* @ngdoc directive
* @name umbraco.directives.directive:preventDefault
**/
angular.module("umbraco.directives")
	.directive('preventDefault', function () {
		return function (scope, element, attrs) {
		    $(element).click(function (event) {
				if(event.metaKey || event.ctrlKey){
					return;
				}else{
					event.preventDefault();
				}		
			});
		};
	});
/**
 * @ngdoc directive
 * @name umbraco.directives.directive:resizeToContent
 * @element div
 * @function
 *
 * @description
 * Resize iframe's automatically to fit to the content they contain
 *
 * @example
   <example module="umbraco.directives">
     <file name="index.html">
         <iframe resize-to-content src="meh.html"></iframe>
     </file>
   </example>
 */
angular.module("umbraco.directives")
  .directive('resizeToContent', function ($window, $timeout) {
    return function (scope, el, attrs) {
       var iframe = el[0];
       var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
       if (iframeWin.document.body) {

          $timeout(function(){
              var height = iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight;
              el.height(height);
          }, 2000);
       }
    };
  });
angular.module("umbraco.directives")
.directive('sectionIcon', function ($compile, iconHelper) {
    return {
        restrict: 'E',
        replace: true,

        link: function (scope, element, attrs) {

            var icon = attrs.icon;

            if (iconHelper.isLegacyIcon(icon)) {
                //its a known legacy icon, convert to a new one
                element.html("<i class='" + iconHelper.convertFromLegacyIcon(icon) + "'></i>");
            }
            else if (iconHelper.isFileBasedIcon(icon)) {
                var convert = iconHelper.convertFromLegacyImage(icon);
                if(convert){
                    element.html("<i class='icon-section " + convert + "'></i>");
                }else{
                    element.html("<img src='images/tray/" + icon + "'>");
                }
                //it's a file, normally legacy so look in the icon tray images
            }
            else {
                //it's normal
                element.html("<i class='icon-section " + icon + "'></i>");
            }
        }
    };
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbItemSorter
* @function
* @element ANY
* @restrict E
* @description A re-usable directive for sorting items
**/
function umbItemSorter(angularHelper) {
    return {
        scope: {
            model: "="
        },
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-item-sorter.html',
        link: function(scope, element, attrs, ctrl) {
            var defaultModel = {
                okButton: "Ok",
                successMsg: "Sorting successful",
                complete: false
            };
            //assign user vals to default
            angular.extend(defaultModel, scope.model);
            //re-assign merged to user
            scope.model = defaultModel;

            scope.performSort = function() {
                scope.$emit("umbItemSorter.sorting", {
                    sortedItems: scope.model.itemsToSort
                });
            };

            scope.handleCancel = function () {
                scope.$emit("umbItemSorter.cancel");
            };

            scope.handleOk = function() {
                scope.$emit("umbItemSorter.ok");
            };
            
            //defines the options for the jquery sortable
            scope.sortableOptions = {
                axis: 'y',
                cursor: "move",
                placeholder: "ui-sortable-placeholder",
                update: function (ev, ui) {
                    //highlight the item when the position is changed
                    $(ui.item).effect("highlight", { color: "#049cdb" }, 500);
                },
                stop: function (ev, ui) {
                    //the ui-sortable directive already ensures that our list is re-sorted, so now we just
                    // need to update the sortOrder to the index of each item
                    angularHelper.safeApply(scope, function () {
                        angular.forEach(scope.itemsToSort, function (val, index) {
                            val.sortOrder = index + 1;
                        });

                    });
                }
            };
        }
    };
}

angular.module('umbraco.directives').directive("umbItemSorter", umbItemSorter);

/**
* @ngdoc directive
* @name umbraco.directives.directive:umbAvatar
* @restrict E
**/
function avatarDirective() {
    return {
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-avatar.html',
        scope: {
            name: '@',
            email: '@',
            hash: '@'
        },
        link: function(scope, element, attr, ctrl) {

            scope.$watch("hash", function (val) {
                //set the gravatar url
                scope.gravatar = "http://www.gravatar.com/avatar/" + val + "?s=40";
            });
            
        }
    };
}

angular.module('umbraco.directives').directive("umbAvatar", avatarDirective);

/**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbConfirm
 * @function
 * @description
 * A confirmation dialog
 * 
 * @restrict E
 */
function confirmDirective() {
    return {
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-confirm.html',
        scope: {
            onConfirm: '=',
            onCancel: '=',
            caption: '@'
        },
        link: function (scope, element, attr, ctrl) {
            
        }
    };
}
angular.module('umbraco.directives').directive("umbConfirm", confirmDirective);
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbContentName 
* @restrict E
* @function
* @description 
* Used by editors that require naming an entity. Shows a textbox/headline with a required validator within it's own form.
**/
angular.module("umbraco.directives")
	.directive('umbContentName', function ($timeout) {
	    return {
	        require: "ngModel",
			restrict: 'E',
			replace: true,
			templateUrl: 'views/directives/umb-content-name.html',
			scope: {
			    placeholder: '@placeholder',
			    model: '=ngModel'
			},
			link: function(scope, element, attrs, modelCtrl) {

				var input = $(element).find('input');
				var h1 = $(element).find('h1');
				input.hide();

				
				input.on("blur", function () {
				    //Don't hide the input field if there is no value in it
				    var val = input.val() || "empty";
				    input.hide();

				    h1.text(val);
				    h1.show();
				});


				h1.on("click", function () {
				    h1.hide();
		            input.show().focus();
				});

				$timeout(function(){
						if(!scope.model){
							    h1.hide();
					            input.show().focus();
					        }    
				}, 500);	
			}
	    };
	});
angular.module("umbraco.directives")
.directive('umbContextMenu', function ($injector) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/directives/umb-contextmenu.html',
        link: function (scope, element, attrs, ctrl) {

            //adds a handler to the context menu item click, we need to handle this differently
            //depending on what the menu item is supposed to do.
            scope.executeMenuItem = function (currentNode, action, currentSection) {

                if (action.metaData && action.metaData["jsAction"] && angular.isString(action.metaData["jsAction"])) {

                    //we'll try to get the jsAction from the injector
                    var menuAction = action.metaData["jsAction"].split('.');
                    if (menuAction.length !== 2) {
                        throw "The jsAction assigned to a menu action must have two parts delimited by a '.' ";
                    }

                    var service = $injector.get(menuAction[0]);
                    if (!service) {
                        throw "The angular service " + menuAction[0] + " could not be found";
                    }

                    var method = service[menuAction[1]];
                    
                    if (!method) {
                        throw "The method " + menuAction[1] + " on the angular service " + menuAction[0] + " could not be found";
                    }

                    method.apply(this, [{
                        treeNode: currentNode,
                        action: action,
                        section: currentSection
                    }]);
                }
                else {
                    //by default we launch the dialog
                    scope.openDialog(currentNode, action, currentSection);
                }
            };

        }
    };
});
/**
* @ngdoc directive
* @function
* @name umbraco.directives.directive:umbEditor 
* @requires formController
* @restrict E
**/
angular.module("umbraco.directives")
    .directive('umbEditor', function (umbPropEditorHelper) {
        return {
            scope: {
                model: "=",
                isPreValue: "@"
            },
            require: "^form",
            restrict: 'E',
            replace: true,      
            templateUrl: 'views/directives/umb-editor.html',
            link: function (scope, element, attrs, ctrl) {

                //we need to copy the form controller val to our isolated scope so that
                //it get's carried down to the child scopes of this!
                //we'll also maintain the current form name.
                scope[ctrl.$name] = ctrl;

                if(!scope.model.alias){
                   scope.model.alias = Math.random().toString(36).slice(2);
                }

                scope.propertyEditorView = umbPropEditorHelper.getViewPath(scope.model.view, scope.isPreValue);
            }
        };
    });
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbFileUpload
* @function
* @restrict A
* @scope
* @description
*  Listens for file input control changes and emits events when files are selected for use in other controllers.
**/
function umbFileUpload() {
    return {
        restrict: "A",
        scope: true,        //create a new scope
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var files = event.target.files;
                //emit event upward
                scope.$emit("filesSelected", { files: files });                           
            });
        }
    };
}

angular.module('umbraco.directives').directive("umbFileUpload", umbFileUpload);
angular.module("umbraco.directives")
.directive('umbHeader', function($parse, $timeout){
    return {
        restrict: 'E',
        replace: true,
        transclude: 'true',
        templateUrl: 'views/directives/umb-header.html',
        //create a new isolated scope assigning a tabs property from the attribute 'tabs'
        //which is bound to the parent scope property passed in
        scope: {
            tabs: "="
        },
        link: function (scope, iElement, iAttrs) {

            function collectFromDom(activeTab){
                var $panes = $('div.tab-content');
                $panes.find('.tab-pane').each(function (index) {
                    var $this = angular.element(this);
                    var id = $this.attr("rel");
                    var label = $this.attr("label");
                    var tab = {id: id, label: label, active: false};
                    if(!activeTab){
                        tab.active = true;
                        activeTab = tab;
                    }

                    if ($this.attr("rel") === String(activeTab.id)) {
                        $this.addClass('active');
                    }
                    else {
                        $this.removeClass('active');
                    }

                    //this is sorta hacky since we add a tab object to the tabs collection
                    //based on a dom element, there is most likely a better way...    
                    if (label) {
                        scope.collectedTabs.push(tab);
                    }
                });
            }

            scope.showTabs = iAttrs.tabs ? true : false;
            scope.collectedTabs = [];

            $timeout(function () {
                                collectFromDom(undefined);
                            }, 500);

            //when the tabs change, we need to hack the planet a bit and force the first tab content to be active,
            //unfortunately twitter bootstrap tabs is not playing perfectly with angular.
            scope.$watch("tabs", function (newValue, oldValue) {

                $(newValue).each(function(i, val){
                        scope.collectedTabs.push({id: val.id, label: val.label});
                });
                //scope.collectedTabs = newValue;

                //don't process if we cannot or have already done so
                if (!newValue) {return;}
                //if (hasProcessed || !newValue.length || newValue.length == 0) return;
                if (!newValue.length || newValue.length === 0){return;}
                
                //set the flag
                //hasProcessed = true;

                
                var activeTab = _.find(newValue, function (item) {
                    return item.active;
                });


                //we need to do a timeout here so that the current sync operation can complete
                // and update the UI, then this will fire and the UI elements will be available.
                $timeout(function () {
                    collectFromDom(activeTab);
                }, 500);
                
            });
        }
    };
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:login
* @function
* @element ANY
* @restrict E
**/
function loginDirective() {
    return {
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-login.html'        
    };
}

angular.module('umbraco.directives').directive("umbLogin", loginDirective);

/**
* @ngdoc directive
* @name umbraco.directives.directive:umbNavigation
* @restrict E
**/
function leftColumnDirective() {
    return {
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-navigation.html'
    };
}

angular.module('umbraco.directives').directive("umbNavigation", leftColumnDirective);

/**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbNotifications
 */
function notificationDirective() {
    return {
        restrict: "E",    // restrict to an element
        replace: true,   // replace the html element with the template
        templateUrl: 'views/directives/umb-notifications.html'
    };
}

angular.module('umbraco.directives').directive("umbNotifications", notificationDirective);
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbProperty
* @restrict E
**/
angular.module("umbraco.directives")
    .directive('umbProperty', function (umbPropEditorHelper) {
        return {
            scope: {
                property: "="
            },
            transclude: true,
            restrict: 'E',
            replace: true,        
            templateUrl: 'views/directives/umb-property.html',
            link: function (scope, element, attrs, ctrl) {

            }
        };
    });
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbFileUpload
* @function
* @restrict A
* @scope
* @description
*  A single file upload field that will reset itself based on the object passed in for the rebuild parameter. This
*  is required because the only way to reset an upload control is to replace it's html.
**/
function umbSingleFileUpload($compile) {
    return {
        restrict: "E",
        scope: {
            rebuild: "="
        },
        replace: true,
        template: "<div><input type='file' umb-file-upload /></div>",
        link: function (scope, el, attrs) {

            scope.$watch("rebuild", function (newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
                    //recompile it!
                    el.html("<input type='file' umb-file-upload />");
                    $compile(el.contents())(scope);
                }
            });

        }
    };
}

angular.module('umbraco.directives').directive("umbSingleFileUpload", umbSingleFileUpload);
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbTab 
* @restrict E
**/
angular.module("umbraco.directives")
.directive('umbTab', function(){
	return {
		restrict: 'E',
		replace: true,
		transclude: 'true',
		templateUrl: 'views/directives/umb-tab.html'
	};
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbTabView 
* @restrict E
**/
angular.module("umbraco.directives")
.directive('umbTabView', function(){
	return {
		restrict: 'E',
		replace: true,
		transclude: 'true',
		templateUrl: 'views/directives/umb-tab-view.html'
	};
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:umbTree
* @restrict E
**/
angular.module("umbraco.directives")
  .directive('umbTree', function ($compile, $log, $q, $rootScope, treeService, notificationsService, $timeout) {
    
    return {
      restrict: 'E',
      replace: true,
      terminal: false,

      scope: {
        section: '@',
        showoptions: '@',
        showheader: '@',
        cachekey: '@',
        eventhandler: '='
      },

      compile: function (element, attrs) {
         //config
         var hideheader = (attrs.showheader === 'false') ? true : false;
         var hideoptions = (attrs.showoptions === 'false') ? "hide-options" : "";
        
         var template = '<ul class="umb-tree ' + hideoptions + '">' + 
         '<li class="root">';

         if(!hideheader){ 
           template +='<div>' + 
           '<h5><a href="#{{section}}" class="root-link">{{tree.name}}</a></h5>' +
               '<a href class="umb-options" ng-hide="tree.root.isContainer || !tree.root.menuUrl" ng-click="options(this, tree.root, $event)" ng-swipe-right="options(this, tree.root, $event)"><i></i><i></i><i></i></a>' +
           '</div>';
         }
         template += '<ul>' +
                  '<umb-tree-item ng-repeat="child in tree.root.children" eventhandler="eventhandler" node="child" section="{{section}}" ng-animate="animation()"></umb-tree-item>' +
                  '</ul>' +
                '</li>' +
               '</ul>';

        element.replaceWith(template);

        return function (scope, element, attrs, controller) {

            //flag to track the last loaded section when the tree 'un-loads'. We use this to determine if we should
            // re-load the tree again. For example, if we hover over 'content' the content tree is shown. Then we hover
            // outside of the tree and the tree 'un-loads'. When we re-hover over 'content', we don't want to re-load the 
            // entire tree again since we already still have it in memory. Of course if the section is different we will
            // reload it. This saves a lot on processing if someone is navigating in and out of the same section many times
            // since it saves on data retreival and DOM processing.
            var lastSection = "";

            //flag to enable/disable delete animations
            var enableDeleteAnimations = false;

            /** Helper function to emit tree events */
            function emitEvent(eventName, args) {

              if (scope.eventhandler) {
                $(scope.eventhandler).trigger(eventName, args);
              }
             //   $rootScope.$broadcast(eventName, args);
            }

            /** Method to load in the tree data */
            function loadTree() {                
                if (scope.section) {

                    //anytime we want to load the tree we need to disable the delete animations
                    enableDeleteAnimations = false;

                    //use $q.when because a promise OR raw data might be returned.
                    $q.when(treeService.getTree({ section: scope.section, cachekey: scope.cachekey }))
                        .then(function (data) {
                            //set the data once we have it
                            scope.tree = data;

                            //do timeout so that it re-enables them after this digest
                            $timeout(function() {
                                //enable delete animations
                                enableDeleteAnimations = true;
                            });

                        }, function (reason) {
                            notificationsService.error("Tree Error", reason);
                        });
                }
            }

            /** method to set the current animation for the node. 
             *  This changes dynamically based on if we are changing sections or just loading normal tree data. 
             *  When changing sections we don't want all of the tree-ndoes to do their 'leave' animations.
             */
            scope.animation = function () {
                if (enableDeleteAnimations) {
                    return { leave: 'tree-node-delete-leave' };
                }
                else {
                    return {};
                }
            };

            /**
              Method called when the options button next to the root node is called.
              The tree doesnt know about this, so it raises an event to tell the parent controller
              about it.
            */
            scope.options = function (e, n, ev) {
                emitEvent("treeOptionsClick", { element: e, node: n, event: ev });
            };
            
            //watch for section changes
            scope.$watch("section", function (newVal, oldVal) {
                if (!newVal) {
                    //store the last section loaded
                    lastSection = oldVal;
                }                
                else if (newVal !== oldVal && newVal !== lastSection) {
                    //only reload the tree data and Dom if the newval is different from the old one
                    // and if the last section loaded is different from the requested one.
                    loadTree();
                    
                    //store the new section to be loaded as the last section
                    lastSection = newVal;
                }
            });

            //initial change
            loadTree();
         };
       }
      };
    });
/**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbTreeItem
 * @element li
 * @function
 *
 * @description
 * Renders a list item, representing a single node in the tree.
 * Includes element to toggle children, and a menu toggling button
 *
 * **note:** This directive is only used internally in the umbTree directive
 *
 * @example
   <example module="umbraco">
    <file name="index.html">
         <umb-tree-item ng-repeat="child in tree.children" node="child" callback="callback" section="content"></umb-tree-item>
    </file>
   </example>
 */
angular.module("umbraco.directives")
.directive('umbTreeItem', function ($compile, $http, $templateCache, $interpolate, $log, $location, $rootScope, $window, treeService, notificationsService) {
  return {
    restrict: 'E',
    replace: true,

    scope: {
      section: '@',
      cachekey: '@',
      eventhandler: '=',
      node:'='
    },

    template: '<li ng-swipe-right="options(this, node, $event)"><div ng-style="setTreePadding(node)" ng-class="{\'loading\': node.loading}">' +
        '<ins ng-hide="node.hasChildren" style="background:none;width:18px;"></ins>' +        
        '<ins ng-show="node.hasChildren" ng-class="{\'icon-navigation-right\': !node.expanded, \'icon-navigation-down\': node.expanded}" ng-click="load(this, node)"></ins>' +
        '<i title="#{{node.routePath}}" class="{{node.cssClass}}" style="{{node.style}}"></i>' +
        '<a href ng-click="select(this, node, $event)" >{{node.name}}</a>' +
        '<a href class="umb-options" ng-hide="!node.menuUrl" ng-click="options(this, node, $event)"><i></i><i></i><i></i></a>' +
        '<div ng-show="node.loading" class="l"><div></div></div>' +
        '</div>' +
        '</li>',

    link: function (scope, element, attrs) {
        
        //flag to enable/disable delete animations, default for an item is tru
        var enableDeleteAnimations = true;

        /** Helper function to emit tree events */
        function emitEvent(eventName, args) {

          if(scope.eventhandler){
            $(scope.eventhandler).trigger(eventName,args);
          }
          //$rootScope.$broadcast(eventName, args);
        }

        /**
          Method called when the options button next to a node is called
          In the main tree this opens the menu, but internally the tree doesnt
          know about this, so it simply raises an event to tell the parent controller
          about it.
        */
        scope.options = function(e, n, ev){ 
          emitEvent("treeOptionsClick", {element: e, node: n, event: ev});
        };

        /**
          Method called when an item is clicked in the tree, this passes the 
          DOM element, the tree node object and the original click
          and emits it as a treeNodeSelect element if there is a callback object
          defined on the tree
        */
        scope.select = function(e,n,ev){
            emitEvent("treeNodeSelect", { element: e, node: n, event: ev });
        };

        /** method to set the current animation for the node. 
        *  This changes dynamically based on if we are changing sections or just loading normal tree data. 
        *  When changing sections we don't want all of the tree-ndoes to do their 'leave' animations.
        */
        scope.animation = function () {
            if (enableDeleteAnimations && scope.node.expanded) {
                return { leave: 'tree-node-delete-leave' };
            }
            else {
                return {};
            }
        };

        /**
          Method called when a node in the tree is expanded, when clicking the arrow
          takes the arrow DOM element and node data as parameters
          emits treeNodeCollapsing event if already expanded and treeNodeExpanding if collapsed
        */
        scope.load = function(arrow, node) {

            if (node.expanded) {
                enableDeleteAnimations = false;
                emitEvent("treeNodeCollapsing", { element: arrow, node: node });
                node.expanded = false;                
            }
            else {

                //emit treeNodeExpanding event, if a callback object is set on the tree
                emitEvent("treeNodeExpanding", { element: arrow, node: node });
                
                if (!node.children || (angular.isArray(node.children) && node.children.length === 0)) {
                    //get the children from the tree service
                    treeService.loadNodeChildren({ node: node, section: scope.section })
                        .then(function(data) {
                            //emit expanded event
                            emitEvent("treeNodeExpanded", { element: arrow, node: node, children: data });
                            enableDeleteAnimations = true;
                        });
                }
                else {
                    emitEvent("treeNodeExpanded", { element: arrow, node: node, children: node.children });
                    node.expanded = true;
                    enableDeleteAnimations = true;
                }
            }            
        };

        /**
          Helper method for setting correct element padding on tree DOM elements
          Since elements are not children of eachother, we need this indenting done
          manually
        */
        scope.setTreePadding = function(node) {
          return { 'padding-left': (node.level * 20) + "px" };
        };
        
        var template = '<ul ng-class="{collapsed: !node.expanded}"><umb-tree-item ng-repeat="child in node.children" eventhandler="eventhandler" node="child" section="{{section}}" ng-animate="animation()"></umb-tree-item></ul>';
        var newElement = angular.element(template);
        $compile(newElement)(scope);
        element.append(newElement);
    }
  };
});

/**
* @description Utillity directives for key and field events
**/
angular.module('umbraco.directives')

.directive('onKeyup', function () {
    return function (scope, elm, attrs) {
        elm.bind("keyup", function () {
            scope.$apply(attrs.onKeyup);
        });
    };
})

.directive('onKeyDown', function ($key) {
    return {
        link: function (scope, elm, attrs) {
            $key('keydown', scope, elm, attrs);
        }
    };
})

.directive('onBlur', function () {
    return function (scope, elm, attrs) {
        elm.bind("blur", function () {
            scope.$apply(attrs.onBlur);
        });
    };
})

.directive('onFocus', function () {
    return function (scope, elm, attrs) {
        elm.bind("focus", function () {
            scope.$apply(attrs.onFocus);
        });
    };
});
/**
 * General-purpose validator for ngModel.
 * angular.js comes with several built-in validation mechanism for input fields (ngRequired, ngPattern etc.) but using
 * an arbitrary validation function requires creation of a custom formatters and / or parsers.
 * The ui-validate directive makes it easy to use any function(s) defined in scope as a validator function(s).
 * A validator function will trigger validation on both model and input changes.
 *
 * @example <input val-custom=" 'myValidatorFunction($value)' ">
 * @example <input val-custom="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }">
 * @example <input val-custom="{ foo : '$value > anotherModel' }" val-custom-watch=" 'anotherModel' ">
 * @example <input val-custom="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }" val-custom-watch=" { foo : 'anotherModel' } ">
 *
 * @param val-custom {string|object literal} If strings is passed it should be a scope's function to be used as a validator.
 * If an object literal is passed a key denotes a validation error key while a value should be a validator function.
 * In both cases validator function should take a value to validate as its argument and should return true/false indicating a validation result.
 */

 /* 
  This code comes from the angular UI project, we had to change the directive name and module
  but other then that its unmodified
 */
angular.module('umbraco.directives.validation')
.directive('valCustom', function () {

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      var validateFn, watch, validators = {},
        validateExpr = scope.$eval(attrs.valCustom);

      if (!validateExpr){ return;}

      if (angular.isString(validateExpr)) {
        validateExpr = { validator: validateExpr };
      }

      angular.forEach(validateExpr, function (exprssn, key) {
        validateFn = function (valueToValidate) {
          var expression = scope.$eval(exprssn, { '$value' : valueToValidate });
          if (angular.isObject(expression) && angular.isFunction(expression.then)) {
            // expression is a promise
            expression.then(function(){
              ctrl.$setValidity(key, true);
            }, function(){
              ctrl.$setValidity(key, false);
            });
            return valueToValidate;
          } else if (expression) {
            // expression is true
            ctrl.$setValidity(key, true);
            return valueToValidate;
          } else {
            // expression is false
            ctrl.$setValidity(key, false);
            return undefined;
          }
        };
        validators[key] = validateFn;
        ctrl.$formatters.push(validateFn);
        ctrl.$parsers.push(validateFn);
      });

      function apply_watch(watch)
      {
          //string - update all validators on expression change
          if (angular.isString(watch))
          {
              scope.$watch(watch, function(){
                  angular.forEach(validators, function(validatorFn){
                      validatorFn(ctrl.$modelValue);
                  });
              });
              return;
          }

          //array - update all validators on change of any expression
          if (angular.isArray(watch))
          {
              angular.forEach(watch, function(expression){
                  scope.$watch(expression, function()
                  {
                      angular.forEach(validators, function(validatorFn){
                          validatorFn(ctrl.$modelValue);
                      });
                  });
              });
              return;
          }

          //object - update appropriate validator
          if (angular.isObject(watch))
          {
              angular.forEach(watch, function(expression, validatorKey)
              {
                  //value is string - look after one expression
                  if (angular.isString(expression))
                  {
                      scope.$watch(expression, function(){
                          validators[validatorKey](ctrl.$modelValue);
                      });
                  }

                  //value is array - look after all expressions in array
                  if (angular.isArray(expression))
                  {
                      angular.forEach(expression, function(intExpression)
                      {
                          scope.$watch(intExpression, function(){
                              validators[validatorKey](ctrl.$modelValue);
                          });
                      });
                  }
              });
          }
      }
      // Support for val-custom-watch
      if (attrs.valCustomWatch){
          apply_watch( scope.$eval(attrs.valCustomWatch) );
      }
    }
  };
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:valHighlight
* @restrict A
* @description Used on input fields when you want to signal that they are in error, this will highlight the item for 1 second
**/
function valHighlight($timeout) {
    return {
        restrict: "A",
        link: function (scope, element, attrs, ctrl) {
            
            scope.$watch(function() {
                return scope.$eval(attrs.valHighlight);
            }, function(newVal, oldVal) {
                if (newVal === true) {
                    element.addClass("highlight-error");
                    $timeout(function () {
                        //set the bound scope property to false
                        scope[attrs.valHighlight] = false;
                    }, 1000);
                }
                else {
                    element.removeClass("highlight-error");
                }
            });
   
        }
    };
}
angular.module('umbraco.directives').directive("valHighlight", valHighlight);
angular.module('umbraco.directives.validation')
	.directive('valCompare',function () {
	return {
	        require: "ngModel",
	        link: function(scope, elem, attrs, ctrl) {	            
	            var otherInput = elem.inheritedData("$formController")[attrs.valCompare];

	            ctrl.$parsers.push(function(value) {
	                if(value === otherInput.$viewValue) {
	                    ctrl.$setValidity("valCompare", true);
	                    return value;
	                }
	                ctrl.$setValidity("valCompare", false);
	            });

	            otherInput.$parsers.push(function(value) {
	                ctrl.$setValidity("valCompare", value === ctrl.$viewValue);
	                return value;
	            });
	        }
	};
});
/**
* @ngdoc directive
* @name umbraco.directives.directive:valPropertyMsg
* @restrict A
* @element textarea
* @requires formController
* @description This directive is used to control the display of the property level validation message.
*    We will listen for server side validation changes
*    and when an error is detected for this property we'll show the error message
**/
function valPropertyMsg(serverValidationManager) {    
    return {
        scope: {
            property: "=property"
        },
        require: "^form",   //require that this directive is contained within an ngForm
        replace: true,      //replace the element with the template
        restrict: "E",      //restrict to element
        template: "<div ng-show=\"errorMsg != ''\" class='alert alert-error property-error' >{{errorMsg}}</div>",        
       
        /**
            Our directive requries a reference to a form controller 
            which gets passed in to this parameter
         */
        link: function (scope, element, attrs, formCtrl) {

            //assign the form control to our isolated scope so we can watch it's values
            scope.formCtrl = formCtrl;
            
            //if there's any remaining errors in the server validation service then we should show them.
            var showValidation = serverValidationManager.items.length > 0;
            var hasError = false;

            //create properties on our custom scope so we can use it in our template
            scope.errorMsg = "";

            //listen for error changes
            scope.$watch("formCtrl.$error", function () {
                if (formCtrl.$invalid) {
                    
                    //first we need to check if the valPropertyMsg validity is invalid
                    if (formCtrl.$error.valPropertyMsg && formCtrl.$error.valPropertyMsg.length > 0) {
                        //since we already have an error we'll just return since this means we've already set the 
                        // hasError and errorMsg properties which occurs below in the serverValidationManager.subscribe
                        return;
                    }                    
                    else if (element.closest(".umb-control-group").find(".ng-invalid").length > 0) {
                        //check if it's one of the properties that is invalid in the current content property
                        hasError = true;
                        //update the validation message if we don't already have one assigned.
                        if (showValidation && scope.errorMsg === "") {
                            var err;
                            //this can be null if no property was assigned
                            if (scope.property) {
                                err = serverValidationManager.getPropertyError(scope.property.alias, "");
                            }
                            scope.errorMsg = err ? err.errorMsg : "Property has errors";
                        }
                    }
                    else {
                        hasError = false;
                        scope.errorMsg = "";
                    }
                }
                else {
                    hasError = false;
                    scope.errorMsg = "";
                }
            }, true);

            //listen for the forms saving event
            scope.$on("saving", function (ev, args) {
                showValidation = true;
                if (hasError && scope.errorMsg === "") {
                    var err;
                    //this can be null if no property was assigned
                    if (scope.property) {
                        err = serverValidationManager.getPropertyError(scope.property.alias, "");
                    }
                    scope.errorMsg = err ? err.errorMsg : "Property has errors";                    
                }
                else if (!hasError) {
                    scope.errorMsg = "";
                }
            });

            //listen for the forms saved event
            scope.$on("saved", function (ev, args) {
                showValidation = false;
                scope.errorMsg = "";
                formCtrl.$setValidity('valPropertyMsg', true);                
            });

            //We need to subscribe to any changes to our model (based on user input)
            // This is required because when we have a server error we actually invalidate 
            // the form which means it cannot be resubmitted. 
            // So once a field is changed that has a server error assigned to it
            // we need to re-validate it for the server side validator so the user can resubmit
            // the form. Of course normal client-side validators will continue to execute.          
            scope.$watch("property.value", function (newValue) {
                //we are explicitly checking for valServer errors here, since we shouldn't auto clear
                // based on other errors. We'll also check if there's no other validation errors apart from valPropertyMsg, if valPropertyMsg
                // is the only one, then we'll clear.

                var errCount = 0;
                for (var e in scope.formCtrl.$error) {
                    errCount++;
                }

                if ((errCount === 1 && scope.formCtrl.$error.valPropertyMsg !== undefined) ||
                    (formCtrl.$invalid && scope.formCtrl.$error.valServer !== undefined)) {
                    scope.errorMsg = "";
                    formCtrl.$setValidity('valPropertyMsg', true);
                }
            }, true);
            
            //listen for server validation changes
            // NOTE: we pass in "" in order to listen for all validation changes to the content property, not for
            // validation changes to fields in the property this is because some server side validators may not
            // return the field name for which the error belongs too, just the property for which it belongs.
            // It's important to note that we need to subscribe to server validation changes here because we always must
            // indicate that a content property is invalid at the property level since developers may not actually implement
            // the correct field validation in their property editors.
            
            if (scope.property) { //this can be null if no property was assigned
                serverValidationManager.subscribe(scope.property.alias, "", function(isValid, propertyErrors, allErrors) {
                    hasError = !isValid;
                    if (hasError) {
                        //set the error message to the server message
                        scope.errorMsg = propertyErrors[0].errorMsg;
                        //flag that the current validator is invalid
                        formCtrl.$setValidity('valPropertyMsg', false);
                    }
                    else {
                        scope.errorMsg = "";
                        //flag that the current validator is valid
                        formCtrl.$setValidity('valPropertyMsg', true);
                    }
                });

                //when the element is disposed we need to unsubscribe!
                // NOTE: this is very important otherwise when this controller re-binds the previous subscriptsion will remain
                // but they are a different callback instance than the above.
                element.bind('$destroy', function() {
                    serverValidationManager.unsubscribe(scope.property.alias, "");
                });
            }
        }
    };
}
angular.module('umbraco.directives').directive("valPropertyMsg", valPropertyMsg);
/**
    * @ngdoc directive
    * @name umbraco.directives.directive:valRegex
    * @restrict A
    * @description A custom directive to allow for matching a value against a regex string.
    *               NOTE: there's already an ng-pattern but this requires that a regex expression is set, not a regex string
    **/
function valRegex() {
    return {
        require: 'ngModel',
        restrict: "A",
        link: function (scope, elm, attrs, ctrl) {

            var regex;
            try {
                regex = new RegExp(scope.$eval(attrs.valRegex));
            }
            catch(e) {
                regex = new RegExp(attrs.valRegex);
            }

            var patternValidator = function (viewValue) {
                //NOTE: we don't validate on empty values, use required validator for that
                if (!viewValue || regex.test(viewValue)) {
                    // it is valid
                    ctrl.$setValidity('valRegex', true);
                    //assign a message to the validator
                    ctrl.errorMsg = "";
                    return viewValue;
                }
                else {
                    // it is invalid, return undefined (no model update)
                    ctrl.$setValidity('valRegex', false);
                    //assign a message to the validator
                    ctrl.errorMsg = "Value is invalid, it does not match the correct pattern";
                    return undefined;
                }
            };

            ctrl.$formatters.push(patternValidator);
            ctrl.$parsers.push(patternValidator);
        }
    };
}
angular.module('umbraco.directives').directive("valRegex", valRegex);
/**
    * @ngdoc directive
    * @name umbraco.directives.directive:valServer
    * @restrict A
    * @description This directive is used to associate a content property with a server-side validation response
    *               so that the validators in angular are updated based on server-side feedback.
    **/
function valServer(serverValidationManager) {
    return {
        require: 'ngModel',
        restrict: "A",
        link: function (scope, element, attr, ctrl) {
            
            if (!scope.model || !scope.model.alias){
                throw "valServer can only be used in the scope of a content property object";
            }
            var currentProperty = scope.model;

            //default to 'value' if nothing is set
            var fieldName = "value";
            if (attr.valServer) {
                fieldName = scope.$eval(attr.valServer);
                if (!fieldName) {
                    //eval returned nothing so just use the string
                    fieldName = attr.valServer;
                }
            }            

            //subscribe to the changed event of the view model. This is required because when we
            // have a server error we actually invalidate the form which means it cannot be 
            // resubmitted. So once a field is changed that has a server error assigned to it
            // we need to re-validate it for the server side validator so the user can resubmit
            // the form. Of course normal client-side validators will continue to execute.
            ctrl.$viewChangeListeners.push(function () {
                if (ctrl.$invalid) {
                    ctrl.$setValidity('valServer', true);
                }
            });
            
            //subscribe to the server validation changes
            serverValidationManager.subscribe(currentProperty.alias, fieldName, function (isValid, propertyErrors, allErrors) {
                if (!isValid) {
                    ctrl.$setValidity('valServer', false);
                    //assign an error msg property to the current validator
                    ctrl.errorMsg = propertyErrors[0].errorMsg;
                }
                else {
                    ctrl.$setValidity('valServer', true);
                    //reset the error message
                    ctrl.errorMsg = "";
                }
            });
            
            //when the element is disposed we need to unsubscribe!
            // NOTE: this is very important otherwise when this controller re-binds the previous subscriptsion will remain
            // but they are a different callback instance than the above.
            element.bind('$destroy', function () {
                serverValidationManager.unsubscribe(currentProperty.alias, fieldName);
            });
        }
    };
}
angular.module('umbraco.directives').directive("valServer", valServer);
/**
    * @ngdoc directive
    * @name umbraco.directives.directive:valServerField
    * @restrict A
    * @description This directive is used to associate a content field (not user defined) with a server-side validation response
    *               so that the validators in angular are updated based on server-side feedback.
    **/
function valServerField(serverValidationManager) {
    return {
        require: 'ngModel',
        restrict: "A",
        link: function (scope, element, attr, ctrl) {
            
            if (!attr.valServerField) {
                throw "valServerField must have a field name for referencing server errors";
            }

            var fieldName = attr.valServerField;
            
            //subscribe to the changed event of the view model. This is required because when we
            // have a server error we actually invalidate the form which means it cannot be 
            // resubmitted. So once a field is changed that has a server error assigned to it
            // we need to re-validate it for the server side validator so the user can resubmit
            // the form. Of course normal client-side validators will continue to execute.
            ctrl.$viewChangeListeners.push(function () {
                if (ctrl.$invalid) {
                    ctrl.$setValidity('valServerField', true);
                }
            });
            
            //subscribe to the server validation changes
            serverValidationManager.subscribe(null, fieldName, function (isValid, fieldErrors, allErrors) {
                if (!isValid) {
                    ctrl.$setValidity('valServerField', false);
                    //assign an error msg property to the current validator
                    ctrl.errorMsg = fieldErrors[0].errorMsg;
                }
                else {
                    ctrl.$setValidity('valServerField', true);
                    //reset the error message
                    ctrl.errorMsg = "";
                }
            });
            
            //when the element is disposed we need to unsubscribe!
            // NOTE: this is very important otherwise when this controller re-binds the previous subscriptsion will remain
            // but they are a different callback instance than the above.
            element.bind('$destroy', function () {
                serverValidationManager.unsubscribe(null, fieldName);
            });
        }
    };
}
angular.module('umbraco.directives').directive("valServerField", valServerField);
/**
* @ngdoc directive
* @name umbraco.directives.directive:valShowValidation
* @restrict A
* @description Used to toggle the show-validation class on the element containing the form elements to validate.
*   This is used because we don't want to show validation messages until after the form is submitted and then reset
*   the process when the form is successful. We do this by listening to the current controller's saving and saved events.
**/
function valShowValidation(serverValidationManager) {
    return {
        restrict: "A",
        link: function (scope, element, attr, ctrl) {

            //we should show validation if there are any msgs in the server validation collection
            if (serverValidationManager.items.length > 0) {
                element.addClass("show-validation");
            }

            //listen for the forms saving event
            scope.$on("saving", function (ev, args) {
                element.addClass("show-validation");
            });
            
            //listen for the forms saved event
            scope.$on("saved", function (ev, args) {
                element.removeClass("show-validation");
            });
            
        }
    };
}
angular.module('umbraco.directives').directive("valShowValidation", valShowValidation);

/**
* @ngdoc directive
* @name umbraco.directives.directive:valTab
* @restrict A
* @description Used to show validation warnings for a tab to indicate that the tab content has validations errors in its data.
**/
function valTab() {
    return {
        require: "^form",
        restrict: "A",
        link: function (scope, element, attr, formCtrl) {
            
            var tabId = "tab" + scope.tab.id;
            
            //assign the form control to our isolated scope so we can watch it's values
            scope.formCtrl = formCtrl;
            scope.tabHasError = false;

            //watch the current form's validation for the current field name
            scope.$watch("formCtrl.$valid", function () {                
                var tabContent = element.closest(".umb-panel").find("#" + tabId);

                if (formCtrl.$invalid) {
                    //check if the validation messages are contained inside of this tabs 
                    if (tabContent.find(".ng-invalid").length > 0) {
                        scope.tabHasError = true;
                    }
                    else {
                        scope.tabHasError = false;
                    }
                }
                else {
                    scope.tabHasError = false;
                }
            });
        }
    };
}
angular.module('umbraco.directives').directive("valTab", valTab);
function valToggleMsg(serverValidationManager) {
    return {
        require: "^form",
        restrict: "A",

        /**
            Our directive requries a reference to a form controller which gets passed in to this parameter
         */
        link: function (scope, element, attr, formCtrl) {

            if (!attr.valToggleMsg){
                throw "valToggleMsg requires that a reference to a validator is specified";
            }
            if (!attr.valMsgFor){
                throw "valToggleMsg requires that the attribute valMsgFor exists on the element";
            }
            if (!formCtrl[attr.valMsgFor]) {
                throw "valToggleMsg cannot find field " + attr.valMsgFor + " on form " + formCtrl.$name;
            }

            //assign the form control to our isolated scope so we can watch it's values
            scope.formCtrl = formCtrl;

            //if there's any remaining errors in the server validation service then we should show them.
            var showValidation = serverValidationManager.items.length > 0;
            
            //add a watch to the validator for the value (i.e. myForm.value.$error.required )
            scope.$watch("formCtrl." + attr.valMsgFor + ".$error." + attr.valToggleMsg, function () {
                if (formCtrl[attr.valMsgFor].$error[attr.valToggleMsg] && showValidation) {
                    element.show();
                }
                else {
                    element.hide();
                }
            });
            
            scope.$on("saving", function(ev, args) {
                showValidation = true;
                if (formCtrl[attr.valMsgFor].$error[attr.valToggleMsg]) {
                    element.show();
                }
                else {
                    element.hide();
                }
            });
            
            scope.$on("saved", function (ev, args) {
                showValidation = false;
                element.hide();
            });

        }
    };
}

/**
* @ngdoc directive
* @name umbraco.directives.directive:valToggleMsg
* @restrict A
* @element input
* @requires formController
* @description This directive will show/hide an error based on: is the value + the given validator invalid? AND, has the form been submitted ?
**/
angular.module('umbraco.directives').directive("valToggleMsg", valToggleMsg);

})();