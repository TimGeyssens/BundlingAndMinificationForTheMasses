using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using umbraco.interfaces;

namespace Optimus.Umbraco.Tasks
{
    public abstract class BaseBundleTasks : ITaskReturnUrl
    {
        public abstract string BundleType { get; }

        #region ITaskReturnUrl Members

        public string ReturnUrl { get; set; }

        #endregion

        #region ITask Members

        public string Alias { get; set; }

        public int ParentID { get; set; }

        public int TypeID { get; set; }

        public int UserId { get; set; }


        public bool Delete()
        {
            string virtualPath = Alias;

            return Bundles.DeleteBundle(BundleType, virtualPath);
        }


        public bool Save()
        {
            ReturnUrl = ".." + Config.EditPagePath + "?virtualPath=~/bundles/" + Alias + "&bundleType=" + BundleType;

            return true;
        }

        #endregion
    }
}