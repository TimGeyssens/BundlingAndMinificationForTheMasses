using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optimus.Providers.V8JavaScriptEngine.Umbraco.Installer
{
    using System.IO;
    using System.Web;
    using System.Xml;
    using System.Xml.XPath;

    using umbraco.cms.businesslogic.packager.standardPackageActions;
    using umbraco.interfaces;

    public class AddAssemblyBinding : IPackageAction
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
}
