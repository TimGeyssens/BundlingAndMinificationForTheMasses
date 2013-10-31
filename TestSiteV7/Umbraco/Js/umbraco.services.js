/*! umbraco - v0.0.1-TechnicalPReview - 2013-09-17
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

angular.module("umbraco.services", ["umbraco.security", "umbraco.resources"]);

/**
 * @ngdoc service
 * @name umbraco.services.angularHelper
 * @function
 *
 * @description
 * Some angular helper/extension methods
 */
function angularHelper($log, $q) {
    return {

        /**
         * @ngdoc function
         * @name umbraco.services.angularHelper#rejectedPromise
         * @methodOf umbraco.services.angularHelper
         * @function
         *
         * @description
         * In some situations we need to return a promise as a rejection, normally based on invalid data. This
         * is a wrapper to do that so we can save one writing a bit of code.
         *
         * @param {object} objReject The object to send back with the promise rejection
         */
        rejectedPromise: function (objReject) {
            var deferred = $q.defer();
            //return an error object including the error message for UI
            deferred.reject(objReject);
            return deferred.promise;
        },

        /**
         * @ngdoc function
         * @name safeApply
         * @methodOf umbraco.services.angularHelper
         * @function
         *
         * @description
         * This checks if a digest/apply is already occuring, if not it will force an apply call
         */
        safeApply: function (scope, fn) {
            if (scope.$$phase || scope.$root.$$phase) {
                if (angular.isFunction(fn)) {
                    fn();
                }
            }
            else {
                if (angular.isFunction(fn)) {
                    scope.$apply(fn);
                }
                else {
                    scope.$apply();
                }
            }
        },

        /**
         * @ngdoc function
         * @name getCurrentForm
         * @methodOf umbraco.services.angularHelper
         * @function
         *
         * @description
         * Returns the current form object applied to the scope or null if one is not found
         */
        getCurrentForm: function (scope) {

            //NOTE: There isn't a way in angular to get a reference to the current form object since the form object
            // is just defined as a property of the scope when it is named but you'll always need to know the name which
            // isn't very convenient. If we want to watch for validation changes we need to get a form reference.
            // The way that we detect the form object is a bit hackerific in that we detect all of the required properties 
            // that exist on a form object.
            //
            //The other way to do it in a directive is to require "^form", but in a controller the only other way to do it
            // is to inject the $element object and use: $element.inheritedData('$formController');

            var form = null;
            //var requiredFormProps = ["$error", "$name", "$dirty", "$pristine", "$valid", "$invalid", "$addControl", "$removeControl", "$setValidity", "$setDirty"];
            var requiredFormProps = ["$addControl", "$removeControl", "$setValidity", "$setDirty", "$setPristine"];

            // a method to check that the collection of object prop names contains the property name expected
            function propertyExists(objectPropNames) {
                //ensure that every required property name exists on the current scope property
                return _.every(requiredFormProps, function (item) {

                    return _.contains(objectPropNames, item);
                });
            }

            for (var p in scope) {

                if (_.isObject(scope[p]) && p !== "this" && p.substr(0, 1) !== "$") {
                    //get the keys of the property names for the current property
                    var props = _.keys(scope[p]);
                    //if the length isn't correct, try the next prop
                    if (props.length < requiredFormProps.length) {
                        continue;
                    }

                    //ensure that every required property name exists on the current scope property
                    var containProperty = propertyExists(props);

                    if (containProperty) {
                        form = scope[p];
                        break;
                    }
                }
            }

            return form;
        },

        /**
         * @ngdoc function
         * @name validateHasForm
         * @methodOf umbraco.services.angularHelper
         * @function
         *
         * @description
         * This will validate that the current scope has an assigned form object, if it doesn't an exception is thrown, if
         * it does we return the form object.
         */
        getRequiredCurrentForm: function (scope) {
            var currentForm = this.getCurrentForm(scope);
            if (!currentForm || !currentForm.$name) {
                throw "The current scope requires a current form object (or ng-form) with a name assigned to it";
            }
            return currentForm;
        },

        /**
         * @ngdoc function
         * @name getNullForm
         * @methodOf umbraco.services.angularHelper
         * @function
         *
         * @description
         * Returns a null angular FormController, mostly for use in unit tests
         *      NOTE: This is actually the same construct as angular uses internally for creating a null form but they don't expose
         *          any of this publicly to us, so we need to create our own.
         *
         * @param {string} formName The form name to assign
         */
        getNullForm: function (formName) {
            return {
                $addControl: angular.noop,
                $removeControl: angular.noop,
                $setValidity: angular.noop,
                $setDirty: angular.noop,
                $setPristine: angular.noop,
                $name: formName
                //NOTE: we don't include the 'properties', just the methods.
            };
        }
    };
}
angular.module('umbraco.services').factory('angularHelper', angularHelper);
/**
 * @ngdoc service
 * @name umbraco.services.assetsService
 *
 * @requires $q 
 * @requires angularHelper
 *  
 * @description
 * Promise-based utillity service to lazy-load client-side dependencies inside angular controllers.
 * 
 * ##usage
 * To use, simply inject the assetsService into any controller that needs it, and make
 * sure the umbraco.services module is accesible - which it should be by default.
 *
 * <pre>
 *      angular.module("umbraco").controller("my.controller". function(assetsService){
 *          assetsService.load(["script.js", "styles.css"], $scope).then(function(){
 *                 //this code executes when the dependencies are done loading
 *          });
 *      });
 * </pre> 
 *
 * You can also load individual files, which gives you greater control over what attibutes are passed to the file, as well as timeout
 *
 * <pre>
 *      angular.module("umbraco").controller("my.controller". function(assetsService){
 *          assetsService.loadJs("script.js", $scope, {charset: 'utf-8'}, 10000 }).then(function(){
 *                 //this code executes when the script is done loading
 *          });
 *      });
 * </pre>
 *
 * For these cases, there are 2 individual methods, one for javascript, and one for stylesheets:
 *
 * <pre>
 *      angular.module("umbraco").controller("my.controller". function(assetsService){
 *          assetsService.loadCss("stye.css", $scope, {media: 'print'}, 10000 }).then(function(){
 *                 //loadcss cannot determine when the css is done loading, so this will trigger instantly
 *          });
 *      });
 * </pre>  
 */
angular.module('umbraco.services')
.factory('assetsService', function ($q, $log, angularHelper) {

    return {
        /**
         * @ngdoc method
         * @name umbraco.services.assetsService#loadCss
         * @methodOf umbraco.services.assetsService
         *
         * @description
         * Injects a file as a stylesheet into the document head
         * 
         * @param {String} path path to the css file to load
         * @param {Scope} scope optional scope to pass into the loader
         * @param {Object} keyvalue collection of attributes to pass to the stylesheet element  
         * @param {Number} timeout in milliseconds
         * @returns {Promise} Promise object which resolves when the file has loaded
         */
        loadCss : function(path, scope, attributes, timeout){
            var deferred = $q.defer();
            var t = timeout || 5000;
            var a = attributes || undefined;

            yepnope.injectCss(path, function () {

             if (!scope) {
                 deferred.resolve(true);
             }else{
                 angularHelper.safeApply(scope, function () {
                     deferred.resolve(true);
                 });
             }

            },a,t);

            return deferred.promise;
        },
        
        /**
         * @ngdoc method
         * @name umbraco.services.assetsService#loadJs
         * @methodOf umbraco.services.assetsService
         *
         * @description
         * Injects a file as a javascript into the document
         * 
         * @param {String} path path to the js file to load
         * @param {Scope} scope optional scope to pass into the loader
         * @param {Object} keyvalue collection of attributes to pass to the script element  
         * @param {Number} timeout in milliseconds
         * @returns {Promise} Promise object which resolves when the file has loaded
         */
        loadJs : function(path, scope, attributes, timeout){
            var deferred = $q.defer();
            var t = timeout || 5000;
            var a = attributes || undefined;

            yepnope.injectJs(path, function () {

              if (!scope) {
                  deferred.resolve(true);
              }else{
                  angularHelper.safeApply(scope, function () {
                      deferred.resolve(true);
                  });
              }

            },a,t);

            return deferred.promise;
        },

        /**
         * @ngdoc method
         * @name umbraco.services.assetsService#load
         * @methodOf umbraco.services.assetsService
         *
         * @description
         * Injects a collection of files, this can be a mixed collection of css and js files, the loader will determine how to load them
         * 
         * **Warning:** if the collection of files contains a .css file, you will in some cases not receive a resolved promise, it is therefore prefered to use the individual loadCss and loadJs methods
         *
         * @param {Array} pathArray string array of paths to the files to load
         * @param {Scope} scope optional scope to pass into the loader
         * @returns {Promise} Promise object which resolves when all the files has loaded
         */
        load: function (pathArray, scope) {
            var deferred = $q.defer();
           
            var nonEmpty = _.reject(pathArray, function(item) {
                return item === undefined || item === "";
            });

            //don't load anything if there's nothing to load
            if (nonEmpty.length > 0) {

                yepnope({
                    load: pathArray,
                    complete: function() {

                        //if a scope is supplied then we need to make a digest here because
                        // deferred only executes in a digest. This might be required if we 
                        // are doing a load script after an http request or some other async call.
                        if (!scope) {
                            deferred.resolve(true);
                        }
                        else {
                            angularHelper.safeApply(scope, function () {
                                deferred.resolve(true);
                            });
                        }
                    }
                });
            }
            else {
                if (!scope) {
                    deferred.resolve(true);
                }
                else {
                    angularHelper.safeApply(scope, function () {
                        deferred.resolve(true);
                    });
                }
            }

            return deferred.promise;
        }
    };
});

/**
* @ngdoc service
* @name umbraco.services.contentEditingHelper
* @description A helper service for content controllers when editing/creating/saving content.
**/
function contentEditingHelper($location, $routeParams, notificationsService, serverValidationManager, dialogService) {

    return {

        /**
         * @ngdoc method
         * @name umbraco.services.contentEditingHelper#getAllProps
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * Returns all propertes contained for the content item (since the normal model has properties contained inside of tabs)
         */
        getAllProps: function (content) {
            var allProps = [];

            for (var i = 0; i < content.tabs.length; i++) {
                for (var p = 0; p < content.tabs[i].properties.length; p++) {
                    allProps.push(content.tabs[i].properties[p]);
                }
            }

            return allProps;
        },

        /**
         * @ngdoc method
         * @name umbraco.services.contentEditingHelper#reBindChangedProperties
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * re-binds all changed property values to the origContent object from the newContent object and returns an array of changed properties.
         */
        reBindChangedProperties: function (origContent, newContent) {

            var changed = [];

            //get a list of properties since they are contained in tabs
            var allOrigProps = this.getAllProps(origContent);
            var allNewProps = this.getAllProps(newContent);

            function getNewProp(alias) {
                if (alias.startsWith("_umb_")) {
                    return null;
                }
                return _.find(allNewProps, function (item) {
                    return item.alias === alias;
                });
            }

            for (var p in allOrigProps) {
                var newProp = getNewProp(allOrigProps[p].alias);
                if (newProp && !_.isEqual(allOrigProps[p].value, newProp.value)) {
                    //they have changed so set the origContent prop to the new one
                    allOrigProps[p].value = newProp.value;
                    changed.push(allOrigProps[p]);
                }
            }

            return changed;
        },

        /**
         * @ngdoc method
         * @name umbraco.services.contentEditingHelper#handleValidationErrors
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * A function to handle the validation (modelState) errors collection which will happen on a 400 error indicating validation errors
         *  It's worth noting that when a 400 occurs, the data is still saved just never published, though this depends on if the entity is a new
         *  entity and whether or not the data fulfils the absolute basic requirements like having a mandatory Name.
         */
        handleValidationErrors: function (allProps, modelState) {
            
            //find the content property for the current error, for use in the loop below
            function findContentProp(props, propAlias) {
                return _.find(props, function (item) {
                    return (item.alias === propAlias);
                });
            }

            for (var e in modelState) {
                //the alias in model state can be in dot notation which indicates
                // * the first part is the content property alias
                // * the second part is the field to which the valiation msg is associated with
                //There will always be at least 2 parts since all model errors for properties are prefixed with "Properties"
                var parts = e.split(".");
                if (parts.length > 1) {
                    var propertyAlias = parts[1];

                    //find the content property for the current error
                    var contentProperty = findContentProp(allProps, propertyAlias);

                    if (contentProperty) {
                        //if it contains 2 '.' then we will wire it up to a property's field
                        if (parts.length > 2) {
                            //add an error with a reference to the field for which the validation belongs too
                            serverValidationManager.addPropertyError(contentProperty.alias, parts[2], modelState[e][0]);
                        }
                        else {
                            //add a generic error for the property, no reference to a specific field
                            serverValidationManager.addPropertyError(contentProperty.alias, "", modelState[e][0]);
                        }
                    }
                }
                else {
                    //the parts are only 1, this means its not a property but a native content property
                    serverValidationManager.addFieldError(parts[0], modelState[e][0]);
                }

                //add to notifications
                notificationsService.error("Validation", modelState[e][0]);
            }
        },

        /**
         * @ngdoc function
         * @name umbraco.services.contentEditingHelper#handleSaveError
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * A function to handle what happens when we have validation issues from the server side
         */
        handleSaveError: function (args) {
             
            if (!args.err) {
                throw "args.err cannot be null";
            }
            if (!args.allNewProps && !angular.isArray(args.allNewProps)) {
                throw "args.allNewProps must be a valid array";
            }
            
            //When the status is a 400 status with a custom header: X-Status-Reason: Validation failed, we have validation errors.
            //Otherwise the error is probably due to invalid data (i.e. someone mucking around with the ids or something).
            //Or, some strange server error
            if (args.err.status === 400) {
                //now we need to look through all the validation errors
                if (args.err.data && (args.err.data.ModelState)) {
                    
                    this.handleValidationErrors(args.allNewProps, args.err.data.ModelState);

                    if (!args.redirectOnFailure || !this.redirectToCreatedContent(args.err.data.id, args.err.data.ModelState)) {
                        //we are not redirecting because this is not new content, it is existing content. In this case
                        // we need to detect what properties have changed and re-bind them with the server data. Then we need
                        // to re-bind any server validation errors after the digest takes place.

                        if (args.rebindCallback && angular.isFunction(args.rebindCallback)) {
                            args.rebindCallback();
                        }
                        
                        serverValidationManager.executeAndClearAllSubscriptions();
                    }

                    //indicates we've handled the server result
                    return true;
                }
                else {
                    dialogService.ysodDialog(args.err);
                }
            }
            else {
                dialogService.ysodDialog(args.err);
            }

            return false;
        },

        /**
         * @ngdoc function
         * @name umbraco.services.contentEditingHelper#handleSuccessfulSave
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * A function to handle when saving a content item is successful. This will rebind the values of the model that have changed
         * ensure the notifications are displayed and that the appropriate events are fired. This will also check if we need to redirect
         * when we're creating new content.
         */
        handleSuccessfulSave: function (args) {

            if (!args) {
                throw "args cannot be null";
            }
            if (!args.scope) {
                throw "args.scope cannot be null";
            }
            if (!args.scope.content) {
                throw "args.scope.content cannot be null";
            }
            if (!args.newContent) {
                throw "args.newContent cannot be null";
            }

            for (var i = 0; i < args.newContent.notifications.length; i++) {
                notificationsService.showNotification(args.newContent.notifications[i]);
            }

            args.scope.$broadcast("saved", { scope: args.scope });
            if (!this.redirectToCreatedContent(args.newContent.id)) {
                
                //we are not redirecting because this is not new content, it is existing content. In this case
                // we need to detect what properties have changed and re-bind them with the server data.
                //call the callback
                if (args.rebindCallback && angular.isFunction(args.rebindCallback)) {
                    args.rebindCallback();
                }
            }
        },

        /**
         * @ngdoc function
         * @name umbraco.services.contentEditingHelper#redirectToCreatedContent
         * @methodOf umbraco.services.contentEditingHelper
         * @function
         *
         * @description
         * Changes the location to be editing the newly created content after create was successful.
         * We need to decide if we need to redirect to edito mode or if we will remain in create mode. 
         * We will only need to maintain create mode if we have not fulfilled the basic requirements for creating an entity which is at least having a name.
         */
        redirectToCreatedContent: function (id, modelState) {

            //only continue if we are currently in create mode and if there is no 'Name' modelstate errors
            // since we need at least a name to create content.
            if ($routeParams.create && (!modelState || !modelState["Name"])) {

                //need to change the location to not be in 'create' mode. Currently the route will be something like:
                // /belle/#/content/edit/1234?doctype=newsArticle&create=true
                // but we need to remove everything after the query so that it is just:
                // /belle/#/content/edit/9876 (where 9876 is the new id)

                //clear the query strings
                $location.search("");
                
                //change to new path
                $location.path("/" + $routeParams.section + "/" + $routeParams.tree  + "/" + $routeParams.method + "/" + id);
                //don't add a browser history for this
                $location.replace();
                return true;
            }
            return false;
        }
    };
}
angular.module('umbraco.services').factory('contentEditingHelper', contentEditingHelper);
/**
 * @ngdoc service
 * @name umbraco.services.dialogService
 *
 * @requires $rootScope 
 * @requires $compile
 * @requires $http
 * @requires $log
 * @requires $q
 * @requires $templateCache
 *  
 * @description
 * Application-wide service for handling modals, overlays and dialogs
 * By default it injects the passed template url into a div to body of the document
 * And renders it, but does also support rendering items in an iframe, incase
 * serverside processing is needed, or its a non-angular page
 *
 * ##usage
 * To use, simply inject the dialogService into any controller that needs it, and make
 * sure the umbraco.services module is accesible - which it should be by default.
 *
 * <pre>
 *    var dialog = dialogService.open({template: 'path/to/page.html', show: true, callback: done});
 *    functon done(data){
 *      //The dialog has been submitted 
 *      //data contains whatever the dialog has selected / attached
 *    }     
 * </pre> 
 */

angular.module('umbraco.services')
.factory('dialogService', function ($rootScope, $compile, $http, $timeout, $q, $templateCache, $log) {

       var dialogs = [];
       
       /** Internal method that removes all dialogs */
       function removeAllDialogs(args) {
           for (var i = 0; i < dialogs.length; i++) {
               var dialog = dialogs[i];
               dialog.scope.close(args);

               //removeDialog(dialog, args);
               dialogs.splice(i, 1);
           }
       }

       /** Internal method that handles opening all dialogs */
       function openDialog(options) {

           var defaults = {
              container: $("body"),
              animation: "fade",
              modalClass: "umb-modal",
              width: "100%",
              inline: false,
              iframe: false,
              show: true,
              template: "views/common/notfound.html",
              callback: undefined,
              closeCallback: undefined,
              element: undefined
           };
           
           var dialog = angular.extend(defaults, options);
           var scope = options.scope || $rootScope.$new();
           delete dialog.scope;

           //Modal dom obj and unique id
           dialog.element = $('<div ng-swipe-left="hide()" ng-swipe-right="hide()"  data-backdrop="false"></div>');
           var id = dialog.template.replace('.html', '').replace('.aspx', '').replace(/[\/|\.|:\&\?\=]/g, "-") + '-' + scope.$id;
           
          if(options.inline){
              dialog.animation = "";
              dialog.modalClass = "";
          }else{
                dialog.element.addClass("modal");
                dialog.element.addClass("hide");
          }
           //set the id and add classes
           dialog.element
               .attr('id', id)
               .addClass(dialog.animation)
               .addClass(dialog.modalClass);

           //push the modal into the global modal collection
           //we halt the .push because a link click will trigger a closeAll right away
           $timeout(function () {
               dialogs.push(dialog);
           }, 500);
           

           //basic events for submitting and closing
           scope.submit = function(data) {
               if (dialog.callback) {
                   dialog.callback(data);
               }

               dialog.element.modal('hide');
               dialog.element.remove();
               $("#" + dialog.element.attr("id")).remove();
           };

           scope.close = function(data) {
              if (dialog.closeCallback) {
                   dialog.closeCallback(data);
              }

              if(dialog.element){
                 dialog.element.modal('hide');
                 dialog.element.remove();
                 $("#" + dialog.element.attr("id")).remove();
               }
           };

           //if iframe is enabled, inject that instead of a template
           if (dialog.iframe) {
               var html = $("<iframe auto-scale='0' src='" + dialog.template + "' style='width: 100%; height: 100%;'></iframe>");
               dialog.element.html(html);
  
               //append to body or whatever element is passed in as options.containerElement
               dialog.container.append(dialog.element);

               // Compile modal content
               $timeout(function () {
                   $compile(dialog.element)(dialog.scope);
               });

               dialog.element.css("width", dialog.width);

               //Autoshow 
               if (dialog.show) {
                   dialog.element.modal('show');
               }

               //store the callback in the modal jquery data
               //dialog.element.data("modalCb", dialog.callback);
               dialog.scope = scope;
               return dialog;
           }
           else {
               
             //We need to load the template with an httpget and once it's loaded we'll compile and assign the result to the container
             // object. However since the result could be a promise or just data we need to use a $q.when. We still need to return the 
             // $modal object so we'll actually return the modal object synchronously without waiting for the promise. Otherwise this openDialog
             // method will always need to return a promise which gets nasty because of promises in promises plus the result just needs a reference
             // to the $modal object which will not change (only it's contents will change).
             $q.when($templateCache.get(dialog.template) || $http.get(dialog.template, { cache: true }).then(function(res) { return res.data; }))
                 .then(function onSuccess(template) {

                     // Build modal object
                     dialog.element.html(template);

                     //append to body or other container element  
                     dialog.container.append(dialog.element);

                     //store the callback in the modal jquery data
                     dialog.element.data("modalCb", dialog.callback);

                     // Compile modal content
                     $timeout(function() {
                         $compile(dialog.element)(scope);
                     });

                     scope.dialogOptions = dialog;
                     
                     //Scope to handle data from the modal form
                     scope.dialogData = {};
                     scope.dialogData.selection = [];

                     // Provide scope display functions
                     //this passes the modal to the current scope
                     scope.$modal = function(name) {
                         dialog.element.modal(name);
                     };

                     scope.hide = function() {
                         dialog.element.modal('hide');

                         dialog.element.remove();
                         $("#" + dialog.element.attr("id")).remove();
                     };

                     scope.show = function() {
                         dialog.element.modal('show');
                     };

                     scope.select = function(item) {
                        var i = scope.dialogData.selection.indexOf(item);
                         if (i < 0) {
                             scope.dialogData.selection.push(item);
                         }else{
                            scope.dialogData.selection.splice(i, 1);
                         }
                     };

                     scope.dismiss = scope.hide;

                     // Emit modal events
                     angular.forEach(['show', 'shown', 'hide', 'hidden'], function(name) {
                         dialog.element.on(name, function(ev) {
                             scope.$emit('modal-' + name, ev);
                         });
                     });

                     // Support autofocus attribute
                     dialog.element.on('shown', function(event) {
                         $('input[autofocus]', dialog.element).first().trigger('focus');
                     });

                     //Autoshow 
                     if (dialog.show) {
                         dialog.element.modal('show');
                     }

                     dialog.scope = scope;
               });
               
               //Return the modal object outside of the promise!
               return dialog;
           }
       }

       /** Handles the closeDialogs event */
       $rootScope.$on("closeDialogs", function (evt, args) {
           removeAllDialogs(args);
       });

       return {
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#open
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a modal rendering a given template url.
            *
            * @param {Object} options rendering options
            * @param {DomElement} options.container the DOM element to inject the modal into, by default set to body
            * @param {Function} options.callback function called when the modal is submitted
            * @param {String} options.template the url of the template
            * @param {String} options.animation animation csss class, by default set to "fade"
            * @param {String} options.modalClass modal css class, by default "umb-modal"
            * @param {Bool} options.show show the modal instantly
            * @param {Object} options.scope scope to attach the modal to, by default rootScope.new()
            * @param {Bool} options.iframe load template in an iframe, only needed for serverside templates
            * @param {Int} options.width set a width on the modal, only needed for iframes
            * @param {Bool} options.inline strips the modal from any animation and wrappers, used when you want to inject a dialog into an existing container
            * @returns {Object} modal object
            */
           open: function (options) {               
               return openDialog(options);
           },
           
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#close
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Closes a specific dialog
            * @param {Object} dialog the dialog object to close
            * @param {Object} args if specified this object will be sent to any callbacks registered on the dialogs.
            */
           close: function (dialog, args) {
              if(dialog && dialog.scope){
                  dialog.scope.close();
              }
              
               //removeDialog(dialog, args);
           },
           
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#closeAll
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Closes all dialogs
            * @param {Object} args if specified this object will be sent to any callbacks registered on the dialogs.
            */
           closeAll: function(args) {
               removeAllDialogs(args);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#mediaPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a media picker in a modal, the callback returns an array of selected media items
            * @param {Object} options mediapicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           mediaPicker: function (options) {
            options.template = 'views/common/dialogs/mediaPicker.html';
            options.show = true;
            return openDialog(options);
           },


           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#contentPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a content picker tree in a modal, the callback returns an array of selected documents
            * @param {Object} options content picker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.multipicker should the picker return one or multiple items
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           contentPicker: function (options) {
               options.template = 'views/common/dialogs/contentPicker.html';
               options.show = true;
              return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#macroPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a mcaro picker in a modal, the callback returns a object representing the macro and it's parameters
            * @param {Object} options macropicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           macroPicker: function (options) {
                options.template = 'views/common/dialogs/macroPicker.html';
                options.show = true;
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#iconPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a icon picker in a modal, the callback returns a object representing the selected icon
            * @param {Object} options iconpicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           iconPicker: function (options) {
                options.template = 'views/common/dialogs/iconPicker.html';
                options.show = true;
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#treePicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a tree picker in a modal, the callback returns a object representing the selected tree item
            * @param {Object} options iconpicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.section tree section to display
            * @param {$scope} options.multiPicker should the tree pick one or multiple items before returning
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           treePicker: function (options) {
                options.template = 'views/common/dialogs/treePicker.html';
                options.show = true;
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#propertyDialog
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a dialog with a chosen property editor in, a value can be passed to the modal, and this value is returned in the callback
            * @param {Object} options mediapicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @param {String} editor editor to use to edit a given value and return on callback
            * @param {Object} value value sent to the property editor
            * @returns {Object} modal object
            */
          propertyDialog: function (options) {
              options.template = 'views/common/dialogs/property.html';
              options.show = true;
              return openDialog(options);
          },
           
           /**
           * @ngdoc method
           * @name umbraco.services.dialogService#ysodDialog
           * @methodOf umbraco.services.dialogService
           *
           * @description
           * Opens a dialog to an embed dialog 
           */
          embedDialog: function (options) {
              options.template = 'views/common/dialogs/rteembed.html';
              options.show = true;
              return openDialog(options);
          },
           /**
           * @ngdoc method
           * @name umbraco.services.dialogService#ysodDialog
           * @methodOf umbraco.services.dialogService
           *
           * @description
           * Opens a dialog to show a custom YSOD
           */
           ysodDialog: function (ysodError) {

               var newScope = $rootScope.$new();
               newScope.error = ysodError;
               return openDialog({
                   modalClass: "umb-modal wide",
                   scope: newScope,
                   //callback: options.callback,
                   template: 'views/common/dialogs/ysod.html',
                   show: true
               });
           }
       };
   });
angular.module('umbraco.services')
.service('editorContextService', function () {
        var context;
        return {
            getContext:function () {
                return context;
            },
            setContext:function (value) {
                context = value;
            }
        };
    });
/* pubsub - based on https://github.com/phiggins42/bloody-jquery-plugins/blob/master/pubsub.js*/
function eventsService($q) {
	var cache = {};

	return {
		publish: function(){
			
			var args = [].splice.call(arguments,0);
			var topic = args[0];
			var deferred = $q.defer();
			args.splice(0,1);

			if(cache[topic]){
				$.each(cache[topic], function() {
					this.apply(null, args || []);
				});
				deferred.resolve.apply(null, args);
			}else{
				deferred.resolve.apply(null, args);
			}

			return deferred.promise;
		},

		subscribe: function(topic, callback) {
			if(!cache[topic]) {
				cache[topic] = [];
			}
			cache[topic].push(callback);
			return [topic, callback]; 
		},
		
		unsubscribe: function(handle) {
			var t = handle[0];
			
			if(cache[t]){
				$.each(cache[t], function(idx){
					if(this === handle[1]){
						cache[t].splice(idx, 1);
					}
				});	
			}
		}

	};
}

angular.module('umbraco.services').factory('eventsService', eventsService);
/**
 * @ngdoc service
 * @name umbraco.services.fileManager
 * @function
 *
 * @description
 * Used by editors to manage any files that require uploading with the posted data, normally called by property editors
 * that need to attach files.
 */
function fileManager() {

    var fileCollection = [];

    return {
        /**
         * @ngdoc function
         * @name umbraco.services.fileManager#addFiles
         * @methodOf umbraco.services.fileManager
         * @function
         *
         * @description
         *  Attaches files to the current manager for the current editor for a particular property, if an empty array is set
         *   for the files collection that effectively clears the files for the specified editor.
         */
        setFiles: function(propertyId, files) {
            //this will clear the files for the current property and then add the new ones for the current property
            fileCollection = _.reject(fileCollection, function (item) {
                return item.id === propertyId;
            });
            for (var i = 0; i < files.length; i++) {
                //save the file object to the files collection
                fileCollection.push({ id: propertyId, file: files[i] });
            }
        },
        
        /**
         * @ngdoc function
         * @name umbraco.services.fileManager#getFiles
         * @methodOf umbraco.services.fileManager
         * @function
         *
         * @description
         *  Returns all of the files attached to the file manager
         */
        getFiles: function() {
            return fileCollection;
        },
        
        /**
         * @ngdoc function
         * @name umbraco.services.fileManager#clearFiles
         * @methodOf umbraco.services.fileManager
         * @function
         *
         * @description
         *  Removes all files from the manager
         */
        clearFiles: function () {
            fileCollection = [];
        }
};
}

angular.module('umbraco.services').factory('fileManager', fileManager);
/**
 * @ngdoc service
 * @name umbraco.services.historyService
 *
 * @requires $rootScope 
 * @requires $timeout
 * @requires angularHelper
 *	
 * @description
 * Service to handle the main application navigation history. Responsible for keeping track
 * of where a user navigates to, stores an icon, url and name in a collection, to make it easy
 * for the user to go back to a previous editor / action
 *
 * **Note:** only works with new angular-based editors, not legacy ones
 *
 * ##usage
 * To use, simply inject the historyService into any controller that needs it, and make
 * sure the umbraco.services module is accesible - which it should be by default.
 *
 * <pre>
 *      angular.module("umbraco").controller("my.controller". function(historyService){
 *         historyService.add({
 *								icon: "icon-class",
 *								name: "Editing 'articles',
 *								link: "/content/edit/1234"}
 *							);
 *      }); 
 * </pre> 
 */
angular.module('umbraco.services')
.factory('historyService', function ($rootScope, $timeout, angularHelper) {

	var nArray = [];

	function add(item) {
		nArray.splice(0,0,item);
		return nArray[0];
	}

	return {
		/**
		 * @ngdoc method
		 * @name umbraco.services.historyService#add
		 * @methodOf umbraco.services.historyService
		 *
		 * @description
		 * Adds a given history item to the users history collection.
		 *
		 * @param {Object} item the history item
		 * @param {String} item.icon icon css class for the list, ex: "icon-image", "icon-doc"
		 * @param {String} item.link route to the editor, ex: "/content/edit/1234"
		 * @param {String} item.name friendly name for the history listing
		 * @returns {Object} history item object
		 */
		add: function (item) {
			var icon = item.icon || "icon-file";
			angularHelper.safeApply($rootScope, function () {
				return add({name: item.name, icon: icon, link: item.link, time: new Date() });
			});
		},
		/**
		 * @ngdoc method
		 * @name umbraco.services.historyService#remove
		 * @methodOf umbraco.services.historyService
		 *
		 * @description
		 * Removes a history item from the users history collection, given an index to remove from.
		 *
		 * @param {Int} index index to remove item from
		 */
		remove: function (index) {
			angularHelper.safeApply($rootScope, function() {
				nArray.splice(index, 1);
			});
		},

		/**
		 * @ngdoc method
		 * @name umbraco.services.historyService#removeAll
		 * @methodOf umbraco.services.historyService
		 *
		 * @description
		 * Removes all history items from the users history collection
		 */
		removeAll: function () {
			angularHelper.safeApply($rootScope, function() {
				nArray = [];
			});
		},

		/**
		 * @ngdoc property
		 * @name umbraco.services.historyService#current
		 * @propertyOf umbraco.services.historyService
		 *
		 * @description
		 * 
		 * @returns {Array} Array of history entries for the current user, newest items first
		 */
		current: nArray,

		/**
		 * @ngdoc method
		 * @name umbraco.services.historyService#getCurrent
		 * @methodOf umbraco.services.historyService
		 *
		 * @description
		 * Method to return the current history collection.
		 *
		 */
		getCurrent: function(){
			return nArray;
		}
	};
});
// This service was based on OpenJS library available in BSD License
// http://www.openjs.com/scripts/events/keyboard_shortcuts/index.php
angular.module('umbraco.services')
.factory('keyboardService', ['$window', '$timeout', function ($window, $timeout) {
	var keyboardManagerService = {};
	var defaultOpt = {
		'type':             'keydown',
		'propagate':        false,
		'inputDisabled':    false,
		'target':           $window.document,
		'keyCode':          false
	};
	
	// Store all keyboard combination shortcuts
	keyboardManagerService.keyboardEvent = {};

	// Add a new keyboard combination shortcut
	keyboardManagerService.bind = function (label, callback, opt) {
		var fct, elt, code, k;
		// Initialize opt object
		opt   = angular.extend({}, defaultOpt, opt);
		label = label.toLowerCase();
		elt   = opt.target;
		if(typeof opt.target === 'string'){
			elt = document.getElementById(opt.target);	
		} 

	
		fct = function (e) {
			e = e || $window.event;

			// Disable event handler when focus input and textarea
			if (opt['inputDisabled']) {
				var elt;
				if (e.target){
					elt = e.target;	
				}else if (e.srcElement){
					elt = e.srcElement;	
				} 

				if (elt.nodeType === 3){elt = elt.parentNode;} 
				if (elt.tagName === 'INPUT' || elt.tagName === 'TEXTAREA'){return;}
			}

			// Find out which key is pressed
			if (e.keyCode){
				code = e.keyCode;	
			}else if (e.which){
				code = e.which;	
			} 

			var character = String.fromCharCode(code).toLowerCase();

			if (code === 188){character = ",";} // If the user presses , when the type is onkeydown
			if (code === 190){character = ".";} // If the user presses , when the type is onkeydown

			var keys = label.split("+");
			// Key Pressed - counts the number of valid keypresses - if it is same as the number of keys, the shortcut function is invoked
			var kp = 0;
			// Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
			var shift_nums = {
				"`":"~",
				"1":"!",
				"2":"@",
				"3":"#",
				"4":"$",
				"5":"%",
				"6":"^",
				"7":"&",
				"8":"*",
				"9":"(",
				"0":")",
				"-":"_",
				"=":"+",
				";":":",
				"'":"\"",
				",":"<",
				".":">",
				"/":"?",
				"\\":"|"
			};
			// Special Keys - and their codes
			var special_keys = {
				'esc':27,
				'escape':27,
				'tab':9,				
				'space':32,
				'return':13,
				'enter':13,
				'backspace':8,

				'scrolllock':145,
				'scroll_lock':145,
				'scroll':145,
				'capslock':20,
				'caps_lock':20,
				'caps':20,
				'numlock':144,
				'num_lock':144,
				'num':144,

				'pause':19,
				'break':19,

				'insert':45,
				'home':36,
				'delete':46,
				'end':35,

				'pageup':33,
				'page_up':33,
				'pu':33,

				'pagedown':34,
				'page_down':34,
				'pd':34,

				'left':37,
				'up':38,
				'right':39,
				'down':40,

				'f1':112,
				'f2':113,
				'f3':114,
				'f4':115,
				'f5':116,
				'f6':117,
				'f7':118,
				'f8':119,
				'f9':120,
				'f10':121,
				'f11':122,
				'f12':123
			};
			// Some modifiers key
			var modifiers = {
				shift: {
					wanted:		false, 
					pressed:	e.shiftKey ? true : false
				},
				ctrl : {
					wanted:		false, 
					pressed:	e.ctrlKey ? true : false
				},
				alt  : {
					wanted:		false,
					pressed:	e.altKey ? true : false
				},
				meta : { //Meta is Mac specific
					wanted:		false, 
					pressed:	e.metaKey ? true : false
				}
			};
			// Foreach keys in label (split on +)
			var l = keys.length;
			for (var i = 0; i < l; i++) {

				var k=keys[i];
				switch (k) {
					case 'ctrl':
					case 'control':
						kp++;
						modifiers.ctrl.wanted = true;
						break;
					case 'shift':
					case 'alt':
					case 'meta':
						kp++;
						modifiers[k].wanted = true;
						break;
				}

				if (k.length > 1) { // If it is a special key
					if(special_keys[k] === code){
						kp++;
					}

				} else if (opt['keyCode']) { // If a specific key is set into the config
					if (opt['keyCode'] === code) {
						kp++;
					}

				} else { // The special keys did not match
					if(character === k) {
						kp++;
					}else {
						if(shift_nums[character] && e.shiftKey) { // Stupid Shift key bug created by using lowercase
							character = shift_nums[character];
							if(character === k){
								kp++;
							}
						}
					}
				}

			} //for end

			if(kp === keys.length &&
				modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
				modifiers.shift.pressed === modifiers.shift.wanted &&
				modifiers.alt.pressed === modifiers.alt.wanted &&
				modifiers.meta.pressed === modifiers.meta.wanted) {
		        $timeout(function() {
					callback(e);
		        }, 1);

				if(!opt['propagate']) { // Stop the event
					// e.cancelBubble is supported by IE - this will kill the bubbling process.
					e.cancelBubble = true;
					e.returnValue = false;

					// e.stopPropagation works in Firefox.
					if (e.stopPropagation) {
						e.stopPropagation();
						e.preventDefault();
					}
					return false;
				}
			}
		};
		// Store shortcut
		keyboardManagerService.keyboardEvent[label] = {
			'callback': fct,
			'target':   elt,
			'event':    opt['type']
		};

		//Attach the function with the event
		if(elt.addEventListener){
			elt.addEventListener(opt['type'], fct, false);
		}else if(elt.attachEvent){
			elt.attachEvent('on' + opt['type'], fct);
		}else{
			elt['on' + opt['type']] = fct;
		}
	};
	// Remove the shortcut - just specify the shortcut and I will remove the binding
	keyboardManagerService.unbind = function (label) {
		label = label.toLowerCase();
		var binding = keyboardManagerService.keyboardEvent[label];
		delete(keyboardManagerService.keyboardEvent[label]);
		
		if(!binding){return;}

		var type		= binding['event'],
		elt			= binding['target'],
		callback	= binding['callback'];
		
		if(elt.detachEvent){
			elt.detachEvent('on' + type, callback);
		}else if(elt.removeEventListener){
			elt.removeEventListener(type, callback, false);
		}else{
			elt['on'+type] = false;
		}
	};
	//

	return keyboardManagerService;
}]);
/**
 * @ngdoc service
 * @name umbraco.services.umbracoMenuActions
 *
 * @requires q
 * @requires treeService
 *	
 * @description
 * Defines the methods that are called when menu items declare only an action to execute
 */
function umbracoMenuActions($q, treeService, $location, navigationService) {
    
    return {
        
        /**
         * @ngdoc method
         * @name umbraco.services.umbracoMenuActions#RefreshNode
         * @methodOf umbraco.services.umbracoMenuActions
         * @function
         *
         * @description
         * Clears all node children and then gets it's up-to-date children from the server and re-assigns them
         * @param {object} args An arguments object
         * @param {object} args.treeNode The tree node
         * @param {object} args.section The current section
         */
        "RefreshNode": function (args) {
            treeService.loadNodeChildren({ node: args.treeNode, section: args.section });
        },
        
        /**
         * @ngdoc method
         * @name umbraco.services.umbracoMenuActions#CreateChildEntity
         * @methodOf umbraco.services.umbracoMenuActions
         * @function
         *
         * @description
         * This will re-route to a route for creating a new entity as a child of the current node
         * @param {object} args An arguments object
         * @param {object} args.treeNode The tree node
         * @param {object} args.section The current section
         */
        "CreateChildEntity": function (args) {

            navigationService.hideNavigation();

            var route = "/" + args.section + "/" + treeService.getTreeAlias(args.treeNode) + "/edit/" + args.treeNode.id;
            //change to new path
            $location.path(route).search({ create: true });
            
        }
    };
} 

angular.module('umbraco.services').factory('umbracoMenuActions', umbracoMenuActions);
/**
 * @ngdoc service
 * @name umbraco.services.navigationService
 *
 * @requires $rootScope 
 * @requires $routeParams
 * @requires $log
 * @requires $location
 * @requires dialogService
 * @requires treeService
 * @requires sectionResource
 *	
 * @description
 * Service to handle the main application navigation. Responsible for invoking the tree
 * Section navigation and search, and maintain their state for the entire application lifetime
 *
 */

angular.module('umbraco.services')
.factory('navigationService', function ($rootScope, $routeParams, $log, $location, $q, $timeout, dialogService, treeService, notificationsService) {


    //TODO: would be nicer to set all of the options here first instead of implicitly below!
    var ui = {};
    $rootScope.$on("closeDialogs", function(){});

    function setMode(mode) {
        switch (mode) {
            case 'tree':
                ui.showNavigation = true;
                ui.showContextMenu = false;
                ui.showContextMenuDialog = false;
                ui.stickyNavigation = false;

                //$("#search-form input").focus();    
                break;
            case 'menu':
                ui.showNavigation = true;
                ui.showContextMenu = true;
                ui.showContextMenuDialog = false;
                ui.stickyNavigation = true;
                break;
            case 'dialog':
                ui.stickyNavigation = true;
                ui.showNavigation = true;
                ui.showContextMenu = false;
                ui.showContextMenuDialog = true;
                break;
            case 'search':
                ui.stickyNavigation = false;
                ui.showNavigation = true;
                ui.showContextMenu = false;
                ui.showSearchResults = true;
                ui.showContextMenuDialog = false;
                break;
            default:
                ui.showNavigation = false;
                ui.showContextMenu = false;
                ui.showContextMenuDialog = false;
                ui.showSearchResults = false;
                ui.stickyNavigation = false;
                break;
        }
    }

    var service = {
        active: false,
        mode: "default",
        touchDevice: false,
        ui: ui,

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#load
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Shows the legacy iframe and loads in the content based on the source url
         * @param {String} source The URL to load into the iframe
         */
        loadLegacyIFrame: function (source) {
            $location.path("/framed/" + encodeURIComponent(source));
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#changeSection
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Changes the active section to a given section alias
         * If the navigation is 'sticky' this will load the associated tree
         * and load the dashboard related to the section
         * @param {string} sectionAlias The alias of the section
         */
        changeSection: function (sectionAlias) {
            if (this.ui.stickyNavigation) {
                setMode("default-opensection");
                this.ui.currentSection = sectionAlias;
                this.showTree(sectionAlias);
            }

            $location.path(sectionAlias);
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#showTree
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Shows the tree for a given tree alias but turning on the containing dom element
         * only changes if the section is different from the current one
		 * @param {string} sectionAlias The alias of the section the tree should load data from
		 */
        showTree: function (sectionAlias) {
            if (sectionAlias !== this.ui.currentSection) {
                this.ui.currentSection = sectionAlias;
                setMode("tree");
            }
        },
        

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#enterTree
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Sets a service variable as soon as the user hovers the navigation with the mouse
         * used by the leaveTree method to delay hiding
         */
        enterTree: function (event) {
            service.active = true;
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#leaveTree
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Hides navigation tree, with a short delay, is cancelled if the user moves the mouse over the tree again
         */
        leaveTree: function (event) {
            //this is a hack to handle IE touch events
            //which freaks out due to no mouse events
            //so the tree instantly shuts down
            if(!event){
                return;
            }


            service.active = false;

            $timeout(function(){
                if(!service.active){
                    service.hideTree();
                }
            }, 300);
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#hideTree
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Hides the tree by hiding the containing dom element
         */
        hideTree: function () {
            if (!this.ui.stickyNavigation) {
                this.ui.currentSection = "";
                setMode("default-hidesectiontree");
            }
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#showMenu
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Hides the tree by hiding the containing dom element. 
         * This always returns a promise!
         *
         * @param {Event} event the click event triggering the method, passed from the DOM element
         */
        showMenu: function (event, args) {

            var deferred = $q.defer();
            var self = this;

            if (args.event !== undefined && args.node.defaultAction && !args.event.altKey) {

                treeService.getMenuItemByAlias({ treeNode: args.node, menuItemAlias: args.node.defaultAction })
                    .then(function(result) {

                        if (!result) {
                            throw "No menu item found with alias " + args.node.defaultAction;
                        }

                        self.ui.currentNode = args.node;
                        
                        //ensure the current dialog is cleared before creating another!
                        if (self.ui.currentDialog) {
                            dialogService.close(self.ui.currentDialog);
                        }

                        var dialog = self.showDialog({
                            scope: args.scope,
                            node: args.node,
                            action: result,
                            section: self.ui.currentSection
                        });

                        //return the dialog this is opening.
                        deferred.resolve(dialog);
                    });
            }
            else {
                setMode("menu");

                treeService.getMenu({ treeNode: args.node })
                    .then(function(data) {
                        ui.actions = data;
                    });

                this.ui.currentNode = args.node;
                this.ui.dialogTitle = args.node.name;

                //we're not opening a dialog, return null.
                deferred.resolve(null);
            }

            return deferred.promise;
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#hideMenu
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Hides the menu by hiding the containing dom element
         */
        hideMenu: function () {
            var selectedId = $routeParams.id;
            this.ui.currentNode = undefined;
            this.ui.actions = [];

            setMode("tree");
        },

        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#showUserDialog
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Opens the user dialog, next to the sections navigation
         * template is located in views/common/dialogs/user.html
         */
        showUserDialog: function () {
            return dialogService.open(
                {
                    template: "views/common/dialogs/user.html",
                    modalClass: "umb-modal-left",
                    show: true
                });
        },
        /**
         * @ngdoc method
         * @name umbraco.services.navigationService#showDialog
         * @methodOf umbraco.services.navigationService
         *
         * @description
         * Opens a dialog, for a given action on a given tree node
         * uses the dialogService to inject the selected action dialog
         * into #dialog div.umb-panel-body
         * the path to the dialog view is determined by: 
         * "views/" + current tree + "/" + action alias + ".html"
         * The dialog controller will get passed a scope object that is created here. This scope
         * object may be injected as part of the args object, if one is not found then a new scope
         * is created. Regardless of whether a scope is created or re-used, a few properties and methods 
         * will be added to it so that they can be used in any dialog controller:
         *  scope.currentNode = the selected tree node
         *  scope.currentAction = the selected menu item
         * @param {Object} args arguments passed to the function
         * @param {Scope} args.scope current scope passed to the dialog
         * @param {Object} args.action the clicked action containing `name` and `alias`
         */
        showDialog: function (args) {

            if (!args) {
                throw "showDialog is missing the args parameter";
            }
            if (!args.action) {
                throw "The args parameter must have an 'action' property as the clicked menu action object";
            }

            //ensure the current dialog is cleared before creating another!
            if (this.ui.currentDialog) {
                dialogService.close(this.ui.currentDialog);
            }

            setMode("dialog");

            //set up the scope object and assign properties
            var scope = args.scope || $rootScope.$new();
            scope.currentNode = args.node;
            scope.currentAction = args.action;

            //the title might be in the meta data, check there first
            if (args.action.metaData["dialogTitle"]) {
                this.ui.dialogTitle = args.action.metaData["dialogTitle"];
            }
            else {
                this.ui.dialogTitle = args.action.name;
            }

            var templateUrl;
            var iframe;

            //TODO: fix hardcoded hack for content/media... once these trees are converted over to 
            // new c# trees we won't need to do this any longer.
            var isCreateForContent = args.action.alias === "create" && (this.ui.currentSection === "content" || this.ui.currentSection === "media");

            if (args.action.metaData["actionUrl"] && !isCreateForContent) {
                templateUrl = args.action.metaData["actionUrl"];
                iframe = true;
            }
            else if (args.action.metaData["actionView"]) {
                templateUrl = args.action.metaData["actionView"];
                iframe = false;
            }
            else {
                templateUrl = "views/" + this.ui.currentSection + "/" + args.action.alias + ".html";
                iframe = false;
            }

            //TODO: some action's want to launch a new window like live editing, we support this in the menu item's metadata with
            // a key called: "actionUrlMethod" which can be set to either: Dialog, BlankWindow. Normally this is always set to Dialog 
            // if a URL is specified in the "actionUrl" metadata. For now I'm not going to implement launching in a blank window, 
            // though would be v-easy, just not sure we want to ever support that?

            var dialog = dialogService.open(
                {
                    container: $("#dialog div.umb-modalcolumn-body"),
                    scope: scope,
                    inline: true,
                    show: true,
                    iframe: iframe,
                    template: templateUrl
                });

            //save the currently assigned dialog so it can be removed before a new one is created
            this.ui.currentDialog = dialog;

            return dialog;
        },

        /**
	     * @ngdoc method
	     * @name umbraco.services.navigationService#hideDialog
	     * @methodOf umbraco.services.navigationService
	     *
	     * @description
	     * hides the currently open dialog
	     */
        hideDialog: function () {
            this.showMenu(undefined, { node: this.ui.currentNode });
        },
        /**
          * @ngdoc method
          * @name umbraco.services.navigationService#showSearch
          * @methodOf umbraco.services.navigationService
          *
          * @description
          * shows the search pane
          */
        showSearch: function () {
            setMode("search");
        },
        /**
          * @ngdoc method
          * @name umbraco.services.navigationService#hideSearch
          * @methodOf umbraco.services.navigationService
          *
          * @description
          * hides the search pane
        */
        hideSearch: function () {
            setMode("default-hidesearch");
        },
        /**
          * @ngdoc method
          * @name umbraco.services.navigationService#hideNavigation
          * @methodOf umbraco.services.navigationService
          *
          * @description
          * hides any open navigation panes and resets the tree, actions and the currently selected node
          */
        hideNavigation: function () {
           this.ui.currentSection = "";
            this.ui.actions = [];
            this.ui.currentNode = undefined;
            setMode("default");
        }
    };

    return service;
});

/**
 * @ngdoc service
 * @name umbraco.services.notificationsService
 *
 * @requires $rootScope 
 * @requires $timeout
 * @requires angularHelper
 *	
 * @description
 * Application-wide service for handling notifications, the umbraco application 
 * maintains a single collection of notications, which the UI watches for changes.
 * By default when a notication is added, it is automaticly removed 7 seconds after
 * This can be changed on add()
 *
 * ##usage
 * To use, simply inject the notificationsService into any controller that needs it, and make
 * sure the umbraco.services module is accesible - which it should be by default.
 *
 * <pre>
 *		notificationsService.success("Document Published", "hooraaaay for you!");
 *      notificationsService.error("Document Failed", "booooh");
 * </pre> 
 */
angular.module('umbraco.services')
.factory('notificationsService', function ($rootScope, $timeout, angularHelper) {

	var nArray = [];

	function add(item) {	    
	    angularHelper.safeApply($rootScope, function () {
	        
	        //add a colon after the headline if there is a message as well
	        if (item.message) {
	            item.headline += ":";
	            if(item.message.length > 200) {
	                item.sticky = true;
	            }
	        }

	        //we need to ID the item, going by index isn't good enough because people can remove at different indexes 
	        // whenever they want. Plus once we remove one, then the next index will be different. The only way to 
	        // effectively remove an item is by an Id.
	        item.id = String.CreateGuid();
	        
	        nArray.push(item);
            
            if(!item.sticky) {
                $timeout(function() {
                    var found = _.find(nArray, function(i) {
                        return i.id === item.id;
                    });

                    if (found) {
                        var index = nArray.indexOf(found);
                        nArray.splice(index, 1);
                    }

                }, 7000);
            }

	        return item;
	    });
	}

	return {

	    /**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#showNotification
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Shows a notification based on the object passed in, normally used to render notifications sent back from the server
		 *		 
		 * @returns {Object} args notification object
		 */
        showNotification: function(args) {
            if (!args) {
                throw "args cannot be null";
            }
            if (args.type === undefined || args.type === null) {
                throw "args.type cannot be null";
            }
            if (!args.header) {
                throw "args.header cannot be null";
            }
            
            switch(args.type) {
                case 0:
                    //save
                    this.success(args.header, args.message);
                    break;
                case 1:
                    //info
                    this.success(args.header, args.message);
                    break;
                case 2:
                    //error
                    this.error(args.header, args.message);
                    break;
                case 3:
                    //success
                    this.success(args.header, args.message);
                    break;
                case 4:
                    //warning
                    this.warning(args.header, args.message);
                    break;
            }
        },

	    /**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#success
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Adds a green success notication to the notications collection
		 * This should be used when an operations *completes* without errors
		 *
		 * @param {String} headline Headline of the notification
		 * @param {String} message longer text for the notication, trimmed after 200 characters, which can then be exanded
		 * @returns {Object} notification object
		 */
	    success: function (headline, message) {
	        return add({ headline: headline, message: message, type: 'success', time: new Date() });
	        
		},
		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#error
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Adds a red error notication to the notications collection
		 * This should be used when an operations *fails* and could not complete
		 * 
		 * @param {String} headline Headline of the notification
		 * @param {String} message longer text for the notication, trimmed after 200 characters, which can then be exanded
		 * @returns {Object} notification object
		 */
	    error: function (headline, message) {
	        return add({ headline: headline, message: message, type: 'error', time: new Date() });
		},

		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#warning
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Adds a yellow warning notication to the notications collection
		 * This should be used when an operations *completes* but something was not as expected
		 * 
		 *
		 * @param {String} headline Headline of the notification
		 * @param {String} message longer text for the notication, trimmed after 200 characters, which can then be exanded
		 * @returns {Object} notification object
		 */
	    warning: function (headline, message) {
	        return add({ headline: headline, message: message, type: 'warning', time: new Date() });
		},

		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#warning
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Adds a yellow warning notication to the notications collection
		 * This should be used when an operations *completes* but something was not as expected
		 * 
		 *
		 * @param {String} headline Headline of the notification
		 * @param {String} message longer text for the notication, trimmed after 200 characters, which can then be exanded
		 * @returns {Object} notification object
		 */
	    info: function (headline, message) {
	        return add({ headline: headline, message: message, type: 'info', time: new Date() });
		},

		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#remove
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Removes a notification from the notifcations collection at a given index 
		 *
		 * @param {Int} index index where the notication should be removed from
		 */
	    remove: function (index) {
	        angularHelper.safeApply($rootScope, function() {
	            nArray.splice(index, 1);
	        });
		},

		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#removeAll
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Removes all notifications from the notifcations collection 
		 */
	    removeAll: function () {
	        angularHelper.safeApply($rootScope, function() {
	            nArray = [];
	        });
		},

		/**
		 * @ngdoc property
		 * @name umbraco.services.notificationsService#current
		 * @propertyOf umbraco.services.notificationsService
		 *
		 * @description
		 * Returns an array of current notifications to display
		 *
		 * @returns {string} returns an array
		 */
		current: nArray,

		/**
		 * @ngdoc method
		 * @name umbraco.services.notificationsService#getCurrent
		 * @methodOf umbraco.services.notificationsService
		 *
		 * @description
		 * Method to return all notifications from the notifcations collection 
		 */
		getCurrent: function(){
			return nArray;
		}
	};
});
angular.module('umbraco.services')
.factory('searchService', function () {
	return {
		search: function(term, section){
			return [
			{
				section: "settings",
				tree: "documentTypes",
				matches:[
				{ name: "News archive", path:"/News Archive", id: 1234, icon: "icon-list-alt", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "Meta Data", path:"/Seo/Meta Data", id: 1234, icon: "icon-list-alt", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "Dooo", path:"/Woop/dee/dooo", id: 1234, icon: "icon-list-alt red", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 }
				
				]	
			},
			
			{
				section: "content",
				tree: "content",
				matches:[
				{ name: "News", path:"/archive/news", id: 1234, icon: "icon-file", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "Data types", path:"/Something/About/Data-Types", id: 1234, icon: "icon-file", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "Dooo", path:"/Woop/dee/dooo", id: 1234, icon: "icon-file", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 }
				]	
			},

			{
				section: "developer",
				tree: "macros",
				matches:[
				{ name: "Navigation", path:"/Macros/Navigation.xslt", id: 1234, icon: "icon-cogs", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "List of stuff", path:"/Macros/Navigation.xslt", id: 1234, icon: "icon-cogs", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 },
				{ name: "Something else", path:"/Macros/Navigation.xslt",id: 1234, icon: "icon-cogs", view: section + "/edit/" + 1234, children: [], expanded: false, level: 1 }
				]	
			}
			];
		},
		
		setCurrent: function(sectionAlias){
			currentSection = sectionAlias;	
		}
	};
});
/**
 * @ngdoc service
 * @name umbraco.services.serverValidationManager
 * @function
 *
 * @description
 * Used to handle server side validation and wires up the UI with the messages. There are 2 types of validation messages, one
 * is for user defined properties (called Properties) and the other is for field properties which are attached to the native 
 * model objects (not user defined). The methods below are named according to these rules: Properties vs Fields.
 */
function serverValidationManager($timeout) {

    var callbacks = [];
    
    /** calls the callback specified with the errors specified, used internally */
    function executeCallback(self, errorsForCallback, callback) {

        callback.apply(self, [
                 false,                  //pass in a value indicating it is invalid
                 errorsForCallback,      //pass in the errors for this item
                 self.items]);           //pass in all errors in total
    }

    function getFieldErrors(self, fieldName) {
        //find errors for this field name
        return _.filter(self.items, function (item) {
            return (item.propertyAlias === null && item.fieldName === fieldName);
        });
    }
    
    function getPropertyErrors(self, propertyAlias, fieldName) {
        //find all errors for this property
        return _.filter(self.items, function (item) {            
            return (item.propertyAlias === propertyAlias && (item.fieldName === fieldName || (fieldName === undefined || fieldName === "")));
        });
    }

    return {
        
        /**
         * @ngdoc function
         * @name umbraco.services.serverValidationManager#subscribe
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         *  This is primarily used for scenarios where the error collection needs to be persisted over a route change. Generally this 
         *   is when a content item (or any item) is created. The controller should call this method once the data is bound to the scope
         *   so that any persisted validation errors are re-bound to their controls. Once they are re-binded this then clears the validation
         *   colleciton so that if another route change occurs, the previously persisted validation errors are not re-bound to the new item.
         */
        executeAndClearAllSubscriptions: function() {

            var self = this;

            $timeout(function () {
                
                for (var cb in callbacks) {
                    if (callbacks[cb].propertyAlias === null) {
                        //its a field error callback
                        var fieldErrors = getFieldErrors(self, callbacks[cb].fieldName);
                        if (fieldErrors.length > 0) {
                            executeCallback(self, fieldErrors, callbacks[cb].callback);
                        }
                    }
                    else {
                        //its a property error
                        var propErrors = getPropertyErrors(self, { alias: callbacks[cb].propertyAlias }, callbacks[cb].fieldName);
                        if (propErrors.length > 0) {
                            executeCallback(self, propErrors, callbacks[cb].callback);
                        }
                    }
                }
                //now that they are all executed, we're gonna clear all of the errors we have
                self.clear();
            });
        },

        /**
         * @ngdoc function
         * @name umbraco.services.serverValidationManager#subscribe
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         *  Adds a callback method that is executed whenever validation changes for the field name + property specified.
         *  This is generally used for server side validation in order to match up a server side validation error with 
         *  a particular field, otherwise we can only pinpoint that there is an error for a content property, not the 
         *  property's specific field. This is used with the val-server directive in which the directive specifies the 
         *  field alias to listen for.
         *  If propertyAlias is null, then this subscription is for a field property (not a user defined property).
         */
        subscribe: function (propertyAlias, fieldName, callback) {
            if (!callback) {
                return;
            }
            
            if (propertyAlias === null) {
                //don't add it if it already exists
                var exists1 = _.find(callbacks, function (item) {
                    return item.propertyAlias === null && item.fieldName === fieldName;
                });
                if (!exists1) {
                    callbacks.push({ propertyAlias: null, fieldName: fieldName, callback: callback });
                }
            }
            else if (propertyAlias !== undefined) {
                //don't add it if it already exists
                var exists2 = _.find(callbacks, function (item) {
                    return item.propertyAlias === propertyAlias && item.fieldName === fieldName;
                });
                if (!exists2) {
                    callbacks.push({ propertyAlias: propertyAlias, fieldName: fieldName, callback: callback });
                }
            }
        },
        
        unsubscribe: function (propertyAlias, fieldName) {
            
            if (propertyAlias === null) {

                //remove all callbacks for the content field
                callbacks = _.reject(callbacks, function (item) {
                    return item.propertyAlias === null && item.fieldName === fieldName;
                });

            }
            else if (propertyAlias !== undefined) {
                
                //remove all callbacks for the content property
                callbacks = _.reject(callbacks, function (item) {
                    return item.propertyAlias === propertyAlias &&
                    (item.fieldName === fieldName ||
                        ((item.fieldName === undefined || item.fieldName === "") && (fieldName === undefined || fieldName === "")));
                });
            }

            
        },
        
        
        /**
         * @ngdoc function
         * @name getPropertyCallbacks
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Gets all callbacks that has been registered using the subscribe method for the propertyAlias + fieldName combo.
         * This will always return any callbacks registered for just the property (i.e. field name is empty) and for ones with an 
         * explicit field name set.
         */
        getPropertyCallbacks: function (propertyAlias, fieldName) {
            var found = _.filter(callbacks, function (item) {
                //returns any callback that have been registered directly against the field and for only the property
                return (item.propertyAlias === propertyAlias && (item.fieldName === fieldName || (item.fieldName === undefined || item.fieldName === "")));
            });
            return found;
        },
        
        /**
         * @ngdoc function
         * @name getFieldCallbacks
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Gets all callbacks that has been registered using the subscribe method for the field.         
         */
        getFieldCallbacks: function (fieldName) {
            var found = _.filter(callbacks, function (item) {
                //returns any callback that have been registered directly against the field
                return (item.propertyAlias === null && item.fieldName === fieldName);
            });
            return found;
        },
        
        /**
         * @ngdoc function
         * @name addFieldError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Adds an error message for a native content item field (not a user defined property, for Example, 'Name')
         */
        addFieldError: function(fieldName, errorMsg) {
            if (!fieldName) {
                return;
            }
            
            //only add the item if it doesn't exist                
            if (!this.hasFieldError(fieldName)) {
                this.items.push({
                    propertyAlias: null,
                    fieldName: fieldName,
                    errorMsg: errorMsg
                });
            }
            
            //find all errors for this item
            var errorsForCallback = getFieldErrors(this, fieldName);
            //we should now call all of the call backs registered for this error
            var cbs = this.getFieldCallbacks(fieldName);
            //call each callback for this error
            for (var cb in cbs) {
                executeCallback(this, errorsForCallback, cbs[cb].callback);
            }
        },

        /**
         * @ngdoc function
         * @name addPropertyError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Adds an error message for the content property
         */
        addPropertyError: function (propertyAlias, fieldName, errorMsg) {
            if (!propertyAlias) {
                return;
            }
            
            //only add the item if it doesn't exist                
            if (!this.hasPropertyError(propertyAlias, fieldName)) {
                this.items.push({
                    propertyAlias: propertyAlias,
                    fieldName: fieldName,
                    errorMsg: errorMsg
                });
            }
            
            //find all errors for this item
            var errorsForCallback = getPropertyErrors(this, propertyAlias, fieldName);
            //we should now call all of the call backs registered for this error
            var cbs = this.getPropertyCallbacks(propertyAlias, fieldName);
            //call each callback for this error
            for (var cb in cbs) {
                executeCallback(this, errorsForCallback, cbs[cb].callback);
            }
        },        
        
        /**
         * @ngdoc function
         * @name removePropertyError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Removes an error message for the content property
         */
        removePropertyError: function (propertyAlias, fieldName) {

            if (!propertyAlias) {
                return;
            }
            //remove the item
            this.items = _.reject(this.items, function (item) {
                return (item.propertyAlias === propertyAlias && (item.fieldName === fieldName || (fieldName === undefined || fieldName === "")));
            });
        },
        
        /**
         * @ngdoc function
         * @name reset
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Clears all errors and notifies all callbacks that all server errros are now valid - used when submitting a form
         */
        reset: function () {
            this.clear();
            for (var cb in callbacks) {
                callbacks[cb].callback.apply(this, [
                        true,       //pass in a value indicating it is VALID
                        [],         //pass in empty collection
                        []]);       //pass in empty collection
            }
        },
        
        /**
         * @ngdoc function
         * @name clear
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Clears all errors
         */
        clear: function() {
            this.items = [];
        },
        
        /**
         * @ngdoc function
         * @name getPropertyError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Gets the error message for the content property
         */
        getPropertyError: function (propertyAlias, fieldName) {
            var err = _.find(this.items, function (item) {
                //return true if the property alias matches and if an empty field name is specified or the field name matches
                return (item.propertyAlias === propertyAlias && (item.fieldName === fieldName || (fieldName === undefined || fieldName === "")));
            });
            return err;
        },
        
        /**
         * @ngdoc function
         * @name getFieldError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Gets the error message for a content field
         */
        getFieldError: function (fieldName) {
            var err = _.find(this.items, function (item) {
                //return true if the property alias matches and if an empty field name is specified or the field name matches
                return (item.propertyAlias === null && item.fieldName === fieldName);
            });
            return err;
        },
        
        /**
         * @ngdoc function
         * @name hasPropertyError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Checks if the content property + field name combo has an error
         */
        hasPropertyError: function (propertyAlias, fieldName) {
            var err = _.find(this.items, function (item) {
                //return true if the property alias matches and if an empty field name is specified or the field name matches
                return (item.propertyAlias === propertyAlias && (item.fieldName === fieldName || (fieldName === undefined || fieldName === "")));
            });
            return err ? true : false;
        },
        
        /**
         * @ngdoc function
         * @name hasFieldError
         * @methodOf umbraco.services.serverValidationManager
         * @function
         *
         * @description
         * Checks if a content field has an error
         */
        hasFieldError: function (fieldName) {
            var err = _.find(this.items, function (item) {
                //return true if the property alias matches and if an empty field name is specified or the field name matches
                return (item.propertyAlias === null && item.fieldName === fieldName);
            });
            return err ? true : false;
        },
        
        /** The array of error messages */
        items: []
    };
}

angular.module('umbraco.services').factory('serverValidationManager', serverValidationManager);

/**
 * @ngdoc service
 * @name umbraco.services.treeService
 * @function
 *
 * @description
 * The tree service factory, used internally by the umbTree and umbTreeItem directives
 */
function treeService($q, treeResource, iconHelper, notificationsService, $rootScope) {
    //implement this in local storage
    var treeArray = [];
    var standardCssClass = 'icon umb-tree-icon sprTree';

    return {  
        
        /** Internal method that ensures there's a routePath, parent and level property on each tree node and adds some icon specific properties so that the nodes display properly */
        _formatNodeDataForUseInUI: function (parentNode, treeNodes, section, level) {
            //if no level is set, then we make it 1   
            var childLevel = (level ? level : 1);
            for (var i = 0; i < treeNodes.length; i++) {

                treeNodes[i].level = childLevel;
                treeNodes[i].parent = parentNode;
                
                //if there is not route path specified, then set it automatically,
                //if this is a tree root node then we want to route to the section's dashboard
                if (!treeNodes[i].routePath) {
                    if (treeNodes[i].metaData && treeNodes[i].metaData["treeAlias"]) {
                        //this is a root node
                        treeNodes[i].routePath = section;
                        //we're going to remove any js callbacks from legacy tree nodes here!
                        treeNodes[i].metaData["jsClickCallback"] = null;
                    }
                    else {
                        var treeAlias = this.getTreeAlias(treeNodes[i]);
                        treeNodes[i].routePath = section + "/" + treeAlias + "/edit/" + treeNodes[i].id;
                    }
                }

                //now, format the icon data
                if (treeNodes[i].iconIsClass === undefined || treeNodes[i].iconIsClass) {
                    var converted = iconHelper.convertFromLegacyTreeNodeIcon(treeNodes[i]);
                    treeNodes[i].cssClass = standardCssClass + " " + converted;
                    if (converted.startsWith('.')) {
                        //its legacy so add some width/height
                        treeNodes[i].style = "height:16px;width:16px;";
                    }
                    else {
                        treeNodes[i].style = "";
                    }
                }
                else {
                    treeNodes[i].style = "background-image: url('" + treeNodes[i].iconFilePath + "');";
                    //we need an 'icon-' class in there for certain styles to work so if it is image based we'll add this
                    treeNodes[i].cssClass = standardCssClass + " legacy-custom-file";
                }
            }
        },

        /**
         * @ngdoc method
         * @name umbraco.services.treeService#getMenuItemByAlias
         * @methodOf umbraco.services.treeService
         * @function
         *
         * @description
         * Clears all node children, gets it's up-to-date children from the server and re-assigns them and then
         * returns them in a promise.
         * @param {object} args An arguments object
         * @param {object} args.node The tree node
         * @param {object} args.section The current section
         */
        loadNodeChildren: function(args) {
            if (!args) {
                throw "No args object defined for getChildren";
            }
            if (!args.node) {
                throw "No node defined on args object for getChildren";
            }
            
            this.removeChildNodes(args.node);
            args.node.loading = true;

            return this.getChildren(args)
                .then(function(data) {

                    //set state to done and expand
                    args.node.loading = false;
                    args.node.children = data;
                    args.node.expanded = true;
                    args.node.hasChildren = true;

                    return data;

                }, function(reason) {

                    //in case of error, emit event
                    $rootScope.$broadcast("treeNodeLoadError", { element: arrow, node: node, error: reason });

                    //stop show the loading indicator  
                    node.loading = false;

                    //tell notications about the error
                    notificationsService.error(reason);

                    return reason;
                });

        },

        /** Removes a given tree node from the tree */
        removeNode: function(treeNode) {
            if (treeNode.parent == null) {
                throw "Cannot remove a node that doesn't have a parent";
            }
            //remove the current item from it's siblings
            treeNode.parent.children.splice(treeNode.parent.children.indexOf(treeNode), 1);            
        },
        
        /** Removes all child nodes from a given tree node */
        removeChildNodes : function(treeNode) {
            treeNode.expanded = false;
            treeNode.children = [];
            treeNode.hasChildren = false;
        },

        /** Gets a child node by id */
        getChildNode: function(treeNode, id) {
            var found = _.find(treeNode.children, function (child) {
                return String(child.id) === String(id);
            });
            return found === undefined ? null : found;
        },

        /** Gets a descendant node by id */
        getDescendantNode: function(treeNode, id) {
            //check the first level
            var found = this.getChildNode(treeNode, id);
            if (found) {
                return found;
            }
           
            //check each child of this node
            for (var i = 0; i < treeNode.children.length; i++) {
                if (treeNode.children[i].children && angular.isArray(treeNode.children[i].children) && treeNode.children[i].children.length > 0) {
                    //recurse
                    found = this.getDescendantNode(treeNode.children[i], id);
                    if (found) {
                        return found;
                    }
                }
            }
            
            //not found
            return found === undefined ? null : found;
        },

        /** Gets the root node of the current tree type for a given tree node */
        getTreeRoot: function(treeNode) {
            //all root nodes have metadata key 'treeAlias'
            var root = null;
            var current = treeNode;            
            while (root === null && current !== undefined) {
                
                if (current.metaData && current.metaData["treeAlias"]) {
                    root = current;
                }
                else { 
                    current = current.parent;
                }
            }
            return root;
        },

        /** Gets the node's tree alias, this is done by looking up the meta-data of the current node's root node */
        getTreeAlias : function(treeNode) {
            var root = this.getTreeRoot(treeNode);
            if (root) {
                return root.metaData["treeAlias"];
            }
            return "";
        },

        getTree: function (args) {

            if (args === undefined) {
                args = {};
            }

            var section = args.section || 'content';
            var cacheKey = args.cachekey || '';
            cacheKey += "_" + section;	

            //return the cache if it exists
            if (treeArray[cacheKey] !== undefined){
                return treeArray[cacheKey];
            }

            var self = this;

            return treeResource.loadApplication(args)
                .then(function(data) {
                    //this will be called once the tree app data has loaded
                    var result = {
                        name: section,
                        alias: section,
                        root: data
                    };
                    //we need to format/modify some of the node data to be used in our app.
                    self._formatNodeDataForUseInUI(result.root, result.root.children, section);
                    //cache this result
                    //TODO: We'll need to un-cache this in many circumstances
                    treeArray[cacheKey] = result;
                    //return the data result as promised
                    //deferred.resolve(treeArray[cacheKey]);
                    return treeArray[cacheKey];
                });
        },

        getMenu: function (args) {

            if (!args) {
                throw "args cannot be null";
            }
            if (!args.treeNode) {
                throw "args.treeNode cannot be null";
            }

            return treeResource.loadMenu(args.treeNode)
                .then(function(data) {
                    //need to convert the icons to new ones
                    for (var i = 0; i < data.length; i++) {
                        data[i].cssclass = iconHelper.convertFromLegacyIcon(data[i].cssclass);
                    }
                    return data;
                });
        },
        
        /**
         * @ngdoc method
         * @name umbraco.services.treeService#getMenuItemByAlias
         * @methodOf umbraco.services.treeService
         * @function
         *
         * @description
         * Attempts to return a tree node's menu item based on the alias supplied, otherwise returns null.
         * @param {object} args An arguments object
         * @param {object} args.treeNode The tree node to get the menu item for
         * @param {object} args.menuItemAlias The menu item alias to attempt to find
         */
        getMenuItemByAlias: function (args) {

            if (!args) {
                throw "args cannot be null";
            }
            if (!args.treeNode) {
                throw "args.treeNode cannot be null";                
            }
            if (!args.menuItemAlias) {
                throw "args.menuItemAlias cannot be null";
            }

            return this.getMenu(args)
                .then(function (menuItems) {
                    //try to find the node with the alias
                    return _.find(menuItems, function(item) {
                        return item.alias === args.menuItemAlias;
                    });
                });
        },
        
        /** Gets the children from the server for a given node */
        getChildren: function (args) {

            if (!args) {
                throw "No args object defined for getChildren";
            }
            if (!args.node) {
                throw "No node defined on args object for getChildren";
            }

            var section = args.section || 'content';
            var treeItem = args.node;

            //hack to have create as default content action
            var action;
            if(section === "content"){
                action = "create";
            }

            var self = this;

            return treeResource.loadNodes({ section: section, node: treeItem })
                .then(function (data) {
                    //now that we have the data, we need to add the level property to each item and the view
                    self._formatNodeDataForUseInUI(treeItem, data, section, treeItem.level + 1);
                    return data;
                });
        }
    };
}

angular.module('umbraco.services').factory('treeService', treeService);
/**
* @ngdoc service
* @name umbraco.services.umbRequestHelper
* @description A helper object used for sending requests to the server
**/
function umbRequestHelper($http, $q, umbDataFormatter, angularHelper, dialogService) {
    return {

        /**
         * @ngdoc method
         * @name umbraco.services.umbRequestHelper#dictionaryToQueryString
         * @methodOf umbraco.services.umbRequestHelper
         * @function
         *
         * @description
         * This will turn an array of key/value pairs into a query string
         * 
         * @param {Array} queryStrings An array of key/value pairs
         */
        dictionaryToQueryString: function (queryStrings) {

            if (!angular.isArray(queryStrings)) {
                throw "The queryString parameter is not an array of key value pairs";
            }

            return _.map(queryStrings, function (item) {
                var key = null;
                var val = null;
                for (var k in item) {
                    key = k;
                    val = item[k];
                    break;
                }
                if (key == null || val == null) {
                    throw "The object in the array was not formatted as a key/value pair";
                }
                return key + "=" + val;
            }).join("&");

        },

        /**
         * @ngdoc method
         * @name umbraco.services.umbRequestHelper#getApiUrl
         * @methodOf umbraco.services.umbRequestHelper
         * @function
         *
         * @description
         * This will return the webapi Url for the requested key based on the servervariables collection
         * 
         * @param {string} apiName The webapi name that is found in the servervariables["umbracoUrls"] dictionary
         * @param {string} actionName The webapi action name 
         * @param {object} queryStrings Can be either a string or an array containing key/value pairs
         */
        getApiUrl: function (apiName, actionName, queryStrings) {
            if (!Umbraco || !Umbraco.Sys || !Umbraco.Sys.ServerVariables || !Umbraco.Sys.ServerVariables["umbracoUrls"]) {
                throw "No server variables defined!";
            }

            if (!Umbraco.Sys.ServerVariables["umbracoUrls"][apiName]) {
                throw "No url found for api name " + apiName;
            }

            return Umbraco.Sys.ServerVariables["umbracoUrls"][apiName] + actionName +
                (!queryStrings ? "" : "?" + (angular.isString(queryStrings) ? queryStrings : this.dictionaryToQueryString(queryStrings)));

        },

        /**
         * @ngdoc function
         * @name umbraco.services.umbRequestHelper#resourcePromise
         * @methodOf umbraco.services.umbRequestHelper
         * @function
         *
         * @description
         * This returns a promise with an underlying http call, it is a helper method to reduce
         *  the amount of duplicate code needed to query http resources and automatically handle any 
         *  Http errors. See /docs/source/using-promises-resources.md
         *
         * @param {object} opts A mixed object which can either be a string representing the error message to be
         *   returned OR an object containing either:
         *     { success: successCallback, errorMsg: errorMessage }
         *          OR
         *     { success: successCallback, error: errorCallback }
         *   In both of the above, the successCallback must accept these parameters: data, status, headers, config
         *   If using the errorCallback it must accept these parameters: data, status, headers, config
         *   The success callback must return the data which will be resolved by the deferred object.
         *   The error callback must return an object containing: {errorMsg: errorMessage, data: originalData, status: status }
         */
        resourcePromise: function (httpPromise, opts) {
            var deferred = $q.defer();

            /** The default success callback used if one is not supplied in the opts */
            function defaultSuccess(data, status, headers, config) {
                //when it's successful, just return the data
                return data;
            }

            /** The default error callback used if one is not supplied in the opts */
            function defaultError(data, status, headers, config) {
                return {
                    //NOTE: the default error message here should never be used based on the above docs!
                    errorMsg: (angular.isString(opts) ? opts : 'An error occurred!'),
                    data: data,
                    status: status
                };
            }

            //create the callbacs based on whats been passed in.
            var callbacks = {
                success: ((!opts || !opts.success) ? defaultSuccess : opts.success),
                error: ((!opts || !opts.error) ? defaultError : opts.error)
            };

            httpPromise.success(function (data, status, headers, config) {

                //invoke the callback 
                var result = callbacks.success.apply(this, [data, status, headers, config]);

                //when it's successful, just return the data
                deferred.resolve(result);

            }).error(function (data, status, headers, config) {

                //invoke the callback
                var result = callbacks.error.apply(this, [data, status, headers, config]);

                //when there's a 500 (unhandled) error show a YSOD overlay if debugging is enabled.
                if (status >= 500 && status < 600 && Umbraco.Sys.ServerVariables["isDebuggingEnabled"] === true) {

                    dialogService.ysodDialog({
                        errorMsg: result.errorMsg,
                        data: result.data
                    });
                }
                else {

                    //return an error object including the error message for UI
                    deferred.reject({
                        errorMsg: result.errorMsg,
                        data: result.data,
                        status: result.status
                    });

                }

            });

            return deferred.promise;

        },

        /** Used for saving media/content specifically */
        postSaveContent: function (restApiUrl, content, action, files) {

            var deferred = $q.defer();

            //save the active tab id so we can set it when the data is returned.
            var activeTab = _.find(content.tabs, function (item) {
                return item.active;
            });
            var activeTabIndex = (activeTab === undefined ? 0 : _.indexOf(content.tabs, activeTab));

            //save the data
            this.postMultiPartRequest(
                restApiUrl,
                { key: "contentItem", value: umbDataFormatter.formatContentPostData(content, action) },
                function (data, formData) {
                    //now add all of the assigned files
                    for (var f in files) {
                        //each item has a property id and the file object, we'll ensure that the id is suffixed to the key
                        // so we know which property it belongs to on the server side
                        formData.append("file_" + files[f].id, files[f].file);
                    }

                },
                function (data, status, headers, config) {
                    //success callback

                    //reset the tabs and set the active one
                    _.each(data.tabs, function (item) {
                        item.active = false;
                    });
                    data.tabs[activeTabIndex].active = true;

                    //the data returned is the up-to-date data so the UI will refresh
                    deferred.resolve(data);
                },
                function (data, status, headers, config) {
                    //failure callback

                    //when there's a 500 (unhandled) error show a YSOD overlay if debugging is enabled.
                    if (status >= 500 && status < 600 && Umbraco.Sys.ServerVariables["isDebuggingEnabled"] === true) {

                        dialogService.ysodDialog({
                            errorMsg: 'An error occurred',
                            data: data
                        });
                    }
                    else {

                        //return an error object including the error message for UI
                        deferred.reject({
                            errorMsg: 'An error occurred',
                            data: data,
                            status: status
                        });
                    }

                });

            return deferred.promise;
        },

        /** Posts a multi-part mime request to the server */
        postMultiPartRequest: function (url, jsonData, transformCallback, successCallback, failureCallback) {

            //validate input, jsonData can be an array of key/value pairs or just one key/value pair.
            if (!jsonData) { throw "jsonData cannot be null"; }

            if (angular.isArray(jsonData)) {
                _.each(jsonData, function (item) {
                    if (!item.key || !item.value) { throw "jsonData array item must have both a key and a value property"; }
                });
            }
            else if (!jsonData.key || !jsonData.value) { throw "jsonData object must have both a key and a value property"; }


            $http({
                method: 'POST',
                url: url,
                //IMPORTANT!!! You might think this should be set to 'multipart/form-data' but this is not true because when we are sending up files
                // the request needs to include a 'boundary' parameter which identifies the boundary name between parts in this multi-part request
                // and setting the Content-type manually will not set this boundary parameter. For whatever reason, setting the Content-type to 'false'
                // will force the request to automatically populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': false },
                transformRequest: function (data) {
                    var formData = new FormData();
                    //add the json data
                    if (angular.isArray(data)) {
                        _.each(data, function (item) {
                            formData.append(item.key, !angular.isString(item.value) ? angular.toJson(item.value) : item.value);
                        });
                    }
                    else {
                        formData.append(data.key, !angular.isString(data.value) ? angular.toJson(data.value) : data.value);
                    }

                    //call the callback
                    if (transformCallback) {
                        transformCallback.apply(this, [data, formData]);
                    }

                    return formData;
                },
                data: jsonData
            }).
            success(function (data, status, headers, config) {
                if (successCallback) {
                    successCallback.apply(this, [data, status, headers, config]);
                }
            }).
            error(function (data, status, headers, config) {
                if (failureCallback) {
                    failureCallback.apply(this, [data, status, headers, config]);
                }
            });
        }
    };
}
angular.module('umbraco.services').factory('umbRequestHelper', umbRequestHelper);
angular.module('umbraco.services')
.factory('userService', function ($rootScope, $q, $location, $log, securityRetryQueue, authResource, dialogService) {

    var currentUser = null;
    var loginDialog = null;

    // Redirect to the given url (defaults to '/')
    function redirect(url) {
        url = url || '/';
        $location.path(url);
    }

    function openLoginDialog() {
        if (!loginDialog) {
            loginDialog = dialogService.open({
                template: 'views/common/dialogs/login.html',
                modalClass: "login-overlay",
                animation: "slide",
                show: true,
                callback: onLoginDialogClose
            });
        }
    }

    function onLoginDialogClose(success) {
        loginDialog = null;

        if (success) {
            securityRetryQueue.retryAll();
        } else {
            securityRetryQueue.cancelAll();
            redirect();
        }
    }

    // Register a handler for when an item is added to the retry queue
    securityRetryQueue.onItemAddedCallbacks.push(function (retryItem) {
        if (securityRetryQueue.hasMore()) {
            openLoginDialog();
        }
    });

    return {

        /** Returns a promise, sends a request to the server to check if the current cookie is authorized  */
        isAuthenticated: function () {
            
            return authResource.isAuthenticated()
                .then(function(data) {

                    //note, this can return null if they are not authenticated
                    if (!data) {
                        throw "Not authenticated";
                    }
                    else {
                        currentUser = data;
                        currentUser.avatar = 'http://www.gravatar.com/avatar/' + data.emailHash + '?s=40&d=404';
                        return { user: data, authenticated: true };
                    }
                });
        },

        /** Returns a promise, sends a request to the server to validate the credentials  */
        authenticate: function (login, password) {

            return authResource.performLogin(login, password)
                .then(function (data) {
                    //when it's successful, return the user data
                    currentUser = data;
                    return { user: data, authenticated: true };
                });
        },

        logout: function () {
            return authResource.performLogout()
                .then(function (data) {                   
                    currentUser = null;
                    openLoginDialog();
                    return null;
                });
        },

        /** Returns the current user object, if null then calls to authenticated or authenticate must be called  */
        getCurrentUser: function () {
            return currentUser;
        }
    };

});

/*Contains multiple services for various helper tasks */

/**
 * @ngdoc function
 * @name umbraco.services.legacyJsLoader
 * @function
 *
 * @description
 * Used to lazy load in any JS dependencies that need to be manually loaded in
 */
function legacyJsLoader(assetsService, umbRequestHelper) {
    return {
        
        /** Called to load in the legacy tree js which is required on startup if a user is logged in or 
         after login, but cannot be called until they are authenticated which is why it needs to be lazy loaded. */
        loadLegacyTreeJs: function(scope) {
            return assetsService.loadJs(umbRequestHelper.getApiUrl("legacyTreeJs", "", ""), scope);
        }  
    };
}
angular.module('umbraco.services').factory('legacyJsLoader', legacyJsLoader);

/**
* @ngdoc service
* @name umbraco.services.umbPropertyEditorHelper
* @description A helper object used for property editors
**/
function umbPropEditorHelper() {
    return {
        /**
     * @ngdoc function
     * @name getImagePropertyValue
     * @methodOf umbraco.services.umbPropertyEditorHelper
     * @function    
     *
     * @description
     * Returns the correct view path for a property editor, it will detect if it is a full virtual path but if not then default to the internal umbraco one
     * 
     * @param {string} input the view path currently stored for the property editor
     */
        getViewPath: function (input, isPreValue) {
            var path = String(input);

            if (path.startsWith('/')) {

                //This is an absolute path, so just leave it
                return path;
            }
            else {
                
                if (path.indexOf("/") >= 0) {
                    //This is a relative path, so just leave it
                    return path;
                }
                else {
                    if (!isPreValue) {
                        //i.e. views/propertyeditors/fileupload/fileupload.html
                        return "views/propertyeditors/" + path + "/" + path + ".html";
                    }
                    else {
                        //i.e. views/prevalueeditors/requiredfield.html
                        return "views/prevalueeditors/" + path + ".html";
                    }
                }
                
            }
        }
    };
}
angular.module('umbraco.services').factory('umbPropEditorHelper', umbPropEditorHelper);

/**
* @ngdoc service
* @name umbraco.services.imageHelper
* @description A helper object used for parsing image paths
**/
function imageHelper() {
    return {
        /** Returns the actual image path associated with the image property if there is one */
        getImagePropertyValue: function(options) {
            if (!options && !options.imageModel) {
                throw "The options objet does not contain the required parameters: imageModel";
            }
            if (options.imageModel.contentTypeAlias.toLowerCase() === "image") {

                //combine all props, TODO: we really need a better way then this
                var props = [];
                if(options.imageModel.properties){
                    props = options.imageModel.properties;
                }else{
                    $(options.imageModel.tabs).each(function(i, tab){
                        props = props.concat(tab.properties);
                    });    
                }

                var imageProp = _.find(props, function (item) {
                    return item.alias === 'umbracoFile';
                });
                var imageVal;

                //our default images might store one or many images (as csv)
                var split = imageProp.value.split(',');
                var self = this;
                imageVal = _.map(split, function(item) {
                    return { file: item, isImage: self.detectIfImageByExtension(item) };
                });
                
                //for now we'll just return the first image in the collection.
                //TODO: we should enable returning many to be displayed in the picker if the uploader supports many.
                if (imageVal.length && imageVal.length > 0 && imageVal[0].isImage) {
                    return imageVal[0].file;
                }
            }
            return "";
        },
        /** formats the display model used to display the content to the model used to save the content */
        getThumbnail: function (options) {
            
            if (!options && !options.imageModel) {
                throw "The options objet does not contain the required parameters: imageModel";
            }

            var imagePropVal = this.getImagePropertyValue(options);
            if (imagePropVal !== "") {
                return this.getThumbnailFromPath(imagePropVal);
            }
            return "";
        },

        scaleToMaxSize: function(maxSize, width, height){
            var retval = {width: width, height: height};

            var maxWidth = maxSize; // Max width for the image
            var maxHeight = maxSize;    // Max height for the image
            var ratio = 0;  // Used for aspect ratio
           
            // Check if the current width is larger than the max
            if(width > maxWidth){
                ratio = maxWidth / width;   // get ratio for scaling image
                
                retval.width = maxWidth;
                retval.height = height * ratio;

                height = height * ratio;    // Reset height to match scaled image
                width = width * ratio;    // Reset width to match scaled image
            }

            // Check if current height is larger than max
            if(height > maxHeight){
                ratio = maxHeight / height; // get ratio for scaling image

                retval.height = maxHeight;
                retval.width = width * ratio;
                width = width * ratio;    // Reset width to match scaled image
            }

            return retval;
        },

        getThumbnailFromPath: function(imagePath) {
            var ext = imagePath.substr(imagePath.lastIndexOf('.'));
            return imagePath.substr(0, imagePath.lastIndexOf('.')) + "_thumb" + ".jpg";
        },
        detectIfImageByExtension: function(imagePath) {
            var lowered = imagePath.toLowerCase();
            var ext = lowered.substr(lowered.lastIndexOf(".") + 1);
            return ("," + Umbraco.Sys.ServerVariables.umbracoSettings.imageFileTypes + ",").indexOf("," + ext + ",") !== -1;
        }
    };
}
angular.module('umbraco.services').factory('imageHelper', imageHelper);

/**
* @ngdoc service
* @name umbraco.services.umbDataFormatter
* @description A helper object used to format/transform JSON Umbraco data, mostly used for persisting data to the server
**/
function umbDataFormatter() {
    return {
        
        /** formats the display model used to display the data type to the model used to save the data type */
        formatDataTypePostData: function(displayModel, preValues, action) {
            var saveModel = {
                parentId: -1,
                id: displayModel.id,
                name: displayModel.name,
                selectedEditor: displayModel.selectedEditor,
                //set the action on the save model
                action: action,
                preValues: []
            };
            for (var i = 0; i < preValues.length; i++) {

                saveModel.preValues.push({
                    key: preValues[i].alias,
                    value: preValues[i].value
                });
            }
            return saveModel;
        },

        /** formats the display model used to display the content to the model used to save the content */
        formatContentPostData: function (displayModel, action) {
            //NOTE: the display model inherits from the save model so we can in theory just post up the display model but 
            // we don't want to post all of the data as it is unecessary.
            var saveModel = {
                id: displayModel.id,
                properties: [],
                name: displayModel.name,
                contentTypeAlias : displayModel.contentTypeAlias,
                parentId: displayModel.parentId,
                //set the action on the save model
                action: action
            };
            
            _.each(displayModel.tabs, function (tab) {
                
                _.each(tab.properties, function (prop) {
                    
                    //don't include the custom generic tab properties
                    if (!prop.alias.startsWith("_umb_")) {
                        saveModel.properties.push({
                            id: prop.id,
                            alias: prop.alias,
                            value: prop.value
                        });
                    }
                    else {
                        //here we need to map some of our internal properties to the content save item

                        switch (prop.alias) {
                            case "_umb_expiredate":
                                saveModel.expireDate = prop.value;
                                break;
                            case "_umb_releasedate":
                                saveModel.releaseDate = prop.value;
                                break;
                            case "_umb_template":
                                saveModel.templateAlias = prop.value;
                                break;
                        }
                    }
                    
                });
            });

            return saveModel;
        }
    };
}
angular.module('umbraco.services').factory('umbDataFormatter', umbDataFormatter);

/**
* @ngdoc service
* @name umbraco.services.iconHelper
* @description A helper service for dealing with icons, mostly dealing with legacy tree icons
**/
function iconHelper() {

    var converter = [
        { oldIcon: ".sprNew", newIcon: "add" },
        { oldIcon: ".sprDelete", newIcon: "remove" },
        { oldIcon: ".sprMove", newIcon: "enter" },
        { oldIcon: ".sprCopy", newIcon: "documents" },
        { oldIcon: ".sprSort", newIcon: "navigation-vertical" },
        { oldIcon: ".sprPublish", newIcon: "globe" },
        { oldIcon: ".sprRollback", newIcon: "undo" },
        { oldIcon: ".sprProtect", newIcon: "lock" },
        { oldIcon: ".sprAudit", newIcon: "time" },
        { oldIcon: ".sprNotify", newIcon: "envelope" },
        { oldIcon: ".sprDomain", newIcon: "home" },
        { oldIcon: ".sprPermission", newIcon: "lock" },
        { oldIcon: ".sprRefresh", newIcon: "refresh" },
        { oldIcon: ".sprBinEmpty", newIcon: "trash" },
        { oldIcon: ".sprExportDocumentType", newIcon: "download-alt" },
        { oldIcon: ".sprImportDocumentType", newIcon: "page-up" },
        { oldIcon: ".sprLiveEdit", newIcon: "edit" },
        { oldIcon: ".sprCreateFolder", newIcon: "add" },
        { oldIcon: ".sprPackage2", newIcon: "box" },
        { oldIcon: ".sprLogout", newIcon: "logout" },
        { oldIcon: ".sprSave", newIcon: "save" },
        { oldIcon: ".sprSendToTranslate", newIcon: "envelope-alt" },
        { oldIcon: ".sprToPublish", newIcon: "mail-forward" },
        { oldIcon: ".sprTranslate", newIcon: "comments" },
        { oldIcon: ".sprUpdate", newIcon: "save" },
        
        { oldIcon: ".sprTreeSettingDomain", newIcon: "icon-home" },
        { oldIcon: ".sprTreeDoc", newIcon: "icon-document" },
        { oldIcon: ".sprTreeDoc2", newIcon: "icon-diploma-alt" },
        { oldIcon: ".sprTreeDoc3", newIcon: "icon-notepad" },
        { oldIcon: ".sprTreeDoc4", newIcon: "icon-newspaper-alt" },
        { oldIcon: ".sprTreeDoc5", newIcon: "icon-notepad-alt" },

        { oldIcon: ".sprTreeDocPic", newIcon: "icon-picture" },        
        { oldIcon: ".sprTreeFolder", newIcon: "icon-folder" },
        { oldIcon: ".sprTreeFolder_o", newIcon: "icon-folder" },
        { oldIcon: ".sprTreeMediaFile", newIcon: "icon-music" },
        { oldIcon: ".sprTreeMediaMovie", newIcon: "icon-movie" },
        { oldIcon: ".sprTreeMediaPhoto", newIcon: "icon-picture" },
        
        { oldIcon: ".sprTreeMember", newIcon: "icon-user" },
        { oldIcon: ".sprTreeMemberGroup", newIcon: "icon-users" },
        { oldIcon: ".sprTreeMemberType", newIcon: "icon-users" },
        
        { oldIcon: ".sprTreeNewsletter", newIcon: "icon-file-text-alt" },
        { oldIcon: ".sprTreePackage", newIcon: "icon-box" },
        { oldIcon: ".sprTreeRepository", newIcon: "icon-server-alt" },
        
        { oldIcon: ".sprTreeSettingDataType", newIcon: "icon-autofill" },

        //TODO:
        /*
        { oldIcon: ".sprTreeSettingAgent", newIcon: "" },
        { oldIcon: ".sprTreeSettingCss", newIcon: "" },
        { oldIcon: ".sprTreeSettingCssItem", newIcon: "" },
        
        { oldIcon: ".sprTreeSettingDataTypeChild", newIcon: "" },
        { oldIcon: ".sprTreeSettingDomain", newIcon: "" },
        { oldIcon: ".sprTreeSettingLanguage", newIcon: "" },
        { oldIcon: ".sprTreeSettingScript", newIcon: "" },
        { oldIcon: ".sprTreeSettingTemplate", newIcon: "" },
        { oldIcon: ".sprTreeSettingXml", newIcon: "" },
        { oldIcon: ".sprTreeStatistik", newIcon: "" },
        { oldIcon: ".sprTreeUser", newIcon: "" },
        { oldIcon: ".sprTreeUserGroup", newIcon: "" },
        { oldIcon: ".sprTreeUserType", newIcon: "" },
        */


        { oldIcon: ".sprTreeDeveloperCacheItem", newIcon: "icon-box" },
        { oldIcon: ".sprTreeDeveloperCacheTypes", newIcon: "icon-box" },
        { oldIcon: ".sprTreeDeveloperMacro", newIcon: "icon-cogs" },
        { oldIcon: ".sprTreeDeveloperRegistry", newIcon: "icon-windows" },
        { oldIcon: ".sprTreeDeveloperPython", newIcon: "icon-linux" }
    ];

    var imageConverter = [
            {oldImage: "contour.png", newIcon: "icon-umb-contour"}
            ];

    return {
        
        /** Used by the create dialogs for content/media types to format the data so that the thumbnails are styled properly */
        formatContentTypeThumbnails: function (contentTypes) {
            for (var i = 0; i < contentTypes.length; i++) {
                if (contentTypes[i].thumbnailIsClass === undefined || contentTypes[i].thumbnailIsClass) {
                    contentTypes[i].cssClass = this.convertFromLegacyIcon(contentTypes[i].thumbnail);
                }
                else {
                    contentTypes[i].style = "background-image: url('" + contentTypes[i].thumbnailFilePath + "');height:36px; background-position:4px 0px; background-repeat: no-repeat;background-size: 35px 35px;";
                    //we need an 'icon-' class in there for certain styles to work so if it is image based we'll add this
                    contentTypes[i].cssClass = "custom-file";
                }
            }
            return contentTypes;
        },
        formatContentTypeIcons: function (contentTypes) {
            for (var i = 0; i < contentTypes.length; i++) {
                contentTypes[i].icon = this.convertFromLegacyIcon(contentTypes[i].icon);
            }
            return contentTypes;
        },
        /** If the icon is file based (i.e. it has a file path) */
        isFileBasedIcon: function (icon) {
            //if it doesn't start with a '.' but contains one then we'll assume it's file based
            if (!icon.startsWith('.') && icon.indexOf('.') > 1) {
                return true;
            }
            return false;
        },
        /** If the icon is legacy */
        isLegacyIcon: function (icon) {
            if (icon.startsWith('.')) {
                return true;
            }
            return false;
        },
        /** If the tree node has a legacy icon */
        isLegacyTreeNodeIcon: function(treeNode){
            if (treeNode.iconIsClass) {
                return this.isLegacyIcon(treeNode.icon);
            }
            return false;
        },

        /** Return a list of icons, optionally filter them */
        /** It fetches them directly from the active stylesheet in the browser */
        getIcons: function(filter){

            var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
            var result = [];
            var f = filter || "";
            var c = ".icon-" + f;

            for(var x=0;x<classes.length;x++) {
                var cur = classes[x];
                if(cur.selectorText && cur.selectorText.indexOf(c) === 0 && cur.selectorText.indexOf("before") > 0 && cur.selectorText.indexOf(",") < 0) {
                    var s = cur.selectorText;
                    s = cur.selectorText.substring(1, s.indexOf(":"));
                    
                    if(result.indexOf(s) < 0){
                        result.push(s);   
                    }
                }
            }

            return result;
        },

        /** Converts the icon from legacy to a new one if an old one is detected */
        convertFromLegacyIcon: function (icon) {
            if (this.isLegacyIcon(icon)) {
                //its legacy so convert it if we can
                var found = _.find(converter, function (item) {
                    return item.oldIcon.toLowerCase() === icon.toLowerCase();
                });
                return (found ? found.newIcon : icon);
            }
            return icon;
        },

        convertFromLegacyImage: function (icon) {
                var found = _.find(imageConverter, function (item) {
                    return item.oldImage.toLowerCase() === icon.toLowerCase();
                });
                return (found ? found.newIcon : undefined);
        },

        /** If we detect that the tree node has legacy icons that can be converted, this will convert them */
        convertFromLegacyTreeNodeIcon: function (treeNode) {
            if (this.isLegacyTreeNodeIcon(treeNode)) {
                return this.convertFromLegacyIcon(treeNode.icon);
            }
            return treeNode.icon;
        }
    };
}
angular.module('umbraco.services').factory('iconHelper', iconHelper);




/**
 * @ngdoc service
 * @name umbraco.services.xmlhelper
 * @function
 *
 * @description
 * Used to convert legacy xml data to json and back again
 */
function xmlhelper($http) {
    /*
     Copyright 2011 Abdulla Abdurakhmanov
     Original sources are available at https://code.google.com/p/x2js/

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
     */

    function X2JS() {
            var VERSION = "1.0.11";
            var escapeMode = false;

            var DOMNodeTypes = {
                    ELEMENT_NODE       : 1,
                    TEXT_NODE          : 3,
                    CDATA_SECTION_NODE : 4,
                    DOCUMENT_NODE      : 9
            };
            
            function getNodeLocalName( node ) {
                    var nodeLocalName = node.localName;                     
                    if(nodeLocalName == null){
                        nodeLocalName = node.baseName;
                    } // Yeah, this is IE!! 
                            
                    if(nodeLocalName === null || nodeLocalName===""){
                        nodeLocalName = node.nodeName;
                    } // =="" is IE too
                            
                    return nodeLocalName;
            }
            
            function getNodePrefix(node) {
                    return node.prefix;
            }
                    
            function escapeXmlChars(str) {
                    if(typeof(str) === "string"){
                            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
                    }else{
                        return str;
                    }
            }

            function unescapeXmlChars(str) {
                    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '\/');
            }      

            function parseDOMChildren( node ) {
                    var result,child, childName;

                    if(node.nodeType === DOMNodeTypes.DOCUMENT_NODE) {
                            result = {};
                            child = node.firstChild;
                            childName = getNodeLocalName(child);
                            result[childName] = parseDOMChildren(child);
                            return result;
                    }
                    else{

                    if(node.nodeType === DOMNodeTypes.ELEMENT_NODE) {
                            result = {};
                            result.__cnt=0;
                            var nodeChildren = node.childNodes;
                            
                            // Children nodes
                            for(var cidx=0; cidx <nodeChildren.length; cidx++) {
                                    child = nodeChildren.item(cidx); // nodeChildren[cidx];
                                    childName = getNodeLocalName(child);
                                    
                                    result.__cnt++;
                                    if(result[childName] === null) {
                                            result[childName] = parseDOMChildren(child);
                                            result[childName+"_asArray"] = new Array(1);
                                            result[childName+"_asArray"][0] = result[childName];
                                    }
                                    else {
                                            if(result[childName] !== null) {
                                                    if( !(result[childName] instanceof Array)) {
                                                            var tmpObj = result[childName];
                                                            result[childName] = [];
                                                            result[childName][0] = tmpObj;
                                                            
                                                            result[childName+"_asArray"] = result[childName];
                                                    }
                                            }
                                            var aridx = 0;
                                            while(result[childName][aridx]!==null){
                                                aridx++;
                                            } 

                                            (result[childName])[aridx] = parseDOMChildren(child);
                                    }                       
                            }
                            
                            // Attributes
                            for(var aidx=0; aidx <node.attributes.length; aidx++) {
                                    var attr = node.attributes.item(aidx); // [aidx];
                                    result.__cnt++;
                                    result["_"+attr.name]=attr.value;
                            }
                            
                            // Node namespace prefix
                            var nodePrefix = getNodePrefix(node);
                            if(nodePrefix!==null && nodePrefix!=="") {
                                    result.__cnt++;
                                    result.__prefix=nodePrefix;
                            }
                            
                            if( result.__cnt === 1 && result["#text"]!==null  ) {
                                    result = result["#text"];
                            }
                            
                            if(result["#text"]!==null) {
                                    result.__text = result["#text"];
                                    if(escapeMode){
                                        result.__text = unescapeXmlChars(result.__text);
                                    }
                                            
                                    delete result["#text"];
                                    delete result["#text_asArray"];
                            }
                            if(result["#cdata-section"]!=null) {
                                    result.__cdata = result["#cdata-section"];
                                    delete result["#cdata-section"];
                                    delete result["#cdata-section_asArray"];
                            }
                            
                            if(result.__text!=null || result.__cdata!=null) {
                                    result.toString = function() {
                                            return (this.__text!=null? this.__text:'')+( this.__cdata!=null ? this.__cdata:'');
                                    };
                            }
                            return result;
                    }
                    else{
                        if(node.nodeType === DOMNodeTypes.TEXT_NODE || node.nodeType === DOMNodeTypes.CDATA_SECTION_NODE) {
                                return node.nodeValue;
                        } 
                    }
                }     
            }
            
            function startTag(jsonObj, element, attrList, closed) {
                    var resultStr = "<"+ ( (jsonObj!=null && jsonObj.__prefix!=null)? (jsonObj.__prefix+":"):"") + element;
                    if(attrList!=null) {
                            for(var aidx = 0; aidx < attrList.length; aidx++) {
                                    var attrName = attrList[aidx];
                                    var attrVal = jsonObj[attrName];
                                    resultStr+=" "+attrName.substr(1)+"='"+attrVal+"'";
                            }
                    }
                    if(!closed){
                        resultStr+=">";
                    }else{
                        resultStr+="/>";
                    }
                            
                    return resultStr;
            }
            
            function endTag(jsonObj,elementName) {
                    return "</"+ (jsonObj.__prefix!==null? (jsonObj.__prefix+":"):"")+elementName+">";
            }
            
            function endsWith(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            
            function jsonXmlSpecialElem ( jsonObj, jsonObjField ) {
                    if(endsWith(jsonObjField.toString(),("_asArray")) || jsonObjField.toString().indexOf("_")===0 || (jsonObj[jsonObjField] instanceof Function) ){
                        return true;
                    }else{
                        return false;
                    }
            }
            
            function jsonXmlElemCount ( jsonObj ) {
                    var elementsCnt = 0;
                    if(jsonObj instanceof Object ) {
                            for( var it in jsonObj  ) {
                                    if(jsonXmlSpecialElem ( jsonObj, it) ){
                                        continue;
                                    }                            
                                    elementsCnt++;
                            }
                    }
                    return elementsCnt;
            }
            
            function parseJSONAttributes ( jsonObj ) {
                    var attrList = [];
                    if(jsonObj instanceof Object ) {
                            for( var ait in jsonObj  ) {
                                    if(ait.toString().indexOf("__")=== -1 && ait.toString().indexOf("_")===0) {
                                            attrList.push(ait);
                                    }
                            }
                    }

                    return attrList;
            }
            
            function parseJSONTextAttrs ( jsonTxtObj ) {
                    var result ="";
                    
                    if(jsonTxtObj.__cdata!=null) {                                                                          
                            result+="<![CDATA["+jsonTxtObj.__cdata+"]]>";                                   
                    }
                    
                    if(jsonTxtObj.__text!=null) {                   
                            if(escapeMode){
                               result+=escapeXmlChars(jsonTxtObj.__text);     
                            }else{
                                result+=jsonTxtObj.__text;
                            } 
                    }
                    return result;
            }
            
            function parseJSONTextObject ( jsonTxtObj ) {
                    var result ="";

                    if( jsonTxtObj instanceof Object ) {
                            result+=parseJSONTextAttrs ( jsonTxtObj );
                    }
                    else{
                        if(jsonTxtObj!=null) {
                                if(escapeMode){
                                   result+=escapeXmlChars(jsonTxtObj);     
                                }else{
                                    result+=jsonTxtObj;
                                }
                        }
                    }
                            
                    
                    return result;
            }
            
            function parseJSONArray ( jsonArrRoot, jsonArrObj, attrList ) {
                    var result = ""; 
                    if(jsonArrRoot.length === 0) {
                            result+=startTag(jsonArrRoot, jsonArrObj, attrList, true);
                    }
                    else {
                            for(var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
                                    result+=startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
                                    result+=parseJSONObject(jsonArrRoot[arIdx]);
                                    result+=endTag(jsonArrRoot[arIdx],jsonArrObj);                                          
                            }
                    }
                    return result;
            }
            
            function parseJSONObject ( jsonObj ) {
                    var result = "";        

                    var elementsCnt = jsonXmlElemCount ( jsonObj );
                    
                    if(elementsCnt > 0) {
                            for( var it in jsonObj ) {
                                if(jsonXmlSpecialElem ( jsonObj, it) ){
                                    continue;
                                }                            
                                
                                var subObj = jsonObj[it];                                               
                                var attrList = parseJSONAttributes( subObj );
                                
                                if(subObj === null || subObj === undefined) {
                                        result+=startTag(subObj, it, attrList, true);
                                }else{
                                    if(subObj instanceof Object) {
                                            
                                            if(subObj instanceof Array) {                                   
                                                    result+=parseJSONArray( subObj, it, attrList );
                                            }else {
                                                    var subObjElementsCnt = jsonXmlElemCount ( subObj );
                                                    if(subObjElementsCnt > 0 || subObj.__text!==null || subObj.__cdata!==null) {
                                                            result+=startTag(subObj, it, attrList, false);
                                                            result+=parseJSONObject(subObj);
                                                            result+=endTag(subObj,it);
                                                    }else{
                                                            result+=startTag(subObj, it, attrList, true);
                                                    }
                                            }

                                    }else {
                                            result+=startTag(subObj, it, attrList, false);
                                            result+=parseJSONTextObject(subObj);
                                            result+=endTag(subObj,it);
                                    }
                                }
                            }
                    }
                    result+=parseJSONTextObject(jsonObj);
                    
                    return result;
            }
            
            this.parseXmlString = function(xmlDocStr) {
                    var xmlDoc;
                    if (window.DOMParser) {
                            var parser=new window.DOMParser();
                            xmlDoc = parser.parseFromString( xmlDocStr, "text/xml" );
                    }
                    else {
                            // IE :(
                            if(xmlDocStr.indexOf("<?")===0) {
                                    xmlDocStr = xmlDocStr.substr( xmlDocStr.indexOf("?>") + 2 );
                            }
                            xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
                            xmlDoc.async="false";
                            xmlDoc.loadXML(xmlDocStr);
                    }
                    return xmlDoc;
            };

            this.xml2json = function (xmlDoc) {
                    return parseDOMChildren ( xmlDoc );
            };
            
            this.xml_str2json = function (xmlDocStr) {
                    var xmlDoc = this.parseXmlString(xmlDocStr);    
                    return this.xml2json(xmlDoc);
            };

            this.json2xml_str = function (jsonObj) {
                    return parseJSONObject ( jsonObj );
            };

            this.json2xml = function (jsonObj) {
                    var xmlDocStr = this.json2xml_str (jsonObj);
                    return this.parseXmlString(xmlDocStr);
            };

            this.getVersion = function () {
                    return VERSION;
            };

            this.escapeMode = function(enabled) {
                    escapeMode = enabled;
            };
    }

    var x2js = new X2JS();
    return {
        /** Called to load in the legacy tree js which is required on startup if a user is logged in or 
         after login, but cannot be called until they are authenticated which is why it needs to be lazy loaded. */
        toJson: function(xml) {
            var json = x2js.xml_str2json( xml );
            return json;
        },
        fromJson: function(json) {
            var xml = x2js.json2xml_str( json );
            return xml;
        },
        parseFeed: function (url) {             
            return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));         
        }
    };
}
angular.module('umbraco.services').factory('xmlhelper', xmlhelper);


})();