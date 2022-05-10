# ESnet Tools Group Open Source - Getting Started Guide

## Projects

Currently the ESnet Tools Group maintains several projects which are used within the MyESnet Portal and the internal database ESDB. The two most useful to people outside of ESnet are likely to be:

http://software.es.net/react-timeseries-charts

Modular charting components used for building flexible interactive charts used within the ESnet Portal

http://software.es.net/react-network-diagrams

React circuit drawing and network mapping components which are used within the ESnet Portal, but are not tied to ESnet, or even to network visualization

Tying these to together is a unified notion of TimeSeries data, Events, TimeRanges and other structures. This is built into a third library called Pond.js:

http://software.es.net/pond

For example, if producing a line chart with the react-timeseries-charts library, you will need to build a Pond TimeSeries object and pass that to the charts code.

## Base assumptions

### npm

Our open source components are distributed with npm. As a result, some minimal setup using npm to bring in our components to your project are required. See the [npm quickstart](https://github.com/esnet/tools-starter#npm-quickstart) section below to find out how to set that up. This is a fairly easy thing to setup and gives you access to the whole npm repository. But it is possible to work around this. You can clone the source directly from github into say a vendor directory and then import what you need directly. This makes it hard to update and may cause other problems, but it is possible.

### webserver

And of course you need a webserver. Our code doesn't bring any backend solution to your problem, although you can use Pond in a node.js environment. In case you don't have a web server lying around and want to just get something up running quickly, a section below, [node.js server quickstart](https://github.com/esnet/tools-starter#nodejs-server-quickstart), describes setting up a simple node.js express app.

### build step

Modules imported from npm will need to be run through a build step, since modules are not part of most browser's Javascript, though they will be in the future. We do this building with a tool called webpack. A section below, [Webpack quickstart](https://github.com/esnet/tools-starter#webpack-quickstart), takes you through setting this up.

### React

Our open source UI components are built on top of React, an open source library from Facebook. As a result, React, at least at a minimal level, is required. React will let you `render()` a component into a page element like a `<div>`. From that element down React will control the DOM. You can compose React components together freely, which is what makes React nice to work with. The libraries are best used within a fully React app, but the components can also be used within a subset of a page too.

At the bottom of this document, in the [Using React](https://github.com/esnet/tools-starter#using-react) section, after we setup a build and npm environment, we'll get a simple circuit to render from the react-network-diagrams library.

---

## npm quickstart

npm is a package manager for Javascript projects. All of our open source projects are installed from npm.

Using npm is pretty simple. npm comes with node.js, so if you install the latest version of node.js you'll get npm. node.js can be installed from this website: https://nodejs.org/en/

Type this into a shell:

    npm help
    
This should return help information for using npm. If your system can't find npm, you will have to fix that first. Mine was installed at: /usr/local/bin/npm (on a Mac).

### Initializing a project

First we will initialize a project (at the top level of your project) so that we can begin to add our dependencies to our projects. Initialize with:

    npm init

This will ask you a series of questions, none of which are especially important to get you started. Just check the name of the project is reasonable and press enter to accept the defaults. The result of running this will be a package.json file. This file can hold lots of meta information about your project, especially if this is a project you are going to contribute back to npm.

I created a new directory called 'starter' and then followed the above steps. I was left with the package.json file shown below. It's not that exciting, since for us the main purpose will be to hold the dependencies of the project (npm modules that this project depends on) and we'll get to adding those next.

    {
        "name": "starter",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "author": "",
        "license": "ISC",
    }

### Installing packages

The general command to install packages is:

    npm install <packagename>

This will download the package specified and put it in the ./node_modules directory

    npm install <packagename> --save

Will download the package as above, but make an entry in the ./package.json file. That's probably what we want at this point.

### Installing our ESnet Open Source software

In this example I'll get the react-network-diagrams code running. To do this we'll need React (and React DOM), the network diagram code itself, and our timeseries abstraction: pond.js. The three npm install commands below will achieve this:

    npm install react react-dom --save
    npm install react-network-diagrams --save
    npm install pondjs --save

We have now installed these packages and listed them as dependencies in our package.json file. You can check your ./package.json to confirm. The complete collection of installed packages can be also be seen in the ./node_modules directory. There are quite a few because each of these projects has its own dependencies.

At this point we have npm setup and can install anything from npm's vast collection of packages.

### Resources:

 * NPM Repository - https://www.npmjs.com/
 * NPM docs - https://docs.npmjs.com/

---

## node.js server quickstart

You don't need to use node.js to use our tools, you can just use Django or whatever. We just want something that can serve a single html file as well as a javascript file. But if you want to get a very quick and dirty website running, here a step-by-step guide to using node.js to do this. It's pretty quick and painless.

The first thing we'll need is express, which is a web framework for node.js. This will handle responding to URL routes and API calls if we add those later. We install express with npm. (See the above “npm quickstart” section if you don't have npm setup):

    npm install express --save
    npm install body-parser --save

The body-parser is middleware that we'll need.

Now we create a simple directory structure for our server. There's no right way to organize a project, so let's just do this:

    --.
      |-public
      |   |-- index.html
      |   |-- bundle.js
      |
      |-server.js
      |-package.json

Then we can expand on this later.

For server.js, make a file with this bare bones content:

    // server.js
    var port = process.env.PORT || 8080;

    // require packages
    var express    = require("express");
    var app        = express();
    var bodyParser = require("body-parser");

    // middleware
    app.use("/public", express.static(__dirname + "/public"));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // routing
    app.get('/', function(req, res) {
        res.sendFile("index.html", {root: "public"});
    });

    // start
    app.listen(port);

    console.log('Server started on port ' + port);


This will start a webserver and respond to the root route ('/') by sending back the file index.html from the public directory.

Next, let's make that index.html file. For us, we keep this pretty simple. We bring in Bootstrap CSS to help with the layout and to give us a base look and feel, and jQuery, because inevitably we'll need this on the page. It's a decent place to start. We also bring in a Javascript file called bundle.js, which we don't have yet. We'll create this in the next section on webpack. But if you're not using webpack you could put in your own javascript here.

Here's our starter index.html file:

    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Title</title>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css">
        <style>
            html { overflow-y:scroll; }
            body { padding-top:50px; }
            ul { font-family: Gotham SSm A; letter-spacing: -.02em; color: rgb(128, 128, 128);}
            a { color: #9A9A9A !important; text-decoration: none !important; }
            a.active { color: #424242 !important; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="row" />
                <div class="col-md-12">
                    <div id="content">
                        Content here
                    </div>
                </div>
            </div>
        </div>
        <!-- Load jQuery from CDN -->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
        <!-- Our application -->
        <script src="public/bundle.js"></script>
    </body>
    </html>


If you put this stuff together, you should now be able to run a simple node.js web server by typing:

    node server.js

Then navigating a browser to: http://localhost:8080

You should see the words "Content here". This is placeholder text. We've added a `<div id=”content”>Content here</div>` into the html page for the moment which is what caused that output. When we come to using React we'll target that div using its id ("content"), and React will own the DOM below it.

Since this div is basically all of the page, this will let React control the content of the page. However it is important to note that you could have a whole html page here (for an existing app) and then just target a small piece of it (such as `<div id=”trafficchart />` and render just a React chart into that. React is flexible in that way: you don't have to go all in, you can use it here and there.

At this point you will have a working web server. Express is a complete web framework solution, so the above is only the beginning of what is possible in terms of a node.js web server. See the express docs for further info if you want to expand on this simple setup.

### Resources:

 * node.js: https://nodejs.org/en/
 * express: http://expressjs.com/
 * bootstrap: http://getbootstrap.com/

---

## Webpack quickstart

Our use of modules within Javascript is using a language feature not commonly available with Javascript on browsers at this point. So how do we make this work? The answer is to add a build step which will take our modules and essentially inline them together into a new Javascript file. There are several ways to do this, but we use Webpack.

Webpack considers your project to be a dependency graph of modules. You give webpack the entry point to your javascript application, such as index.js and it will follow your import statements (ES6 module syntax) and create a bundle.js file which can run on a browser.

There are two parts to a webpack setup:
 1. The webpack config file: webpack.config.js
 2. A command to run the webpack build whenever a source file changes

For the webpack config, here is our config that we use for most of our projects. Call this webpack.config.js and put at the top level of the project:

    module.exports = {
      entry: './src/entry.jsx',
      output: {
        filename: './public/bundle.js'
      },
      module: {
        loaders: [
          { test: /\.jsx$/,
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'react']
            }
          },
          { test: /\.css$/,
            loader: 'css-loader'
          }
        ]
      }
    };

The basics of how this works are that it will take the entry file, which above is "./src/entry.jsx", follow all dependencies and package it all together as "./public/bundle.js".

Here's what we're going for:

    --.
      |-public
      |   |-- index.html
      |   |-- bundle.js      <-- webpack builds our application here
      |
      |-src
      |   |-- entry.jsx      <-- we write our application here
      |
      |-server.js
      |-package.json
      |-webpack.config.js

Our webpack config also uses these “loaders”, which will used to transform the code. The most important loader is the babel-loader, but there's lots of others, including one to load in css files. Babel is a transpiler that will convert from ES6 and ES7 to Javascript a browser can use. The main thing for us at the moment is that it understands the `import` syntax that we'll use to bring in our modules and use them. It will also transform JSX (which is a way to express the `render()` of a React component in a way that is similar to HTML or XML). It's pretty handy. Not only can we write code that brings in external modules with a `npm install`, and an `import` statement, but we can also write our code in ES6, which is much nicer.

Since we're using these loaders, and webpack itself, we need to install those as well. As before, we do this with npm:

    sudo npm install webpack -g
    npm install babel-loader babel-core babel-preset-es2015 babel-preset-react --save-dev
    npm install css-loader --save-dev

There's some new install modes here in our use of npm. In the case of webpack, this is a tool and not part of our project itself, so typically you install this globally using the `-g` flag. You may have to use sudo. In the case of the babel pieces we need, these are used to build our products, not used directly in the application, so they are development dependencies. But the result is the same in this case.

Now that we've got a basic config, we can start it up in different ways:

    webpack           - for building once for development
    webpack -p        - for building once for production (minification)
    webpack --watch   - for continuous incremental build in development (fast!)
    webpack -d        - to include source maps

We usually fire up `webpack --watch -d` in a terminal window and leave it on our screen so we can see it build. It is  pretty fast, especially after the first build, but it good to see errors.

Right now we don't have a "./src/entry.jsx" file, so running webpack will not work. See the 'Using React' section below for how we might start building up our React application starting with the entry.jsx file.

### References

 * webpack: https://webpack.github.io/
 * webpack how-to: https://github.com/petehunt/webpack-howto
 * babel: https://babeljs.io/
 * babel-loader: https://github.com/babel/babel-loader

---

## Using React

Our projects use React, and if you want to consume one of our UI libraries, you need to use React, at least a little bit.

What we'll do is make a simple ./src/entry.jsx file, then we'll expand it to show a circuit using one of the ESnet open source libraries.

Here is about as simple as React gets. Copy this into ./src/entry.jsx:

    import React from "react";
    import ReactDOM from "react-dom";
    ReactDOM.render(
        <h1>Hello, world!</h1>,
        document.getElementById("content")
    );

If we save this, then run webpack (at the project top level), it should build a ./public/bundle.js file. This is the script that is referenced in the index.html file. It's contents is Javascript that can run in the browser.

    webpack

Then, start up the node.js server, or whatever server you are using. For node:

    node server.js

And navigating to http://localhost:8080, we should see the text 'Hello, World!' where the content placeholder was before. At this point we have a fully functioning React app.

This app is now:

 * working with npm modules, such as React
 * we're using next-generation Javascript here with the import statement
 * we're serving our application with node.js

To test out the webpack watch mode, run

    webpack --watch

Now try to change the entry.jsx file to output some different text. Then refresh the webpage. If the text in the web page changed as you expected, you've now got your development environment working. Now lets add something real.

### Expanding this example

In this next step, we'll use one of the ESnet Open Source libraries within our newly created web application. Cut and paste this code into "./src/entry.js" instead of the Hello World code:

    import React from "react";
    import ReactDOM from "react-dom";
    import { BasicCircuit } from "react-network-diagrams";
    const lineStyle = {
        node: {
            normal: {stroke: "#737373", strokeWidth: 4, fill: "none"},
            highlighted: {stroke: "#b1b1b1", strokeWidth: 4, fill: "#b1b1b1"}
        },
        line: {
            normal: {stroke: "#1f77b4", strokeWidth: 3, fill: "none"},
            highlighted: {stroke: "#4EC1E0",strokeWidth: 4,fill: "none"}
        },
        label: {
            normal: {fill: "#9D9D9D",fontFamily: "verdana, sans-serif",fontSize: 10}
        }
    };
    const endpointStyle = {
        node: {
            normal: {fill: "none", stroke: "#DBDBDB", strokeWidth: 4}
        },
        label: {
            normal: {fill: "#9D9D9D", fontSize: 10, fontFamily: "verdana, sans-serif"}
        }
    };
    ReactDOM.render(
        <BasicCircuit
            title="A test circuit from albq to hou"
            circuitLabel="albq-hou"
            lineStyle={lineStyle}
            endpointStyle={endpointStyle}
            endpointLabelA="ALBQ"
            endpointLabelZ="HOU" />,
        document.getElementById("content")
    );

Most of this file is now the style definitions which are needed for the circuit rendering. However, a couple of key parts to note here:

 * We are importing the react-network-diagrams code and destructuring it to get the BasicCircuit out of it. This is ES6 syntax, but should be fairly straight forward to read.
 * We are now now rendering a `<BasicCircuit>` instead of rendering `<h1>Hello World!</h1>` we saw before.

We pass values (in React speak: “props”) into the BasicCircuit component just like in html. This syntax is JSX. For example, we set the `circuitLabel=“albq-hou”`. Full details of props that can be passed into our components can be found in the docs pages for the libraries. Having html like code in the middle of our Javascript may seem weird at first, or give you flashbacks to PHP 1999, but it's actually a really nice way of working. In the background webpack and the babel loader will take this and turn it into function calls.

### Taking this further

We can now make our own components to start encapsulating data. Please see the React docs for how to create a new component. As you build an app, you would have a single top level component such as `<App>`, which you would render as shown above. The render() function of App would render additional components and so on.

The resulting project is in the source of this repo. A further extension where we start to work with React components can be found in the react-components branch. Check out the ./src directory for changes.
