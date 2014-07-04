#!/bin/bash

configure_ec2_timezone() {
    sudo ln -sf /usr/share/zoneinfo/America/Los_Angeles /etc/localtime
}

download_and_make_redis() {
    wget http://download.redis.io/releases/redis-2.8.12.tar.gz
    tar xzf redis-2.8.12.tar.gz
    cd redis-2.8.12
    make
}

configure_redis_ec2() {
    # setup conf dirs
    sudo mkdir /etc/redis /var/lib/redis
    sudo cp src/redis-server src/redis-cli /usr/local/bin

    # put pre-configured config in place
    cd ..
    sudo cp ./bin/redis.conf.aws /etc/redis/redis.conf

    # get redis-server script
    wget https://raw.github.com/saxenap/install-redis-amazon-linux-centos/master/redis-server
    sudo mv redis-server /etc/init.d
    sudo chmod 755 /etc/init.d/redis-server

    # auto-enable redis-server
    sudo chkconfig --add redis-server
    sudo chkconfig --level 345 redis-server on

    sudo service redis-server start
}

install_mongodb_ec2() {
    # see: http://michaelconnor.org/2013/07/install-mongodb-on-amazon-64-bit-linux/
    sudo cp ./bin/10gen.repo /etc/yum.repos.d/
    sudo yum install mongo-10gen mongo-10gen-server
    sudo mkdir -p /data/db
    sudo chown mongod:mongod /data/db
    sudo service mongod start
}

install_mongodb_mac() {
    brew install mongodb
    mkdir -p /data/db
    sudo chmod u+r /data/db
    mongod &
}

install_nvm() {
    # Install node version manager
    if [[ ! -e "~/.nvm/nvm.sh" ]]; then
        echo "Installing nvm..."
        curl https://raw.githubusercontent.com/creationix/nvm/v0.8.0/install.sh | sh
        source $HOME/.nvm/nvm.sh

        # setup node
        echo "Installing node v0.10..."
        nvm install 0.10
        echo "Setting default node v0.10..."
        nvm alias default 0.10
        nvm use 0.10
    else
        echo "nvm already installed"
    fi
}

install_npm() {
    if [[ -z "$(command -v npm)" ]]; then
        echo "Installing npm"
        curl -L https://npmjs.org/install.sh | sh
    else
        echo "npm already installed"
    fi
}

cleanup_ec2() {
    rm redis-*.tar.gz
    rm -rf redis*/
}

do_ec2_setup() {
    echo "Setup: ec2"

    sudo yum -y update
    sudo yum groupinstall "Development Tools"

    # Install prereq packages

    # Configure timezone
    configure_ec2_timezone

    #
    # MongoDB
    #
    install_mongodb_ec2

    #
    # Redis
    # instructions: http://codingsteps.com/install-redis-2-6-on-amazon-ec2-linux-ami-or-centos/
    #
    sudo yum -y install gcc make
    download_and_make_redis
    configure_redis_ec2

    #
    # Node.js
    #
    install_nvm
    install_npm

    # setup required node modules
    echo "Installing grunt-cli..."
    npm install -g grunt-cli

    echo "Installing nodemon..."
    npm install nodemon -g

    echo "Installing node dependencies..."
    npm install

    cleanup_ec2
}

do_local_setup() {
    echo "Setup: local dev"

    # Update Homebrew Formulae
    brew update

    brew install redis

    install_mongodb_mac

    install_nvm
    install_npm

    echo "Installing nodemon..."
    sudo npm install nodemon -g

    echo "Installing nodemon..."
    sudo npm install nodemon -g

    echo "Installing node dependencies..."
    npm install
}

main() {

    echo $PATH

    if [[ -z "$(command -v yum)" ]]; then
        do_local_setup
    else
        do_ec2_setup
    fi

    echo "PLEASE RESTART YOUR SHELL TO CONTINUE"
}

# Run script
main
