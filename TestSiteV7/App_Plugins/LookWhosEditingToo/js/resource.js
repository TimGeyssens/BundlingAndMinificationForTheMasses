function lookWhosEditingTooResource($http) {

    var apiRoot = "backoffice/LookWhosEditingToo/EditApi/";

    return {

        getAllEdits: function () {
            return $http.get(apiRoot + "GetAllEdits");
        },

        getByNodeId: function (nodeId) {
            return $http.get(apiRoot + "GetByNodeId?nodeId=" + nodeId);
        },

        setEdit: function (nodeId, userId) {
            var edit = {};
            edit.nodeId = nodeId;
            edit.userId = userId;
            return $http.post(apiRoot + "PostSave", edit);
        },

        deleteByUserId: function (userId) {
            if (userId != undefined)
                return $http.delete(apiRoot + "DeleteByUserId?userId=" + userId);
        }
    };
}

angular.module('umbraco.resources').factory('lookWhosEditingTooResource', lookWhosEditingTooResource);