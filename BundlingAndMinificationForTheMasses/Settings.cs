using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Caching;
using System.Web.Hosting;
using System.Xml;
using umbraco.BusinessLogic;

namespace Optimus
{
    public class Settings
    {
        public static XmlDocument OptimusConfig
        {
            get
            {
                XmlDocument us = (XmlDocument)HttpRuntime.Cache["optimusSettingsFile"];
                if (us == null)
                    us = ensureSettingsDocument();
                return us;
            }
        }

        private static XmlDocument ensureSettingsDocument()
        {
            object settingsFile = HttpRuntime.Cache["optimusSettingsFile"];
            string fullPath = HostingEnvironment.MapPath(Config.BundlesConfigPath);

            // Check for language file in cache
            if (settingsFile == null)
            {
                XmlDocument temp = new XmlDocument();
                XmlTextReader settingsReader = new XmlTextReader(fullPath);
                try
                {
                    temp.Load(settingsReader);
                    HttpRuntime.Cache.Insert("optimusSettingsFile", temp, new CacheDependency(fullPath));
                }
                catch (XmlException e)
                {
                    throw new XmlException("Your bundles.config file fails to pass as valid XML. Refer to the InnerException for more information", e);
                }
                catch (Exception e)
                {
                    Log.Add(LogTypes.Error, new User(0), -1, "Error reading bundles.config file: " + e.ToString());
                }
                settingsReader.Close();
                return temp;
            }
            else
                return (XmlDocument)settingsFile;
        }
        private static object configCacheSyncLock = new object();

        public static string GetSetting(string key)
        {
            return CacheService.GetCacheItem<string>("OptimusKey" + key, configCacheSyncLock, TimeSpan.FromHours(6),
                    delegate
                    {

                        XmlNode x = OptimusConfig.SelectSingleNode(string.Format("//setting [@key = '{0}']", key));
                        if (x != null)
                            return x.Attributes["value"].Value;
                        else
                            return string.Empty;
                    });
        }
    }
}