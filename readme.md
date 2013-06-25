# Optimus aka - Bundling and minification for the masses #

UI layer on top of [Asp.net Web Optimization framework](http://aspnetoptimization.codeplex.com/) for [Umbraco](http://umbraco.com/), makes it possible to create script and style bundles from within the Umbraco backoffice. 

For an intro to bundling and minification check out
[http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification](http://www.asp.net/mvc/tutorials/mvc-4/bundling-and-minification)

In short: bundling and minification improves request load time by reducing the number of requests to the server and reducing the size of requested assets (such as CSS and JavaScript.)

Makes use of the [bundle transformers](http://bundletransformer.codeplex.com/) extension for System.Web.Optimization (so should be easy to add LESS, Sass,SCSS, CoffeeScript and TypeScript support in addition to plain css and js files)


