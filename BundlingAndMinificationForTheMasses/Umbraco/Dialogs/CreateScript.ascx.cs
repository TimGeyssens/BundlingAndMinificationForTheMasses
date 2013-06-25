using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using umbraco;
using umbraco.BasePages;
using System.IO;

namespace Optimus.Umbraco.Dialogs
{
    public partial class CreateScript : System.Web.UI.UserControl
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            sbmt.Text = ui.Text("create");

            if (!Page.IsPostBack)
            {
                scriptType.Items.Add(new ListItem("Plain script", "js"));

                foreach (var trans in new Translation.Core().GetScriptTranslators())
                {
                    scriptType.Items.Add(new ListItem(trans.Name, trans.FileExtension));
                }
            }
        }

        protected void sbmt_Click(object sender, EventArgs e)
        {
            if (Page.IsValid)
            {
                var fileName = rename.Text + "." + scriptType.SelectedValue;
                var fullFilePath = Server.MapPath("/scripts/") + fileName;

                File.Create(fullFilePath).Close();

                BasePage.Current.ClientTools
                    .ChangeContentFrameUrl(".." + Config.EditFilePagePath + "?file=" + fileName + "&path=/scripts/")
                    .ChildNodeCreated()
                    .CloseModalWindow();

            }
        }
    }
}