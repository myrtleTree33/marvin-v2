# FROM node:8.12.0-jessie
# FROM timbru31/java-node
FROM ubuntu 

# ENV PATH="=/home/node/.npm-global/bin:${PATH}"
# ENV NUM_NODES=10
# ENV MONGO_URI="mongodb://localhost/test"
# ENV MIN_INTERVAL=20
# ENV RAND_INTERVAL=2000
# ENV JOB_INTERVAL_MS=200
# ENV DEFAULT_CACHE_TIME_MS=7200000
# ENV MIN_CACHE_TIME_MS=7200000
# ENV MAX_CACHE_TIME_MS=172800000
# ENV MAX_DIFF_TOLERANCE=0.12

# Create app directory
WORKDIR /home/node/app

RUN apt update -y
RUN apt install -y default-jdk

RUN echo $JAVA_HOME

ADD . /home/node/app
RUN npm install -g babel-cli
RUN npm install .
RUN npm run-script build
RUN npm run-script start
# RUN npm install . --unsafe-perm
# Run in bash instead of sh
# ENTRYPOINT [ "./startup.sh" ]