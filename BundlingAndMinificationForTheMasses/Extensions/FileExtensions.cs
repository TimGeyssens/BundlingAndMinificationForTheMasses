using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Optimus.Extensions
{
    public static class FileExtensions
    {
        public static IEnumerable<FileInfo> GetFilesByExtensions(this DirectoryInfo dirInfo, params string[] extensions)
        {
            var allowedExtensions = new HashSet<string>(extensions, StringComparer.OrdinalIgnoreCase);

            return dirInfo.EnumerateFiles()
                            .Where(f => allowedExtensions.Contains(f.Extension));
        }
    }
}