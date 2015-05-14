namespace Optimus
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web;
    using System.Xml.Linq;

    using global::Umbraco.Core.Logging;

    using Optimus.Models;

    public class Bundles
    {
        public static BundleViewModel GetBundleAsViewModel(string virtualPath, string bundleType)
        {
            var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));
            var files = new List<string>();
            var disableMinification = false;

            if (doc.Descendants(bundleType + "Bundle")
                   .Any(x => x.Attribute("virtualPath").Value == virtualPath))
            {

                var bundleElement = doc.Descendants(bundleType + "Bundle")
                                        .Single(x => x.Attribute("virtualPath").Value == virtualPath);

                disableMinification = bundleElement.Attribute("disableMinification") != null && bundleElement.Attribute("disableMinification").Value == true.ToString(); // simplified

	            files.AddRange(bundleElement.Descendants().Select(file => file.Attribute("virtualPath").Value)); 
            }

	        string path = string.Format("{0}{1}", bundleType, virtualPath.Replace('~','s')); // text for current bundle being edited

            return new BundleViewModel { VirtualPath = virtualPath, DisableMinification = disableMinification, Files = files, EditPath = path}; // constructor
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

            bundleEl.SetAttributeValue("disableMinification", bundle.DisableMinification.ToString());

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

            try
            {
                //HttpRuntime.UnloadAppDomain();
                var webConfigPath = HttpContext.Current.Request.PhysicalApplicationPath + "\\\\Web.config"; 
                System.IO.File.SetLastWriteTimeUtc(webConfigPath, DateTime.UtcNow); 
            }
            catch (Exception ex)
            {
                LogHelper.Info<Bundles>("Optimus failed to restart the application pool, you may need to check permissions on web.config");
            }
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