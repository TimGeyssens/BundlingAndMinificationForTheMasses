using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using Umbraco.Core;
using umbraco;
using umbraco.BasePages;
using umbraco.BusinessLogic;
using umbraco.interfaces;
using umbraco.cms.businesslogic.packager.standardPackageActions;

namespace BundlingAndMinificationForTheMasses.Umbraco.Installer
{
    public class AddUIPackageAction : IPackageAction 
    {
        //Set the UI.xml full path
        const string FULL_PATH = "/umbraco/config/create/UI.xml";

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddTree";
        }

        /// <summary>
        /// Append the xmlData nodes to the UI.xml file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the UI.xml file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Select new nodes from the supplied xmlData
            XmlNodeList newNodes = xmlData.SelectNodes("//nodeType");

            //Check for new nodes to insert
            if (newNodes.Count == 0) return result;

            //Open the UI.xml file
            XmlDocument document = xmlHelper.OpenAsXmlDocument(FULL_PATH);

            //Select root node in the ui.xml file for append new nodes
            XmlNode rootNode = document.SelectSingleNode("//createUI");

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Proceed for each new node fom supplied xmlData
            foreach (XmlNode newNode in newNodes)
            {
                //Set insert node default true
                bool insertNode = true;

                //Look for existing nodes with same alias of new node
                if (rootNode.HasChildNodes)
                {
                    //Get alias of new node
                    string alias = newNode.Attributes["alias"].Value;

                    //Look for existing nodeType nodes
                    XmlNode node = rootNode.SelectSingleNode(
                        String.Format("//nodeType[@alias = '{0}']", alias));

                    //If alias already exists 
                    if (node != null)
                    {
                        //Cancel insert node operation
                        insertNode = false;
                    }
                }
                //Check for insert flag
                if (insertNode)
                {
                    //Append new node to createUI
                    rootNode.AppendChild(document.ImportNode(newNode, true));

                    //Mark document modified
                    modified = true;
                }
            }
            //Check for modified document
            if (modified)
            {
                //Set document node indent in a human readable form
                document.Normalize();
                try
                {
                    //Save the Rewrite config file with the new rewerite rule
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at execute AddTreeNodeType package action: " + e.Message;
                    Log.Add(LogTypes.Error, getUser(), -1, message);
                }
            }
            return result;
        }

        public bool Undo(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Select undo nodes from the supplied xmlData
            XmlNodeList undoNodes = xmlData.SelectNodes("//nodeType");

            //Check for undo nodes to remove
            if (undoNodes.Count == 0) return result;

            //Open the UI.xml file
            XmlDocument document = xmlHelper.OpenAsXmlDocument(FULL_PATH);

            //Select root node in the ui.xml file for remove undo nodes
            XmlNode rootNode = document.SelectSingleNode("//createUI");

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Proceed for each undo node fom supplied xmlData
            foreach (XmlNode undoNode in undoNodes)
            {
                //Look for existing nodes with same alias of undo node
                if (rootNode.HasChildNodes)
                {
                    //Get alias of undo node
                    string alias = undoNode.Attributes["alias"].Value;

                    //Look for existing nodeType node with this alias
                    var xmlNodeList = rootNode.SelectNodes(String.Format("//nodeType[@alias = '{0}']", alias));
                    if (xmlNodeList != null)
                    {
                        foreach (XmlNode existingNode in xmlNodeList)
                        {
                            //Remove existing node from createUI
                            rootNode.RemoveChild(existingNode);
                            modified = true;
                        }
                    }
                }
            }
            if (modified)
            {
                //Set document node indent in a human readable form
                document.Normalize();
                try
                {
                    //Save the Rewrite config file with the new rewerite rule
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at undo AddTreeNodeType package action: " + e.Message;
                    Log.Add(LogTypes.Error, getUser(), -1, message);
                }
            }
            return result;
        }

        public XmlNode SampleXml()
        {
            return umbraco.cms.businesslogic.packager.standardPackageActions.helper.parseStringToXmlNode(
                "<Action runat=\"install\" alias=\"Umbundle.AddTree\">"
                    + "<nodeType alias=\"initrss\">"
                        + "<header>RSS Feed</header>"
                        + "<usercontrol>/create/simple.ascx</usercontrol>"
                        + "<tasks><create assembly=\"tswe.rss\" type=\"rssCreateTasks\" /></tasks>"
                    + "</nodeType>"
                    + "<nodeType alias=\"rssInstance\">"
                        + "<header>RSS Feed</header>"
                        + "<usercontrol>/create/simple.ascx</usercontrol>"
                        + "<tasks><delete assembly=\"tswe.rss\" type=\"rssCreateTasks\" /></tasks>"
                    + "</nodeType>"
                + "</Action>"
            );
        }

        private User getUser()
        {
            int id = BasePage.GetUserId(BasePage.umbracoUserContextID);
            id = (id < 0) ? 0 : id;
            return User.GetUser(id);
        }
    }

    public class AddXMLPackageAction : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.AddXmlFragment";
        }

        public bool Execute(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            var file = xmlData.Attributes.GetNamedItem("file").Value;

            //The config file we want to modify
            string configFileName = VirtualPathUtility.ToAbsolute(file);

            //Xpath expression to determine the rootnode
            string xPath = xmlData.Attributes.GetNamedItem("xpath").Value;

            //Holds the position where we want to insert the xml Fragment
            string position = xmlData.Attributes.GetNamedItem("position").Value;

            //Open the config file
            XmlDocument configDocument = umbraco.xmlHelper.OpenAsXmlDocument(configFileName);

            //The xml fragment we want to insert
            XmlNode xmlFragment = xmlData.SelectSingleNode("./*");

            //Select rootnode using the xpath
            XmlNode rootNode = configDocument.SelectSingleNode(xPath);

            //Check if XML already exists
            var checkExists = configDocument.SelectSingleNode(".//" + xmlFragment.SelectSingleNode(".").Name.ToString());

            if (checkExists == null)
            {
                if (position.Equals("beginning", StringComparison.CurrentCultureIgnoreCase))
                {
                    //Add xml fragment to the beginning of the selected rootnode
                    rootNode.PrependChild(configDocument.ImportNode(xmlFragment, true));
                }
                else
                {
                    //add xml fragment to the end of the selected rootnode
                    rootNode.AppendChild(configDocument.ImportNode(xmlFragment, true));
                }

                //Save the modified document
                configDocument.Save(HttpContext.Current.Server.MapPath(configFileName));

                result = true;
            }
            else
            {
                result = false;
            }

            return result;
        }

        public bool Undo(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            var file = xmlData.Attributes.GetNamedItem("file").Value;

            //The config file we want to modify
            string configFileName = VirtualPathUtility.ToAbsolute(file);

            //Xpath expression to determine the rootnode
            string xPath = xmlData.Attributes.GetNamedItem("xpath").Value;

            //Holds the position where we want to insert the xml Fragment
            string position = xmlData.Attributes.GetNamedItem("position").Value;

            //Open the config file
            XmlDocument configDocument = umbraco.xmlHelper.OpenAsXmlDocument(configFileName);

            //Select the node to remove using the xpath
            XmlNode node = configDocument.SelectSingleNode(xPath);

            //Remove the node 
            if (node != null)
            {
                node.ParentNode.RemoveChild(node);
            }

            //Save the modified document
            configDocument.Save(HttpContext.Current.Server.MapPath(configFileName));

            result = true;

            return result;
        }

        public XmlNode SampleXml()
        {
            string sample =
                "<Action runat=\"install\" undo=\"false\" alias=\"Umbundle.AddXmlFragment\" file=\"~/config/umbracosettings.config\" xpath=\"//help\" position=\"end\">" +
                    "<link application=\"content\" applicationUrl=\"dashboard.aspx\"  language=\"en\" userType=\"Administrators\" helpUrl=\"http://www.xyz.no?{0}/{1}/{2}/{3}\" />" +
                "</Action>";

            return umbraco.cms.businesslogic.packager.standardPackageActions.helper.parseStringToXmlNode(sample);
        }
    }
}