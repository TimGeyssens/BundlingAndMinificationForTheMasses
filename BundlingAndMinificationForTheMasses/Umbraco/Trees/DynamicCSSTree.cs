using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using Umbraco.Core.IO;
using umbraco.BusinessLogic.Actions;
using umbraco.businesslogic;
using umbraco.cms.presentation;
using umbraco.cms.presentation.Trees;
using umbraco.interfaces;
using umbraco.uicontrols;
using Optimus.Extensions;

namespace Optimus.Umbraco.Trees
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




