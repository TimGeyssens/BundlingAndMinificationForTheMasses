using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;
using BundlingAndMinificationForTheMasses.Models;
using BundlingAndMinificationForTheMasses.Umbraco;

namespace BundlingAndMinificationForTheMasses.Controllers
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