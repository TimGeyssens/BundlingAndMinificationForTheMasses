using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Umbraco.Core;

namespace BundlingAndMinificationForTheMasses.Umbraco
{
    public class UmbracoAuthorizeAttribute : AuthorizeAttribute
    {

        private bool failedAuthentication = true;

        public UmbracoAuthorizeAttribute(ApplicationContext appContext)
        {
            if (appContext == null) throw new ArgumentNullException("appContext");
        }

        public UmbracoAuthorizeAttribute()
            : this(ApplicationContext.Current)
        {

        }

        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            if (httpContext == null)
            {
                throw new ArgumentNullException("httpContext");
            }

            try
            {
                failedAuthentication = !umbraco.BasePages.BasePage.ValidateUserContextID(umbraco.BasePages.BasePage.umbracoUserContextID);
                return !failedAuthentication;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            base.OnAuthorization(filterContext);
            if (failedAuthentication)
                throw new HttpException((int)global::System.Net.HttpStatusCode.Unauthorized, "You must login to view this resource.");


        }
    }
}