using BundleTransformer.Core.Translators;
using BundlingAndMinificationForTheMasses.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace BundlingAndMinificationForTheMasses.Interfaces
{
    public interface IFileTranslator
    {
        string Name { get; }
        string FileExtension { get; }
        string FileMimeType { get; }
        TranslatorType TranslatorType { get; }

        IEnumerable<string> EditorClientDependencies { get; }

        IEnumerable<Exception> ValidateTranslation(string path);
        void SaveTranslation(string path);
    }
}
