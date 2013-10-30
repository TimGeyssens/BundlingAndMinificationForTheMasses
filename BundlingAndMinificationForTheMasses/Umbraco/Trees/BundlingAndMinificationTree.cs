using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using Optimus.Helpers;
using umbraco.businesslogic;
using umbraco.cms.presentation.Trees;
using umbraco.interfaces;

namespace Optimus.Umbraco.Trees
{
    [Tree("settings", "bundlingAndMinificationTree", "Bundling")]
    public class BundlingAndMinificationTree : BaseTree
    {
        public BundlingAndMinificationTree(string application): base(application)
        {
        }

        protected override void CreateRootNode(ref XmlTreeNode rootNode)
        {
            rootNode.NodeType   = "bundle";
            rootNode.NodeID     = "init";
            rootNode.Menu       = new List<IAction>();
        }

        public override void Render(ref XmlTree tree)
        {

            string bundleType = string.Empty;
            if (HttpContext.Current.Request.QueryString.ToString().IndexOf("bundleType=") >= 0)
                bundleType = HttpContext.Current.Request.QueryString.Get("bundleType");

            if (bundleType == string.Empty)
            {
                XmlTreeNode xNode   = XmlTreeNode.Create(this);
                xNode.NodeID        = "1";
                xNode.NodeType      = "scriptBundle";
                xNode.Text          = "Scripts";
                xNode.Action        = "";
                if (CompatibilityHelper.IsVersion7OrNewer)
                    xNode.Icon = "icon-folder";
                else
                    xNode.Icon = FolderIcon;
                xNode.OpenIcon      = "folder_o.gif";
                xNode.Source        = "tree.aspx?bundleType=script&app=" + m_app + "&treeType=" +
                            HttpContext.Current.Request.QueryString["treeType"] + "&rnd=" + Guid.NewGuid();
                xNode.HasChildren   = true;
                xNode.Menu          = new List<IAction>()
                {
                    umbraco.BusinessLogic.Actions.ActionNew.Instance,
                    umbraco.BusinessLogic.Actions.ActionRefresh.Instance
                };

                OnBeforeNodeRender(ref tree, ref xNode, EventArgs.Empty);

                if (xNode != null)
                {
                    tree.Add(xNode);
                    OnAfterNodeRender(ref tree, ref xNode, EventArgs.Empty);
                }

                XmlTreeNode xNode2  = XmlTreeNode.Create(this);
                xNode2.NodeID       = "2";
                xNode2.NodeType     = "styleBundle";
                xNode2.Text         = "Styles";
                xNode2.Action       = "";
                if (CompatibilityHelper.IsVersion7OrNewer)
                    xNode2.Icon = "icon-folder";
                else
                    xNode2.Icon = FolderIcon;
                xNode2.OpenIcon     = "folder_o.gif";
                xNode2.HasChildren  = true;
                xNode2.Source       = "tree.aspx?bundleType=style&app=" + m_app + "&treeType=" +
                          HttpContext.Current.Request.QueryString["treeType"] + "&rnd=" + Guid.NewGuid();
                xNode2.Menu         = new List<IAction>()
                {
                    umbraco.BusinessLogic.Actions.ActionNew.Instance,
                    umbraco.BusinessLogic.Actions.ActionRefresh.Instance
                };

                OnBeforeNodeRender(ref tree, ref xNode2, EventArgs.Empty);

                if (xNode2 != null)
                {
                    tree.Add(xNode2);
                    OnAfterNodeRender(ref tree, ref xNode2, EventArgs.Empty);
                }
            }
            else
            {

                var doc = XDocument.Load(HttpContext.Current.Server.MapPath(Config.BundlesConfigPath));

               
                var bundles = doc.Descendants(bundleType+"Bundle").OrderBy(b => b.Attribute("virtualPath").Value);
                int id = 1;
                foreach (var bundleElement in bundles)
                {
                    XmlTreeNode bundleNode  = XmlTreeNode.Create(this);
                    bundleNode.NodeID       = bundleElement.Attribute("virtualPath").Value;
                    bundleNode.NodeType     = bundleType + "Bundle"; 
                    bundleNode.Text         = bundleElement.Attribute("virtualPath").Value;
                    bundleNode.Action       = string.Format("javascript:openBundlingAndMinificationEditPage('{0}','{1}');",
                        bundleElement.Attribute("virtualPath").Value, bundleType);
                    if (CompatibilityHelper.IsVersion7OrNewer)
                        bundleNode.Icon = "../../../App_Plugins/Optimus/Icons/bundle-icon.png";
                    else
                        bundleNode.Icon = "icon-box";

                    bundleNode.OpenIcon = "../../../App_Plugins/Optimus/Icons/bundle-icon.png";
                    bundleNode.HasChildren  = false;

                    OnBeforeNodeRender(ref tree, ref bundleNode, EventArgs.Empty);
                    if (bundleNode != null)
                    {
                        tree.Add(bundleNode);
                        OnAfterNodeRender(ref tree, ref bundleNode, EventArgs.Empty);
                    }

                    id++;
                }
            }
        }

        public override void RenderJS(ref System.Text.StringBuilder Javascript)
        {
            Javascript.Append(
               @"function openBundlingAndMinificationEditPage(virtualPath,bundleType) {
                 UmbClientMgr.contentFrame('../App_Plugins/Optimus/Index?virtualPath='+virtualPath +'&bundleType=' + bundleType);
    }       ");
        }
    }
}