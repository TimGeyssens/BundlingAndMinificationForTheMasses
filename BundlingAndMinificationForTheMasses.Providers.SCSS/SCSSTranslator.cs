using BundleTransformer.Core.Assets;
using BundleTransformer.Core.Translators;
using BundleTransformer.SassAndScss.Translators;
using Optimus.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Optimus.Providers.SassAndSCSS
{
    public class SCSSTranslator : IFileTranslator
    {
        public string Name
        {
            get { return "Sass Dynamic Stylesheet"; }
        }

        public string FileExtension
        {
            get { return "scss"; }
        }

        public string FileIconPath 
        {
            get { return "../../../App_Plugins/Optimus/Icons/sass-icon.png"; }  
        }
        public string FileMimeType
        {
            get { return "text/x-sass"; }
        }

        public Enums.TranslatorType TranslatorType
        {
            get { return Enums.TranslatorType.StyleSheet; }
        }

        public IEnumerable<string> EditorClientDependencies
        {
            get
            {
                var scripts = new List<string>();
                scripts.Add("CodeMirror/js/mode/sass/sass.js");
                return scripts;
            }
        }

        public IEnumerable<Exception> ValidateTranslation(string path)
        {
            var retVal = new List<Exception>();
            try
            {
                IAsset file = new Asset(path);
                SassAndScssTranslator translator = new SassAndScssTranslator();
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
            SassAndScssTranslator translator = new SassAndScssTranslator();
            var compiled = translator.Translate(file);

            var normalCSS = path.Replace("." + FileExtension, ".css");

            using (var compiledCSS = File.CreateText(HostingEnvironment.MapPath(normalCSS)))
            {
                compiledCSS.Write(compiled.Content);
                compiledCSS.Close();
            }
        }
    }
}