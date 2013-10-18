using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;
using System.Xml.Linq;
using BundleTransformer.Core.Orderers;
using BundleTransformer.Core.Transformers;
using umbraco.BusinessLogic;

namespace Optimus
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            try
            {
                var ignoreCompilationDebug = Settings.GetSetting("ignoreCompilationDebug") == "True" || string.IsNullOrEmpty(Settings.GetSetting("ignoreCompilationDebug"));

                if (ignoreCompilationDebug)
                {                    
                    BundleTable.EnableOptimizations = true;
                }

                var cssTransformer = new CssTransformer();
                var jsTransformer = new JsTransformer();
                var nullOrderer = new NullOrderer();

                var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

                foreach (string bundleType in "script,style".Split(','))
                {

                    foreach (var bundleElement in doc.Descendants(bundleType + "Bundle"))
                    {
                        var bundle = new Bundle(bundleElement.Attribute("virtualPath").Value);
                        var bundleHasFiles = false;
                        var dontMinify = bundleElement.Attribute("disableMinification") != null ? bundleElement.Attribute("disableMinification").Value == true.ToString() : false;

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
                                if(!dontMinify)
                                    bundle.Transforms.Add(new JsMinify());
                            }
                            else
                            {
                                bundle.Transforms.Add(cssTransformer);
                                if(!dontMinify)
                                    bundle.Transforms.Add(new CssMinify());
                            }
                            bundle.Orderer = nullOrderer;


                            bundles.Add(bundle);
                        }
                    }

                }

            }
            catch (Exception e)
            {
                Log.Add(LogTypes.Error, new User(0), -1, "Error adding bundles: " + e.ToString());
            }


        }
    }
}