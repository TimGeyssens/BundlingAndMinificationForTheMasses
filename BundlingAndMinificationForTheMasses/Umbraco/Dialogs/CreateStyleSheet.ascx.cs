using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using umbraco;
using umbraco.BasePages;

namespace Optimus.Umbraco.Dialogs
{
    public partial class CreateStyleSheet : System.Web.UI.UserControl
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            sbmt.Text = ui.Text("create");

            if (!Page.IsPostBack)
            {
                styleSheetType.Items.Add(new ListItem("Plain stylesheet", "css"));

                foreach (var trans in new Translation.Core().GetStyleSheetTranslators())
                {
                    styleSheetType.Items.Add(new ListItem(trans.Name, trans.FileExtension));
                }
            }
        }

       

        protected void sbmt_Click(object sender, EventArgs e)
        {
            if (Page.IsValid)
            {
                var fileName = rename.Text + "." + styleSheetType.SelectedValue;
                var fullFilePath = Server.MapPath("/css/") + fileName;

                File.Create(fullFilePath).Close();

                BasePage.Current.ClientTools
                    .ChangeContentFrameUrl(".." + Config.EditFilePagePath + "?file=" + fileName + "&path=/css/")
                    .ChildNodeCreated()
                    .CloseModalWindow();

            }
        }

        

    
    }
}