(function(angular){

	var app = angular.module('newsController',[]);

	app.controller('IndexController', ['$scope', '$http', function($scope, $http){
		$scope.newsList = [];
		$http.get('/api/news').success(function(data){
			if(data.code !== 0) return alert(data.message);
			var result = data.result;
			result.forEach(function(item, index){
				var date = new Date(item.date*1000);
				result[index].date = date.toLocaleDateString();
			})
			$scope.newsList = result;
		});
	}]);

	app.controller('NewsController', ['$scope', '$routeParams', '$http', '$sce', function($scope, $routeParams, $http, $sce){
		$scope.news = {};
		$http.get('/api/news/' + $routeParams.id).success(function(data){
			if(data.code !== 0) return alert(data.message);
			data.result.body = $sce.trustAsHtml(data.result.body);
			$scope.news = data.result;
		});
	}]);

})(angular)