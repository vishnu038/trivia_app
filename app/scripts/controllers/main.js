'use strict';

angular.module('triviaApp')
    .controller('NavCtrl', ['$scope',
        function ($scope) {

            $scope.loggedIn = false;

            $scope.$on('user:loggedIn', function (e) {
                $scope.loggedIn = true;
            });

            $scope.$on('user:logout', function (e) {
                $scope.loggedIn = false;
            });
        }])
    .controller('ErrorsCtrl', ['$scope', function ($scope) {

        $scope.errors = [];

        $scope.$on('app:error', function (e, error) {

            $scope.errors.push(error);
        });

        $scope.$on('app:error:clear', function (e) {

            $scope.errors = [];
        })
    }])
    .controller('TriviaCtrl', ['$scope', 'DreamFactory', 'UserService', 'MovieService', 'MakeQuestion', 'StringService', 'ScoreKeeper',
        function ($scope, DreamFactory, UserService, MovieService, MakeQuestion, StringService, ScoreKeeper) {


            // Public vars
            $scope.user = UserService.getUser();
            $scope.score = ScoreKeeper.getScore();
            $scope.question = '';
            $scope.userAnswer = '';
            $scope.cheatAnswer = '';

            // Private vars
            $scope._actualAnswer = '';

            $scope.init = function () {

                if (DreamFactory.isReady()) {
                    $scope.$broadcast('getMovie');
                }
            };


            // Public API
            $scope.verifyAnswer = function (userAnswer) {

                $scope.$broadcast('verifyAnswer', userAnswer)
            };


            // Private Api
            $scope._storeQuestionAnswer = function(QAObj) {

                $scope.question = QAObj.question;
                $scope.cheatAnswer = QAObj.answer;
                $scope._actualAnswer = QAObj.answer;
            };

            $scope._verifyAnswer = function (userAnswer) {

                return StringService.areIdentical(userAnswer.toLowerCase(), $scope._actualAnswer.toLowerCase()) ? true : false;
            };


            $scope._resetForm = function() {

                $scope.userAnswer = '';
            };

            $scope._saveUserScore = function() {

                if (!UserService.isLoggedIn()) return false;

                var record = {
                    table_name: 'TriviaScore',
                    id: UserService.getUser().id,
                    id_field: 'user',
                    body: {
                        score: ScoreKeeper.getScore()
                    }
                };

                ScoreKeeper.updateScoreRecord(record).then(
                    function (result) {
                        console.log('Score Saved')
                    },
                    function (reason) {
                        console.log(reason)
                    });
            }


            // Handle Messages

            $scope.$on('api:ready', function (e) {

                $scope.$broadcast('getMovie');
            });


            $scope.$on('getMovie', function () {

                MovieService.getMovie().then(
                    function (result) {

                        $scope._storeQuestionAnswer(MakeQuestion.questionBuilder(result));

                    }, function (reason) {

                        $scope.$broadcast('getMovie');
                    });
            });

            $scope.$on('verifyAnswer', function (e, userAnswer) {


                if ($scope._verifyAnswer(userAnswer)) {

                    $scope.score = ScoreKeeper.incrementScore();
                } else {

                    $scope.score = ScoreKeeper.decrementScore();
                }

                $scope._saveUserScore();
                $scope._resetForm();
                $scope.$broadcast('getMovie');
            });


            // Init from login
            $scope.init();

        }])
    .controller('LoginCtrl', ['$scope', '$rootScope', '$location', 'UserService', 'DreamFactory', 'ScoreKeeper',
        function ($scope, $rootScope, $location, UserService, DreamFactory, ScoreKeeper) {


            // Vars
            $scope.creds = {
                email: '',
                password: ''
            };

            // Public API
            $scope.login = function (creds) {

                $scope.$broadcast('user:login', creds)
            };

            // Private API


            // Handle Messages
            $scope.$on('user:login', function (e, creds) {


                var postData = {
                    body: creds
                }


                DreamFactory.api.user.login(postData,
                    function (data) {
                        UserService.setUser(data);

                        ScoreKeeper.getScoreRecord(data).then(
                            function (result) {
                                ScoreKeeper.setScore(result.score);
                                $rootScope.$broadcast('user:loggedIn');
                                $location.url('/');
                            },
                            function (reason) {

                                ScoreKeeper.createScoreRecord(data).then(
                                    function (result) {
                                        $rootScope.$broadcast('user:loggedIn');
                                        $location.url('/');
                                    },
                                    function (reason) {
                                        console.log(reason)
                                    });
                            });
                    },
                    function (data) {
                        throw {message: 'Unable to login.'}
                    });
            })
        }])
    .controller('RegisterCtrl', ['$scope', '$rootScope', '$location', 'StringService', 'DreamFactory', 'UserService', 'ScoreKeeper',
        function ($scope, $rootScope, $location, StringService, DreamFactory, UserService, ScoreKeeper) {

            // Vars
            $scope.creds = {
                email: '',
                password: '',
                confirm: ''
            };


            // Public API
            $scope.register = function (creds) {

                if ($scope.identical == false) {
                    return false
                }

                $scope.$broadcast('user:register', creds)
            };

            $scope.verifyUserPassword = function (creds) {

                $scope.$broadcast('verify:password', creds);
            };


            // Private API
            $scope._verifyPassword = function (creds) {
                return StringService.areIdentical(creds.password, creds.confirm);
            };


            // Handle Messages
            $scope.$on('verify:password', function (e, creds) {

                $scope.identical = $scope._verifyPassword(creds);
            });

            $scope.$on('user:register', function (e, creds) {

                var data = {
                    body: {
                        email: creds.email,
                        new_password: creds.password
                    }
                };

                DreamFactory.api.user.register(data,
                    function (data) {

                        UserService.setUser(data);

                        ScoreKeeper.createScoreRecord(data).then(
                            function (result) {
                                $rootScope.$broadcast('user:loggedIn');
                                $location.url('/');
                            },
                            function (reason) {
                                console.log(reason)
                            });
                    },
                    function (data) {

                        throw {message: 'Unable to Register.'}
                    });
            })
        }])
    .controller('FakeCtrl', ['$scope', function($scope) {


    }]);


