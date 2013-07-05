using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml.Linq;
using ICSharpCode.SharpZipLib.Zip;
using Optimus.Extensions;
using umbraco;
using umbraco.cms.businesslogic.packager;
using umbraco.IO;

namespace Optimus.Umbraco.Dialogs
{
    public partial class ProviderInstaller : System.Web.UI.UserControl
    {
        private const string REPO_GUID = "65194810-1f85-11dd-bd0b-0800200c9a66";
        private const string PROVIDER_FEED_URL_FORMAT = @"http://pipes.yahoo.com/pipes/pipe.run?_id=bef44ed4c28b4b105cfd21c533486591&_render=rss&rnd={0}";

        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                chkProviders.DataSource = GetProviderPackages();
                chkProviders.DataValueField = "Url";
                chkProviders.DataTextField = "Name";
                chkProviders.DataBind();
            }
        }

        protected void btnInstall_Click(object sender, EventArgs e)
        {
            IList<string> successList = new List<string>();
            IList<string> failedList = new List<string>();

            // Loop through selected providers
            foreach (ListItem li in chkProviders.Items)
            {
                if (li.Selected)
                {
                    var url = li.Value;

                    try
                    {
                        var tmpFileName = Guid.NewGuid().ToString() + ".umb";
                        var tmpFilePath = IOHelper.MapPath(SystemDirectories.Data + Path.DirectorySeparatorChar + tmpFileName);

                        // Download file
                        new WebClient().DownloadFile(url, tmpFilePath);

                        // Extract package guid from zip
                        var packageGuid = GetPackageGuidFromZip(tmpFilePath);
                        if (packageGuid == default(Guid))
                            packageGuid = Guid.NewGuid();

                        var packageGuidString = packageGuid.ToString("D");

                        // Check package isn't already installed
                        if (!InstalledPackage.isPackageInstalled(packageGuidString))
                        {
                            // Rename file
                            var packageFileName = packageGuidString + ".umb";
                            var packageFilePath = IOHelper.MapPath(SystemDirectories.Data + Path.DirectorySeparatorChar + packageFileName);
                            File.Move(tmpFilePath, packageFilePath);

                            // Install package
                            var installer = new umbraco.cms.businesslogic.packager.Installer();
                            var tempDir = installer.Import(packageFileName);
                            installer.LoadConfig(tempDir);
                            var packageId = installer.CreateManifest(tempDir, packageGuidString, REPO_GUID);
                            installer.InstallFiles(packageId, tempDir);
                            installer.InstallBusinessLogic(packageId, tempDir);
                            installer.InstallCleanUp(packageId, tempDir);

                            // Append package to success list
                            successList.Add(li.Text);

                            // Deselect and disable option
                            li.Enabled = li.Selected = false;
                        }
                        else
                        {
                            // Append package to failed list
                            failedList.Add(li.Text);
                        }

                    }
                    catch (Exception)
                    {
                        // Append package to failed list
                        failedList.Add(li.Text);
                    }
                }
            }

            library.RefreshContent();

            // Show message
            if (successList.Count > 0)
            {
                if (failedList.Count > 0)
                {
                    // Some providers installed, some failed
                    feedback.type = umbraco.uicontrols.Feedback.feedbacktype.notice;
                    feedback.Text = string.Format("{0} provider(s) installed successfully, however {1} provider(s) failed to install. Please see the <strong>Installed packages</strong> section to see which provider(s) were installed.", successList.Count, failedList.Count);
                }
                else
                {
                    // All successfull
                    feedback.type = umbraco.uicontrols.Feedback.feedbacktype.success;
                    feedback.Text = string.Format("{0} provider(s) installed successfully", successList.Count);
                }
            }
            else
            {
                if (failedList.Count > 0)
                {
                    // All failed
                    feedback.type = umbraco.uicontrols.Feedback.feedbacktype.error;
                    feedback.Text = string.Format("{0} provider(s) failed to install", failedList.Count);
                }
                else
                {
                    // None selected
                    feedback.type = umbraco.uicontrols.Feedback.feedbacktype.error;
                    feedback.Text = "Please select one or more providers to install";
                }
            }
        }

        private IList<ProviderPackage> GetProviderPackages()
        {
            var rnd = DateTime.Now.Round(new TimeSpan(0, 5, 0)).Ticks;
            var feed = XDocument.Load(string.Format(PROVIDER_FEED_URL_FORMAT, rnd));

            var providers = feed.Descendants("item").Select(item => new ProviderPackage
            {
                Name = item.Element("title").Value,
                Url = item.Element("link").Value
            });

            return providers.ToList();
        }

        private Guid GetPackageGuidFromZip(string path)
        {
            var packageGuid = default(Guid);
            ZipInputStream zip = new ZipInputStream(File.OpenRead(path));
            ZipEntry zipEntry;
            while ((zipEntry = zip.GetNextEntry()) != null)
            {
                var dir = Path.GetDirectoryName(zipEntry.Name);
                try
                {
                    packageGuid = new Guid(dir);
                    break;
                }
                catch (FormatException)
                {
                    continue;
                }
            }
            zip.Close();

            return packageGuid;
        }
    }

    internal class ProviderPackage
    {
        public string Name { get; set; }
        public string Url { get; set; }
    }
}