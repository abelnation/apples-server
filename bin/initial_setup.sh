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

install_grunt_cli() {
}

do_ec2_setup() {
    echo "Setup: ec2"

    sudo yum -y update

    # Install prereq packages

    # Configure timezone
    configure_ec2_timezone

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
    sudo npm install -g grunt-cli

    echo "Installing nodemon..."
    npm install nodemon -g

    echo "Installing node dependencies..."
    npm install
}

do_local_setup() {
    echo "Setup: local dev"

    # Update Homebrew Formulae
    brew update

    brew install redis

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
