
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
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

        public BaseDynamicFileTree(string application)
            : base(application)
        {
        }

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
            if (String.IsNullOrEmpty(this.NodeKey))
            {
                //Create Top Level SASS or LESS nodes
                TopLevelNodes(ref tree);
            }
            //else
            //{
            //    //A SASS or LESS file has been selected with child static CSS file
            //    CreateChildNodes(ref tree);
            //}
        }


        protected void TopLevelNodes(ref XmlTree tree)
        {
            string orgPath  = string.Empty;
            string path     = string.Empty;
            string FilePath = TranslatorType == Enums.TranslatorType.StyleSheet ? "/css/" : "/scripts/";
            path            = IOHelper.MapPath(FilePath);


            DirectoryInfo dirInfo       = new DirectoryInfo(path);
            DirectoryInfo[] dirInfos    = dirInfo.GetDirectories();

            var args = new TreeEventArgs(tree);
            OnBeforeTreeRender(dirInfo, args);

            //Loop through files
            var fileInfo = dirInfo.GetFilesByExtensions(new Translation.Core().GetPossibleExtensions(TranslatorType).ToArray());

            foreach (FileInfo file in fileInfo)
            {
                if ((file.Attributes & FileAttributes.Hidden) == 0)
                {
                    XmlTreeNode xFileNode   = XmlTreeNode.Create(this);
                    xFileNode.NodeID        = orgPath + file.Name;
                    xFileNode.Text          = file.Name;
                    xFileNode.OpenIcon      = "doc.gif";
                    xFileNode.Menu          = new List<IAction> { ActionDelete.Instance };
                    xFileNode.NodeType      = TranslatorType == Enums.TranslatorType.StyleSheet ? "initstylesheetsNew" : "initscriptsNew";
                    xFileNode.Icon          = new Optimus.Translation.Core().GetTranslatorTreeIconPath(file.Name);

                    ////Check for compiled version of file
                    //var fileName        = file.FullName.TrimStart('/');
                    //var staticFileName  = fileName.Replace(".scss", ".css").Replace(".sass", ".css").Replace(".less", ".css");

                    ////Check if compileFileName exists
                    //if (System.IO.File.Exists(staticFileName))
                    //{
                    //    //Add a child node to the current node to display the static CSS file
                    //    xFileNode.HasChildren   = true;
                    //    var functionToCall      = "javascript:openDyanmicCSSFileEditor('" + orgPath + staticFileName + "', true')";
                    //    var nodeSourceURL       = TreeUrlGenerator.GetServiceUrl(-1, "stylesheetsNew", false, false, "settings", orgPath + staticFileName, functionToCall);
                    //    xFileNode.Source        = nodeSourceURL;
                    //}

                    //CSS Action link...
                    //Only run/set an action if it's empty (as in not been set above as static/compiled file)
                    if (string.IsNullOrEmpty(xFileNode.Action))
                    {
                        if (orgPath != string.Empty)
                        {
                            xFileNode.Action =  TranslatorType == Enums.TranslatorType.StyleSheet ?
                                "javascript:openDyanmicCSSFileEditor('" + orgPath + file.Name + "', false');" :
                                "javascript:openDyanmicScriptFileEditor('" + orgPath + file.Name + "', false');"; ;
                        }
                        else
                        {
                            xFileNode.Action = TranslatorType == Enums.TranslatorType.StyleSheet ?
                                "javascript:openDyanmicCSSFileEditor('" + file.Name + "', 'false');" :
                                "javascript:openDyanmicScriptFileEditor('" + file.Name + "', 'false');"; ;
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