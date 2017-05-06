angular.module('home', []);

angular.module('home')
  .config(function ($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        // controller: 'HomeCtrl',
        // controllerAs: 'home',
        templateUrl: '../home/home.html',
      });
  });
