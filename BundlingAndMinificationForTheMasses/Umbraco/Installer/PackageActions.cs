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

namespace Optimus.Umbraco.Installer
{
    using System.IO;
    using System.Xml.XPath;

    using global::Umbraco.Core.Logging;

    using umbraco.cms.businesslogic.packager.standardPackageActions;

    public class AddAssemblyBinding : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.AddAssemblyBinding";
        }

        public bool Execute(string packageName, XmlNode xmlData)
        {

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
           
            XmlNode node = xmlData.SelectSingleNode("./*");
            if (node == null)
            {
                throw new Exception("Invalid Configuration File");
            }

            nav.AppendChild(node.OuterXml);

            document.Save(filename);
            return true;
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
        #region IPackageAction AddHiddenSegment

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

}