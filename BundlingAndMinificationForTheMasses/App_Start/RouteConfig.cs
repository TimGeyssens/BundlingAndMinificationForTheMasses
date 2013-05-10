using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace BundlingAndMinificationForTheMasses
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
           
            routes.MapRoute(
                name: "Bundle",
                url: "App_Plugins/BundlingAndMinificationForTheMasses/{action}/{id}",
                defaults: new { controller = "Bundle", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}