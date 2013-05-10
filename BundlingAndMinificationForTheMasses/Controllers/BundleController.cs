using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Xml.Linq;
using BundlingAndMinificationForTheMasses.Models;
using BundlingAndMinificationForTheMasses.Umbraco;
using Umbraco.Web.Mvc;

namespace BundlingAndMinificationForTheMasses.Controllers
{
    public class BundleController : UmbracoAuthorizedController
    {

        public ActionResult Index(string virtualPath, string bundleType)
        {
            var m = Bundles.GetBundleAsViewModel(virtualPath, bundleType);

            return View(Config.EditPageViewPath,m);
        }
    }
}
