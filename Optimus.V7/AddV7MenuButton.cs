using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Optimus.Interfaces;
using umbraco.uicontrols;
using System.Web.UI;


namespace Optimus.V7
{
    public class AddV7MenuButton : IAddMenuButton
    {
        public void Add(Control parent)
        {
            var editorSource = FindControl<CodeArea>(parent, "editorSource");

            editorSource.Menu.InsertSplitter();
            var eazyDBtn = editorSource.Menu.NewIcon();
            eazyDBtn.AltText = "Create script/style bundle";
            eazyDBtn.ImageURL = "../../../App_Plugins/Optimus/Icons/bundle_menu_icon.png";
            eazyDBtn.OnClickCommand =
                @"var selection = UmbEditor.IsSimpleEditor? jQuery('#body_editorSource').getSelection().text : UmbEditor._editor.getSelection();                                                UmbClientMgr.openModalWindow('/App_Plugins/Optimus/Dialog?snippet='+selection, 'Create Bundle', true, 550, 350);                                                return false;";

        }

        public static T FindControl<T>(Control startingControl, string id) where T : Control
        {
            // this is null by default
            T found = default(T);
            int controlCount = startingControl.Controls.Count;

            if (controlCount > 0)
            {
                for (int i = 0; i < controlCount; i++)
                {
                    Control activeControl = startingControl.Controls[i];
                    if (activeControl is T)
                    {
                        found = startingControl.Controls[i] as T;
                        if (string.Compare(id, found.ID, true) == 0) break;
                        else found = null;
                    }
                    else
                    {
                        found = FindControl<T>(activeControl, id);
                        if (found != null) break;
                    }
                }
            }
            return found;
        }
    }
}
