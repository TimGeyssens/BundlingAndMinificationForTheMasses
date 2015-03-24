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
        public const string EditPagePath =      "/umbraco/backoffice/plugins/optimus/index";
        public const string EditFilePagePath    = "/App_Plugins/Optimus/Pages/FileEditor.aspx";
        public const string DialogViewPath      = "~/App_Plugins/Optimus/Views/Dialog.cshtml";
    }
}