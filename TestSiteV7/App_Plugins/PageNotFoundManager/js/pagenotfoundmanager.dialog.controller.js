angular.module("umbraco").controller("PageNotFoundManager.Dialog.Controller",

function ($scope, pageNotFoundManagerResource, eventsService, navigationService, appState, treeService, localizationService, entityResource, iconHelper) {

    var dialogOptions = $scope.dialogOptions;
    var node = dialogOptions.currentNode;

    pageNotFoundManagerResource.getNotFoundPage(node.id)
    .then(function (resp) {
        $scope.pageNotFoundId = resp.data;

        var val = parseInt($scope.pageNotFoundId);

        if (!isNaN(val) && angular.isNumber(val) && val > 0) {

            entityResource.getById(val, "Document").then(function (item) {
                item.icon = iconHelper.convertFromLegacyIcon(item.icon);
                $scope.pageNotFoundNode = item;
            });
        }

        $scope.loaded = true;
    });


    var searchText = "Search...";
    localizationService.localize("general_search").then(function (value) {
        searchText = value + "...";
    });


    $scope.dialogTreeEventHandler = $({});
    $scope.busy = false;
    $scope.searchInfo = {
        searchFromId: null,
        searchFromName: null,
        showSearch: false,
        results: [],
        selectedSearchResults: []
    }



    function nodeSelectHandler(ev, args) {
        args.event.preventDefault();
        args.event.stopPropagation();

        if (args.node.metaData.listViewNode) {
            //check if list view 'search' node was selected

            $scope.searchInfo.showSearch = true;
            $scope.searchInfo.searchFromId = args.node.metaData.listViewNode.id;
            $scope.searchInfo.searchFromName = args.node.metaData.listViewNode.name;
        }
        else {
            eventsService.emit("editors.content.copyController.select", args);

            if ($scope.target) {
                //un-select if there's a current one selected
                $scope.target.selected = false;
            }

            $scope.target = args.node;
            $scope.target.selected = true;
        }

    }

    function nodeExpandedHandler(ev, args) {
        if (angular.isArray(args.children)) {

            //iterate children
            _.each(args.children, function (child) {
                //check if any of the items are list views, if so we need to add a custom 
                // child: A node to activate the search
                if (child.metaData.isContainer) {
                    child.hasChildren = true;
                    child.children = [
                        {
                            level: child.level + 1,
                            hasChildren: false,
                            name: searchText,
                            metaData: {
                                listViewNode: child,
                            },
                            cssClass: "icon umb-tree-icon sprTree icon-search",
                            cssClasses: ["not-published"]
                        }
                    ];
                }
            });
        }
    }

    $scope.hideSearch = function () {
        $scope.searchInfo.showSearch = false;
        $scope.searchInfo.searchFromId = null;
        $scope.searchInfo.searchFromName = null;
        $scope.searchInfo.results = [];
    }

    // method to select a search result 
    $scope.selectResult = function (evt, result) {
        result.selected = result.selected === true ? false : true;
        nodeSelectHandler(evt, { event: evt, node: result });
    };

    //callback when there are search results 
    $scope.onSearchResults = function (results) {
        $scope.searchInfo.results = results;
        $scope.searchInfo.showSearch = true;
    };

    $scope.setNotFoundPage = function () {

        $scope.busy = true;
        $scope.error = false;

        var parentId = 0;
        if (node != null)
            parentId = node.id;

        var notFoundPageId = 0;
        if ($scope.target != null)
            notFoundPageId = $scope.target.id;

        pageNotFoundManagerResource.setNotFoundPage(parentId, notFoundPageId)
            .then(function (path) {
                $scope.error = false;
                $scope.success = true;
                $scope.busy = false;


            }, function (err) {
                $scope.success = false;
                $scope.error = err;
                $scope.busy = false;
            });
    };

    $scope.clear = function () {
        $scope.pageNotFoundNode = null;
    };

    $scope.dialogTreeEventHandler.bind("treeNodeSelect", nodeSelectHandler);
    $scope.dialogTreeEventHandler.bind("treeNodeExpanded", nodeExpandedHandler);

    $scope.$on('$destroy', function () {
        $scope.dialogTreeEventHandler.unbind("treeNodeSelect", nodeSelectHandler);
        $scope.dialogTreeEventHandler.unbind("treeNodeExpanded", nodeExpandedHandler);
    });
});