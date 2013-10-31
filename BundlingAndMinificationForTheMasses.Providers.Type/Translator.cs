using BundleTransformer.Core.Assets;
using BundleTransformer.Core.Translators;
using BundleTransformer.TypeScript.Translators;
using Optimus.Helpers;
using Optimus.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Optimus.Providers.TypeScript
{
    public class Translator : IFileTranslator
    {
        public string Name
        {
            get { return "TypeScript"; }
        }

        public string FileExtension
        {
            get { return "ts"; }
        }

        public string FileIconPath
        {
            get { return CompatibilityHelper.IsVersion7OrNewer ? "~/../../../App_Plugins/Optimus/Icons/typescript-icon-grey.png" : "../../../App_Plugins/Optimus/Icons/typescript-icon.png"; }
        }

        public string FileMimeType
        {
            get { return "text/x-typescript"; }
        }

        public Enums.TranslatorType TranslatorType
        {
            get { return Enums.TranslatorType.Script; }
        }

        public IEnumerable<string> EditorClientDependencies
        {
            get
            {
                var scripts = new List<string>();
                scripts.Add("CodeMirror/js/mode/Javascript/javascript.js");
                return scripts;
            }
        }

        public IEnumerable<Exception> ValidateTranslation(string path)
        {
            var retVal = new List<Exception>();
            try
            {
                IAsset file = new Asset(path);
                TypeScriptTranslator translator = new TypeScriptTranslator();
                translator.Translate(file);
            }
            catch (AssetTranslationException ex)
            {
                retVal.Add(ex);
            }

            return retVal;

        }

        public void SaveTranslation(string path)
        {
            IAsset file = new Asset(path);
            TypeScriptTranslator translator = new TypeScriptTranslator();
            var compiled = translator.Translate(file);

            var normalScript = path.Replace("." + FileExtension, ".js");

            using (var compiledScript = File.CreateText(HostingEnvironment.MapPath(normalScript)))
            {
                compiledScript.Write(compiled.Content);
                compiledScript.Close();
            }
        }
    }
}