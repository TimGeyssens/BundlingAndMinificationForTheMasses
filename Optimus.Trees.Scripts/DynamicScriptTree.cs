using Optimus.Umbraco.Trees;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using umbraco.businesslogic;

namespace Optimus.Trees.Scripts
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
