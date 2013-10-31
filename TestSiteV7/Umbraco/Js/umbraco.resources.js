/*! umbraco - v0.0.1-TechnicalPReview - 2013-09-17
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

angular.module("umbraco.resources", []);
/**
    * @ngdoc service
    * @name umbraco.resources.authResource
    * @description Loads in data for authentication
**/
function authResource($q, $http, umbRequestHelper, angularHelper) {

    return {
        //currentUser: currentUser,

        /** Logs the user in if the credentials are good */
        performLogin: function (username, password) {
            
            if (!username || !password) {
                return angularHelper.rejectedPromise({
                    errorMsg: 'Username or password cannot be empty'
                });
            }

            return umbRequestHelper.resourcePromise(
                $http.post(
                    umbRequestHelper.getApiUrl(
                        "authenticationApiBaseUrl",
                        "PostLogin",
                        [{ username: username }, { password: password }])),
                'Login failed for user ' + username);
        },
        
        performLogout: function() {
            return umbRequestHelper.resourcePromise(
                $http.post(
                    umbRequestHelper.getApiUrl(
                        "authenticationApiBaseUrl",
                        "PostLogout")));
        },
        
        /** Sends a request to the server to check if the current cookie value is valid for the user */
        isAuthenticated: function () {
            
            return umbRequestHelper.resourcePromise(
                $http.get(
                    umbRequestHelper.getApiUrl(
                        "authenticationApiBaseUrl",
                        "GetCurrentUser")),
                'Server call failed for checking authorization'); 
        }
    };
}

angular.module('umbraco.resources').factory('authResource', authResource);

/**
  * @ngdoc service
  * @name umbraco.resources.contentResource
  * @description Handles all transactions of content data
  * from the angular application to the Umbraco database, using the Content WebApi controller
  *
  * all methods returns a resource promise async, so all operations won't complete untill .then() is completed.
  *
  * @requires $q
  * @requires $http
  * @requires umbDataFormatter
  * @requires umbRequestHelper
  *
  * ##usage
  * To use, simply inject the contentResource into any controller or service that needs it, and make
  * sure the umbraco.resources module is accesible - which it should be by default.
  *
  * <pre>
  *    contentResource.getById(1234)
  *          .then(function(data) {
  *              $scope.content = data;
  *          });    
  * </pre> 
  **/

function contentResource($q, $http, umbDataFormatter, umbRequestHelper) {

    /** internal method process the saving of data and post processing the result */
    function saveContentItem(content, action, files) {
        return umbRequestHelper.postSaveContent(
            umbRequestHelper.getApiUrl(
                "contentApiBaseUrl",
                "PostSave"),
            content, action, files);
    }

    return {
        
        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#sort
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Sorts all children below a given parent node id, based on a collection of node-ids
         *
         * ##usage
         * <pre>
         * var ids = [123,34533,2334,23434];
         * contentResource.sort({ parentId: 1244, sortedIds: ids })
         *    .then(function() {
         *        $scope.complete = true;
         *    });
         * </pre> 
         * @param {Object} args arguments object
         * @param {Int} args.parentId the ID of the parent node
         * @param {Array} options.sortedIds array of node IDs as they should be sorted
         * @returns {Promise} resourcePromise object.
         *
         */
        sort: function (args) {
            if (!args) {
                throw "args cannot be null";
            }
            if (!args.parentId) {
                throw "args.parentId cannot be null";
            }
            if (!args.sortedIds) {
                throw "args.sortedIds cannot be null";
            }

            return umbRequestHelper.resourcePromise(
                $http.post(umbRequestHelper.getApiUrl("contentApiBaseUrl", "PostSort"),
                    {
                        parentId: args.parentId,
                        idSortOrder: args.sortedIds
                    }),
                'Failed to sort content');
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#emptyRecycleBin
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Empties the content recycle bin
         *
         * ##usage
         * <pre>
         * contentResource.emptyRecycleBin()
         *    .then(function() {
         *        alert('its empty!');
         *    });
         * </pre> 
         *         
         * @returns {Promise} resourcePromise object.
         *
         */
        emptyRecycleBin: function() {
            return umbRequestHelper.resourcePromise(
                $http.delete(
                    umbRequestHelper.getApiUrl(
                        "contentApiBaseUrl",
                        "EmptyRecycleBin")),
                'Failed to empty the recycle bin');
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#deleteById
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Deletes a content item with a given id
         *
         * ##usage
         * <pre>
         * contentResource.deleteById(1234)
         *    .then(function() {
         *        alert('its gone!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of content item to delete        
         * @returns {Promise} resourcePromise object.
         *
         */
        deleteById: function(id) {
            return umbRequestHelper.resourcePromise(
                $http.delete(
                    umbRequestHelper.getApiUrl(
                        "contentApiBaseUrl",
                        "DeleteById",
                        [{ id: id }])),
                'Failed to delete item ' + id);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#getById
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Gets a content item with a given id
         *
         * ##usage
         * <pre>
         * contentResource.getById(1234)
         *    .then(function(content) {
         *        var myDoc = content; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of content item to return        
         * @returns {Promise} resourcePromise object containing the content item.
         *
         */
        getById: function (id) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "contentApiBaseUrl",
                       "GetById",
                       [{ id: id }])),
               'Failed to retreive data for content id ' + id);
        },
        
        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#getByIds
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Gets an array of content items, given a collection of ids
         *
         * ##usage
         * <pre>
         * contentResource.getByIds( [1234,2526,28262])
         *    .then(function(contentArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Array} ids ids of content items to return as an array        
         * @returns {Promise} resourcePromise object containing the content items array.
         *
         */
        getByIds: function (ids) {
            
            var idQuery = "";
            _.each(ids, function(item) {
                idQuery += "ids=" + item + "&";
            });

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "contentApiBaseUrl",
                       "GetByIds",
                       idQuery)),
               'Failed to retreive data for content id ' + id);
        },

        
        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#getScaffold
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Returns a scaffold of an empty content item, given the id of the content item to place it underneath and the content type alias.
         * 
         * - Parent Id must be provided so umbraco knows where to store the content
         * - Content Type alias must be provided so umbraco knows which properties to put on the content scaffold 
         * 
         * The scaffold is used to build editors for content that has not yet been populated with data.
         * 
         * ##usage
         * <pre>
         * contentResource.getScaffold(1234, 'homepage')
         *    .then(function(scaffold) {
         *        var myDoc = scaffold;
         *        myDoc.name = "My new document"; 
         *
         *        contentResource.publish(myDoc, true)
         *            .then(function(content){
         *                alert("Retrieved, updated and published again");
         *            });
         *    });
         * </pre> 
         * 
         * @param {Int} parentId id of content item to return
         * @param {String} alias contenttype alias to base the scaffold on        
         * @returns {Promise} resourcePromise object containing the content scaffold.
         *
         */
        getScaffold: function (parentId, alias) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "contentApiBaseUrl",
                       "GetEmpty",
                       [{ contentTypeAlias: alias }, { parentId: parentId }])),
               'Failed to retreive data for empty content item type ' + alias);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#getChildren
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Gets children of a content item with a given id
         *
         * ##usage
         * <pre>
         * contentResource.getChildren(1234, {pageSize: 10, pageNumber: 2})
         *    .then(function(contentArray) {
         *        var children = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Int} parentid id of content item to return children of
         * @param {Object} options optional options object
         * @param {Int} options.pageSize if paging data, number of nodes per page, default = 0
         * @param {Int} options.pageNumber if paging data, current page index, default = 0
         * @param {String} options.filter if provided, query will only return those with names matching the filter
         * @param {String} options.orderDirection can be `Ascending` or `Descending` - Default: `Ascending`
         * @param {String} options.orderBy property to order items by, default: `SortOrder`
         * @returns {Promise} resourcePromise object containing an array of content items.
         *
         */
        getChildren: function (parentId, options) {

            var defaults = {
                pageSize: 0,
                pageNumber: 0,
                filter: '',
                orderDirection: "Ascending",
                orderBy: "SortOrder"
            };
            if (options === undefined) {
                options = {}; 
            }
            //overwrite the defaults if there are any specified
            angular.extend(defaults, options);
            //now copy back to the options we will use
            options = defaults;
            //change asc/desct
            if (options.orderDirection === "asc") {
                options.orderDirection = "Ascending";
            }
            else if (options.orderDirection === "desc") {
                options.orderDirection = "Descending";
            }

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "contentApiBaseUrl",
                       "GetChildren",
                       [
                           { id: parentId },
                           { pageNumber: options.pageNumber },
                           { pageSize: options.pageSize },
                           { orderBy: options.orderBy },
                           { orderDirection: options.orderDirection },
                           { filter: options.filter }
                       ])),
               'Failed to retreive children for content item ' + parentId);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#save
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Saves changes made to a content item to its current version, if the content item is new, the isNew paramater must be passed to force creation
         * if the content item needs to have files attached, they must be provided as the files param and passed seperately 
         * 
         * 
         * ##usage
         * <pre>
         * contentResource.getById(1234)
         *    .then(function(content) {
         *          content.name = "I want a new name!";
         *          contentResource.save(content, false)
         *            .then(function(content){
         *                alert("Retrieved, updated and saved again");
         *            });
         *    });
         * </pre> 
         * 
         * @param {Object} content The content item object with changes applied
         * @param {Bool} isNew set to true to create a new item or to update an existing 
         * @param {Array} files collection of files for the document      
         * @returns {Promise} resourcePromise object containing the saved content item.
         *
         */
        save: function (content, isNew, files) {
            return saveContentItem(content, "save" + (isNew ? "New" : ""), files);
        },


        /**
         * @ngdoc method
         * @name umbraco.resources.contentResource#publish
         * @methodOf umbraco.resources.contentResource
         *
         * @description
         * Saves and publishes changes made to a content item to a new version, if the content item is new, the isNew paramater must be passed to force creation
         * if the content item needs to have files attached, they must be provided as the files param and passed seperately 
         * 
         * 
         * ##usage
         * <pre>
         * contentResource.getById(1234)
         *    .then(function(content) {
         *          content.name = "I want a new name, and be published!";
         *          contentResource.publish(content, false)
         *            .then(function(content){
         *                alert("Retrieved, updated and published again");
         *            });
         *    });
         * </pre> 
         * 
         * @param {Object} content The content item object with changes applied
         * @param {Bool} isNew set to true to create a new item or to update an existing 
         * @param {Array} files collection of files for the document      
         * @returns {Promise} resourcePromise object containing the saved content item.
         *
         */
        publish: function (content, isNew, files) {
            return saveContentItem(content, "publish" + (isNew ? "New" : ""), files);
        }

    };
}

angular.module('umbraco.resources').factory('contentResource', contentResource);

/**
    * @ngdoc service
    * @name umbraco.resources.contentTypeResource
    * @description Loads in data for content types
    **/
function contentTypeResource($q, $http, umbRequestHelper) {

    return {

        //return a content type with a given ID
        getContentType: function (id) {

            var deferred = $q.defer();
            var data = {
                name: "News Article",
                alias: "newsArticle",
                id: id,
                tabs: []
            };
            
            deferred.resolve(data);
            return deferred.promise;
        },
        //return all available types
        all: function () {
            return [];
        },

        //return children inheriting a given type
        children: function (id) {
            return [];
        },

        //return all content types a type inherits from
        parents: function (id) {
            return [];
        },

        //return all types allowed under given document
        getAllowedTypes: function (contentId) {
           
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "contentTypeApiBaseUrl",
                       "GetAllowedChildren",
                       [{ contentId: contentId }])),
               'Failed to retreive data for content id ' + contentId);
        }

    };
}
angular.module('umbraco.resources').factory('contentTypeResource', contentTypeResource);
/**
    * @ngdoc service
    * @name umbraco.resources.dashboardResource
    * @description Handles loading the dashboard manifest
    **/
function dashboardResource($q, $http, umbRequestHelper) {
    //the factory object returned
    return {
        getDashboard: function (section) {
          
            return umbRequestHelper.resourcePromise(
                $http.get(
                    umbRequestHelper.getApiUrl(
                        "dashboardApiBaseUrl",
                        "GetDashboard",
                        [{ section: section }])),
                'Failed to get dashboard ' + section);
        }
    };
}

angular.module('umbraco.resources').factory('dashboardResource', dashboardResource);
/**
    * @ngdoc service
    * @name umbraco.resources.dataTypeResource
    * @description Loads in data for data types
    **/
function dataTypeResource($q, $http, umbDataFormatter, umbRequestHelper) {
    
    return {
        
        getPreValues: function (editorId, dataTypeId) {

            if (!dataTypeId) {
                dataTypeId = -1;
            }

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "dataTypeApiBaseUrl",
                       "GetPreValues",
                       [{ editorAlias: editorId }, { dataTypeId: dataTypeId }])),
               'Failed to retreive pre values for editor id ' + editorId);
        },

        getById: function (id) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "dataTypeApiBaseUrl",
                       "GetById",
                       [{ id: id }])),
               'Failed to retreive data for data type id ' + id);
        },

        getAll: function () {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "dataTypeApiBaseUrl",
                       "GetAll",
                       [{ id: id }])),
               'Failed to retreive data for data type id ' + id);
        },

        /** returns an empty content object which can be persistent on the content service
            requires the parent id and the alias of the content type to base the scaffold on */
        getScaffold: function (parentId, alias) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "dataTypeApiBaseUrl",
                       "GetEmpty")),
               'Failed to retreive data for empty media item type ' + alias);

        },

        /** saves or updates a data type object */
        save: function (dataType, preValues, isNew) {
            
            var saveModel = umbDataFormatter.formatDataTypePostData(dataType, preValues, "save" + (isNew ? "New" : ""));

            return umbRequestHelper.resourcePromise(
                 $http.post(umbRequestHelper.getApiUrl("dataTypeApiBaseUrl", "PostSave"), saveModel),
                'Failed to save data for data type id ' + dataType.id);
        }
    };
}

angular.module('umbraco.resources').factory('dataTypeResource', dataTypeResource);

/**
    * @ngdoc service
    * @name umbraco.resources.entityResource
    * @description Loads in basic data for all entities
    * 
    * ##What is an entity?
    * An entity is a basic **read-only** representation of an Umbraco node. It contains only the most
    * basic properties used to display the item in trees, lists and navigation. 
    *
    * ##What is the difference between get entity and get content?
    * the entity only contains the basic node data, name, id and guid, whereas content
    * nodes fetched through the entity service also contains additional meta data such
    * as icon, document type, path and so on.
    *
    * ##Entity object types?
    * As an optional parameter, you can pass in the specific type name. So if you know you
    * are looking for a specific type, you should pass in the object name, to make lookup faster
    * and to return more data.
    * 
    * The core object types are:
    *
    * - Document
    * - Media
    * - Member
    * - Template
    * - DocumentType
    * - MediaType
    * - MemberType
    **/
function entityResource($q, $http, umbRequestHelper) {

    //the factory object returned
    return {
        
        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getEntityById
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an entity with a given id
         *
         * ##usage
         * <pre>
         * entityResource.getEntityById(1234)
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         *
         * //Only return users
         * entityResource.getEntityById(0, "User")
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of entity to return
         * @param {string} type optional Object type name        
         * @returns {Promise} resourcePromise object containing the entity.
         *
         */
        getById: function (id, type) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetById",
                       [{ id: id, type: type }])),
               'Failed to retreive entity data for id ' + id);
        },
        
        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getEntitiesByIds
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an array of entities, given a collection of ids
         *
         * ##usage
         * <pre>
         * entityResource.getEntitiesByIds( [1234,2526,28262])
         *    .then(function(contentArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * 
         * //Only return templates
         * entityResource.getEntitiesByIds( [1234,2526,28262], "Template")
         *    .then(function(templateArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Array} ids ids of entities to return as an array
         * @param {string} type optional type name        
         * @returns {Promise} resourcePromise object containing the entity array.
         *
         */
        getByIds: function (ids) {
            
            var idQuery = "";
            _.each(ids, function(item) {
                idQuery += "ids=" + item + "&";
            });

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetByIds",
                       idQuery)),
               'Failed to retreive entity data for ids ' + idQuery);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getEntityById
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an entity with a given id
         *
         * ##usage
         * <pre>
         * //returns all entities, you should NEVER do that
         * entityResource.getAll()
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         *
         * //Only return users
         * entityResource.getAll("User")
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {string} type Object type name        
         * @returns {Promise} resourcePromise object containing the entity.
         *
         */
        getAll: function (type) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetAll",
                       [{type: type }])),
               'Failed to retreive entity data for type ' + type);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getEntityById
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an entity with a given id
         *
         * ##usage
         * <pre>
         * //returns all entities, you should NEVER do that
         * entityResource.getAll()
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         *
         * //Only return users
         * entityResource.getAll("User")
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {string} type Object type name        
         * @returns {Promise} resourcePromise object containing the entity.
         *
         */
        getAncestors: function (id) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetAncestors",
                       [{id: id}])),
               'Failed to retreive entity data for id ' + id);
        },


        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getDocumentById
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets a content entity with a given id
         *
         * ##usage
         * <pre>
         * entityResource.getDocumentById(1234)
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of document to return        
         * @returns {Promise} resourcePromise object containing the document.
         *
         */
        getDocumentById: function (id) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetDocumentById",
                       [{ id: id }])),
               'Failed to retreive entity data for id ' + id);
        },
        
        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getDocumentsByIds
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an array of content entities, given a collection of ids
         *
         * ##usage
         * <pre>
         * entityResource.getDocumentsByIds( [1234,2526,28262])
         *    .then(function(contentArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Array} ids ids of entities to return as an array        
         * @returns {Promise} resourcePromise object containing the entity array.
         *
         */
        getDocumentsByIds: function (ids) {
            
            var idQuery = "";
            _.each(ids, function(item) {
                idQuery += "ids=" + item + "&";
            });

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetDocumentsByIds",
                       idQuery)),
               'Failed to retreive document data for ids ' + idQuery);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#searchDocuments
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an array of content entities, given a query
         *
         * ##usage
         * <pre>
         * entityResource.searchDocuments("news")
         *    .then(function(contentArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {String} Query search query        
         * @returns {Promise} resourcePromise object containing the entity array.
         *
         */
        searchDocuments: function (query) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "SearchDocuments",
                       query)),
               'Failed to retreive document data for query ' + query);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getMediaById
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets a media entity with a given id
         *
         * ##usage
         * <pre>
         * entityResource.getMediaById(1234)
         *    .then(function(ent) {
         *        var myDoc = ent; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of media to return        
         * @returns {Promise} resourcePromise object containing the media.
         *
         */
        getMediaById: function (id) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetMediaById",
                       [{ id: id }])),
               'Failed to retreive media data for id ' + id);
        },
        
        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#getMediaByIds
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an array of media entities, given a collection of ids
         *
         * ##usage
         * <pre>
         * entityResource.getMediaByIds( [1234,2526,28262])
         *    .then(function(mediaArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Array} ids ids of entities to return as an array        
         * @returns {Promise} resourcePromise object containing the entity array.
         *
         */
        getMediaByIds: function (ids) {
            
            var idQuery = "";
            _.each(ids, function(item) {
                idQuery += "ids=" + item + "&";
            });

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "GetMediaByIds",
                       idQuery)),
               'Failed to retreive media data for ids ' + idQuery);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.entityResource#searchMedia
         * @methodOf umbraco.resources.entityResource
         *
         * @description
         * Gets an array of medoa entities, given a query
         *
         * ##usage
         * <pre>
         * entityResource.searchMedia("news")
         *    .then(function(mediaArray) {
         *        var myDoc = mediaArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {String} Query search query        
         * @returns {Promise} resourcePromise object containing the entity array.
         *
         */
        searchMedia: function (query) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "entityApiBaseUrl",
                       "SearchMedia",
                       query)),
               'Failed to retreive media data for query ' + query);
        }
            
    };
}

angular.module('umbraco.resources').factory('entityResource', entityResource);

/**
    * @ngdoc service
    * @name umbraco.resources.legacyResource
    * @description Handles legacy dialog requests
    **/
function legacyResource($q, $http, umbRequestHelper) {
   
    //the factory object returned
    return {
        /** Loads in the data to display the section list */
        deleteItem: function (args) {
            
            if (!args.nodeId || !args.nodeType) {
                throw "The args parameter is not formatted correct, it requires properties: nodeId, nodeType";
            } 

            return umbRequestHelper.resourcePromise(
                $http.delete(
                    umbRequestHelper.getApiUrl(
                        "legacyApiBaseUrl",
                        "DeleteLegacyItem",
                        [{ nodeId: args.nodeId }, { nodeType: args.nodeType }])),
                'Failed to delete item ' + args.nodeId);

        }
    };
}

angular.module('umbraco.resources').factory('legacyResource', legacyResource);
/**
    * @ngdoc service
    * @name umbraco.resources.mediaResource
    * @description Loads in data for media
    **/
function mediaResource($q, $http, umbDataFormatter, umbRequestHelper) {
    
    /** internal method process the saving of data and post processing the result */
    function saveMediaItem(content, action, files) {
        return umbRequestHelper.postSaveContent(
            umbRequestHelper.getApiUrl(
                "mediaApiBaseUrl",
                "PostSave"),
            content, action, files);
    }

    return {
        
        /**
         * @ngdoc method
         * @name umbraco.resources.mediaResource#sort
         * @methodOf umbraco.resources.mediaResource
         *
         * @description
         * Sorts all children below a given parent node id, based on a collection of node-ids
         *
         * ##usage
         * <pre>
         * var ids = [123,34533,2334,23434];
         * mediaResource.sort({ sortedIds: ids })
         *    .then(function() {
         *        $scope.complete = true;
         *    });
         * </pre> 
         * @param {Object} args arguments object
         * @param {Int} args.parentId the ID of the parent node
         * @param {Array} options.sortedIds array of node IDs as they should be sorted
         * @returns {Promise} resourcePromise object.
         *
         */
        sort: function (args) {
            if (!args) {
                throw "args cannot be null";
            }
            if (!args.parentId) {
                throw "args.parentId cannot be null";
            }
            if (!args.sortedIds) {
                throw "args.sortedIds cannot be null";
            }

            return umbRequestHelper.resourcePromise(
                $http.post(umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostSort"),
                    {
                        parentId: args.parentId,
                        idSortOrder: args.sortedIds
                    }),
                'Failed to sort content');
        },
        /**
         * @ngdoc method
         * @name umbraco.resources.mediaResource#getById
         * @methodOf umbraco.resources.mediaResource
         *
         * @description
         * Gets a media item with a given id
         *
         * ##usage
         * <pre>
         * mediaResource.getById(1234)
         *    .then(function(media) {
         *        var myMedia = media; 
         *        alert('its here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of media item to return        
         * @returns {Promise} resourcePromise object containing the media item.
         *
         */
        getById: function (id) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "mediaApiBaseUrl",
                       "GetById",
                       [{ id: id }])),
               'Failed to retreive data for media id ' + id);
        },
        /**
         * @ngdoc method
         * @name umbraco.resources.mediaResource#getByIds
         * @methodOf umbraco.resources.mediaResource
         *
         * @description
         * Gets an array of media items, given a collection of ids
         *
         * ##usage
         * <pre>
         * mediaResource.getByIds( [1234,2526,28262])
         *    .then(function(mediaArray) {
         *        var myDoc = contentArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @param {Array} ids ids of media items to return as an array        
         * @returns {Promise} resourcePromise object containing the media items array.
         *
         */
        getByIds: function (ids) {
            
            var idQuery = "";
            _.each(ids, function(item) {
                idQuery += "ids=" + item + "&";
            });

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "mediaApiBaseUrl",
                       "GetByIds",
                       idQuery)),
               'Failed to retreive data for media id ' + id);
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.mediaResource#getScaffold
         * @methodOf umbraco.resources.mediaResource
         *
         * @description
         * Returns a scaffold of an empty media item, given the id of the media item to place it underneath and the media type alias.
         * 
         * - Parent Id must be provided so umbraco knows where to store the media
         * - Media Type alias must be provided so umbraco knows which properties to put on the media scaffold 
         * 
         * The scaffold is used to build editors for media that has not yet been populated with data.
         * 
         * ##usage
         * <pre>
         * mediaResource.getScaffold(1234, 'folder')
         *    .then(function(scaffold) {
         *        var myDoc = scaffold;
         *        myDoc.name = "My new media item"; 
         *
         *        mediaResource.save(myDoc, true)
         *            .then(function(media){
         *                alert("Retrieved, updated and saved again");
         *            });
         *    });
         * </pre> 
         * 
         * @param {Int} parentId id of media item to return
         * @param {String} alias mediatype alias to base the scaffold on        
         * @returns {Promise} resourcePromise object containing the media scaffold.
         *
         */
        getScaffold: function (parentId, alias) {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "mediaApiBaseUrl",
                       "GetEmpty",
                       [{ contentTypeAlias: alias }, { parentId: parentId }])),
               'Failed to retreive data for empty media item type ' + alias);

        },

        rootMedia: function () {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "mediaApiBaseUrl",
                       "GetRootMedia")),
               'Failed to retreive data for root media');

        },

        getChildren: function (parentId) {

            return umbRequestHelper.resourcePromise(
                $http.get(
                    umbRequestHelper.getApiUrl(
                        "mediaApiBaseUrl",
                        "GetChildren",
                        [{ parentId: parentId }])),
                'Failed to retreive data for root media');
        },
        
        /** saves or updates a media object */
        save: function (media, isNew, files) {
            return saveMediaItem(media, "save" + (isNew ? "New" : ""), files);
        },

        //** shorthand for creating a new folder under a given parent **/
        addFolder: function(name, parentId){
            return umbRequestHelper.resourcePromise(
                $http.post(umbRequestHelper
                    .getApiUrl("mediaApiBaseUrl", "PostAddFolder"),
                    {
                        name: name,
                        parentId: parentId
                    }),
                'Failed to add folder');
        }
    };
}

angular.module('umbraco.resources').factory('mediaResource', mediaResource);

/**
    * @ngdoc service
    * @name umbraco.resources.mediaTypeResource
    * @description Loads in data for media types
    **/
function mediaTypeResource($q, $http, umbRequestHelper) {

    return {

        //return all types allowed under given document
        getAllowedTypes: function (contentId) {

            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "mediaTypeApiBaseUrl",
                       "GetAllowedChildren",
                       [{ contentId: contentId }])),
               'Failed to retreive data for media id ' + contentId);
        }

    };
}
angular.module('umbraco.resources').factory('mediaTypeResource', mediaTypeResource);
/**
    * @ngdoc service
    * @name umbraco.resources.sectionResource
    * @description Loads in data for section
    **/
function sectionResource($q, $http, umbRequestHelper) {

    /** internal method to get the tree app url */
    function getSectionsUrl(section) {
        return Umbraco.Sys.ServerVariables.sectionApiBaseUrl + "GetSections";
    }
   
    //the factory object returned
    return {
        /** Loads in the data to display the section list */
        getSections: function () {
            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "sectionApiBaseUrl",
                       "GetSections")),
               'Failed to retreive data for sections');

		}
    };
}

angular.module('umbraco.resources').factory('sectionResource', sectionResource);

/**
    * @ngdoc service
    * @name umbraco.resources.treeResource
    * @description Loads in data for trees
    **/
function treeResource($q, $http, umbRequestHelper) {

    /** internal method to get the tree node's children url */
    function getTreeNodesUrl(node) {
        if (!node.childNodesUrl) {
            throw "No childNodesUrl property found on the tree node, cannot load child nodes";
        }
        return node.childNodesUrl;
    }

    /** internal method to get the tree menu url */
    function getTreeMenuUrl(node) {
        if (!node.menuUrl) {
            throw "No menuUrl property found on the tree node, cannot load menu";
        }
        return node.menuUrl;
    }

    //the factory object returned
    return {
        
        /** Loads in the data to display the nodes menu */
        loadMenu: function (node) {
              
            return umbRequestHelper.resourcePromise(
                $http.get(getTreeMenuUrl(node)),
                "Failed to retreive data for a node's menu " + node.id);
        },

        /** Loads in the data to display the nodes for an application */
        loadApplication: function (options) {

            if (!options || !options.section) {
                throw "The object specified for does not contain a 'section' property";
            }

            return umbRequestHelper.resourcePromise(
                $http.get(
                    umbRequestHelper.getApiUrl(
                        "treeApplicationApiBaseUrl",
                        "GetApplicationTrees",
                        [{ application: options.section }])),
                'Failed to retreive data for application tree ' + options.section);
        },
        
        /** Loads in the data to display the child nodes for a given node */
        loadNodes: function (options) {

            if (!options || !options.node || !options.section) {
                throw "The options parameter object does not contain the required properties: 'node' and 'section'";
            }

            return umbRequestHelper.resourcePromise(
                $http.get(getTreeNodesUrl(options.node)),
                'Failed to retreive data for child nodes ' + options.node.nodeId);
        }
    };
}

angular.module('umbraco.resources').factory('treeResource', treeResource);
/**
    * @ngdoc service
    * @name umbraco.resources.userResource
    * @description Retrives user data from the server, cannot be used for authentication, for this, use the user.service
    * 
    *
    **/
function userResource($q, $http, umbRequestHelper) {

    //the factory object returned
    return {
        
        /**
         * @ngdoc method
         * @name umbraco.resources.userResource#getById
         * @methodOf umbraco.resources.userResource
         *
         * @description
         * Gets a user with a given id
         *
         * ##usage
         * <pre>
         * userResource.getById(1234)
         *    .then(function(ent) {
         *        var myUser = ent; 
         *        alert('im here!');
         *    });
         * </pre> 
         * 
         * @param {Int} id id of user to return        
         * @returns {Promise} resourcePromise object containing the user.
         *
         */
        getById: function (id) {            
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "userApiBaseUrl",
                       "GetById",
                       [{ id: id }])),
               'Failed to retreive user data for id ' + id);
        },
        
        /**
         * @ngdoc method
         * @name umbraco.resources.userResource#getAll
         * @methodOf umbraco.resources.userResource
         *
         * @description
         * Gets all users available on the system
         *
         * ##usage
         * <pre>
         * contentResource.getAll()
         *    .then(function(userArray) {
         *        var myUsers = userArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @returns {Promise} resourcePromise object containing the user array.
         *
         */
        getAll: function () {
            return umbRequestHelper.resourcePromise(
               $http.get(
                   umbRequestHelper.getApiUrl(
                       "userApiBaseUrl",
                       "GetAll")),
               'Failed to retreive all users');
        },

        /**
         * @ngdoc method
         * @name umbraco.resources.userResource#changePassword
         * @methodOf umbraco.resources.userResource
         *
         * @description
         * Changes the current users password
         *
         * ##usage
         * <pre>
         * contentResource.getAll()
         *    .then(function(userArray) {
         *        var myUsers = userArray; 
         *        alert('they are here!');
         *    });
         * </pre> 
         * 
         * @returns {Promise} resourcePromise object containing the user array.
         *
         */
        changePassword: function (oldPassword, newPassword) {
            return umbRequestHelper.resourcePromise(
               $http.post(
                   umbRequestHelper.getApiUrl(
                       "userApiBaseUrl",
                       "PostChangePassword"),
                       { oldPassword: oldPassword, newPassword: newPassword }),
               'Failed to change password');
        }
    };
}

angular.module('umbraco.resources').factory('userResource', userResource);


})();