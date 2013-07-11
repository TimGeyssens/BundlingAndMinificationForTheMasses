using Optimus.Interfaces;
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

namespace Optimus.Umbraco.Pages
{
    public partial class FileEditor : UmbracoEnsuredPage
    {
        private Translation.Core transCore = new Translation.Core();

        public static int ErrorLineNumber = 0;


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

            //if querystring ?compiled=true
            if (Request.QueryString["compiled"] == "true")
            {
                //Then run JS fucntion disableEditor()
                var jsString =
                        "console.log('Disable Editor Function():');" +
                        "disableEditor();";
                Page.ClientScript.RegisterStartupScript(this.GetType(), "disableEditorJS", jsString, true);

                //Now set Feedback panel with warning/info message
                Feedback.Text = "This is a compiled file, and you are unable to edit this file directly. Please edit the compiler file instead.";
                Feedback.type = Feedback.feedbacktype.notice;
                Feedback.Visible = true;
                UmbracoPanel.hasMenu = false;
            }
            


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
           
            var path = Request.QueryString["path"] + filename;
            var fullPath = Server.MapPath(Request.QueryString["path"]) + filename;
            using (var text = File.CreateText(fullPath))
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
                    var exceptionMessage = errors.First().Message;

                    Feedback.type = Feedback.feedbacktype.error;
                    Feedback.Text = exceptionMessage;
                    Feedback.Visible = true;

                    //Get Line number from the exception message - presumes messages always ends with
                    //Line number: 3
                    var lineNumber = exceptionMessage.Split(' ').Last().Replace("\r", "").Replace("\n", "");
                    int.TryParse(lineNumber, out ErrorLineNumber);

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
                //If we have an error - most likely have a line number from the parser - highlight in the editor?
                if (ErrorLineNumber > 0)
                {
                    //Figure how to write or inject some JS to highlight the line with the error...
                    //highlightLine(ErrorLineNumber);

                    var jsString = 
                        "console.log('Highlight Line Function(): " + ErrorLineNumber + "');" +
                        "highlightLine(" + ErrorLineNumber + ");";

                    Page.ClientScript.RegisterStartupScript(this.GetType(), "errorLineJS", jsString, true);
                }

                ClientTools.ShowSpeechBubble(speechBubbleIcon.error, "Error Compiling", "There was an error compiling your file.");
            }
        }
    }
}