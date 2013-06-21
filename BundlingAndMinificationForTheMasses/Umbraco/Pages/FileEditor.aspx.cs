using BundlingAndMinificationForTheMasses.Interfaces;
using ClientDependency.Core;
using ClientDependency.Core.Controls;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using umbraco;
using umbraco.BasePages;
using umbraco.uicontrols;

namespace BundlingAndMinificationForTheMasses.Umbraco.Pages
{
    public partial class FileEditor : UmbracoEnsuredPage
    {
        private Translation.Core transCore = new Translation.Core();

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            if (!UmbracoPanel.hasMenu)
            {
                return;
            }

            var imageButton = UmbracoPanel.Menu.NewImageButton();
            imageButton.AlternateText = "Save File";
            imageButton.ImageUrl = GlobalSettings.Path + "/images/editor/save.gif";
            imageButton.Click += MenuSaveClick;

            var file = Request.QueryString["file"];
            var path = Request.QueryString["path"] + file;

            EditorSource.EditorMimeType = transCore.GetTranslatorMimeType(path);
        }

        protected void Page_Load(object sender, EventArgs e)
        {
             var file = Request.QueryString["file"];
             var path = Request.QueryString["path"] + file;

            //Register SASS file

            foreach(var script in transCore.GetTranlatorClientDependencies(path))
                ClientDependencyLoader.Instance.RegisterDependency(2, script, "UmbracoClient", ClientDependencyType.Javascript);

           
            TxtName.Text = file;
            var appPath = Request.ApplicationPath;

            if (appPath == "/")
            {
                appPath = string.Empty;
            }

            LtrlPath.Text = appPath + path;
            if (IsPostBack)
            {
                return;
            }

            string fullPath = Server.MapPath(path);
            if (File.Exists(fullPath))
            {
                string content;
                using (var streamReader = File.OpenText(fullPath))
                {
                    content = streamReader.ReadToEnd();
                }

                if (string.IsNullOrEmpty(content))
                {
                    return;
                }

                EditorSource.Text = content;
            }
            else
            {
                Feedback.Text = (string.Format("The file '{0}' does not exist.", file));
                Feedback.type = Feedback.feedbacktype.error;
                Feedback.Visible = true;
                UmbracoPanel.hasMenu = NamePanel.Visible = PathPanel.Visible = EditorPanel.Visible = false;
            }
        }

        private bool SaveConfigFile(string filename, string contents)
        {
           
            var path = Server.MapPath(Request.QueryString["path"]) + filename;
            using (var text = File.CreateText(path))
            {
                //Save the file
                text.Write(contents);
                text.Close();

                var errors = transCore.ValidateTranslation(path);

                if (errors == null || !errors.Any())
                {
                    transCore.SaveTranslation(path);

                    return true;
                }
                else
                {
                    Feedback.type = Feedback.feedbacktype.error;
                    Feedback.Text = errors.First().Message;
                    Feedback.Visible = true;

                    return false;
                }

            }


        }

        private void MenuSaveClick(object sender, ImageClickEventArgs e)
        {
            if (SaveConfigFile(TxtName.Text, EditorSource.Text))
            {
                ClientTools.ShowSpeechBubble(speechBubbleIcon.save, ui.Text("speechBubbles", "fileSavedHeader"), ui.Text("speechBubbles", "fileSavedText"));
            }
            else
            {
                ClientTools.ShowSpeechBubble(speechBubbleIcon.error, ui.Text("speechBubbles", "fileErrorHeader"), ui.Text("speechBubbles", "fileErrorText"));
            }
        }
    }
}