(function(angular){

	var app = angular.module('app', ['ngRoute','newsController']);

	app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
        $locationProvider.html5Mode(true);
        var templatePath = '/assets/templates/';
        $routeProvider
        .when('/', {
            templateUrl: templatePath + 'home.html',
            controller: 'IndexController'
        })
        .when('/news/:id', {
            templateUrl: templatePath + 'news.html',
            controller: 'NewsController'
        })
    }]);

    app.run(function ($rootScope, $location) {
        $rootScope.$on('$routeChangeSuccess', function(){
            ga('send', 'pageview', $location.path());
        });
    });
    
})(angular)