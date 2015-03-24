using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace Optimus
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "BundleApi",
                routeTemplate: "umbraco/backoffice/Plugins/Optimus/api/{action}/{id}",
                defaults: new {  controller = "BundleApi", id = RouteParameter.Optional }
            );
        }
    }
}
