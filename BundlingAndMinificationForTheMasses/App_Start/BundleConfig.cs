using System;
using System.Web;
using System.Web.Optimization;
using System.Xml.Linq;
using BundleTransformer.Core.Orderers;
using BundleTransformer.Core.Transformers;

namespace Optimus
{
    using global::Umbraco.Core.Logging;

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

                var cssTransformer = new StyleTransformer();
                var jsTransformer = new ScriptTransformer();
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
                            var filePath = includeElement.Attribute("virtualPath").Value;
                            string fullPath = null;
                            try
                            {
                                fullPath = HttpContext.Current.Server.MapPath(filePath);
                            }
                            catch (Exception ex)
                            {
                                LogHelper.Warn<Exception>("Optmius skipped '" + filePath + "' in Bundle '" + bundle.Path + "' as the file path was invalid. Only application relative URLs (~/url) are allowed.");
                            }

                            if (fullPath != null)
                            {
                                bundle.Include(filePath);
                                bundleHasFiles = true;
                            }
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
                LogHelper.Error(typeof(BundleCollection), "Error adding bundles: " + e.ToString(),e);
            }


        }
    }
}