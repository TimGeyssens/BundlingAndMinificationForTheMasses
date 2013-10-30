using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using umbraco;
using umbraco.BasePages;
using umbraco.cms.helpers;
using umbraco.BasePages;
using umbraco.IO;

namespace Optimus.Umbraco.Dialogs
{
    public partial class CreateStyleSheet : System.Web.UI.UserControl
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            sbmt.Text = ui.Text("create");

            if (!Page.IsPostBack)
            {
                //styleSheetType.Items.Add(new ListItem("Plain stylesheet", "css"));

                styleSheetType.Items.Add(new ListItem(ui.Text("folder"), ""));
                styleSheetType.Items.FindByText(ui.Text("folder")).Selected = true;

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
                //get file new path info
                var fileName = !String.IsNullOrEmpty(styleSheetType.SelectedValue) ? rename.Text + "."
                    + styleSheetType.SelectedValue : rename.Text;
                var helperPath = helper.Request("nodeID") == "init" ? String.Empty : helper.Request("nodeID");
                var cmsPath = !String.IsNullOrEmpty(helperPath) ? ("/css/" + helperPath + "/") : "/css/";
                var fullFilePath = Server.MapPath(cmsPath) + fileName;

                //make sure not create folder
                if (!String.IsNullOrEmpty(styleSheetType.SelectedValue))
                {
                    //create new file
                    File.Create(fullFilePath).Close();

                    //redirect to new file edit mode
                    BasePage.Current.ClientTools
                        .ChangeContentFrameUrl(".." + Config.EditFilePagePath + "?file=" + fileName + "&path=" + cmsPath)
                        .ChildNodeCreated()
                        .CloseModalWindow();
                }
                else
                {
                    //create new directory if not already exists
                    if (!Directory.Exists(fullFilePath))
                        Directory.CreateDirectory(fullFilePath);

                    //redirect to new file edit mode
                    BasePage.Current.ClientTools
                        .ChildNodeCreated()
                        .CloseModalWindow();
                }
            }
        }
    }
}