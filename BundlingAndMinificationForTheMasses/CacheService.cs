using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Caching;

using umbCache = umbraco.cms.businesslogic.cache.Cache;
using System.Web;



namespace Optimus
{
    public class CacheService
    {
        /// <summary>
        /// Clears everything in umbraco's runtime cache, which means that not only
        /// umbraco content is removed, but also other cache items from pages running in
        /// the same application / website. Use with care :-)
        /// </summary>
        public static void ClearAllCache()
        {
            umbCache.ClearAllCache();
        }

        /// <summary>
        /// Clears the item in umbraco's runtime cache with the given key 
        /// </summary>
        /// <param name="Key">Key</param>
        public static void ClearCacheItem(string Key)
        {
            //LogHelper.Debug("clearing log item: " + Key);
            umbCache.ClearCacheItem(Key);
        }


        /// <summary>
        /// Clears all objects in the System.Web.Cache with the System.Type name as the
        /// input parameter. (using [object].GetType())
        /// </summary>
        /// <param name="TypeName">The name of the System.Type which should be cleared from cache ex "System.Xml.XmlDocument"</param>
        public static void ClearCacheObjectTypes(string TypeName)
        {
            umbCache.ClearCacheObjectTypes(TypeName);
        }

        /// <summary>
        /// Clears all cache items that starts with the key passed.
        /// </summary>
        /// <param name="KeyStartsWith">The start of the key</param>
        public static void ClearCacheByKeySearch(string KeyStartsWith)
        {
            umbCache.ClearCacheByKeySearch(KeyStartsWith);
        }

        /// <summary>
        /// Retrieve all cached items
        /// </summary>
        /// <returns>A hastable containing all cacheitems</returns>
        public static System.Collections.Hashtable ReturnCacheItemsOrdred()
        {
            return umbCache.ReturnCacheItemsOrdred();
        }


        public static TT GetCacheItem<TT>(string cacheKey, object syncLock,
            TimeSpan timeout, umbCache.GetCacheItemDelegate<TT> getCacheItem)
        {

            return umbCache.GetCacheItem(cacheKey, syncLock, null, timeout, getCacheItem);
        }

        public static TT GetCacheItem<TT>(string cacheKey, object syncLock,
            CacheItemRemovedCallback refreshAction, TimeSpan timeout,
            umbCache.GetCacheItemDelegate<TT> getCacheItem)
        {
            return umbCache.GetCacheItem(cacheKey, syncLock, CacheItemPriority.Normal, refreshAction, timeout, getCacheItem);
        }

        public static TT GetCacheItem<TT>(string cacheKey, object syncLock,
            CacheItemPriority priority, CacheItemRemovedCallback refreshAction, TimeSpan timeout,
            umbCache.GetCacheItemDelegate<TT> getCacheItem)
        {
            return umbCache.GetCacheItem(cacheKey, syncLock, priority, refreshAction, null, timeout, getCacheItem);
        }

        public static TT GetCacheItem<TT>(string cacheKey, object syncLock,
            CacheItemPriority priority, CacheItemRemovedCallback refreshAction,
            CacheDependency cacheDependency, TimeSpan timeout, umbCache.GetCacheItemDelegate<TT> getCacheItem)
        {

            return (TT)umbCache.GetCacheItem<TT>(cacheKey, syncLock, priority, refreshAction, cacheDependency, timeout, getCacheItem);
        }
    }
}
