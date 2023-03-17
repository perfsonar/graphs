# perfSONAR Graphs

Graphs that show perfSONAR active measurement results taken from a measurement archive. In some cases they will also suplement the graphs with informaion from the Lookup Service to provide additional context in debugging. Graphs are capable of showing data ranging from throughput, loss, one-way delay, and much more. 

## Building the Javascript

Currently the Javascript is packged using webpack and the resulting bundle.js files are kept in this repo. To build those:

```
# start a unibuild container
wget https://raw.githubusercontent.com/perfsonar/unibuild/main/docker-envs/docker-compose.yml

# cd to react dir
cd graphs/perfsonar-graphs/react
docker compose up -d el7

# remove old build files
make clean

# enable devtoolset-3 for building on CentOS 6 only
npm install --force   

# run linter
make lint

# build using webpack (production)
make webpack
# Altenatively run 'make dev' if you want console.log output to show up


# copy build files to where they need to be
make deploy
```

##Getting the Code
You may checkout the code with the following command:

```
git clone --recursive https://github.com/perfsonar/graphs.git
```

Note the use of the `--recursive` option to ensure any submodule trees are included in the clone.

##Building and Installing

To install the code on your system run:

```bash
make install
```

##Packaging
You may create a source tarball of this code with the following:

```bash
make dist
```

##Using the *shared* Submodule
This repository contains a [git submodule](http://git-scm.com/book/en/v2/Git-Tools-Submodules) to the perfSONAR [shared](https://github.com/perfsonar/perl-shared) repository. This submodule is used to access common perfSONAR libraries. You will find a number of symbolic links to these modules under *lib*. The use of a submodule has a few implications when working with the code in this repository:

* As previously noted, when you clone the repository for the first time, you will want to use the `--recursive` option to make sure the submodule tree is included. If you do not, any symbolic links under *lib* will be broken in your local copy. If you forget the `--recursive` option, you can pull the submodule tree with the following commands:

    ```bash
    git submodule init
    git submodule update
    ```
* When you are editing files under *lib* be sure to check if you are working on an actual file or whether it's a link to something under *shared*. In general it is better to make changes to the *shared* submodule by editing the *shared* repository directly. If however you do make changes while working in this repository, see the [git submodule page](http://git-scm.com/book/en/v2/Git-Tools-Submodules#Working-on-a-Project-with-Submodules) for more details on pushing those changes to the server.
* Keep in mind that a submodule points at a specific revision of the repository it is referencing. As such if a new commit is made to the shared submodule's repository, this project will not get the change automatically. Instead it will still point at the old revision. To update to the latest revision of the *shared* submodule repository run the following commands:

    ```bash
    git submodule foreach git pull origin master
    git commit -a -m "Updating to latest shared"
    git push
    ```
* If you want to include a new file from the *shared* submodule, create a symbolic link under *lib*. For example, if you were to add a reference to the  *perfSONAR_PS::Utils::DNS* module you would run the following:

    ```bash
    mkdir -p lib/perfSONAR_PS/Utils/
    cd lib/perfSONAR_PS/Utils/
    ln -s ../../../shared/lib/perfSONAR_PS/Utils/DNS.pm DNS.pm
    ```
For more information on using the submodule, see the *shared/README.md* file or access it [here](https://github.com/perfsonar/perl-shared/blob/master/README.md) 

