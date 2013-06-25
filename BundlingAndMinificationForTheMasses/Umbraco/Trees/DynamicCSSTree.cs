using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using Umbraco.Core.IO;
using umbraco.BusinessLogic.Actions;
using umbraco.businesslogic;
using umbraco.cms.presentation.Trees;
using umbraco.interfaces;

namespace Optimus.Umbraco.Trees
{
    [Tree("settings", "stylesheetsNew", "Dynamic Stylesheets")]
    public class DynamicCSSTree : BaseTree
    {
        public DynamicCSSTree(string application) : base(application)
        {
        }

        public override void RenderJS(ref StringBuilder Javascript)
        {
            Javascript.Append(
            @"
                function openDyanmicCSSFileEditor(fileName, compiled) {
                    UmbClientMgr.contentFrame('../App_Plugins/Optimus/Pages/FileEditor.aspx?file='+ fileName + '&path=/css/&compiled=' + compiled);
                }");
        }
        

        public override void Render(ref XmlTree tree)
        {
            string orgPath  = string.Empty;
            string path     = string.Empty;
            string FilePath = "/css/";

            if (!string.IsNullOrEmpty(this.NodeKey))
            {
                orgPath = this.NodeKey;
                path = IOHelper.MapPath(FilePath + orgPath);
                orgPath += "/";
            }
            else
            {
                path = IOHelper.MapPath(FilePath);
            }

            DirectoryInfo dirInfo       = new DirectoryInfo(path);
            DirectoryInfo[] dirInfos    = dirInfo.GetDirectories();

            var args = new TreeEventArgs(tree);
            OnBeforeTreeRender(dirInfo, args);

            //Loop through directories
            //foreach (DirectoryInfo dir in dirInfos)
            //{
            //    if ((dir.Attributes & FileAttributes.Hidden) == 0)
            //    {
            //        XmlTreeNode xDirNode    = XmlTreeNode.Create(this);
            //        xDirNode.Menu.Clear();
            //        xDirNode.NodeID         = orgPath + dir.Name;
            //        xDirNode.Text           = dir.Name;
            //        xDirNode.Action         = string.Empty;
            //        xDirNode.Source         = GetTreeServiceUrl(orgPath + dir.Name);
            //        xDirNode.Icon           = FolderIcon;
            //        xDirNode.OpenIcon       = FolderIconOpen;
            //        xDirNode.HasChildren    = dir.GetFiles().Length > 0 || dir.GetDirectories().Length > 0;

            //        //OnRenderFolderNode(ref xDirNode);
            //        OnBeforeNodeRender(ref tree, ref xDirNode, EventArgs.Empty);
            //        if (xDirNode != null)
            //        {
            //            tree.Add(xDirNode);
            //            OnAfterNodeRender(ref tree, ref xDirNode, EventArgs.Empty);
            //        }
            //    }
            //}

            //Loop through files
            var fileInfo = dirInfo.GetFilesByExtensions(new Translation.Core().GetPossibleExtensions(Enums.TranslatorType.StyleSheet).ToArray());

            foreach (FileInfo file in fileInfo)
            {
                if ((file.Attributes & FileAttributes.Hidden) == 0)
                {
                    XmlTreeNode xFileNode   = XmlTreeNode.Create(this);
                    xFileNode.NodeID        = orgPath + file.Name;
                    xFileNode.Text          = file.Name;
                    xFileNode.OpenIcon      = "doc.gif";
                    xFileNode.Menu          = new List<IAction> { ActionDelete.Instance };

                    xFileNode.Icon = new Optimus.Translation.Core().GetTranslatorTreeIconPath(file.Name);

                    

                    //JS Action link...
                    //Only run/set an action if it's empty (as in not been set above as static/compiled file)
                    if (string.IsNullOrEmpty(xFileNode.Action))
                    {
                        if (orgPath != string.Empty)
                        {
                            xFileNode.Action = "javascript:openDyanmicCSSFileEditor('" + orgPath + file.Name + "', false');";
                        }
                        else
                        {
                            xFileNode.Action = "javascript:openDyanmicCSSFileEditor('" + file.Name + "', 'false');";
                        }
                    }
                    

                    //OnRenderFileNode(ref xFileNode);
                    OnBeforeNodeRender(ref tree, ref xFileNode, EventArgs.Empty);

                    if (xFileNode != null)
                    {
                        tree.Add(xFileNode);
                        OnAfterNodeRender(ref tree, ref xFileNode, EventArgs.Empty);
                    }
                }
            }

            //After TREE Rendering
            OnAfterTreeRender(dirInfo, args);
        }


        protected override void CreateRootNode(ref XmlTreeNode rootNode)
        {
            rootNode.Icon       = ".sprTreeFolder";
            rootNode.OpenIcon   = ".sprTreeFolder_o";
            rootNode.NodeID     = "init";
            rootNode.NodeType   = rootNode.NodeID + TreeAlias;
            rootNode.Menu       = new List<IAction> { ActionNew.Instance, ActionRefresh.Instance };
        }

       
    }

    
}




