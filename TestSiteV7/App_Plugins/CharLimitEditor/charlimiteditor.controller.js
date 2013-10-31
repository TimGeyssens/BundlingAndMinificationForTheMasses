angular.module("umbraco")
    .controller("Demo.CharLimitEditorController",
    function ($scope) {
         $scope.limitChars = function(){
			var limit = parseInt($scope.model.config.limit);

			if ($scope.model.value.length > limit )
			{
				$scope.info = 'You cannot write more then ' + limit  + ' characters!';
				$scope.model.value = $scope.model.value.substr(0, limit );
			}
			else
			{
				$scope.info = 'You have ' + (limit - $scope.model.value.length) + ' characters left.';
			}
		 };
    });