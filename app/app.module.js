angular.module('app', [
        'ui.bootstrap',
        'ui.router'
    ])
    .config(function($urlRouterProvider, $stateProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'views/home.html'
            });
    })
    .run(function() {
        return;
    });
