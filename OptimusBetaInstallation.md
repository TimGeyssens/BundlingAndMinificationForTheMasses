#OPTIMUS Installation

Updates to files that need to be done manually atm

##Core

###web.config file

####umbracoReservedPaths 

appsetting needs ~/bundles/

	<add key="umbracoReservedPaths" value="~/umbraco,~/install/,~/bundles/" />

#### pages element

	<namespaces>
		<add namespace="System.Web.Optimization" />
	</namespaces>

#### configSections element

	<sectionGroup name="bundleTransformer">
	      <section name="core" type="BundleTransformer.Core.Configuration.CoreSettings, BundleTransformer.Core" />
	 </sectionGroup>

#### configuration element needs
	  <bundleTransformer xmlns="http://tempuri.org/BundleTransformer.Configuration.xsd">
	    <core>
	      <css>
	        <minifiers>
	          <add name="NullMinifier" type="BundleTransformer.Core.Minifiers.NullMinifier, BundleTransformer.Core" />
	        </minifiers>
	        <translators>
	          <add name="NullTranslator" type="BundleTransformer.Core.Translators.NullTranslator, BundleTransformer.Core" enabled="false" />
	         
	        </translators>
	      </css>
	      <js>
	        <minifiers>
	          <add name="NullMinifier" type="BundleTransformer.Core.Minifiers.NullMinifier, BundleTransformer.Core" />
	        </minifiers>
	        <translators>
	          <add name="NullTranslator" type="BundleTransformer.Core.Translators.NullTranslator, BundleTransformer.Core" enabled="false" />
	         
	        </translators>
	      </js>
	    </core>
	  </bundleTransformer>

### views/web.config file

#### configuration/system.web.webPages.razor/pages/namespaces element needs

	<add namespace="System.Web.Optimization" />

##Less Provider

###web.config file

sectionGroup element where name is bundleTransformer needs

  	<section name="less" type="BundleTransformer.Less.Configuration.LessSettings, BundleTransformer.Less" />

bundleTransformer/core/css/translators needs

 	<add name="LessTranslator" type="BundleTransformer.Less.Translators.LessTranslator, BundleTransformer.Less" />

assemblyBinding element needs

 	<dependentAssembly>
        <assemblyIdentity name="BundleTransformer.Core" publicKeyToken="973c344c93aac60d" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-1.6.28.0" newVersion="1.6.28.0" />
    </dependentAssembly>


##Sass Provider

###web.config file

sectionGroup element where name is bundleTransformer needs

  	 <section name="sassAndScss" type="BundleTransformer.SassAndScss.Configuration.SassAndScssSettings, BundleTransformer.SassAndScss" />

bundleTransformer/core/css/translators needs

	<add name="SassAndScssTranslator" type="BundleTransformer.SassAndScss.Translators.SassAndScssTranslator, BundleTransformer.SassAndScss" />


assemblyBinding element needs (if not there from other provider)

 	<dependentAssembly>
        <assemblyIdentity name="BundleTransformer.Core" publicKeyToken="973c344c93aac60d" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-1.6.28.0" newVersion="1.6.28.0" />
    </dependentAssembly>

##CoffeeScript Provider

###web.config file

bundleTransformer/core/js/translators needs

 	<add name="CoffeeScriptTranslator" type="BundleTransformer.CoffeeScript.Translators.CoffeeScriptTranslator, BundleTransformer.CoffeeScript" />

assemblyBinding element needs

	  <dependentAssembly>
	    <assemblyIdentity name="MsieJavaScriptEngine" publicKeyToken="a3a2846a37ac0d3e" culture="neutral" />
	    <bindingRedirect oldVersion="0.0.0.0-1.1.1.0" newVersion="1.1.2.0" />
	  </dependentAssembly>

##TypeScript Provider

sectionGroup element where name is bundleTransformer needs

	<section name="typeScript" type="BundleTransformer.TypeScript.Configuration.TypeScriptSettings, BundleTransformer.TypeScript" />

bundleTransformer/core/js/translators needs

	<add name="TypeScriptTranslator" type="BundleTransformer.TypeScript.Translators.TypeScriptTranslator, BundleTransformer.TypeScript" enabled="true" />
