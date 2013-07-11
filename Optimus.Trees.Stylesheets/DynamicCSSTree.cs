using Optimus.Umbraco.Trees;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using umbraco.businesslogic;

namespace Optimus.Trees.Stylesheets
{
    [Tree("settings", "stylesheetsNew", "Dynamic Stylesheets")]
    public class DynamicCSSTree : BaseDynamicFileTree
    {
        public DynamicCSSTree(string application)
            : base(application)
        {

        }

        public override Enums.TranslatorType TranslatorType
        {
            get
            {
                return Enums.TranslatorType.StyleSheet;
            }
        }


    }
}
