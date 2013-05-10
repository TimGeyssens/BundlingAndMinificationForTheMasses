using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;
using System.Xml.Linq;
using BundleTransformer.Core.Orderers;
using BundleTransformer.Core.Transformers;

namespace BundlingAndMinificationForTheMasses
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            BundleTable.EnableOptimizations = true;

            var cssTransformer = new CssTransformer();
            var jsTransformer = new JsTransformer();
            var nullOrderer = new NullOrderer();

            var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

            foreach(string bundleType in "script,style".Split(','))
            {

                foreach (var bundleElement in doc.Descendants(bundleType+"Bundle"))
                {
                    var bundle = new Bundle(bundleElement.Attribute("virtualPath").Value);
                    var bundleHasFiles = false;

                    foreach (var includeElement in bundleElement.Elements())
                    {
                        bundle.Include(includeElement.Attribute("virtualPath").Value);
                        bundleHasFiles = true;
                    }

                    if (bundleHasFiles)
                    {
                        if (bundleType == "script")
                        {
                            bundle.Transforms.Add(jsTransformer);
                            bundle.Transforms.Add(new JsMinify());
                        }
                        else
                        {
                            bundle.Transforms.Add(cssTransformer);
                            bundle.Transforms.Add(new CssMinify());
                        }
                        bundle.Orderer = nullOrderer;


                        bundles.Add(bundle);
                    }
                }

            }


        }
    }
}