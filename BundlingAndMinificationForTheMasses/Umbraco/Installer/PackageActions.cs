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
using System.Xml.Linq;

namespace Optimus.Umbraco.Installer
{
    using System.Configuration;
    using System.IO;
    using System.Reflection;
    using System.Web.Configuration;
    using System.Xml.XPath;

    using global::Umbraco.Core.Logging;

    using umbraco.cms.businesslogic.packager.standardPackageActions;
    using umbraco.NodeFactory;
    using umbraco.presentation.translation;

    public class AddAssemblyBinding : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.AddAssemblyBinding";
        }

        public bool Execute(string packageName, XmlNode xmlData)
        {

            // Set result default to false
            bool result = false;

            // Set insert node default true
            bool insertNode = true;

            // Set modified document default to false
            bool modified = false;

            // Get attribute values of xmlData
            string name, publicKeyToken, oldVersion, newVersion;
            if (!this.GetAttribute(xmlData, "name", out name) || !this.GetAttribute(xmlData, "publicKeyToken", out publicKeyToken) || !this.GetAttribute(xmlData, "oldVersion", out oldVersion) || !this.GetAttribute(xmlData, "newVersion", out newVersion))
            {
                return result;
            }

            string filename = HttpContext.Current.Server.MapPath("/web.config");
            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("bindings", "urn:schemas-microsoft-com:asm.v1");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode("//bindings:assemblyBinding", nsmgr);
            if (nav == null)
            {
                throw new Exception("Invalid Configuration File");
            }

            // Look for existing nodes with same path like the new node
            if (nav.HasChildren)
            {
                // Look for existing nodeType nodes
                var node =
                    nav.SelectSingleNode(string.Format("./bindings:dependentAssembly/bindings:assemblyIdentity[@publicKeyToken = '{0}' and @name='{1}']", publicKeyToken, name), nsmgr);

                // If path already exists 
                if (node != null)
                {
                    if (node.MoveToNext())
                    {
                        if (node.MoveToAttribute("oldVersion", string.Empty))
                        {
                            node.SetValue(oldVersion);
                        }

                        if (node.MoveToParent())
                        {
                            if (node.MoveToAttribute("newVersion", string.Empty))
                            {
                                node.SetValue(newVersion);
                            }
                        }

                        // Cancel insert node operation
                        insertNode = false;

                        // Lets update versions instead
                        modified = true;
                    }
                    else
                    {
                        //Log error message
                        string message = "Error at AddAssemblyBinding package action: "
                             + "Updating \"" + name + "\" assembly binding failed.";
                        LogHelper.Warn(typeof(AddAssemblyBinding), message);                     
                    }
                }
            }

            // Check for insert flag
            if (insertNode)
            {
                var newNodeContent =
                    string.Format(
                        "<dependentAssembly><assemblyIdentity name=\"{0}\" publicKeyToken=\"{1}\" culture=\"neutral\" />"
                        + "<bindingRedirect oldVersion=\"{2}\" newVersion=\"{3}\" /></dependentAssembly>",
                        name,
                        publicKeyToken,
                        oldVersion,
                        newVersion);

                nav.AppendChild(newNodeContent);

                modified = true;

            }

            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddAssemblyBinding package action: " + e.Message;
                    LogHelper.Error(typeof(AddAssemblyBinding), message, e);
                }
            }
            return result;

        }

        public XmlNode SampleXml()
        {
            string str = "<Action runat=\"install\" undo=\"false\" alias=\"Umbundle.AddAssemblyBindin\">" +
                            "<dependentAssembly>" +
                                "<assemblyIdentity name=\"newone\" publicKeyToken=\"608967\" />" +
                                "<bindingRedirect oldVersion=\"1\" newwVersion=\"2\" />" +
                            "</dependentAssembly>" +
                         "</Action>";
            return helper.parseStringToXmlNode(str);
        }

        public bool Undo(string packageName, XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddAssemblyBinding package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddAssemblyBinding), message);
            }
            return result;
        }

    }
 
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
            //var checkExists = configDocument.SelectSingleNode(".//" + xmlFragment.SelectSingleNode(".").Name.ToString());
            
            //if (checkExists == null)
            //{
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
            //}
            //else
            //{
            //    result = false;
            //}

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

    public class SetAttributeValue : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.SetAttributeValue";
        }

        public bool Execute(string packageName, System.Xml.XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;


            //The config file we want to modify
            string configFileName = VirtualPathUtility.ToAbsolute(Helpers.XmlHelper.GetAttributeValueFromNode(xmlData, "file"));

            //Xpath expression to determine the rootnode
            string xPath = Helpers.XmlHelper.GetAttributeValueFromNode(xmlData, "xpath");

            //Xpath expression to determine the attributeName we want to select
            string attributeName = Helpers.XmlHelper.GetAttributeValueFromNode(xmlData, "attributeName");

            //Xpath expression to determine the attributeValue we want to select
            string attributeValue = Helpers.XmlHelper.GetAttributeValueFromNode(xmlData, "attributeValue");

            //Open the config file
            XmlDocument configDocument = umbraco.xmlHelper.OpenAsXmlDocument(configFileName);

            //Select rootnode using the xpath
            XmlNode rootNode = configDocument.SelectSingleNode(xPath);

            //If the rootnode != null continue
            if (rootNode != null)
            {
                if (rootNode.Attributes[attributeName] == null)
                {
                    //Attribute doesn't exists, create it and set the attribute value
                    XmlAttribute att = umbraco.xmlHelper.addAttribute(configDocument, attributeName, attributeValue);
                    rootNode.Attributes.Append(att);
                }
                else
                {
                    //Set attribute value
                    rootNode.Attributes[attributeName].Value = attributeValue;
                }

                //Save the modified document
                configDocument.Save(HttpContext.Current.Server.MapPath(configFileName));
                result = true;
            }
            return result;
        }

        public System.Xml.XmlNode SampleXml()
        {
            string sample = "<Action runat=\"install\" undo=\"false\" alias=\"Umbundle.SetAttributeValue\" file=\"~/web.config\" xpath=\"//system.webServer/modules\" attributeName=\"runAllManagedModulesForAllRequests\" attributeValue=\"true\"/>";
            return umbraco.cms.businesslogic.packager.standardPackageActions.helper.parseStringToXmlNode(sample);
        }

        /// <summary>
        /// User RemoveXMLFragment action to uninstall.
        /// </summary>
        /// <param name="packageName">Name of the package.</param>
        /// <param name="xmlData">The XML data.</param>
        /// <returns></returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }
    }

    public class AddHttpHandler : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "~/web.config";

        #region IPackageAction Members

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddHttpHandler";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Get attribute values of xmlData
            string position, path, verb, type, validate, name, preCondition;
            position = getAttributeDefault(xmlData, "position", null);
            if (!getAttribute(xmlData, "path", out path)) return result;
            if (!getAttribute(xmlData, "verb", out verb)) return result;
            if (!getAttribute(xmlData, "type", out type)) return result;
            validate = getAttributeDefault(xmlData, "validate", null);
            name = getAttributeDefault(xmlData, "name", null);
            preCondition = getAttributeDefault(xmlData, "preCondition", null);

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));

            //Set modified document default to false
            bool modified = false;

            #region IIS6

            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode("//configuration/system.web/httpHandlers");

            //Set insert node default true
            bool insertNode = true;

            //Check for rootNode exists
            if (rootNode != null)
            {
                //Look for existing nodes with same path like the new node
                if (rootNode.HasChildNodes)
                {
                    //Look for existing nodeType nodes
                    XmlNode node = rootNode.SelectSingleNode(
                        String.Format("add[@path = '{0}']", path));

                    //If path already exists 
                    if (node != null)
                    {
                        //Cancel insert node operation
                        insertNode = false;
                    }
                }
                //Check for insert flag
                if (insertNode)
                {
                    //Create new node with attributes
                    XmlNode newNode = document.CreateElement("add");
                    newNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "path", path));
                    newNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "verb", verb));
                    newNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "type", type));

                    //Attribute validate is optional
                    if (validate != null)
                        newNode.Attributes.Append(
                            xmlHelper.addAttribute(document, "validate", validate));

                    //Select for new node insert position
                    if (position == null || position == "end")
                    {
                        //Append new node at the end of root node
                        rootNode.AppendChild(newNode);

                        //Mark document modified
                        modified = true;
                    }
                    else if (position == "beginning")
                    {
                        //Prepend new node at the beginnig of root node
                        rootNode.PrependChild(newNode);

                        //Mark document modified
                        modified = true;
                    }
                }
            }

            #endregion

            #region IIS7

            //Set insert node default true
            insertNode = true;

            rootNode = document.SelectSingleNode("//configuration/system.webServer/handlers");

            if (rootNode != null && name != null)
            {
                //Look for existing nodes with same path like the new node
                if (rootNode.HasChildNodes)
                {
                    //Look for existing nodeType nodes
                    XmlNode node = rootNode.SelectSingleNode(
                        String.Format("add[@name = '{0}']", name));

                    //If path already exists 
                    if (node != null)
                    {
                        //Cancel insert node operation
                        insertNode = false;
                    }
                }
                //Check for insert flag
                if (insertNode)
                {
                    //Create new remove node with attributes
                    XmlNode newRemoveNode = document.CreateElement("remove");
                    newRemoveNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "name", name));

                    //Create new add node with attributes
                    XmlNode newAddNode = document.CreateElement("add");
                    newAddNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "name", name));
                    newAddNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "path", path));
                    newAddNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "verb", verb));
                    newAddNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "type", type));
                    newAddNode.Attributes.Append(
                        xmlHelper.addAttribute(document, "preCondition", preCondition ?? "integratedMode"));

                    //Select for new node insert position
                    if (position == null || position == "end")
                    {
                        //Append new node at the end of root node
                        rootNode.AppendChild(newRemoveNode);
                        rootNode.AppendChild(newAddNode);

                        //Mark document modified
                        modified = true;
                    }
                    else if (position == "beginning")
                    {
                        //Prepend new node at the beginnig of root node
                        rootNode.PrependChild(newAddNode);
                        rootNode.PrependChild(newRemoveNode);

                        //Mark document modified
                        modified = true;
                    }
                }
            }

            #endregion

            //Check for modified document
            if (modified)
            {
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
                    string message = "Error at execute AddHttpHandler package action: " + e.Message;
                    Log.Add(LogTypes.Error, getUser(), -1, message);
                }
            }
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Get attribute values of xmlData
            string path, name;
            if (!getAttribute(xmlData, "path", out path)) return result;
            name = getAttributeDefault(xmlData, "name", null);

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));

            //Set modified document default to false
            bool modified = false;

            #region IIS6

            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode("//configuration/system.web/httpHandlers");

            //Check for rootNode exists
            if (rootNode != null)
            {
                //Look for existing nodes with same path of undo attribute
                if (rootNode.HasChildNodes)
                {
                    //Look for existing add nodes with attribute path
                    foreach (XmlNode existingNode in rootNode.SelectNodes(
                        String.Format("add[@path = '{0}']", path)))
                    {
                        //Remove existing node from root node
                        rootNode.RemoveChild(existingNode);
                        modified = true;
                    }
                }
            }

            #endregion

            #region IIS7

            //Select root node in the web.config file for insert new nodes
            rootNode = document.SelectSingleNode("//configuration/system.webServer/handlers");

            //Check for rootNode exists
            if (rootNode != null && name != null)
            {
                //Look for existing nodes with same path of undo attribute
                if (rootNode.HasChildNodes)
                {
                    //Look for existing remove nodes with attribute path
                    foreach (XmlNode existingNode in rootNode.SelectNodes(String.Format("remove[@name = '{0}']", name)))
                    {
                        //Remove existing node from root node
                        rootNode.RemoveChild(existingNode);
                        modified = true;
                    }

                    //Look for existing add nodes with attribute path
                    foreach (XmlNode existingNode in rootNode.SelectNodes(String.Format("add[@name = '{0}']", name)))
                    {
                        //Remove existing node from root node
                        rootNode.RemoveChild(existingNode);
                        modified = true;
                    }
                }
            }

            #endregion

            if (modified)
            {
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
                    string message = "Error at undo AddHttpHandler package action: " + e.Message;
                    Log.Add(LogTypes.Error, getUser(), -1, message);
                }
            }
            return result;
        }

        /// <summary>
        /// Get the current user, or when unavailable admin user
        /// </summary>
        /// <returns>The current user</returns>
        private User getUser()
        {
            int id = BasePage.GetUserId(BasePage.umbracoUserContextID);
            id = (id < 0) ? 0 : id;
            return User.GetUser(id);
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool getAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddHttpModule package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                Log.Add(LogTypes.Error, getUser(), -1, message);
            }
            return result;
        }

        /// <summary>
        /// Get an optional named attribute from xmlData root node
        /// when attribute is unavailable, return the default value
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="defaultValue">The default value</param>
        /// <returns>The attribute value or the default value</returns>
        private string getAttributeDefault(XmlNode xmlData, string attribute, string defaultValue)
        {
            //Set result default value
            string result = defaultValue;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get available xml attribute value
                result = xmlAttribute.Value;
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return umbraco.cms.businesslogic.packager.standardPackageActions.helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"AddHttpHandler\" "
                    + "position=\"beginning/end\" "
                    + "path=\"umbraco/channels.aspx\" "
                    + "verb=\"*\" "
                    + "type=\"umbraco.presentation.channels.api, umbraco\" "
                    + "name=\"UmbracoChannels\" "
                    + "preCondition=\"integratedMode\" "
                    + "validate=\"True/False\" />"
            );
        }

        #endregion
    }

    public class AddNamespace : IPackageAction
    {
        #region IPackageAction AddNamespace

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddNamespace";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Get attribute values of xmlData
            string position, nameSpace, file, xPath;
            position = GetAttributeDefault(xmlData, "position", null);
            if (!GetAttribute(xmlData, "namespace", out nameSpace) || !GetAttribute(xmlData, "file", out file) || !GetAttribute(xmlData, "xpath", out xPath))
            {
                return result;
            }

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            string configFileName = VirtualPathUtility.ToAbsolute(file);
            document.Load(HttpContext.Current.Server.MapPath(configFileName));

            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode(xPath);

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Set insert node default true
            bool insertNode = true;

            //Check for namespaces node
            if (rootNode.SelectSingleNode("namespaces") == null)
            {
                //Create namespaces node
                var namespacesNode = document.CreateElement("namespaces");
                rootNode.AppendChild(namespacesNode);

                //Replace root node
                rootNode = namespacesNode;

                //Mark document modified
                modified = true;
            }
            else
            {
                //Replace root node
                rootNode = rootNode.SelectSingleNode("namespaces");
            }

            //Look for existing nodes with same path like the new node
            if (rootNode.HasChildNodes)
            {
                //Look for existing nodeType nodes
                XmlNode node = rootNode.SelectSingleNode(String.Format("//add[@namespace = '{0}']", nameSpace));

                //If path already exists 
                if (node != null)
                {
                    //Cancel insert node operation
                    insertNode = false;
                }
            }

            //Check for insert flag
            if (insertNode)
            {
                //Create new node with attributes
                XmlNode newNode = document.CreateElement("add");
                newNode.Attributes.Append(
                    XmlHelper.AddAttribute(document, "namespace", nameSpace));

                //Select for new node insert position
                if (position == null || position == "end")
                {
                    //Append new node at the end of root node
                    rootNode.AppendChild(newNode);

                    //Mark document modified
                    modified = true;
                }
                else if (position == "beginning")
                {
                    //Prepend new node at the beginnig of root node
                    rootNode.PrependChild(newNode);

                    //Mark document modified
                    modified = true;
                }
            }

            //Check for modified document
            if (modified)
            {
                try
                {
                    //Save the Rewrite config file with the new rewerite rule
                    document.Save(HttpContext.Current.Server.MapPath(configFileName));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at execute AddNamespace package action: " + e.Message;
                    LogHelper.Error(typeof(AddNamespace), message, e);
                }
            }
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            //Set result default to false
            bool result = false;

            //Get attribute values of xmlData
            string nameSpace, file, xPath;
            if (!GetAttribute(xmlData, "namespace", out nameSpace) || !GetAttribute(xmlData, "file", out file) || !GetAttribute(xmlData, "xpath", out xPath))
            {
                return result;
            }

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            string configFileName = VirtualPathUtility.ToAbsolute(file);
            document.Load(HttpContext.Current.Server.MapPath(configFileName));

            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode(xPath);

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Look for existing nodes with same path of undo attribute
            if (rootNode.HasChildNodes)
            {
                //Look for existing add nodes with attribute path
                foreach (XmlNode existingNode in rootNode.SelectNodes(
                   String.Format("//add[@namespace = '{0}']", nameSpace)))
                {
                    //Remove existing node from root node
                    rootNode.RemoveChild(existingNode);
                    modified = true;
                }
            }

            if (modified)
            {
                try
                {
                    //Save the Rewrite config file with the new rewerite rule
                    document.Save(HttpContext.Current.Server.MapPath(configFileName));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at undo AddNamespace package action: " + e.Message;
                    LogHelper.Error(typeof(AddNamespace), message, e);
                }
            }
            return result;
        }


        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddNamespace package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddNamespace), message);
            }
            return result;
        }

        /// <summary>
        /// Get an optional named attribute from xmlData root node
        /// when attribute is unavailable, return the default value
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="defaultValue">The default value</param>
        /// <returns>The attribute value or the default value</returns>
        private string GetAttributeDefault(XmlNode xmlData, string attribute, string defaultValue)
        {
            //Set result default value
            string result = defaultValue;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get available xml attribute value
                result = xmlAttribute.Value;
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case we are adding the System.Web.Optimization namespace
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddNamespace\" "
                    + "position=\"beginning/end\" "
                    + "namespace=\"System.Web.Optimization\""
                    + "xpath=\"//help\""
                    + " />");
        }

        #endregion
    }

    public class AddConfigSectionGroup : IPackageAction
    {
        #region IPackageAction AddConfigSectionGroup

        const string FULL_PATH = "/web.config";

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddConfigSectionGroup";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {            
            bool result = false;

            string name;
            if (!this.GetAttribute(xmlData, "name", out name))
            {
                return result;
            }
            var document = new XmlDocument { PreserveWhitespace = true };

            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));
            XmlNode rootNode = document.SelectSingleNode("//configSections");

            if (rootNode == null) return result;

            bool modified = false;

            if (rootNode.SelectSingleNode(string.Format("sectionGroup[@name = '{0}']", name)) == null)
            {
                XmlNode newNode = document.CreateElement("sectionGroup");
                newNode.Attributes.Append(
                    XmlHelper.AddAttribute(document, "name", name));
                rootNode.AppendChild(newNode);
                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));
                    result = true;
                }
                catch (Exception e)
                {
                    string message = "Error at execute AddConfigSectionGroup package action: " + e.Message;
                    LogHelper.Error(typeof(AddConfigSectionGroup), message, e);
                }
            }           
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            //Set result default to false

            return false;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddConfigSectionGroup package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddConfigSectionGroup), message);
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case we are adding the System.Web.Optimization namespace
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddConfigSectionGroup\" "
                    + "name=\"bundleTransformer\""
                    + " />");
        }

        #endregion
    }

    public class AddConfigSection : IPackageAction
    {
        #region IPackageAction AddConfigSection

        const string FULL_PATH = "/web.config";

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddConfigSection";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {                 
            bool result = false;

            string name, type, sectionGroup;
            if (!this.GetAttribute(xmlData, "name", out name) || !this.GetAttribute(xmlData, "type", out type))
            {
                return result;
            }

            this.GetAttribute(xmlData, "sectionGroup", out sectionGroup);

            var document = new XmlDocument { PreserveWhitespace = true };

            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));

            var xPath = "//configSections";

            if (!string.IsNullOrEmpty(sectionGroup))
            {
                xPath = string.Format("//configSections/sectionGroup[@name = '{0}']", sectionGroup);
            }

            XmlNode rootNode = document.SelectSingleNode(xPath);

            if (rootNode == null) return result;

            bool modified = false;

            if (rootNode.SelectSingleNode(string.Format("section[@name = '{0}']", name)) == null)
            {
                XmlNode newNode = document.CreateElement("section");
                newNode.Attributes.Append(
                    XmlHelper.AddAttribute(document, "name", name));
                newNode.Attributes.Append(
                    XmlHelper.AddAttribute(document, "type", type));
                //newNode.Attributes.Append(
                    //XmlHelper.AddAttribute(document, "requirePermission", requirePermission));
                rootNode.AppendChild(newNode);
                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));
                    result = true;
                }
                catch (Exception e)
                {
                    string message = "Error at execute AddConfigSection package action: " + e.Message;
                    LogHelper.Error(typeof(AddConfigSection), message, e);
                }
            }           
            return result;
  
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            bool result = false;

            string name, type, sectionGroup;
            if (!this.GetAttribute(xmlData, "name", out name) || !this.GetAttribute(xmlData, "type", out type))
            {
                return result;
            }

            this.GetAttribute(xmlData, "sectionGroup", out sectionGroup);

            var document = new XmlDocument { PreserveWhitespace = true };

            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));

            var xPath = "//configSections";

            if (!string.IsNullOrEmpty(sectionGroup))
            {
                xPath = string.Format("//configSections/sectionGroup[@name = '{0}']", sectionGroup);
            }

            XmlNode rootNode = document.SelectSingleNode(xPath);

            if (rootNode == null) return result;

            bool modified = false;

            if (rootNode.SelectSingleNode(string.Format("section[@name = '{0}']", name)) != null)
            {
                rootNode.RemoveChild(
                    rootNode.SelectSingleNode(string.Format("section[@name = '{0}']", name)));

                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));
                    result = true;
                }
                catch (Exception e)
                {
                    string message = "Error at execute AddConfigSection package action: " + e.Message;
                    LogHelper.Error(typeof(AddConfigSection), message, e);
                }
            }
            return result;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddConfigSection package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddConfigSection), message);
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case we are adding the System.Web.Optimization namespace
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddConfigSection\" "
                    + "name=\"core\" type=\"BundleTransformer.Core.Configuration.CoreSettings, BundleTransformer.Core\" sectionGroup=\"myGroup\""
                    + " />");
        }

        #endregion
    }

    public class AddBundleTransformer : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddBundleTransformer

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddBundleTransformer";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
             // Set result default to false
            bool result = false;

            // Set insert node default true
            bool insertNode = true;

            // Set modified document default to false
            bool modified = false;


            string filename = HttpContext.Current.Server.MapPath("/web.config");

            //check for Optimus v1 and v1.1 BundleTransformer config which didn't have the namespace and fix if required
            XmlDocument documentCheck = new XmlDocument();
            try
            {
                documentCheck.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }
            XmlNode rootNode = documentCheck.SelectSingleNode("//bundleTransformer");
            if (rootNode != null)
            {
                rootNode.Attributes.Append(
                    XmlHelper.AddAttribute(documentCheck, "xmlns", "http://tempuri.org/BundleTransformer.Configuration.xsd"));
                documentCheck.Save(filename);
            }

            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("transformer", "http://tempuri.org/BundleTransformer.Configuration.xsd");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode("//transformer:bundleTransformer", nsmgr);

            if (nav == null)
            {
                nav = document.CreateNavigator().SelectSingleNode("//configuration");
                if (nav != null)
                {
                    nav.AppendChildElement(
                        nav.Prefix,
                        "bundleTransformer",
                        "http://tempuri.org/BundleTransformer.Configuration.xsd",
                        null);
                    modified = true;
                }
            }

            var coreNode = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core", nsmgr);
            if (coreNode == null)
            {
                coreNode = nav.SelectSingleNode("//transformer:bundleTransformer", nsmgr);
                coreNode.AppendChild("<core/>");
                modified = true;
            }
            var cssNode = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:css", nsmgr);
            if (cssNode == null)
            {
                cssNode = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core", nsmgr);
                cssNode.AppendChild("<css/>");
                modified = true;
            }
            var cssNodeTranslators = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:css/transformer:translators", nsmgr);
            if (cssNodeTranslators == null)
            {
                cssNodeTranslators = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:css", nsmgr);
                cssNodeTranslators.AppendChild("<translators/>");
                modified = true;
            }
            var cssNodeMinifiers = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:css/transformer:minifiers", nsmgr);
            if (cssNodeMinifiers == null)
            {
                cssNodeMinifiers = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:css", nsmgr);
                cssNodeMinifiers.AppendChild("<minifiers/>");
                modified = true;
            }
            var jsNode = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:js", nsmgr);
            if (jsNode == null)
            {
                jsNode = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core", nsmgr);
                jsNode.AppendChild("<js/>");
                modified = true;
            }
            var jsNodeTranslators = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:js/transformer:translators", nsmgr);
            if (jsNodeTranslators == null)
            {
                jsNodeTranslators = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:js", nsmgr);
                jsNodeTranslators.AppendChild("<translators/>");
                modified = true;
            }
            var jsNodeMinifiers = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:js/transformer:minifiers", nsmgr);
            if (jsNodeMinifiers == null)
            {
                jsNodeMinifiers = nav.SelectSingleNode("//transformer:bundleTransformer/transformer:core/transformer:js", nsmgr);
                jsNodeMinifiers.AppendChild("<minifiers/>");
                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddBundleTransformer package action: " + e.Message;
                    LogHelper.Error(typeof(AddBundleTransformer), message, e);
                }
            }

            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddBundleTransformer\" />");
        }

        #endregion
    }

    public class AddBundleTransformerProvider: IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddBundleTransformerProvider

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddBundleTransformerProvider";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            // Set result default to false
            bool result = false;

            // Set insert node default true
            bool insertNode = true;

            // Set modified document default to false
            bool modified = false;


            string filename = HttpContext.Current.Server.MapPath("/web.config");

            //Get attribute values of xmlData
            string addType, name, type, enabled;
            if (!this.GetAttribute(xmlData, "addType", out addType) || !this.GetAttribute(xmlData, "name", out name) || !this.GetAttribute(xmlData, "type", out type))
            {
                return result;
            }

            if (!this.GetAttribute(xmlData, "enabled", out enabled))
            {
                enabled = string.Empty;
            }

            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("transformer", "http://tempuri.org/BundleTransformer.Configuration.xsd");

            var xpath = string.Empty;

            switch (addType)
            {
                case "css-minifier":
                    xpath = "//transformer:bundleTransformer/transformer:core/transformer:css/transformer:minifiers";
                    break;
                case "css-translator":
                    xpath = "//transformer:bundleTransformer/transformer:core/transformer:css/transformer:translators";
                    break;
                case "js-minifier":
                    xpath = "//transformer:bundleTransformer/transformer:core/transformer:js/transformer:minifiers";
                    break;
                case "js-translator":
                    xpath = "//transformer:bundleTransformer/transformer:core/transformer:js/transformer:translators";
                    break;
            }

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode(xpath, nsmgr);
            if (nav == null)
            {
                throw new Exception("Invalid Configuration File");
            }

            // Look for existing nodes with same path like the new node
            if (nav.HasChildren)
            {
                // Look for existing nodeType nodes
                var node =
                    nav.SelectSingleNode(
                        string.Format("./transformer:add[@type = '{0}' and @name='{1}']", type, name),
                        nsmgr);

                // If path already exists 
                if (node != null)
                {
                    insertNode = false;
                }
            }
            // Check for insert flag
            if (insertNode)
            {
                var newNodeContent = !string.IsNullOrEmpty(enabled) ? string.Format("<add name=\"{0}\" type=\"{1}\" enabled=\"{2}\" />", name, type, enabled) : string.Format("<add name=\"{0}\" type=\"{1}\" />", name, type);
                nav.AppendChild(newNodeContent);

                modified = true;
            }
            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddBundleTransformerProvider package action: " + e.Message;
                    LogHelper.Error(typeof(AddBundleTransformerProvider), message, e);
                }
            }
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddBundleTransformerProvider package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddBundleTransformerProvider), message);
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddBundleTransformerItem\" name=\"NullTranslator\" type\"BundleTransformer.Core.Translators.NullTranslator, BundleTransformer.Core\" addType=\"js-translator\" />");
        }

        #endregion
    }

    public class AddJSEngineSwitcher : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddJSEngineSwitcher

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddJSEngineSwitcher";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            // Set result default to false
            bool result = false;

            // Set modified document default to false
            bool modified = false;


            string filename = HttpContext.Current.Server.MapPath("/web.config");

            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("jsengine", "http://tempuri.org/JavaScriptEngineSwitcher.Configuration.xsd");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode("//jsengine:jsEngineSwitcher", nsmgr);

            if (nav == null)
            {
                nav = document.CreateNavigator().SelectSingleNode("//configuration");
                if (nav != null)
                {
                    nav.AppendChildElement(
                        nav.Prefix,
                        "jsEngineSwitcher",
                        "http://tempuri.org/JavaScriptEngineSwitcher.Configuration.xsd",
                        null);
                    modified = true;
                }
            }

            var coreNode = nav.SelectSingleNode("//jsengine:jsEngineSwitcher/jsengine:core", nsmgr);
            if (coreNode == null)
            {
                coreNode = nav.SelectSingleNode("//jsengine:jsEngineSwitcher", nsmgr);
                coreNode.AppendChild("<core/>");
                modified = true;
            }
            var enginesNode = nav.SelectSingleNode("//jsengine:jsEngineSwitcher/jsengine:core/jsengine:engines", nsmgr);
            if (enginesNode == null)
            {
                enginesNode = nav.SelectSingleNode("//jsengine:jsEngineSwitcher/jsengine:core", nsmgr);
                enginesNode.AppendChild("<engines/>");
                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddJSEngineSwitcher package action: " + e.Message;
                    LogHelper.Error(typeof(AddJSEngineSwitcher), message, e);
                }
            }

            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddBundleTransformer\" />");
        }

        #endregion
    }

    public class AddJSEngineSwitcherProvider : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddJSEngineSwitcherProvider

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddJSEngineSwitcherProvider";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            // Set result default to false
            bool result = false;

            // Set insert node default true
            bool insertNode = true;

            // Set modified document default to false
            bool modified = false;

            string filename = HttpContext.Current.Server.MapPath("/web.config");

            //Get attribute values of xmlData
            string name, type;
            if (!this.GetAttribute(xmlData, "name", out name) || !this.GetAttribute(xmlData, "type", out type))
            {
                return result;
            }


            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("jsengine", "http://tempuri.org/JavaScriptEngineSwitcher.Configuration.xsd");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode("//jsengine:jsEngineSwitcher/jsengine:core/jsengine:engines", nsmgr);
            if (nav == null)
            {
                throw new Exception("Invalid Configuration File");
            }

            // Look for existing nodes with same path like the new node
            if (nav.HasChildren)
            {
                // Look for existing nodeType nodes
                var node =
                    nav.SelectSingleNode(
                        string.Format("./jsengine:add[@type = '{0}' and @name='{1}']", type, name),
                        nsmgr);

                // If path already exists 
                if (node != null)
                {
                    insertNode = false;
                }
            }
            // Check for insert flag
            if (insertNode)
            {
                var newNodeContent = string.Format("<add name=\"{0}\" type=\"{1}\" />", name, type);

                nav.AppendChild(newNodeContent);

                modified = true;
            }
            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddJSEngineSwitcherProvider package action: " + e.Message;
                    LogHelper.Error(typeof(AddJSEngineSwitcherProvider), message, e);
                }
            }
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddJSEngineSwitcherProvider package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddJSEngineSwitcherProvider), message);
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddBundleTransformerItem\" name=\"NullTranslator\" type\"BundleTransformer.Core.Translators.NullTranslator, BundleTransformer.Core\" />");
        }

        #endregion
    }

    public class AddBundleTransformerJSEngine : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddBundleTransformerJSEngine

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.AddBundleTransformerJSEngine";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            // Set result default to false
            bool result = false;

            // Set insert node default true
            bool insertNode = true;

            // Set modified document default to false
            bool modified = false;


            string filename = HttpContext.Current.Server.MapPath("/web.config");

            //Get attribute values of xmlData
            string engine, name, updateOnlyString;
            bool updateOnly = false;

            if (!this.GetAttribute(xmlData, "engine", out engine) || !this.GetAttribute(xmlData, "name", out name))
            {
                return result;
            }

            this.GetAttribute(xmlData, "updateOnly", out updateOnlyString);
            bool.TryParse(updateOnlyString, out updateOnly);

            XmlDocument document = new XmlDocument();
            try
            {
                document.Load(filename);
            }
            catch (FileNotFoundException)
            {
            }

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(document.NameTable);
            nsmgr.AddNamespace("transformer", "http://tempuri.org/BundleTransformer.Configuration.xsd");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode(string.Format("//transformer:bundleTransformer/transformer:{0}", name), nsmgr);
            if (nav == null)
            {
                nav = document.CreateNavigator().SelectSingleNode("//transformer:bundleTransformer", nsmgr);
                if (nav != null  && !updateOnly)
                {
                    nav.AppendChild(string.Format("<{0}/>", name));
                    modified = true;
                }
            }

            var engineNode = nav.SelectSingleNode(string.Format("//transformer:bundleTransformer/transformer:{0}", name), nsmgr);

            // Look for existing nodes with same path like the new node
            if (engineNode.HasChildren)
            {
                // Look for existing nodeType nodes
                var node =
                    engineNode.SelectSingleNode(
                        string.Format("./transformer:jsEngine"),
                        nsmgr);

                // If path already exists, update it
                if (node != null)
                {
                    if (engineNode.MoveToFirstChild())
                    {
                        if (engineNode.MoveToAttribute("name", string.Empty))
                        {
                            engineNode.SetValue(engine);
                            modified = true;
                            insertNode = false;  
                        }
                    }
                    
                }
            }

            // Check for insert flag
            if (insertNode)
            {
                var newNodeContent = string.Format("<jsEngine name=\"{0}\" />", engine);

                engineNode.AppendChild(newNodeContent);

                modified = true;
            }

            if (modified)
            {
                try
                {
                    document.Save(filename);

                    // No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    // Log error message
                    string message = "Error at execute AddBundleTransformerJSEngine package action: " + e.Message;
                    LogHelper.Error(typeof(AddBundleTransformerJSEngine), message, e);
                }
            }
            return result;
        }

        /// <summary>
        /// Removes the xmlData node from the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Undo(string packageName, System.Xml.XmlNode xmlData)
        {
            return false;
        }

        /// <summary>
        /// Get a named attribute from xmlData root node
        /// </summary>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <param name="attribute">The name of the attribute</param>
        /// <param name="value">returns the attribute value from xmlData</param>
        /// <returns>True, when attribute value available</returns>
        private bool GetAttribute(XmlNode xmlData, string attribute, out string value)
        {
            //Set result default to false
            bool result = false;

            //Out params must be assigned
            value = String.Empty;

            //Search xml attribute
            XmlAttribute xmlAttribute = xmlData.Attributes[attribute];

            //When xml attribute exists
            if (xmlAttribute != null)
            {
                //Get xml attribute value
                value = xmlAttribute.Value;

                //Set result successful to true
                result = true;
            }
            else
            {
                //Log error message
                string message = "Error at AddBundleTransformerJSEngine package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddBundleTransformerJSEngine), message);
            }
            return result;
        }

        /// <summary>
        /// Returns a Sample XML Node 
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.AddBundleTransformerJSEngine\" name=\"coffeeScript\" engine=\"MsieJsEngine\"  />");
        }

        #endregion
    }

    public class AddUmbracoReservedPath : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.AddUmbracoReservedPath";
        }

        public bool Execute(string packageName, XmlNode xmlData)
        {
            bool result;
            try
            {
                var config =
                    WebConfigurationManager.OpenWebConfiguration(HttpContext.Current.Request.ApplicationPath);

                // TODO, make this reusable and get these values from package action xmldata
                const string appendString = "~/bundles/";
                const string keyName = "umbracoReservedPaths";

                var currentValue = config.AppSettings.Settings[keyName].Value;
                if (!currentValue.Split(',').Contains(appendString))
                {
                    var newValue = currentValue.EndsWith(",")
                        ? currentValue + appendString
                        : currentValue + "," + appendString;

                    config.AppSettings.Settings[keyName].Value = newValue;
                    config.Save(ConfigurationSaveMode.Modified);
                }
                result = true;
            }
            catch (Exception e)
            {
                // Log error message
                string message = "Error at execute AddUmbracoReservedPath package action: " + e.Message;
                LogHelper.Error(typeof(AddUmbracoReservedPath), message, e);

                result = false;
            }
            return result;
        }

        public XmlNode SampleXml()
        {
            var sample = "<Action runat=\"install\" undo=\"false\" alias=\"Umbundle.AddUmbracoReservedPath\"/>";
            return helper.parseStringToXmlNode(sample);
        }

        /// <summary>
        /// User AppendAppSettingValue action to uninstall.
        /// </summary>
        /// <param name="packageName">Name of the package.</param>
        /// <param name="xmlData">The XML data.</param>
        /// <returns></returns>
        public bool Undo(string packageName, XmlNode xmlData)
        {
            return false;
        }
    }
}