using Optimus.Translation;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.UI;
using System.Web.UI.WebControls;
using umbraco.cms.presentation.Trees;
using umbraco.presentation.masterpages;
using umbraco.uicontrols;
using Umbraco.Core;

namespace Optimus.Umbraco
{
    public class StartUpHandlers : IApplicationEventHandler
    {
        public void OnApplicationInitialized(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {

        }

        public void OnApplicationStarted(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {
            WebApiConfig.Register(GlobalConfiguration.Configuration);
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            try
            {
                BundleConfig.RegisterBundles(BundleTable.Bundles);
            }
            catch { }

            umbracoPage.Load += umbracoPage_Load;

            FileSystemTree.AfterNodeRender += FileSystemTree_AfterNodeRender;
        }

        void FileSystemTree_AfterNodeRender(ref XmlTree sender, ref XmlTreeNode node, EventArgs e)
        {
            if (node.TreeType == "scripts" && new Core().GetPossibleExtensions(Enums.TranslatorType.Script).Contains(Path.GetExtension(node.NodeID)))
            {
                sender.Remove(node);
            }
        }

        private Control GetPanel1Control(umbracoPage up)
        {
            ContentPlaceHolder cph = (ContentPlaceHolder)up.FindControl("body");
            return cph.FindControl("Panel1");
        }

        void umbracoPage_Load(object sender, EventArgs e)
        {
            umbracoPage pageReference = (umbracoPage)sender;

            string path = pageReference.Page.Request.Path.ToLower();


            if (path.EndsWith("settings/views/editview.aspx") == true || path.EndsWith("settings/edittemplate.aspx"))
            {
                bool webforms = path.EndsWith("settings/edittemplate.aspx");

                Control c2 = GetPanel1Control(pageReference);

                if (c2 != null)
                {
                    UmbracoPanel panel = (UmbracoPanel)c2;

                    //Insert splitter in menu to make menu nicer on the eye
                    panel.Menu.InsertSplitter();

                    //Add new image button 
                    ImageButton bundleBtn = panel.Menu.NewImageButton();
                    bundleBtn.ToolTip = "Create script/style bundle";
                    bundleBtn.ImageUrl = webforms ? "../../App_Plugins/Optimus/Icons/bundle_menu_icon.png" : "../../../App_Plugins/Optimus/Icons/bundle_menu_icon.png";
                    bundleBtn.OnClientClick = webforms ?
                                                 @"var selection = UmbEditor.IsSimpleEditor? jQuery('#body_editorSource').getSelection().text : UmbEditor._editor.getSelection();                                                UmbClientMgr.openModalWindow('/App_Plugins/Optimus/Dialog?webforms=true&snippet='+selection, 'Create Bundle', true, 550, 350);                                                return false;"                                                :                                                 @"var selection = UmbEditor.IsSimpleEditor? jQuery('#body_editorSource').getSelection().text : UmbEditor._editor.getSelection();                                                UmbClientMgr.openModalWindow('/App_Plugins/Optimus/Dialog?snippet='+selection, 'Create Bundle', true, 550, 350);                                                return false;";
                }
            }
        }


        public void OnApplicationStarting(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {

        }
    }
}