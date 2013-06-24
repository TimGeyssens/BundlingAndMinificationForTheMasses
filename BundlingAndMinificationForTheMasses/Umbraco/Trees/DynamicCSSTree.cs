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

namespace BundlingAndMinificationForTheMasses.Umbraco.Trees
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
                function openDyanmicCSSFileEditor(fileName) {
                    UmbClientMgr.contentFrame('../App_Plugins/BundlingAndMinificationForTheMasses/Pages/FileEditor.aspx?file='+fileName +'&path=/css/');
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

                    //CSS
                    if (xFileNode.Text.EndsWith(".css"))
                    {
                        xFileNode.Icon = "../../images/umbraco/settingCss.gif";
                    }
                       
                    //LESS
                    else if (xFileNode.Text.EndsWith(".less"))
                    {
                        xFileNode.Icon = "../../images/umbraco/less-icon.gif";

                        //Check if child compiled CSS file exists

                    }   
                    
                    //SASS
                    else if (xFileNode.Text.EndsWith(".scss"))
                    {
                        xFileNode.Icon = "../../images/umbraco/sass-icon.gif";

                        //Try and find a CSS version
                        var cssToFind       = xFileNode.Text.Replace(".scss", ".css");
                        var findStaticCSS   = fileInfo.SingleOrDefault(x => x.Name == cssToFind);

                        if (findStaticCSS != null)
                        {
                            //Found the static CSS file on disk

                            //Remove the item from the tree if it exists
                            var itemInTree = tree.treeCollection.SingleOrDefault(x => x.Text == cssToFind);

                            //Check we found the item in the tree collection
                            if (itemInTree != null)
                            {
                                //Remove the item from the tree collection
                                tree.treeCollection.Remove(itemInTree);
                            }

                            //Now add the item as a child node
                            xFileNode.HasChildren = true;

                            //TODO: TIM Can you help with this Tree Service URL to list the static CSS file as the child node?
                            xFileNode.Source = GetTreeServiceUrl(orgPath + itemInTree.Text);

                        }
                    }


                    //JS Action link...
                    //TODO: JS Action not firing - WHY?!
                    if (orgPath != string.Empty)
                    {
                        xFileNode.Action = "javascript:openDyanmicCSSFileEditor('" + orgPath + file.Name + "');";
                    }
                    else
                    {
                        xFileNode.Action = "javascript:openDyanmicCSSFileEditor('" + file.Name + "');";
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

        protected override void OnAfterNodeRender(ref XmlTree sender, ref XmlTreeNode node, EventArgs e)
        {
            
        }
    }

    
}




