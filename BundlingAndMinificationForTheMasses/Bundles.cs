using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using Optimus.Models;

namespace Optimus
{
    public class Bundles
    {
        public static BundleViewModel GetBundleAsViewModel(string virtualPath, string bundleType)
        {
            var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));
            var files = new List<string>();

            if (doc.Descendants(bundleType + "Bundle")
                   .Any(x => x.Attribute("virtualPath").Value == virtualPath))
            {
                foreach (var file in doc.Descendants(bundleType + "Bundle")
                                        .Single(x => x.Attribute("virtualPath").Value == virtualPath).Descendants())
                {
                    files.Add(file.Attribute("virtualPath").Value);
                }
            }
            return new BundleViewModel { VirtualPath = virtualPath, Files = files };
        }

        public static void SaveBundleFromViewModel(BundleViewModel bundle, string bundleType)
        {
            var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

            var bundleEl = new XElement(bundleType + "Bundle");

            if (doc.Descendants(bundleType + "Bundle").Any(x => x.Attribute("virtualPath").Value == bundle.VirtualPath))
                bundleEl =
                    doc.Descendants(bundleType + "Bundle")
                       .Single(x => x.Attribute("virtualPath").Value == bundle.VirtualPath);
            else
            {
                bundleEl.SetAttributeValue("virtualPath", bundle.VirtualPath);
                doc.Descendants("bundles").Single().Add(bundleEl);
            }

            bundleEl.Elements().Remove();

            if (bundle.Files != null)
            {
                foreach (var file in bundle.Files)
                {
                    var includeEl = new XElement("include");
                    includeEl.SetAttributeValue("virtualPath", file);
                    bundleEl.Add(includeEl);
                }
            }

            doc.Save(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

            HttpRuntime.UnloadAppDomain();
        }

        public static bool DeleteBundle(string bundleType, string virtualPath)
        {
            var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

            if (doc.Descendants(bundleType + "Bundle").Any(x => x.Attribute("virtualPath").Value == virtualPath))
                doc.Descendants(bundleType + "Bundle").Single(x => x.Attribute("virtualPath").Value == virtualPath).Remove();
            else
                return false;


            doc.Save(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

            return true;
        }
    }
}