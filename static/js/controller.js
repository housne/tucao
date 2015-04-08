(function(angular){

	var app = angular.module('newsController',[]);

	app.controller('IndexController', ['$scope', '$http', function($scope, $http){
		$scope.newsList = [];
		$scope.page = 1;
		$scope.total = 1;
		$http.get('/api/news').success(function(data){
			if(data.code !== 0) return alert(data.message);
			var result = data.result;
			result = convertTimestampToLoaleDateString(result);
			if(!result.length) return;
			$scope.newsList = result;
			$scope.total = data.total;
		});
		$scope.loadMore = function(){
			$scope.page ++;
			$http.get('/api/news?page='+ $scope.page).success(function(data){
				if(data.code !== 0) return alert(data.message);
				var result = data.result;
				result = convertTimestampToLoaleDateString(result);
				if(!result) return;
				$scope.newsList = $scope.newsList.concat(result);
			});
		}
	}]);

	app.controller('NewsController', ['$scope', '$routeParams', '$http', '$sce', function($scope, $routeParams, $http, $sce){
		$scope.news = {};
		$http.get('/api/news/' + $routeParams.id).success(function(data){
			if(data.code !== 0) return alert(data.message);
			data.result.body = $sce.trustAsHtml(data.result.body);
			$scope.news = data.result;
		});
	}]);

	function convertTimestampToLoaleDateString(result){
		if(!result.length) return null;
		result.forEach(function(item, index){
			var date = new Date(item.date*1000);
			result[index].date = date.toLocaleDateString();
		})
		return result;
	}

})(angular)