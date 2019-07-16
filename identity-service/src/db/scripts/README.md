# Introduction
This folder contains scripts that are use to generate data or run automated processes related to the database

# One-time setup

## Setup mysql config
* Run `mysql-config.sh`
* Enter root password

## Create database schema
* Create a database schema named `identity` for development and `identity_test` for test

# Using the scripts

## Generate create table scripts
Run `generate-create-table.sh`

**Output**
`.sql` scripts are saved in `generated/` folder

## Create tables
Run `create-table.sh`

## Drop tables
Run `drop-table.sh`


# Note
By default, scripts will run on database schema `identity` for development.

To run scripts for test, pass in `test` as an argument to the script
e.g. `./generate-create-table.sh test`