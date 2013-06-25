using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using umbraco.interfaces;

namespace Optimus.Umbraco.Tasks
{
    public class StyleBundleTasks : BaseBundleTasks
    {
        public override string BundleType
        {
            get
            {
                return "style";
            }
        }
    }
}