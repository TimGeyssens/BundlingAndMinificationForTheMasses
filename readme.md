# Optimus#

UI layer on top of [Asp.net Web Optimization framework](http://aspnetoptimization.codeplex.com/) for [Umbraco](http://umbraco.com/), makes it possible to create script and style bundles from within the Umbraco backoffice. 

For an intro to bundling and minification check out
[http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification](http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification)

In short: bundling and minification improves request load time by reducing the number of requests to the server and reducing the size of requested assets (such as CSS and JavaScript.)

Makes use of the [bundle transformers](http://bundletransformer.codeplex.com/) extension for System.Web.Optimization (so should be easy to add LESS, Sass,SCSS, CoffeeScript and TypeScript support in addition to plain css and js files)


# Documentation

## Installation
To get started with Optimus, you will need to install the base Optimus package which contains the core functionality and allows you to generate Scripts and Stylesheet file bundles with a new tree in the Settings section to allow you to manage this easily.


## Addon Packages
The following packages can be installed to make Optimus more powerful. 
To install an addon package goto the Installed packages in the Umbraco backoffice and select Optimus, from this dashboard you will be to install & uninstall the addons you wish to make Optimus more powerful!

* Sass Tranformer (CSS)
* Less Transformer (CSS)
* CoffeeScript Transformer (JS)
* TypeScript Transformer (JS)


## Files Installed
The following files are installed for the base Optimus package:

* /App_Plugins/Optimus/config/bundles.config
* /App_Plugins/Optimus/content/jQueryFileTree.css
* /App_Plugins/Optimus/content/style.css
* /App_Plugins/Optimus/content/images/application.png
* /App_Plugins/Optimus/content/images/code.png
* /App_Plugins/Optimus/content/images/css.png
* /App_Plugins/Optimus/content/images/db.png
* /App_Plugins/Optimus/content/images/directory.png
* /App_Plugins/Optimus/content/images/doc.png
* /App_Plugins/Optimus/content/images/file.png
* /App_Plugins/Optimus/content/images/film.png
* /App_Plugins/Optimus/content/images/flash.png
* /App_Plugins/Optimus/content/images/folder_open.png
* /App_Plugins/Optimus/content/images/html.png
* /App_Plugins/Optimus/content/images/java.png
* /App_Plugins/Optimus/content/images/linux.png
* /App_Plugins/Optimus/content/images/music.png
* /App_Plugins/Optimus/content/images/pdf.png
* /App_Plugins/Optimus/content/images/php.png
* /App_Plugins/Optimus/content/images/picture.png
* /App_Plugins/Optimus/content/images/ppt.png
* /App_Plugins/Optimus/content/images/psd.png
* /App_Plugins/Optimus/content/images/ruby.png
* /App_Plugins/Optimus/content/images/script.png
* /App_Plugins/Optimus/content/images/spinner.png
* /App_Plugins/Optimus/content/images/txt.png
* /App_Plugins/Optimus/content/images/application.png
* /App_Plugins/Optimus/content/images/xls.png
* /App_Plugins/Optimus/content/images/zip.png
* /App_Plugins/Optimus/dialogs/CreateScript.ascx
* /App_Plugins/Optimus/dialogs/CreateStyleSheet.ascx
* /App_Plugins/Optimus/pages/FileEditor.aspx
* /App_Plugins/Optimus/scripts/jquery-2.0.0.intellisense.js
* /App_Plugins/Optimus/scripts/jquery-2.0.0.js
* /App_Plugins/Optimus/scripts/jquery-2.0.0.min.js
* /App_Plugins/Optimus/scripts/jquery-2.0.0.min.map
* /App_Plugins/Optimus/scripts/jquery-ui-1.10.2.js
* /App_Plugins/Optimus/scripts/jquery-ui-1.10.2.min.js
* /App_Plugins/Optimus/scripts/jqueryFileTree.js
* /App_Plugins/Optimus/scripts/main.js
* /App_Plugins/Optimus/scripts/underscore.js
* /App_Plugins/Optimus/scripts/underscore.min.js
* /App_Plugins/Optimus/services/jqueryFileTree.aspx
* /App_Plugins/Optimus/views/index.cshtml
* /App_Plugins/Optimus/views/web.config
* /bin/Optimus.dll
* /bin/Optimus.pdb
* /bin/BundleTransformer.Core.dll
* ??
* ??

The following files are installed for the SASS Transformer:

* /bin/...
* /bin/....
* 


The following files are installed for the LESS Transformer:

* /bin/...
* /bin/....
* 

The following files are installed for the CoffeeScript Transformer:

* /bin/...
* /bin/....
* 

The following files are installed for the TypeScript Transformer:

* /bin/...
* /bin/....
* 

## Config Changes
The following files have XML config changes to their files with the change & or addition shown below:

* Some Config File
* 
