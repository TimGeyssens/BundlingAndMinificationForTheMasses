using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Optimus.Models;
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
                    var scriptsource = scriptNode.Attributes["src"].Value;
                    if (!scriptsource.StartsWith("~"))
                        scriptsource = "~" + scriptsource;

                    scripts.Add(scriptsource);
                }
            }
            List<string> stylesheets = new List<string>();
            if (doc.DocumentNode.SelectNodes("//link") != null)
            {
                foreach (var linkNode in doc.DocumentNode.SelectNodes("//link"))
                {
                    var stylesheetlink = linkNode.Attributes["href"].Value;
                    if (!stylesheetlink.StartsWith("~"))
                        stylesheetlink = "~" + stylesheetlink;

                    stylesheets.Add(stylesheetlink);
                }
            }

            BundleViewModel m = new BundleViewModel();
            m.VirtualPath = "~/bundles/";
            if (scripts.Any())
                m.Files = scripts;
            else
                m.Files = stylesheets;

            return View(Config.DialogViewPath,m);
        }
    }
}
