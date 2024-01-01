APP_NAME=scrumpoker_app
GH_REPO_NAME = scrumpoker_app
VERSION=$(shell cat package.json|grep version | sed -e 's/"version"://' -e 's/,//' -e 's/"//g' -e 's/ //g')
DOCKER_CLOUD_NETWORK=net_app
PORT ?= 8080

.PHONY: help
help:
	@echo "make options\n\
		- destroy     destroy docker container & image of name ${APP_NAME}\n\
		- build       build production docker image ${APP_NAME}:${VERSION}\n\
		- stop        stop docker container ${APP_NAME}\n\
		- run-docker  run development docker container ${APP_NAME}:latest\n\
		- watch       run localy at port ${PORT} & watch for changes\n\
		- run         run localy at port ${PORT}\n\
		- format      format code according to .prettierrc\n\
		- release     push latest image to ghcr, login using personal access token env variable CR_PAT\n\
		- help        display this message"

.PHONY: destroy_container
destroy_container:
	docker container rm ${APP_NAME} -f

.PHONY: destroy_image
destroy_image:
	docker image rm ${APP_NAME}:${VERSION} -f
	docker image rm "${APP_NAME}:latest" -f

.PHONY: destroy
destroy: destroy_container destroy_image

.PHONY: build
build: destroy_image
	docker build --tag ${APP_NAME}:${VERSION} -f ./Dockerfile .
	docker tag ${APP_NAME}:${VERSION} ${APP_NAME}:latest

.PHONY: stop
stop:
	docker container stop ${APP_NAME}

.PHONY: create_docker_network
create_docker_network:
	docker network create ${DOCKER_CLOUD_NETWORK} || true

.PHONY: watch
watch:
	PORT=${PORT} \
			 npm run dev

.PHONY: run
run:
	npm run build; \
		PORT=${PORT} \
		npm run start

.PHONY: format
format:
	npm install; \
		npm run format

.PHONY: run-docker
run-docker: destroy_container build create_docker_network
	docker container run \
		--detach \
		--name ${APP_NAME} \
		--net ${DOCKER_CLOUD_NETWORK} \
		--restart always \
		${APP_NAME}

.PHONY: release
release:
	echo ${CR_PAT} | docker login ghcr.io --username ${CR_USER} --password-stdin
	docker build \
		--platform linux/arm64 \
		--tag ghcr.io/${CR_USER}/${APP_NAME}:${VERSION} \
		--tag ghcr.io/${CR_USER}/${APP_NAME}:latest \
		--label "org.opencontainers.image.source=https://github.com/${CR_USER}/${GH_REPO_NAME}" \
		--label "org.opencontainers.image.description=${APP_NAME} container image" \
		--label "org.opencontainers.image.licenses=NONE" \
		-f ./Dockerfile .
	docker push ghcr.io/${CR_USER}/${APP_NAME}:${VERSION}
	docker push ghcr.io/${CR_USER}/${APP_NAME}:latest

.PHONY: deploy
deploy:
	ssh ${CLOUD_REMOTE} ' \
		echo ${CR_PAT} | docker login ghcr.io --username ${CR_USER} --password-stdin; \
		docker pull ghcr.io/${CR_USER}/${APP_NAME}:${VERSION}; \
		docker pull ghcr.io/${CR_USER}/${APP_NAME}:latest; \
		docker container rm ${APP_NAME} -f; \
		docker network create ${DOCKER_CLOUD_NETWORK} || true; \
		docker container run \
		--detach \
		--name ${APP_NAME} \
		--net ${DOCKER_CLOUD_NETWORK} \
		--restart always \
		ghcr.io/${CR_USER}/${APP_NAME}; \
		'
