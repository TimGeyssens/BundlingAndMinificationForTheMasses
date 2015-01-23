using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using umbraco;
using umbraco.BasePages;
using umbraco.BusinessLogic;
using Umbraco.Core;
using Umbraco.Core.Logging;

namespace Optimus.Providers.V8JavaScriptEngine.Umbraco.Installer
{
    using System.IO;
    using System.Web;
    using System.Xml;
    using System.Xml.XPath;

    using Optimus.Umbraco.Installer;

    using umbraco.cms.businesslogic.packager.standardPackageActions;
    using umbraco.interfaces;

    public class AddJSEngine : IPackageAction
    {
        public string Alias()
        {
            return "Umbundle.V8.AddJSEngine";
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
            nsmgr.AddNamespace("jsengines", "http://tempuri.org/JavaScriptEngineSwitcher.Configuration.xsd");

            XPathNavigator nav = document.CreateNavigator().SelectSingleNode("//jsengines:jsEngineSwitcher/jsengines:core/jsengines:engines", nsmgr);
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

    public class AddHiddenSegment : IPackageAction
    {
        //Set the web.config full path
        const string FULL_PATH = "/web.config";

        #region IPackageAction AddHiddenSegment

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.V8.AddHiddenSegment";
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
            string position, segment;
            position = GetAttributeDefault(xmlData, "position", null);
            if (!GetAttribute(xmlData, "segment", out segment)) return result;

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));
            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode("//configuration/system.webServer");

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Set insert node default true
            bool insertNode = true;

            //Check for security node
            if (rootNode.SelectSingleNode("security") == null)
            {
                //Create security node
                var securityNode = document.CreateElement("security");
                rootNode.AppendChild(securityNode);

                //Replace root node
                rootNode = securityNode;

                //Mark document modified
                modified = true;
            }
            else
            {
                //Replace root node
                rootNode = rootNode.SelectSingleNode("security");     
            }

            //Check for requestFiltering node
            if (rootNode.SelectSingleNode("requestFiltering") == null)
            {
                //Create security node
                var requestFilteringNode = document.CreateElement("requestFiltering");
                rootNode.AppendChild(requestFilteringNode);

                //Replace root node
                rootNode = requestFilteringNode;

                //Mark document requestFilteringNode
                modified = true;
            }
            else
            {
                //Replace root node
                rootNode = rootNode.SelectSingleNode("requestFiltering");     
            }

            //Check for hiddenSegments node
            if (rootNode.SelectSingleNode("hiddenSegments") == null)
            {
                //Create security node
                var hiddenSegmentsNode = document.CreateElement("hiddenSegments");
                rootNode.AppendChild(hiddenSegmentsNode);

                //Replace root node
                rootNode = hiddenSegmentsNode;

                //Mark document requestFilteringNode
                modified = true;
            }
            else
            {
                //Replace root node
                rootNode = rootNode.SelectSingleNode("hiddenSegments");     
            }

                //Look for existing nodes with same path like the new node
                if (rootNode.HasChildNodes)
                {
                    //Look for existing nodeType nodes
                    XmlNode node = rootNode.SelectSingleNode(String.Format("//add[@segment = '{0}']", segment));

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
                    XmlHelper.AddAttribute(document, "segment", segment));

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
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at execute AddHiddenSegment package action: " + e.Message;
                    LogHelper.Error(typeof(AddHiddenSegment), message, e);
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
            string segment;
            if (!GetAttribute(xmlData, "segment", out segment)) return result;

            //Create a new xml document
            XmlDocument document = new XmlDocument();

            //Keep current indentions format
            document.PreserveWhitespace = true;

            //Load the web.config file into the xml document
            document.Load(HttpContext.Current.Server.MapPath(FULL_PATH));

            //Select root node in the web.config file for insert new nodes
            XmlNode rootNode = document.SelectSingleNode("//configuration/system.webServer/security/requestFiltering/hiddenSegments");

            //Check for rootNode exists
            if (rootNode == null) return result;

            //Set modified document default to false
            bool modified = false;

            //Look for existing nodes with same path of undo attribute
            if (rootNode.HasChildNodes)
            {
                //Look for existing add nodes with attribute path
                foreach (XmlNode existingNode in rootNode.SelectNodes(
                   String.Format("//add[@segment = '{0}']", segment)))
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
                    document.Save(HttpContext.Current.Server.MapPath(FULL_PATH));

                    //No errors so the result is true
                    result = true;
                }
                catch (Exception e)
                {
                    //Log error message
                    string message = "Error at undo AddHiddenSegment package action: " + e.Message;
                    LogHelper.Error(typeof(AddHiddenSegment), message, e);
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
                string message = "Error at AddHiddenSegment package action: "
                     + "Attribute \"" + attribute + "\" not found.";
                LogHelper.Warn(typeof(AddHiddenSegment), message);
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
        /// In this case the Sample HTTP Module TimingModule 
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.V8.AddHiddenSegment\" "
                    + "position=\"beginning/end\" "
                    + "segment=\"Noesis.Javascript\" />"
            );
        }

        #endregion
    }

    /// <summary>
    /// This package action removes the config section and x86 & x64 subfolders in the Noesis.Javascript folder as these were changed in V8 Engine Switcher v0.9.3
    /// </summary>
    public class RemoveLegacy : IPackageAction
    {
        #region IPackageAction RemoveConfigSection

        const string FULL_PATH = "/web.config";

        /// <summary>
        /// This Alias must be unique and is used as an identifier that must match 
        /// the alias in the package action XML
        /// </summary>
        /// <returns>The Alias in string format</returns>
        public string Alias()
        {
            return "Umbundle.V8.RemoveLegacyAndRenameClearScript";
        }

        /// <summary>
        /// Append the xmlData node to the web.config file
        /// </summary>
        /// <param name="packageName">Name of the package that we install</param>
        /// <param name="xmlData">The data that must be appended to the web.config file</param>
        /// <returns>True when succeeded</returns>
        public bool Execute(string packageName, XmlNode xmlData)
        {
            var addSectionAction = new AddConfigSection();
            var removeSection = addSectionAction.Undo(packageName, xmlData);
            string folderPath = HttpContext.Current.Server.MapPath("/Noesis.Javascript");

            if (Directory.Exists(folderPath))
            {         
                Directory.Delete(folderPath);
            }

            string newPath = HttpContext.Current.Server.MapPath("/ClearScript.V8");

            foreach (var file in new DirectoryInfo(newPath).GetFiles())
            {
                if (file.Extension != ".dat")
                {
                    File.Delete(file.FullName);
                }
            }

            foreach (var file in new DirectoryInfo(newPath).GetFiles())
            {
                if (file.Extension == ".dat")
                {
                    File.Move(file.FullName, Path.ChangeExtension(file.FullName, ".dll"));
                }
            }

            //Remove Noesis.Javascript hidden segment

            var hiddenSegement = new AddHiddenSegment();
            var str = "<Action runat=\"install\" undo=\"true\" alias=\"Umbundle.V8.AddHiddenSegment\" position=\"beginning\" segment=\"Noesis.Javascript\" />";
            
            var doc = new XmlDocument();
            doc.LoadXml(str);
            var newNode = doc.DocumentElement;

            hiddenSegement.Undo("", newNode);

            return removeSection;
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
        /// In this case we are adding the System.Web.Optimization namespace
        /// </summary>
        /// <returns>The sample xml as node</returns>
        public XmlNode SampleXml()
        {
            return helper.parseStringToXmlNode(
                "<Action runat=\"install\" undo=\"true/false\" alias=\"Umbundle.V8.RemoveLegacy\" "
                    + "name=\"core\" type=\"BundleTransformer.Core.Configuration.CoreSettings, BundleTransformer.Core\" sectionGroup=\"myGroup\""
                    + " />");
        }

        #endregion
    }
}
