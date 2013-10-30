using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using Optimus.Helpers;
using umbraco.cms.presentation.Trees;
using Umbraco.Core.IO;
using Optimus.Extensions;
using umbraco.interfaces;
using umbraco.BusinessLogic.Actions;
using Optimus.Enums;

namespace Optimus.Umbraco.Trees
{
    public abstract class BaseDynamicFileTree : BaseTree
    {
        public abstract TranslatorType TranslatorType { get; }

        public BaseDynamicFileTree(string application) : base(application) { }

        public override void RenderJS(ref StringBuilder Javascript)
        {
            Javascript.Append(
                TranslatorType == TranslatorType.StyleSheet ?
            @"
                function openDyanmicCSSFileEditor(fileName, compiled) {
                    UmbClientMgr.contentFrame('../App_Plugins/Optimus/Pages/FileEditor.aspx?file='+ fileName + '&path=/css/&compiled=' + compiled);
                }"
            :
             @"
                function openDyanmicScriptFileEditor(fileName, compiled) {
                    UmbClientMgr.contentFrame('../App_Plugins/Optimus/Pages/FileEditor.aspx?file='+ fileName + '&path=/scripts/&compiled=' + compiled);
                }"
            );
        }

        public override void Render(ref XmlTree tree)
        {
            string FilePath = TranslatorType == Enums.TranslatorType.StyleSheet ? "/css/" : "/scripts/";
            string orgPath = String.Empty;
            string path = String.Empty;

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

            DirectoryInfo dirInfo = new DirectoryInfo(path);
            DirectoryInfo[] dirInfos = dirInfo.GetDirectories();
            var allowedExts = new Translation.Core().GetPossibleExtensions(TranslatorType).ToArray();

            var args = new TreeEventArgs(tree);
            OnBeforeTreeRender(dirInfo, args);

            foreach (DirectoryInfo dir in dirInfos)
            {
                if ((dir.Attributes & FileAttributes.Hidden) == 0)
                {
                    XmlTreeNode xDirNode = XmlTreeNode.Create(this);
                    xDirNode.NodeID = orgPath + dir.Name;
                    xDirNode.NodeType = TranslatorType == Enums.TranslatorType.StyleSheet ? "initstylesheetsNew" : "initscriptsNew";
                    xDirNode.Menu = new List<IAction>(new IAction[] { ActionDelete.Instance, ContextMenuSeperator.Instance, ActionNew.Instance, ContextMenuSeperator.Instance, ActionRefresh.Instance });
                    xDirNode.Text = dir.Name;
                    xDirNode.Source = GetTreeServiceUrl(orgPath + dir.Name);
                    if (CompatibilityHelper.IsVersion7OrNewer)
                        xDirNode.Icon = "icon-folder";
                    else
                        xDirNode.Icon = FolderIcon;
                    xDirNode.OpenIcon = FolderIconOpen;
                    xDirNode.HasChildren = dir.GetFiles().Length > 0 || dir.GetDirectories().Length > 0;

                    OnRenderFolderNode(ref xDirNode);
                    OnBeforeNodeRender(ref tree, ref xDirNode, EventArgs.Empty);
                    if (xDirNode != null)
                    {
                        tree.Add(xDirNode);
                        OnAfterNodeRender(ref tree, ref xDirNode, EventArgs.Empty);
                    }
                }
            }

            FileInfo[] fileInfo = dirInfo.GetFiles("*.*");
            foreach (FileInfo file in fileInfo)
            {
                if ((file.Attributes & FileAttributes.Hidden) == 0 && allowedExts.Contains(file.Extension))
                {
                    XmlTreeNode xFileNode = XmlTreeNode.Create(this);
                    xFileNode.NodeID = orgPath + file.Name;
                    xFileNode.Text = file.Name;
                    xFileNode.Icon = new Optimus.Translation.Core().GetTranslatorTreeIconPath(file.Name);
                    xFileNode.OpenIcon = "doc.gif";
                    xFileNode.Menu = new List<IAction> { ActionDelete.Instance };
                    xFileNode.NodeType = TranslatorType == Enums.TranslatorType.StyleSheet ? "initstylesheetsNew" : "initscriptsNew";

                    if (string.IsNullOrEmpty(xFileNode.Action))
                    {
                        if (orgPath != string.Empty)
                        {
                            xFileNode.Action = TranslatorType == Enums.TranslatorType.StyleSheet ?
                                "javascript:openDyanmicCSSFileEditor('" + orgPath + file.Name + "', 'false');" :
                                "javascript:openDyanmicScriptFileEditor('" + orgPath + file.Name + "', 'false');";
                        }
                        else
                        {
                            xFileNode.Action = TranslatorType == Enums.TranslatorType.StyleSheet ?
                                "javascript:openDyanmicCSSFileEditor('" + file.Name + "', 'false');" :
                                "javascript:openDyanmicScriptFileEditor('" + file.Name + "', 'false');";
                        }
                    }

                    OnRenderFileNode(ref xFileNode);
                    OnBeforeNodeRender(ref tree, ref xFileNode, EventArgs.Empty);
                    if (xFileNode != null)
                    {
                        tree.Add(xFileNode);
                        OnAfterNodeRender(ref tree, ref xFileNode, EventArgs.Empty);
                    }
                }
            }
            OnAfterTreeRender(dirInfo, args);
        }

        /// <summary>
        /// Inheritors can override this method to modify the file node that is created.
        /// </summary>
        /// <param name="xNode"></param>
        protected virtual void OnRenderFileNode(ref XmlTreeNode xNode) { }

        /// <summary>
        /// Inheritors can override this method to modify the folder node that is created.
        /// </summary>
        /// <param name="xNode"></param>
        protected virtual void OnRenderFolderNode(ref XmlTreeNode xNode) { }

        protected override void CreateRootNode(ref XmlTreeNode rootNode)
        {
            rootNode.Icon = ".sprTreeFolder";
            rootNode.OpenIcon = ".sprTreeFolder_o";
            rootNode.NodeID = "init";
            rootNode.NodeType = rootNode.NodeID + TreeAlias;
            rootNode.Menu = new List<IAction> { ActionNew.Instance, ActionRefresh.Instance };
        }
    }
}