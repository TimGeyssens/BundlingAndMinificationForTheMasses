using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace BundlingAndMinificationForTheMasses
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "BundleApi",
                routeTemplate: "App_Plugins/BundlingAndMinificationForTheMasses/api/{action}/{id}",
                defaults: new {  controller = "BundleApi", id = RouteParameter.Optional }
            );
        }
    }
}
