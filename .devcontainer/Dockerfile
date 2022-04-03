# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}
WORKDIR /workspace
# installs necessary packages for bcrypt (build-essential, python)
RUN apt-get update \
&& apt-get install -y build-essential \ 
&& apt-get install -y python
# remove locked dependencies to avoid build problems
RUN rm -rf package-lock.json \
&& rm -rf node_modules
