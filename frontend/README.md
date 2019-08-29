# Overview
This is a SPA (Single Page App). One HTML page that does stuff via javascript. It was developed as the UI for data produced by the [sensor-data-pipline](https://github.com/jcu-eresearch/sensor-data-pipeline) project.

There are two styles of pages:
- sites data
- now

The **now** page is for displaying the most recent data in an simple but attractive format.

The **sites data** page is for displaying historical data in timeline graphs. Multiple graphs can be displayed on a page for easy comparison.

There are json configuration files that specifies what data will be made available, how it will look and where to find it for each of these page types (sites.json and now.json). It expects the data to be provided as CSV files. 

You will need to provide a site-config.json file that specifies where the sites.json and now.json files can be found for the instance specific data. The sites.json and now.json files can be on the same server as the website instance or provided via https.

Sample data and sample json files can be found in the *sample-data* directory.

# Development install
1. Clone this repository to your work-area.
2. `cd frontend`
3. `npm install` (this will install all the dependencies locally to the npm_modules directory, no virtual machine required)
4. `npm run dev` (quick build)
5. copy data files (including sites.json and now.json) to ./static/data directory
5. `npm run start` (runs a live server)

# Prep for Production install
If you have made changes to functionality then run:

- `npm run prod` to generate the production dist which will be used in the production install
- git add, commit and push the changes to the repository ready for deployment
- make sure you tag the final version that is actually installed in production with a version number.

# Production install
- `mkdir <project-home>`
- `cd <project-home>`
- git pull the dist folder from [cotr-data](https://github.com/jcu-eresearch/cotr-data) github repository
- copy your project's version of the site-config.json files to `<project_home>/config`

# Production - deploying changes
**to be completed**

# Bundling [plotly.js](https://github.com/plotly/plotly.js) with Webpack


*Note*: Webpack now raises a `Can't resolve 'vertx'` warning, which can *safely be ignored* and suppressed using [Webpack's IgnorePlugin](https://webpack.js.org/plugins/ignore-plugin/) like so: `new webpack.IgnorePlugin(/vertx/)`. The root cause of this warning is that `plotly.js` depends on [`es6-promise`](https://github.com/stefanpenner/es6-promise/blob/master/lib/es6-promise/asap.js), which tries to load `vertx` but gracefully falls back if it isn't present.

## The easy way (recommended)

The easiest way to use `plotly.js` in an app bundled by webpack is just to install it via `npm install plotly.js` and then `require()` or `import` from `'plotly.js/dist/plotly'` instead of from `'plotly.js'`. Doing this will get you a complete version of `plotly.js` (i.e. all chart types) precompiled to browser-friendly ES5 that will work out of the box with pretty much any Webpack configuration.

If you don't want all of `plotly.js` because it's too big (minified it comes in over 2Mb) you can instead load a precompiled [partial bundle](https://github.com/plotly/plotly.js/blob/master/dist/README.md#partial-bundles) from `plotly.js/dist/BUNDLENAME`.

## The customization way

**If neither the full bundle nor any of the partial bundles meet your specific needs**, then you should consider putting your own customized bundle together and if you want to use Webpack you'll have to follow the instructions here. The `package.json` file in this repo shows the minimal set of requirements to use the included `webpack.config.js` to bundle plotly.js for either development or production. The resulting `bundle.js` file is based on `index.js` and can be validated by opening `index.html`.

Usage (works with NPM or Yarn):

```bash
npm install
npm run webpack-dev   #takes ~10s for a 5.9MB bundle
npm run webpack-prod  #takes ~60s for a 2.2MB bundle
```

### Explanations

Bundling with webpack requires [ify-loader@1.1.0+](https://github.com/browserify/ify-loader) for the glslify, cwise, and brfs browserify transforms. Additionally, you may wish to use [transform-loader](https://github.com/webpack-contrib/transform-loader) to run plotly.js's custom [compress\_attributes](https://github.com/plotly/plotly.js/blob/master/tasks/util/compress_attributes.js) transform which removes attribute descriptions from the plot schema that aren't needed to create and view plots.

Bundling for production with webpack (i.e. with the `-p` option) by default runs [the UglifyJS plugin](https://github.com/webpack-contrib/uglifyjs-webpack-plugin), which doesn't accept ES6 syntax, so the [babel-loader](https://github.com/babel/babel-loader) is additionally required, as some of plotly.js' dependencies use this syntax.

## Speeding up the build and reducing the bundle size

The `index.js` file included here loads all of plotly.js but if your application only requires a subset of plot types, you may load a [partial bundle](https://github.com/plotly/plotly.js/blob/master/dist/README.md#partial-bundles) instead for faster build times and reduced bundle sizes.

For example, switching from `require('plotly.js')` to `require('plotly.js/lib/index-basic')` in `index.js` reduces production build times from ~60s to ~15s and bundle size from ~2.2MB to ~690kB.

## License

&copy; 2017 Plotly, Inc. MIT License.
