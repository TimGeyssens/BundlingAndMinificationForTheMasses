using BundleTransformer.Core.Translators;
using Optimus.Enums;
using Optimus.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Optimus.Translation
{
    public class Core
    {
        public List<IFileTranslator> GetStyleSheetTranslators()
        {
            return GetTranslators(TranslatorType.StyleSheet);
        }

        public List<IFileTranslator> GetScriptTranslators()
        {
            return GetTranslators(TranslatorType.Script);
        }

        public IEnumerable<string> GetTranlatorClientDependencies(string filePath)
        {
            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);
            if (translator != null)
                return translator.EditorClientDependencies;

            return null;
        }

        public IEnumerable<string> GetPossibleExtensions(TranslatorType transType)
        {
            var extensions = new List<string>();
            foreach (var trans in GetTranslators(transType))
                extensions.Add(string.Format(".{0}",trans.FileExtension));

            return extensions;
        }

        public string GetTranslatorMimeType(string filePath)
        {
            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);
            if (translator != null)
                return translator.FileMimeType;

            return null;
        }
        public IEnumerable<Exception> ValidateTranslation(string filePath)
        {
            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);
            try
            {
                return translator.ValidateTranslation(filePath);
            }
            catch(Exception ex)
            {
                var exs = new List<Exception>();
                exs.Add(ex);
                return exs;
            }
           

        }

        public void SaveTranslation(string filePath)
        {
            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);

            translator.SaveTranslation(filePath);

        }

        private IFileTranslator GetTranslator(string fileExtension)
        {
            var types = GetAllTypesUsingInterface(typeof(IFileTranslator));
            foreach (var type in types)
            {
                IFileTranslator trans = Activator.CreateInstance(type) as IFileTranslator;

                if (trans.FileExtension == fileExtension)
                    return trans;
            }

            return null;
        }

        private List<IFileTranslator> GetTranslators(TranslatorType transType)
        {
            var retVal = new List<IFileTranslator>();

            var types = GetAllTypesUsingInterface(typeof(IFileTranslator));
            foreach (var type in types)
            {
                IFileTranslator trans = Activator.CreateInstance(type) as IFileTranslator;

                if (trans.TranslatorType == transType)
                    retVal.Add(trans);
            }

            return retVal;
        }

        private List<Type> GetAllTypesUsingInterface(Type interFaceType)
        {
            var retVal = new List<Type>();

            var assemblies = AppDomain.CurrentDomain.GetAssemblies();

            // NOTE: The similar functionality is located in the method above
            foreach (var assembly in assemblies)
            {
                var modules = assembly.GetLoadedModules();

                foreach (var module in modules)
                {
                    try
                    {
                        Type[] types = null;
                        types = module.GetTypes();
                        retVal.AddRange(types.Where(t=> interFaceType.IsAssignableFrom(t) && !t.IsInterface));
                    }
                    catch { } // required because Exception is thrown for some dlls when .GetTypes method is called
                }
            }

            return retVal;
        }
    }
}