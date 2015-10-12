function pageNotFoundManagerResource($http) {

    var apiRoot = "backoffice/PageNotFoundManager/Dashboard/";

    return {

        getNotFoundPage: function (pageId) {
            return $http.get(apiRoot + "GetNotFoundPage?pageId="+pageId);
        },

        setNotFoundPage: function (parentId, notFoundPageId) {
            var pnf = {};
            pnf.parentId = parentId;
            pnf.notFoundPageId = notFoundPageId;
            return $http.post(apiRoot + "SetNotFoundPage", pnf);
        }
    };
}

angular.module('umbraco.resources').factory('pageNotFoundManagerResource', pageNotFoundManagerResource);