using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Xml.Linq;
using Optimus.Models;
using Optimus.Umbraco;
using Umbraco.Web.Mvc;
using HtmlAgilityPack;

namespace Optimus.Controllers
{
    public class BundleController : UmbracoAuthorizedController
    {

        public ActionResult Index(string virtualPath, string bundleType)
        {
            var m = Bundles.GetBundleAsViewModel(virtualPath, bundleType);

            return View(Config.EditPageViewPath,m);
        }

        [ValidateInput(false)]
        public ActionResult Dialog(string snippet)
        {
            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(snippet);

            List<string> scripts = new List<string>();
            if (doc.DocumentNode.SelectNodes("//script") != null)
            {
                foreach (var scriptNode in doc.DocumentNode.SelectNodes("//script"))
                {
                    scripts.Add(scriptNode.Attributes["src"].Value);
                }
            }
            List<string> stylesheets = new List<string>();
            if (doc.DocumentNode.SelectNodes("//link") != null)
            {
                foreach (var linkNode in doc.DocumentNode.SelectNodes("//link"))
                {
                    stylesheets.Add(linkNode.Attributes["href"].Value);
                }
            }

            return View(Config.DialogViewPath);
        }
    }
}
