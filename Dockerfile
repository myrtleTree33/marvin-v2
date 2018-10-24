FROM node:8.12.0-jessie

ENV PATH="=/home/node/.npm-global/bin:${PATH}"
ENV NUM_NODES=10
ENV MONGO_URI="mongodb://localhost/test"
ENV MIN_INTERVAL=20
ENV RAND_INTERVAL=2000
ENV JOB_INTERVAL_MS=200

# Create app directory
WORKDIR /home/node/app
ADD . /home/node/app
RUN npm install . --unsafe-perm
# Run in bash instead of sh
ENTRYPOINT [ "./startup.sh" ]