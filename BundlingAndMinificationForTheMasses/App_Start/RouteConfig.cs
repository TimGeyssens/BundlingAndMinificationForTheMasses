using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Optimus
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
           
            routes.MapRoute(
                name: "Bundle",
                url: "umbraco/backoffice/Plugins/Optimus/{action}/{id}",
                defaults: new { controller = "Bundle", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}