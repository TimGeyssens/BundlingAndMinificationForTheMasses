using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Web;

namespace Optimus.Helpers
{
    public class CompatibilityHelper
    {

        public static bool IsVersion7OrNewer
        {
            get
            {
                var retval = true;
                try
                {
                    typeof (umbraco.uicontrols.CodeArea).InvokeMember("Menu",
                        BindingFlags.GetField, null, new umbraco.uicontrols.CodeArea(), null);
                }
                catch (MissingFieldException e)
                {
                    retval = false;
                }

                return retval;
            }
        }

    }
}