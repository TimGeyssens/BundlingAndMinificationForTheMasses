/*! umbraco - v0.0.1-TechnicalPReview - 2013-10-11
 * https://github.com/umbraco/umbraco-cms/tree/7.0.0
 * Copyright (c) 2013 Umbraco HQ;
 * Licensed MIT
 */

(function() { 

// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('umbraco.security', [
  'umbraco.security.retryQueue',
  'umbraco.security.interceptor']);
angular.module('umbraco.security.interceptor', ['umbraco.security.retryQueue'])

// This http interceptor listens for authentication failures
.factory('securityInterceptor', ['$injector', 'securityRetryQueue', 'notificationsService', function ($injector, queue, notifications) {
    return function (promise) {
        // Intercept failed requests
        return promise.then(null, function (originalResponse) {
            
            //A 401 means that the user is not logged in
            if (originalResponse.status === 401) {

                // The request bounced because it was not authorized - add a new request to the retry queue
                promise = queue.pushRetryFn('unauthorized-server', function retryRequest() {
                    // We must use $injector to get the $http service to prevent circular dependency
                    return $injector.get('$http')(originalResponse.config);
                });
            }
            else if (originalResponse.status === 403) {
                //if the status was a 403 it means the user didn't have permission to do what the request was trying to do.
                //How do we deal with this now, need to tell the user somehow that they don't have permission to do the thing that was 
                //requested. We can either deal with this globally here, or we can deal with it globally for individual requests on the umbRequestHelper,
                // or completely custom for services calling resources.
                
                //http://issues.umbraco.org/issue/U4-2749
                
                //It was decided to just put these messages into the normal status messages. 

                var msg = "Unauthorized access to URL: <br/><i>" + originalResponse.config.url.split('?')[0] + "</i>";
                if (originalResponse.config.data) {
                    msg += "<br/> with data: <br/><i>" + angular.toJson(originalResponse.config.data) + "</i><br/>Contact your administrator for information.";
                }

                notifications.error(
                    "Authorization error", 
                    msg);
            }
            return promise;
        });
    };
}])

// We have to add the interceptor to the queue as a string because the interceptor depends upon service instances that are not available in the config block.
.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.responseInterceptors.push('securityInterceptor');
}]);
angular.module('umbraco.security.retryQueue', [])

// This is a generic retry queue for security failures.  Each item is expected to expose two functions: retry and cancel.
.factory('securityRetryQueue', ['$q', '$log', function ($q, $log) {

  var retryQueue = [];
  var service = {
    // The security service puts its own handler in here!
    onItemAddedCallbacks: [],
    
    hasMore: function() {
      return retryQueue.length > 0;
    },
    push: function(retryItem) {
      retryQueue.push(retryItem);
      // Call all the onItemAdded callbacks
      angular.forEach(service.onItemAddedCallbacks, function(cb) {
        try {
          cb(retryItem);
        } catch(e) {
          $log.error('securityRetryQueue.push(retryItem): callback threw an error' + e);
        }
      });
    },
    pushRetryFn: function(reason, retryFn) {
      // The reason parameter is optional
      if ( arguments.length === 1) {
        retryFn = reason;
        reason = undefined;
      }

      // The deferred object that will be resolved or rejected by calling retry or cancel
      var deferred = $q.defer();
      var retryItem = {
        reason: reason,
        retry: function() {
          // Wrap the result of the retryFn into a promise if it is not already
          $q.when(retryFn()).then(function(value) {
            // If it was successful then resolve our deferred
            deferred.resolve(value);
          }, function(value) {
            // Othewise reject it
            deferred.reject(value);
          });
        },
        cancel: function() {
          // Give up on retrying and reject our deferred
          deferred.reject();
        }
      };
      service.push(retryItem);
      return deferred.promise;
    },
    retryReason: function() {
      return service.hasMore() && retryQueue[0].reason;
    },
    cancelAll: function() {
      while(service.hasMore()) {
        retryQueue.shift().cancel();
      }
    },
    retryAll: function() {
      while(service.hasMore()) {
        retryQueue.shift().retry();
      }
    }
  };
  return service;
}]);

})();