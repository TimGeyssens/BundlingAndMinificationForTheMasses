using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using Umbraco.Core.IO;
using umbraco.BusinessLogic.Actions;
using umbraco.businesslogic;
using umbraco.cms.presentation.Trees;
using umbraco.interfaces;
using umbraco.cms.businesslogic.translation;
using Optimus.Extensions;

namespace Optimus.Umbraco.Trees
{
    [Tree("settings", "scriptsNew", "Dynamic Scripts")]
    public class DynamicScriptTree : BaseDynamicFileTree 
    {
        public DynamicScriptTree(string application)
            : base(application)
        {

        }

        public override Enums.TranslatorType TranslatorType
        {
            get
            {
                return Enums.TranslatorType.Script;
            }
        }
    }
}