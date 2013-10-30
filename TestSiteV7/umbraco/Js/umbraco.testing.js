/*! umbraco - v0.0.1-TechnicalPReview - 2013-10-11
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

angular.module("umbraco.mocks", ['ngCookies']);
angular.module('umbraco.mocks').
    factory('mocksUtils', ['$cookieStore', function($cookieStore) {
        'use strict';
         
        //by default we will perform authorization
        var doAuth = true;

        return {
            
            getMockDataType: function(id, selectedId) {
                var dataType = {
                    id: id,
                    name: "Simple editor " + id,
                    selectedEditor: selectedId,
                    availableEditors: [
                        { name: "Simple editor 1", editorId: String.CreateGuid() },
                        { name: "Simple editor 2", editorId: String.CreateGuid() },
                        { name: "Simple editor " + id, editorId: selectedId },
                        { name: "Simple editor 4", editorId: String.CreateGuid() },
                        { name: "Simple editor 5", editorId: String.CreateGuid() },
                        { name: "Simple editor 6", editorId: String.CreateGuid() }
                    ],
                    preValues: [
                          {
                              label: "Custom pre value 1 for editor " + selectedId,
                              description: "Enter a value for this pre-value",
                              key: "myPreVal1",
                              view: "requiredfield"                              
                          },
                            {
                                label: "Custom pre value 2 for editor " + selectedId,
                                description: "Enter a value for this pre-value",
                                key: "myPreVal2",
                                view: "requiredfield"                                
                            }
                    ]

                };
                return dataType;
            },

            /** Creats a mock content object */
            getMockContent: function(id) {
                var node = {
                    name: "My content with id: " + id,
                    updateDate: new Date().toIsoDateTimeString(),
                    publishDate: new Date().toIsoDateTimeString(),
                    createDate: new Date().toIsoDateTimeString(),
                    id: id,
                    parentId: 1234,
                    icon: "icon-umb-content",
                    owner: { name: "Administrator", id: 0 },
                    updater: { name: "Per Ploug Krogslund", id: 1 },
                    path: "-1,1234,2455",
                    
                    tabs: [
                    {
                        label: "Child documents",
                        id: 1, 
                        active: true,
                        properties: [                            
                            { alias: "list", label: "List", view: "listview", value: "", hideLabel: true },
                            { alias: "media", label: "Media picker", view: "mediapicker", value: "" }
                        ]
                    },
                    {
                        label: "Content",
                        id: 2,
                        properties: [
                            { alias: "valTest", label: "Validation test", view: "validationtest", value: "asdfasdf" },
                            { alias: "bodyText", label: "Body Text", description: "Here you enter the primary article contents", view: "rte", value: "<p>askjdkasj lasjd</p>" },
                            { alias: "textarea", label: "textarea", view: "textarea", value: "ajsdka sdjkds", config: { rows: 4 } },
                            { alias: "map", label: "Map", view: "googlemaps", value: "37.4419,-122.1419", config: { mapType: "ROADMAP", zoom: 4 } },
                            
                            { alias: "content", label: "Content picker", view: "contentpicker", value: "1234,23242,23232,23231" }
                        ]
                    },
                    {
                        label: "Sample Editor",
                        id: 3,
                        properties: [
                            { alias: "datepicker", label: "Datepicker", view: "datepicker", config: { pickTime: false, format: "yyyy-MM-dd" } },
                            { alias: "tags", label: "Tags", view: "tags", value: "" }
                        ]
                    },
                    {
                        label: "Grid",
                        id: 4,
                        properties: [
                        { alias: "grid", label: "Grid", view: "grid", value: "test", hideLabel: true }
                        ]
                    }, {
                        label: "Generic Properties",
                        id: 0,
                        properties: [
                            {
                                label: 'Id',
                                value: 1234,
                                view: "readonlyvalue",
                                alias: "_umb_id"
                            },
                            {
                                label: 'Created by',
                                description: 'Original author',
                                value: "Administrator",
                                view: "readonlyvalue",
                                alias: "_umb_createdby"
                            },
                            {
                                label: 'Created',
                                description: 'Date/time this document was created',
                                value: new Date().toIsoDateTimeString(),
                                view: "readonlyvalue",
                                alias: "_umb_createdate"
                            },
                            {
                                label: 'Updated',
                                description: 'Date/time this document was created',
                                value: new Date().toIsoDateTimeString(),
                                view: "readonlyvalue",
                                alias: "_umb_updatedate"
                            },                            
                            {
                                label: 'Document Type',
                                value: "Home page",
                                view: "readonlyvalue",
                                alias: "_umb_doctype" 
                            },
                            {
                                label: 'Publish at',
                                description: 'Date/time to publish this document',
                                value: new Date().toIsoDateTimeString(),
                                view: "datepicker",
                                alias: "_umb_releasedate"
                            },
                            { 
                                label: 'Unpublish at',
                                description: 'Date/time to un-publish this document',
                                value: new Date().toIsoDateTimeString(),
                                view: "datepicker",
                                alias: "_umb_expiredate"
                            },
                            {
                                label: 'Template', 
                                value: "myTemplate",
                                view: "dropdown",
                                alias: "_umb_template",
                                config: {
                                    items: {
                                        "" : "-- Choose template --",
                                        "myTemplate" : "My Templates",
                                        "home" : "Home Page",
                                        "news" : "News Page"
                                    }
                                }
                            },
                            {
                                label: 'Link to document',
                                value: ["/testing" + id, "http://localhost/testing" + id, "http://mydomain.com/testing" + id].join(),
                                view: "urllist",
                                alias: "_umb_urllist"
                            },
                            {
                                alias: "test", label: "Stuff", view: "test", value: "",
                                config: {
                                    fields: [
                                                { alias: "embedded", label: "Embbeded", view: "textstring", value: "" },
                                                { alias: "embedded2", label: "Embbeded 2", view: "contentpicker", value: "" },
                                                { alias: "embedded3", label: "Embbeded 3", view: "textarea", value: "" },
                                                { alias: "embedded4", label: "Embbeded 4", view: "datepicker", value: "" }
                                    ]
                                }
                            }
                        ]
                    }
                    ]
                };

                return node;
            },

            getMockEntity : function(id){
                return {name: "hello", id: id, icon: "icon-file"};
            },

            /** generally used for unit tests, calling this will disable the auth check and always return true */
            disableAuth: function() {
                doAuth = false;
            },

            /** generally used for unit tests, calling this will enabled the auth check */
            enabledAuth: function() {
                doAuth = true;
            }, 

            /** Checks for our mock auth cookie, if it's not there, returns false */
            checkAuth: function () {
                if (doAuth) {
                    var mockAuthCookie = $cookieStore.get("mockAuthCookie");
                    if (!mockAuthCookie) {
                        return false;
                    }
                    return true;
                }
                else {
                    return true;
                }
            },
            
            /** Creates/sets the auth cookie with a value indicating the user is now authenticated */
            setAuth: function() {
                //set the cookie for loging
                $cookieStore.put("mockAuthCookie", "Logged in!");
            },
            
            /** removes the auth cookie  */
            clearAuth: function() {
                $cookieStore.remove("mockAuthCookie");
            },

            urlRegex: function(url) {
                url = url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                return new RegExp("^" + url);
            },

            getParameterByName: function(url, name) {
                name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

                var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                    results = regex.exec(url);

                return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            },

            getParametersByName: function(url, name) {
                name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

                var regex = new RegExp(name + "=([^&#]*)", "mg"), results = [];
                var match;

                while ( ( match = regex.exec(url) ) !== null )
                {
                    results.push(decodeURIComponent(match[1].replace(/\+/g, " ")));
                }

                return results;
            }
        };
    }]);

angular.module('umbraco.mocks').
  factory('contentMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnChildren(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var pageNumber = Number(mocksUtils.getParameterByName(data, "pageNumber"));
          var filter = mocksUtils.getParameterByName(data, "filter");
          var pageSize = Number(mocksUtils.getParameterByName(data, "pageSize"));
          var parentId = Number(mocksUtils.getParameterByName(data, "id"));

          if (pageNumber === 0) {
              pageNumber = 1;
          }
          var collection = { pageSize: pageSize, totalItems: 68, totalPages: 7, pageNumber: pageNumber, filter: filter };
          collection.totalItems = 56 - (filter.length);
          if (pageSize > 0) {
              collection.totalPages = Math.round(collection.totalItems / collection.pageSize);
          }
          else {
              collection.totalPages = 1;
          }
          collection.items = [];

          if (collection.totalItems < pageSize || pageSize < 1) {
              collection.pageSize = collection.totalItems;
          } else {
              collection.pageSize = pageSize;
          }
          
          var id = 0;
          for (var i = 0; i < collection.pageSize; i++) {
              id = (parentId + i) * pageNumber;
              var cnt = mocksUtils.getMockContent(id);

              //here we fake filtering
              if (filter !== '') {
                  cnt.name = filter + cnt.name;
              }

              //set a fake sortOrder
              cnt.sortOrder = i + 1;

              collection.items.push(cnt);
          }

          return [200, collection, null];
      }

      function returnDeletedNode(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }
          
          return [200, null, null];
      }

      function returnEmptyNode(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var response = returnNodebyId(200, "", null);
          var node = response[1];
          var parentId = mocksUtils.getParameterByName(data, "parentId") || 1234;

          node.name = "";
          node.id = 0;
          node.parentId = parentId;

          $(node.tabs).each(function(i,tab){
              $(tab.properties).each(function(i, property){
                  property.value = "";
              });
          });

          return response;
      }

      function returnNodebyId(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var id = mocksUtils.getParameterByName(data, "id") || "1234";
          id = parseInt(id, 10);

          var node = mocksUtils.getMockContent(id);

          return [200, node, null];
      }
      
      function returnNodebyIds(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var ids = mocksUtils.getParameterByName(data, "ids") || [1234,23324,2323,23424];
          var nodes = [];

          $(ids).each(function(i, id){
            var _id = parseInt(id, 10);
            nodes.push(mocksUtils.getMockContent(_id)); 
          });
          
          return [200, nodes, null];
      }

      function returnSort(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }
          
          return [200, null, null];
      }
      
      function returnSave(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          return [200, null, null];
      }

      return {
          register: function () {

              $httpBackend
                  .whenPOST(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/PostSave'))
                  .respond(returnSave);

              $httpBackend
                  .whenPOST(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/PostSort'))
                  .respond(returnSort);

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/GetChildren'))
                  .respond(returnChildren);

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/GetByIds'))
                  .respond(returnNodebyIds);

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/GetById?'))
                  .respond(returnNodebyId);

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/GetEmpty'))
                  .respond(returnEmptyNode);

              $httpBackend
                  .whenDELETE(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/DeleteById'))
                  .respond(returnDeletedNode);
              
              $httpBackend
                  .whenDELETE(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/EmptyRecycleBin'))
                  .respond(returnDeletedNode);
          },

          expectGetById: function() {
              $httpBackend
                  .expectGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Content/GetById'));
          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('contentTypeMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnAllowedChildren(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var types = [
                { name: "News Article", description: "Standard news article", alias: "newsArticle", id: 1234, icon: "icon-file", thumbnail: "icon-file" },
                { name: "News Area", description: "Area to hold all news articles, there should be only one", alias: "newsArea", id: 1234, icon: "icon-suitcase", thumbnail: "icon-suitcase" },
                { name: "Employee", description: "Employee profile information page", alias: "employee", id: 1234, icon: "icon-user", thumbnail: "icon-user" }
          ];
          return [200, types, null];
      }

      return {
          register: function() {
              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/Api/'))
                  .respond(returnAllowedChildren);
                
          },
          expectAllowedChildren: function(){
            console.log("expecting get");
            $httpBackend.expectGET(mocksUtils.urlRegex('/umbraco/Api/'));
          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('dashboardMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function getDashboard(status, data, headers) {
          //check for existence of a cookie so we can do login/logout in the belle app (ignore for tests).
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }
          else {
              //TODO: return real mocked data
              return [200, [], null];
          }
      }

      return {
          register: function() {
              
              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Dashboard/GetDashboard'))
                  .respond(getDashboard);
          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('dataTypeMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnById(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var id = mocksUtils.getParameterByName(data, "id") || 1234;

          var selectedId = String.CreateGuid();

          var dataType = mocksUtils.getMockDataType(id, selectedId);
              
          return [200, dataType, null];
      }
      
      function returnEmpty(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var response = returnById(200, "", null);
          var node = response[1];

          node.name = "";
          node.selectedEditor = "";
          node.id = 0;
          node.preValues = [];

          return response;
      }
      
      function returnPreValues(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var editorId = mocksUtils.getParameterByName(data, "editorId") || "83E9AD36-51A7-4440-8C07-8A5623AC6979";

          var preValues = [
              {
                  label: "Custom pre value 1 for editor " + editorId,
                  description: "Enter a value for this pre-value",
                  key: "myPreVal",
                  view: "requiredfield",
                  validation: [
                      {
                          type: "Required"
                      }
                  ]
              },
              {
                  label: "Custom pre value 2 for editor " + editorId,
                  description: "Enter a value for this pre-value",
                  key: "myPreVal",
                  view: "requiredfield",
                  validation: [
                      {
                          type: "Required"
                      }
                  ]
              }
          ];
          return [200, preValues, null];
      }
      
      function returnSave(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var postedData = angular.fromJson(headers);

          var dataType = mocksUtils.getMockDataType(postedData.id, postedData.selectedEditor);
          dataType.notifications = [{
              header: "Saved",
              message: "Data type saved",
              type: 0
          }];

          return [200, dataType, null];
      }

      return {
          register: function() {
              
              $httpBackend
                  .whenPOST(mocksUtils.urlRegex('/umbraco/UmbracoApi/DataType/PostSave'))
                  .respond(returnSave);
              
              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/DataType/GetById'))
                  .respond(returnById);              
              
              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/DataType/GetEmpty'))
                  .respond(returnEmpty);
              
              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/DataType/GetPreValues'))
                  .respond(returnPreValues);
          },
          expectGetById: function() {
            $httpBackend
              .expectGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/DataType/GetById'));
          }
      };
  }]);

angular.module('umbraco.mocks').
  factory('entityMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnEntitybyId(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var id = mocksUtils.getParameterByName(data, "id") || "1234";
          id = parseInt(id, 10);

          var node = mocksUtils.getMockEntity(id);

          return [200, node, null];
      }
      
      function returnEntitybyIds(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var ids = mocksUtils.getParametersByName(data, "ids") || [1234,23324,2323,23424];
          var nodes = [];

          $(ids).each(function(i, id){
            var _id = parseInt(id, 10);
            nodes.push(mocksUtils.getMockEntity(_id));
          });
          
          return [200, nodes, null];
      }


      return {
          register: function () {

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Entity/GetByIds'))
                  .respond(returnEntitybyIds);

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Entity/GetById?'))
                  .respond(returnEntitybyId);   
          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('macroMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnParameters(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var nodes = [{
              alias: "parameter1",
              name: "Parameter 1"              
          }, {
              alias: "parameter2",
              name: "Parameter 2"
          }];
          
          return [200, nodes, null];
      }


      return {
          register: function () {

              $httpBackend
                  .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Macro/GetMacroParameters'))
                  .respond(returnParameters);

          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('mediaMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function returnNodeCollection(status, data, headers){
        var nodes = [{"properties":[{"id":348,"value":"/media/1045/windows95.jpg","alias":"umbracoFile"},{"id":349,"value":"640","alias":"umbracoWidth"},{"id":350,"value":"472","alias":"umbracoHeight"},{"id":351,"value":"53472","alias":"umbracoBytes"},{"id":352,"value":"jpg","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:08","createDate":"2013-08-27 15:50:08","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":0,"name":"windows95.jpg","id":1128,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":353,"value":"/media/1046/pete.png","alias":"umbracoFile"},{"id":354,"value":"240","alias":"umbracoWidth"},{"id":355,"value":"240","alias":"umbracoHeight"},{"id":356,"value":"87408","alias":"umbracoBytes"},{"id":357,"value":"png","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:08","createDate":"2013-08-27 15:50:08","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":1,"name":"pete.png","id":1129,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":358,"value":"/media/1047/unicorn.jpg","alias":"umbracoFile"},{"id":359,"value":"640","alias":"umbracoWidth"},{"id":360,"value":"640","alias":"umbracoHeight"},{"id":361,"value":"577380","alias":"umbracoBytes"},{"id":362,"value":"jpg","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:09","createDate":"2013-08-27 15:50:09","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":2,"name":"unicorn.jpg","id":1130,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":363,"value":"/media/1049/exploding-head.gif","alias":"umbracoFile"},{"id":364,"value":"500","alias":"umbracoWidth"},{"id":365,"value":"279","alias":"umbracoHeight"},{"id":366,"value":"451237","alias":"umbracoBytes"},{"id":367,"value":"gif","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:09","createDate":"2013-08-27 15:50:09","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":3,"name":"exploding head.gif","id":1131,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":368,"value":"/media/1048/bighead.jpg","alias":"umbracoFile"},{"id":369,"value":"1240","alias":"umbracoWidth"},{"id":370,"value":"1655","alias":"umbracoHeight"},{"id":371,"value":"836261","alias":"umbracoBytes"},{"id":372,"value":"jpg","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:09","createDate":"2013-08-27 15:50:09","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":4,"name":"bighead.jpg","id":1132,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":373,"value":"/media/1050/powerlines.jpg","alias":"umbracoFile"},{"id":374,"value":"636","alias":"umbracoWidth"},{"id":375,"value":"423","alias":"umbracoHeight"},{"id":376,"value":"79874","alias":"umbracoBytes"},{"id":377,"value":"jpg","alias":"umbracoExtension"}],"updateDate":"2013-08-27 15:50:09","createDate":"2013-08-27 15:50:09","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Image","sortOrder":5,"name":"powerlines.jpg","id":1133,"icon":"mediaPhoto.gif","parentId":1127},{"properties":[{"id":430,"value":"","alias":"contents"}],"updateDate":"2013-08-30 08:53:22","createDate":"2013-08-30 08:53:22","owner":{"id":0,"name":"admin"},"updator":null,"contentTypeAlias":"Folder","sortOrder":6,"name":"new folder","id":1146,"icon":"folder.gif","parentId":1127}];
        return [200, nodes, null];
      }

      function returnNodebyId(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var id = mocksUtils.getParameterByName(data, "id") || 1234;
          
          var node = {
              name: "My content with id: " + id,
              updateDate: new Date(),
              publishDate: new Date(),
              id: id,
              parentId: 1234,
              icon: "icon-file-alt",
              owner: {name: "Administrator", id: 0},
              updater: {name: "Per Ploug Krogslund", id: 1},

              tabs: [
              {
                  label: "Child documents",
                  alias: "tab00",
                  id: 0,
                  active: true,
                  properties: [
                  { alias: "list", label: "List", view: "listview", value: "", hideLabel: true }
                  ]
              },
              {
                  label: "Content",
                  alias: "tab01",
                  id: 1,
                  properties: [
                      { alias: "bodyText", label: "Body Text", description:"Here you enter the primary article contents", view: "rte", value: "<p>askjdkasj lasjd</p>" },
                      { alias: "textarea", label: "textarea", view: "textarea", value: "ajsdka sdjkds", config: { rows: 4 } },
                      { alias: "map", label: "Map", view: "googlemaps", value: "37.4419,-122.1419", config: { mapType: "ROADMAP", zoom: 4 } },
                      { alias: "media", label: "Media picker", view: "mediapicker", value: "" },
                      { alias: "content", label: "Content picker", view: "contentpicker", value: "" }
                  ]
              },
              {
                  label: "Sample Editor",
                  alias: "tab02",
                  id: 2,
                  properties: [
                      { alias: "datepicker", label: "Datepicker", view: "datepicker", config: { rows: 7 } },
                      { alias: "tags", label: "Tags", view: "tags", value: ""}
                  ]
              },
              {
                  label: "Grid",
                  alias: "tab03",
                  id: 3,
                  properties: [
                  { alias: "grid", label: "Grid", view: "grid", value: "test", hideLabel: true }
                  ]
              },{
                  label: "WIP",
                  alias: "tab04",
                  id: 4,
                  properties: [
                      { alias: "tes", label: "Stuff", view: "test", value: "",
                            
                          config: {
                              fields: [
                                          { alias: "embedded", label: "Embbeded", view: "textstring", value: ""},
                                          { alias: "embedded2", label: "Embbeded 2", view: "contentpicker", value: ""},
                                          { alias: "embedded3", label: "Embbeded 3", view: "textarea", value: ""},
                                          { alias: "embedded4", label: "Embbeded 4", view: "datepicker", value: ""}
                              ] 
                          }
                      }
                  ]
              }
              ]
          };
          return [200, node, null];
      }
      


      return {
          register: function() {
            $httpBackend
	            .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Media/GetById'))
		          .respond(returnNodebyId);

            $httpBackend
              .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Media/GetChildren'))
              .respond(returnNodeCollection);

          },
          expectGetById: function() {
            $httpBackend
              .expectGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Media/GetById'));
          }
      };
  }]);

/**
* @ngdoc service
* @name umbraco.mocks.sectionMocks
* @description 
* Mocks data retrival for the sections
**/
function sectionMocks($httpBackend, mocksUtils) {

    /** internal method to mock the sections to be returned */
    function getSections() {
        
        if (!mocksUtils.checkAuth()) {
            return [401, null, null];
        }

        var sections = [
            { name: "Content", cssclass: "icon-umb-content", alias: "content" },
            { name: "Media", cssclass: "icon-umb-media", alias: "media" },
            { name: "Settings", cssclass: "icon-umb-settings", alias: "settings" },
            { name: "Developer", cssclass: "icon-umb-developer", alias: "developer" },
            { name: "Users", cssclass: "icon-umb-users", alias: "users" },
            { name: "Developer", cssclass: "icon-umb-developer", alias: "developer" },
            { name: "Users", cssclass: "icon-umb-users", alias: "users" }
        ];
        
        return [200, sections, null];
    }
    
    return {
        register: function () {
            $httpBackend
              .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoApi/Section/GetSections'))
              .respond(getSections);
        }
    };
}

angular.module('umbraco.mocks').factory('sectionMocks', ['$httpBackend', 'mocksUtils', sectionMocks]);

angular.module('umbraco.mocks').
  factory('treeMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      function getMenuItems() {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var menu = [
              { name: "Create", cssclass: "plus", alias: "create", metaData: {} },

              { seperator: true, name: "Delete", cssclass: "remove", alias: "delete", metaData: {} },
              { name: "Move", cssclass: "move", alias: "move", metaData: {} },
              { name: "Copy", cssclass: "copy", alias: "copy", metaData: {} },
              { name: "Sort", cssclass: "sort", alias: "sort", metaData: {} },

              { seperator: true, name: "Publish", cssclass: "globe", alias: "publish", metaData: {} },
              { name: "Rollback", cssclass: "undo", alias: "rollback", metaData: {} },

              { seperator: true, name: "Permissions", cssclass: "lock", alias: "permissions", metaData: {} },
              { name: "Audit Trail", cssclass: "time", alias: "audittrail", metaData: {} },
              { name: "Notifications", cssclass: "envelope", alias: "notifications", metaData: {} },

              { seperator: true, name: "Hostnames", cssclass: "home", alias: "hostnames", metaData: {} },
              { name: "Public Access", cssclass: "group", alias: "publicaccess", metaData: {} },

              { seperator: true, name: "Reload", cssclass: "refresh", alias: "users", metaData: {} },
          
                { seperator: true, name: "Empty Recycle Bin", cssclass: "trash", alias: "emptyrecyclebin", metaData: {} }
          ];

          var result = {
              menuItems: menu,
              defaultAlias: "create"
          };

          return [200, result, null];
      }

      function returnChildren(status, data, headers) {
          
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var id = mocksUtils.getParameterByName(data, "id");
          var section = mocksUtils.getParameterByName(data, "treeType");
          var level = mocksUtils.getParameterByName(data, "level")+1;

          var url = "/umbraco/UmbracoTrees/ApplicationTreeApi/GetChildren?treeType=" + section + "&id=1234&level=" + level;
          var menuUrl = "/umbraco/UmbracoTrees/ApplicationTreeApi/GetMenu?treeType=" + section + "&id=1234&parentId=456";
          
          //hack to have create as default content action
          var action;
          if (section === "content") {
              action = "create";
          }

          var children = [
              { name: "child-of-" + section, childNodesUrl: url, id: level + "" + 1234, icon: "icon-document", children: [], expanded: false, hasChildren: true, level: level, menuUrl: menuUrl },
              { name: "random-name-" + section, childNodesUrl: url, id: level + "" + 1235, icon: "icon-document", children: [], expanded: false, hasChildren: true, level: level, menuUrl: menuUrl },
              { name: "random-name-" + section, childNodesUrl: url, id: level + "" + 1236, icon: "icon-document", children: [], expanded: false, hasChildren: true, level: level, menuUrl: menuUrl },
              { name: "random-name-" + section, childNodesUrl: url, id: level + "" + 1237, icon: "icon-document", routePath: "common/legacy/1237?p=" + encodeURI("developer/contentType.aspx?idequal1234"), children: [], expanded: false, hasChildren: true, level: level, menuUrl: menuUrl }
          ];

          return [200, children, null];
      }

      function returnDataTypes(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }
          
          var children = [
              { name: "Textstring", childNodesUrl: null, id: 10, icon: "icon-document", children: [], expanded: false, hasChildren: false, level: 1,  menuUrl: null },
              { name: "Multiple textstring", childNodesUrl: null, id: 11, icon: "icon-document", children: [], expanded: false, hasChildren: false, level: 1,  menuUrl: null },
              { name: "Yes/No", childNodesUrl: null, id: 12, icon: "icon-document", children: [], expanded: false, hasChildren: false, level: 1,  menuUrl: null },
              { name: "Rich Text Editor", childNodesUrl: null, id: 13, icon: "icon-document", children: [], expanded: false, hasChildren: false, level: 1,  menuUrl: null }
          ];
          
          return [200, children, null];
      }
      
      function returnDataTypeMenu(status, data, headers) {
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var menu = [
              {
                   name: "Create", cssclass: "plus", alias: "create", metaData: {
                       jsAction: "umbracoMenuActions.CreateChildEntity"
                   }
              },              
              { seperator: true, name: "Reload", cssclass: "refresh", alias: "users", metaData: {} }
          ];

          return [200, menu, null];
      }

      function returnApplicationTrees(status, data, headers) {

          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }

          var section = mocksUtils.getParameterByName(data, "application");
          var url = "/umbraco/UmbracoTrees/ApplicationTreeApi/GetChildren?treeType=" + section + "&id=1234&level=1";
          var menuUrl = "/umbraco/UmbracoTrees/ApplicationTreeApi/GetMenu?treeType=" + section + "&id=1234&parentId=456";
          var t;
          switch (section) {

              case "content":
                  t = {
                      name: "content",
                      id: -1,
                      children: [
                          { name: "My website", id: 1234, childNodesUrl: url, icon: "icon-home", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "Components", id: 1235, childNodesUrl: url, icon: "icon-document", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "Archieve", id: 1236, childNodesUrl: url, icon: "icon-document", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "Recycle Bin", id: -20, childNodesUrl: url, icon: "icon-trash", routePath: section + "/recyclebin", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl }
                      ],
                      expanded: true,
                      hasChildren: true,
                      level: 0,
                      menuUrl: menuUrl,
                      metaData: { treeAlias: "content" }
                  };

                  break;
              case "media":
                  t = {
                      name: "media",
                      id: -1,
                      children: [
                          { name: "random-name-" + section, childNodesUrl: url, id: 1234, icon: "icon-home", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1235, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1236, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1237, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl }
                      ],
                      expanded: true,
                      hasChildren: true,
                      level: 0,
                      menuUrl: menuUrl,
                      metaData: { treeAlias: "media" }
                  };

                  break;
              case "developer":                  

                  var dataTypeChildrenUrl = "/umbraco/UmbracoTrees/DataTypeTree/GetNodes?id=-1&application=developer";
                  var dataTypeMenuUrl = "/umbraco/UmbracoTrees/DataTypeTree/GetMenu?id=-1&application=developer";

                  t = {
                      name: "developer",
                      id: -1,
                      children: [
                          { name: "Data types", childNodesUrl: dataTypeChildrenUrl, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: dataTypeMenuUrl, metaData: { treeAlias: "datatype" } },
                          { name: "Macros", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "macros" } },
                          { name: "Packages", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "packager" } },
                          { name: "XSLT Files", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "xslt" } },
                          { name: "Partial View Macros", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "partialViewMacros" } }
                      ],
                      expanded: true,
                      hasChildren: true,
                      level: 0,
                      isContainer: true
                  };

                  break;
              case "settings":
                  t = {
                      name: "settings",
                      id: -1,
                      children: [
                          { name: "Stylesheets", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "stylesheets" } },
                          { name: "Templates", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "templates" } },
                          { name: "Dictionary", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "dictionary" } },
                          { name: "Media types", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "mediaTypes" } },
                          { name: "Document types", childNodesUrl: url, id: -1, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl, metaData: { treeAlias: "nodeTypes" } }
                      ],
                      expanded: true,
                      hasChildren: true,
                      level: 0,
                      isContainer: true
                  };
                  
                  break;
              default:
                  
                  t = {
                      name: "randomTree",
                      id: -1,
                      children: [
                          { name: "random-name-" + section, childNodesUrl: url, id: 1234, icon: "icon-home", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1235, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1236, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl },
                          { name: "random-name-" + section, childNodesUrl: url, id: 1237, icon: "icon-folder-close", children: [], expanded: false, hasChildren: true, level: 1, menuUrl: menuUrl }
                      ],
                      expanded: true,
                      hasChildren: true,
                      level: 0,
                      menuUrl: menuUrl,
                      metaData: { treeAlias: "randomTree" }
                  };

                  break;
          }

      
          return [200, t, null];
      }


      return {
          register: function() {
              
              $httpBackend
                 .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoTrees/ApplicationTreeApi/GetApplicationTrees'))
                 .respond(returnApplicationTrees);

              $httpBackend
                 .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoTrees/ApplicationTreeApi/GetChildren'))
                 .respond(returnChildren);
              

              $httpBackend
                 .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoTrees/DataTypeTree/GetNodes'))
                 .respond(returnDataTypes);
              
              $httpBackend
                 .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoTrees/DataTypeTree/GetMenu'))
                 .respond(returnDataTypeMenu);
              
              $httpBackend
                 .whenGET(mocksUtils.urlRegex('/umbraco/UmbracoTrees/ApplicationTreeApi/GetMenu'))
                 .respond(getMenuItems);
              
          }
      };
  }]);
angular.module('umbraco.mocks').
  factory('userMocks', ['$httpBackend', 'mocksUtils', function ($httpBackend, mocksUtils) {
      'use strict';
      
      var mocked = {
          name: "Per Ploug",
          email: "test@test.com",
          emailHash: "f9879d71855b5ff21e4963273a886bfc",
          id: 0,
          locale: 'da-DK'
      };

      function getCurrentUser(status, data, headers) {
          //check for existence of a cookie so we can do login/logout in the belle app (ignore for tests).
          if (!mocksUtils.checkAuth()) {
              return [401, null, null];
          }
          else {
              return [200, mocked, null];
          }
      }

      function returnUser(status, data, headers) {

          //set the cookie for loging
          mocksUtils.setAuth();

          return [200, mocked, null];
      }
      
      function logout() {
          
          mocksUtils.clearAuth();

          return [200, null, null];

      }

      return {
          register: function() {
              
              $httpBackend
                  .whenPOST(mocksUtils.urlRegex('/umbraco/UmbracoApi/Authentication/PostLogin'))
                  .respond(returnUser);
              
              $httpBackend
                  .whenPOST(mocksUtils.urlRegex('/umbraco/UmbracoApi/Authentication/PostLogout'))
                  .respond(logout);


              $httpBackend
                  .whenGET('/umbraco/UmbracoApi/Authentication/GetCurrentUser')
                  .respond(getCurrentUser);

                
          }
      };
  }]);

})();