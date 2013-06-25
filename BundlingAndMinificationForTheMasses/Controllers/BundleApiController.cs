using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;
using Optimus.Models;
using Optimus.Umbraco;

namespace Optimus.Controllers
{
    [UmbracoAuthorize]
    public class BundleApiController: ApiController
    {
        public void PostBundleUpdate(BundleViewModel bundle, string bundleType)
        {
           Bundles.SaveBundleFromViewModel(bundle,bundleType);
        }


    }
}