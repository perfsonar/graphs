# Makefile for web development with:
# 1. ES6 / Babel compiler
#    setup: npm install babel
# 2. Bundler (Webpack or Browserify)
#    setup: npm install webpack|browserify
# 3. Static Web Server
#    setup: npm install http-server
# inspired by https://gist.github.com/petermoresi/aed99c17e393f9739d6f

WEBPACK = node_modules/webpack/bin/webpack.js
BROWSERIFY = browserify

UNAME := $(shell uname)
ifeq ($(UNAME),Darwin)
	WAITCOMMAND = fswatch -r -1 src/
else
	WAITCOMMAND = inotifywait -qre close_write src/
endif

all: webpack

rebuild: clean build

rebuild-all: clean all

deps:
	npm install

clean-all: clean clean-deps

clean:
	find public/ -maxdepth 1 -name bundle.* -type f -exec rm {} \;
	find ../html/public/ -maxdepth 1 -type f -exec rm {} \;

clean-deps:
	rm -rf node_modules

deploy:
	find public/ -maxdepth 1 -type f -exec cp "{}" ../html/public/ \;
	cp -R public/jquery ../html/public

setup:
	npm install webpack

webpack:
	@$(WEBPACK) --optimize-minimize

dev:
	@dev=true $(WEBPACK) -d

dev-watch:
	@dev=true $(WEBPACK) -d --watch

watch:
	./watch

test:
	npm test

lint:
	node_modules/eslint/bin/eslint.js src/*.jsx src/*.js server.js test/*.js 
	node_modules/eslint/bin/eslint.js js-shared/lib/*.js js-shared/lib/DataStores/*.js js-shared/lib/Utils/*.js 

server:
	node server.js
