using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Optimus
{
    public class Config
    {
        public const string RootDir             = "~/App_Plugins/Optimus/";
        public const string BundlesConfigPath   = RootDir + "config/bundles.config";
        public const string EditPageViewPath    = "~/App_Plugins/Optimus/Views/Index.cshtml";
        public const string EditPagePath        = "/App_Plugins/Optimus/Index";
        public const string EditFilePagePath    = "/App_Plugins/Optimus/Pages/FileEditor.aspx";
    }
}