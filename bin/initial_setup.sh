#!/bin/bash

do_ec2_setup() {
    echo "Setup: ec2"

    curl https://raw.githubusercontent.com/creationix/nvm/v0.8.0/install.sh | sh

    # Install prereq packages
    # Install node version manager
    if [[ -e "~/.nvm/nvm.sh" ]]; then
        echo "Installing nvm..."
        curl https://raw.github.com/creationix/nvm/master/install.sh | sh
        if [[ -e "~/.bash_profile" ]]; then
            echo "Sourcing ~/.bash_profile"
            source "~/.bash_profile"
        fi
        if [[ -e "~/.profile" ]]; then
            echo "Sourcing ~/.profile"
            source "~/.profile"
        fi
        if [[ -e "~/.zshrc" ]]; then
            echo "Sourcing ~/.zshrc"
            source "~/.zshrc"
        fi
    else
        echo "nvm already installed"
    fi

    sudo npm install nodemon -g
    npm install
}

do_local_setup() {
    echo "Setup: local dev"

    # Update Homebrew Formulae
    brew update

    # Install node version manager
    if [[ -e "~/.nvm/nvm.sh" ]]; then
        echo "Installing nvm..."
        curl https://raw.github.com/creationix/nvm/master/install.sh | sh
        if [[ -e "~/.bash_profile" ]]; then
            echo "Sourcing ~/.bash_profile"
            source "~/.bash_profile"
        fi
        if [[ -e "~/.profile" ]]; then
            echo "Sourcing ~/.profile"
            source "~/.profile"
        fi
        if [[ -e "~/.zshrc" ]]; then
            echo "Sourcing ~/.zshrc"
            source "~/.zshrc"
        fi
    else
        echo "nvm already installed"
    fi

    # setup node
    echo "Installing node v0.10..."
    nvm install 0.10
    echo "Setting default node v0.10..."
    nvm alias default 0.10
    nvm use 0.10

    # setup required node modules
    if [[ -z "$(command -v grunt)" ]]; then
        echo "Installing grunt-cli..."
        sudo npm install -g grunt-cli
    else
        echo "grunt-cli already installed"
    fi
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

    # Setup package overrides json file
    cp ./bin/package_overrides.json.sample ./package_overrides.json
}

# Run script
main
