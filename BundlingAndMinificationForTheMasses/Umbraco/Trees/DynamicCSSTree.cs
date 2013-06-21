using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using umbraco.BusinessLogic.Actions;
using umbraco.businesslogic;
using umbraco.cms.presentation.Trees;
using umbraco.interfaces;

namespace BundlingAndMinificationForTheMasses.Umbraco.Trees
{
    [Tree("settings", "stylesheets", "Stylesheets (NEW)")]
    public class DynamicCSSTree : BaseTree
    {
        public DynamicCSSTree(string application) : base(application)
        {
            //Loop files in CSS folder?

        }

        public override void RenderJS(ref StringBuilder Javascript)
        {
            Javascript.Append(
            @"
                function openDyanmicCSSFileEditor(virtualPath) {
                    UmbClientMgr.contentFrame(Config.EditFilePagePath + '?file='+virtualPath +'path=/css/');
                }");
        }

        public override void Render(ref XmlTree tree)
        {
            throw new NotImplementedException();
        }

        protected override void CreateRootNode(ref XmlTreeNode rootNode)
        {
            rootNode.Text       = "CSS Files";
            rootNode.Icon       = ".sprTreeFolder";
            rootNode.OpenIcon   = ".sprTreeFolder_o";
            rootNode.NodeID     = "init";
            rootNode.NodeType   = rootNode.NodeID + TreeAlias;
            rootNode.Menu       = new List<IAction> { ActionNew.Instance, ActionRefresh.Instance };
        }

        protected override void OnAfterNodeRender(ref XmlTree sender, ref XmlTreeNode node, EventArgs e)
        {
            if (node.NodeType == "configFolder")
            {
                node.Menu = new List<IAction> {ActionNew.Instance, ActionRefresh.Instance};
            }
            else
            {
                if (node.Text.EndsWith(".css"))
                {
                    node.Icon = "../../images/umbraco/settingCss.gif";
                }
                else if (node.Text.EndsWith(".less"))
                {
                    node.Icon = "../../images/umbraco/less-icon.gif";

                    //Check if child compiled CSS file exists
                }
                else if (node.Text.EndsWith(".scss"))
                {
                    node.Icon = "../../images/umbraco/sass-icon.gif";
                }

                //CSS (Sass or Less as well) Node
                node.Action     = node.Action.Replace("openFile", "openConfigEditor");
                node.Menu       = new List<IAction> { ActionDelete.Instance };
                node.OpenIcon   = node.Icon;
                node.Action     = string.Format("javascript:openDyanmicCSSFileEditor('{0}');", node.NodeID);

            }

        }
    }
}




