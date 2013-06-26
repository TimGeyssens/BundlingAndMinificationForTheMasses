using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Umbraco.Core.IO;
using Umbraco.Core.Logging;
using umbraco;
using umbraco.BasePages;
using umbraco.interfaces;

namespace Optimus.Umbraco.Tasks
{
    public class DynamicStyleTasks : ITaskReturnUrl
    {
        public bool Save()
        {
            throw new NotImplementedException();
        }

        public bool Delete()
        {
            string path = IOHelper.MapPath(SystemDirectories.Css + "/" + Alias.TrimStart('/'));

            System.Web.HttpContext.Current.Trace.Warn("", "*" + path + "*");

            try
            {
                if (System.IO.Directory.Exists(path))
                {
                    System.IO.Directory.Delete(path);
                }
                else if (System.IO.File.Exists(path))
                {
                    System.IO.File.Delete(path);
                }
                    
            }
            catch (Exception ex)
            {
                LogHelper.Error<DynamicStyleTasks>(string.Format("Could not remove Dynamic CSS file {0} - User {1}", Alias, UmbracoEnsuredPage.CurrentUser.Id), ex);
            }
            return true;
        }

        private string _alias;
        private int _parentID;
        private int _typeID;
        private int _userID;

        public int UserId
        {
            set { _userID = value; }
        }
        public int TypeID
        {
            set { _typeID = value; }
            get { return _typeID; }
        }


        public string Alias
        {
            set { _alias = value; }
            get { return _alias; }
        }

        public int ParentID
        {
            set { _parentID = value; }
            get { return _parentID; }
        }


        #region ITaskReturnUrl Members

            private string m_returnUrl = string.Empty;
            public string ReturnUrl
            {
                get { return m_returnUrl; }
            }

        #endregion
    }
}