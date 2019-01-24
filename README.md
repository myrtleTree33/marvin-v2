# Marvin

Yet another distributed Web Node Scraper

## Installation

### Docker

    $ docker build -t marvin/marvin .
    $ docker run -d marvin/marvin

### NodeJS installation

    $ npm install -g marvin

### Running dockerfile

To run the dockerfile, do the following:

    $ docker run -d --env-file .env --network="host"
