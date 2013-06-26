# Optimus#

UI layer on top of [Asp.net Web Optimization framework](http://aspnetoptimization.codeplex.com/) for [Umbraco](http://umbraco.com/), makes it possible to create script and style bundles from within the Umbraco backoffice. 

For an intro to bundling and minification check out
[http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification](http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification)

In short: bundling and minification improves request load time by reducing the number of requests to the server and reducing the size of requested assets (such as CSS and JavaScript.)

Makes use of the [bundle transformers](http://bundletransformer.codeplex.com/) extension for System.Web.Optimization (so should be easy to add LESS, Sass,SCSS, CoffeeScript and TypeScript support in addition to plain css and js files)


# Documentation

## Installation
To get started with Optimus, you will need to install the base Optimus package which contains the core functionality and allows you to generate Scripts and Stylesheet file bundles with a new tree in the Settings section to allow you to manage this easily.

***

## Addon Packages
The following packages can be installed to make Optimus more powerful. 
To install an addon package goto the Installed packages in the Umbraco backoffice and select Optimus, from this dashboard you will be to install & uninstall the addons you wish to make Optimus more powerful!

* Sass Tranformer (CSS)
* Less Transformer (CSS)
* CoffeeScript Transformer (JS)
* TypeScript Transformer (JS)

***
