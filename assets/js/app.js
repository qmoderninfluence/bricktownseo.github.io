'use strict';

/**
 * @ngdoc overview
 * @name unitSchedulingApp
 * @description
 * # unitSchedulingApp
 *
 * Main module of the application.
 */
angular
    .module('SEMRushApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch'
    ], function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
    });


angular.module('SEMRushApp')
    .controller('SEMRushCtrl', ['$scope', '$window', function($scope, $window) {

        $scope.reset = function() {
            $scope.keyword = "";
            $scope.relatedKeywords = 1;
            $scope.domains = {};
            $scope.domainArray = [];
            $scope.complete = false;
            $scope.searching = false;
            $scope.status = "";
            $scope.country = "us";
        }

        $scope.search = function() {
            $scope.searching = true;

            $scope.keywordsArr = [];

            $scope.status = "Checking " + $scope.keyword.trim() + "...";
            var check = encodeURIComponent($scope.keyword.trim().replace(" ", "+"));

            SEMRushKeyword(check);
        }

        //store value in local storage so that it can be reloaded agai
        $scope.storeKey = function() {
            if ($scope.store){
                $window.localStorage['semkey'] = $scope.semkey;  
            }
            else
            {
                $window.localStorage.removeItem('semkey');   
            }
        }

        //store value in local storage as user types
        $scope.onChange = function () {
            if ($scope.semkey){
                $window.localStorage['semkey'] = $scope.semkey;  
            }

            }


        function SEMRushKeyword(keyword) {
            var newRequest = new xdRequest;
            console.log("Requesting Phrase Related Keywords");
            console.log("http://api.semrush.com/?type=phrase_fullsearch&phrase=" + keyword + "&key=" + $scope.semkey + "&display_limit=" + $scope.relatedKeywords + "&export_columns=Ph,Nq,Cp,Co,Nr,Td&database=" + $scope.country);
            newRequest.setURL("http://api.semrush.com/?type=phrase_fullsearch&phrase=" + keyword + "&key=" + $scope.semkey + "&display_limit=" + $scope.relatedKeywords + "&export_columns=Ph,Nq,Cp,Co,Nr,Td&database=" + $scope.country);
            newRequest.get(function(response) {
                var keywords = SEMRushData(response.html);
                $scope.$apply(function() {
                    $scope.keywords = keywords;
                });

                SEMRushOrganic();
            });
        }

        function SEMRushOrganic() {
            if ($scope.keywords.length > 0) {
                for (var i = 0; i < $scope.keywords.length; i++) {
                    $scope.status = ('Checking domains for keyword ' + $scope.keywords[i].Keyword + '...');
                    var newRequest = new xdRequest;
                    console.log("Keyword search for "+$scope.keywords[i].Keyword);
                    console.log("http://api.semrush.com/?type=phrase_organic&key=" + $scope.semkey + "&display_limit=20&export_columns=Dn,Ur&phrase=" + encodeURIComponent($scope.keywords[i].Keyword) + "&database=" + $scope.country);
                    newRequest.setURL("http://api.semrush.com/?type=phrase_organic&key=" + $scope.semkey + "&display_limit=20&export_columns=Dn,Ur&phrase=" + encodeURIComponent($scope.keywords[i].Keyword) + "&database=" + $scope.country);
                    newRequest.get(function(response) {
                        var testKeyword = response.url.substring(response.url.indexOf("phrase=") + 7);
                        testKeyword = decodeURIComponent(testKeyword.substring(0, testKeyword.indexOf("&")));

                        var urls = SEMRushData(response.html);
                        for (var j = 10; j < urls.length; j++) {
                            if ($scope.domainArray.indexOf(urls[j]["Domain"]) == -1) {
                                $scope.domainArray.push(urls[j]["Domain"]);
                                $scope.domains[urls[j]["Domain"]] = {
                                    domain: urls[j]["Domain"],
                                    position: "(" + (j + 1) + ") " + testKeyword
                                };
                                SEMRushDomain(urls[j]["Domain"]);
                            } else {
                                $scope.domains[urls[j]["Domain"]].position = $scope.domains[urls[j]["Domain"]].position + "\n " + "(" + (j + 1) + ") " + testKeyword;
                            }
                        }
                        for (var j = 0; j < 10 && j < urls.length; j++) {
                            if ($scope.domainArray.indexOf(urls[j]["Domain"]) >= 0) {
                                $scope.domains[urls[j]["Domain"]].position = $scope.domains[urls[j]["Domain"]].position + "\n " + "(" + (j + 1) + ") " + testKeyword;
                            }
                        }
                    });
                }
            }
        }

        function SEMRushDomain(domain) {
            $scope.complete = true;
            var newRequest = new xdRequest;
            console.log("http://api.semrush.com/?type=domain_rank&key="+$scope.semkey+"&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac&domain="+domain+"&database=us");
            newRequest.setURL("http://api.semrush.com/?type=domain_rank&key="+$scope.semkey+"&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac&domain="+domain+"&database=" + $scope.country);
            newRequest.get(function(response) {
                $scope.$apply(function() {
                    var domaindata = SEMRushData(response.html);
                    if (domaindata.length > 0) {
                      //console.log(domaindata);
                      console.log(domaindata[0]);
                      $scope.domains[domaindata[0]["Domain"]]["paid"] = domaindata[0]["Adwords Cost"];
                    }
                    /*
                    var domain = response.url.substring(response.url.indexOf("domain=") + 7);
                    domain = domain.substring(0, domain.indexOf("&"))
                    var domaindata = SEMRushData(response.html);
                    console.log(domaindata);
                    if (domaindata.length > 0) {
                      $scope.domains[domain]["paid"] = domaindata[0]["Adwords Cost"];
                    }
                    */
                });
            });
        }

        function SEMRushData(data) {
            var resp = [];

            if (data.indexOf("ERROR") > -1) {
                console.log(data);
                $scope.status_update = data;
                $scope.error_message = data;
                return resp;
            }
            var lines = data.split("\n");
            var headers = [];
            if(lines.length>1){
              for (var i = 0; i < lines.length; i++) {
                  if (lines[i].trim().length > 0) {
                      var vals = lines[i].trim().split(";");
                      if (i == 0) {
                          //Headers
                          headers = vals;
                      } else {
                          var elem = {};
                          for (var j = 0; j < headers.length; j++) {
                              elem[headers[j]] = vals[j];
                          }
                          resp.push(elem);
                      }
                  }
              }
            }
            return resp;
        }

        $scope.dump = function() {
            console.log($scope);
        }

        $scope.getKey = function(arr, key) {
            return arr[key];
        }

        $window.localStorage['semkey'] == undefined ? $scope.semkey = "" : $scope.semkey = $window.localStorage['semkey'];

        // $scope.semkey = $window.localStorage['semkey'];
        $scope.store = $window.localStorage['semkey'] != undefined;
        $scope.reset();


    }]);