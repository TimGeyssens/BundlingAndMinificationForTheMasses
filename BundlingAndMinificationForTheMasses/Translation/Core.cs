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
        private static object configCacheSyncLock = new object();

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

        public string GetTranslatorTreeIconPath(string filePath)
        {
            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);
            if (translator != null)
               return translator.FileIconPath;

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

            var compileDynamicStyleSheets = Optimus.Settings.GetSetting("compileDynamicStyleSheetsToCss") == "True" || String.IsNullOrEmpty(Optimus.Settings.GetSetting("compileDynamicStyleSheetsToCss"));
            var compileDynamicJavaScript = Optimus.Settings.GetSetting("compileDynamicJavaScriptToJs") == "True" || String.IsNullOrEmpty(Optimus.Settings.GetSetting("compileDynamicJavaScriptToJs"));

            var extension = Path.GetExtension(filePath);
            extension = extension.Substring(1, extension.Length - 1);
            var translator = GetTranslator(extension);
            if ((translator.TranslatorType == TranslatorType.StyleSheet && compileDynamicStyleSheets)||(translator.TranslatorType == TranslatorType.Script && compileDynamicJavaScript))
            {
                translator.SaveTranslation(filePath); 
            }             
        }

        private IFileTranslator GetTranslator(string fileExtension)
        {
            return CacheService.GetCacheItem<IFileTranslator>("OptimusKeyGetTranslator" + fileExtension, configCacheSyncLock, TimeSpan.FromHours(6),
                   delegate
                   {
                       var types = GetAllTypesUsingInterface(typeof(IFileTranslator));
                       foreach (var type in types)
                       {
                           IFileTranslator trans = Activator.CreateInstance(type) as IFileTranslator;

                           if (trans.FileExtension == fileExtension)
                               return trans;
                       }

                       return null;
                   });
        }

        private List<IFileTranslator> GetTranslators(TranslatorType transType)
        {
            return CacheService.GetCacheItem<List<IFileTranslator>>("OptimusKeyGetTranslators" + transType, configCacheSyncLock, TimeSpan.FromHours(6),
                   delegate
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
                   });
        }

        private List<Type> GetAllTypesUsingInterface(Type interFaceType)
        {
            return CacheService.GetCacheItem<List<Type>>("OptimusKeyGetAllTypesUsingInterface" + interFaceType.Name, configCacheSyncLock, TimeSpan.FromHours(6),
                  delegate
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
                                  retVal.AddRange(types.Where(t => interFaceType.IsAssignableFrom(t) && !t.IsInterface));
                              }
                              catch { } // required because Exception is thrown for some dlls when .GetTypes method is called
                          }
                      }

                      return retVal;

                  });
        }
    }
}