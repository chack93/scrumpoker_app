NAME=scrumpoker_app
TAG=$(shell cat package.json|grep version | sed -e 's/"version"://' -e 's/,//' -e 's/"//g' -e 's/ //g')
DOCKER_CLOUD_NETWORK=net_cloud
LOCALPORT=40006

.PHONY: help
help:
	@echo "make options\n\
		- destroy     destroy docker container & image of name ${NAME}\n\
		- build       build production docker image ${NAME}:${TAG}\n\
		- stop        stop docker container ${NAME}\n\
		- run-docker  run development docker container ${NAME}:latest\n\
		- watch       run localy at port ${LOCALPORT} & watch for changes\n\
		- run         run localy at port ${LOCALPORT}\n\
		- format      format code according to .prettierrc\n\
		- release     push latest image to ghcr, login using personal access token env variable CR_PAT\n\
		- deploy      release latest image on live server, env variable: CLOUD_REMOTE\n\
		- help        display this message"

.PHONY: destroy_container
destroy_container:
	docker container rm ${NAME} -f

.PHONY: destroy_image
destroy_image:
	docker image rm ${NAME}:${TAG} -f
	docker image rm "${NAME}:latest" -f

.PHONY: destroy
destroy: destroy_container destroy_image

.PHONY: copy_fonts
copy_fonts:
	npm install
	cp node_modules/microns/fonts/microns.eot public/app/scrumpoker/font/.
	cp node_modules/microns/fonts/microns.svg public/app/scrumpoker/font/.
	cp node_modules/microns/fonts/microns.ttf public/app/scrumpoker/font/.
	cp node_modules/microns/fonts/microns.woff public/app/scrumpoker/font/.
	cp node_modules/microns/fonts/microns.woff2 public/app/scrumpoker/font/.

.PHONY: build
build: destroy_image copy_fonts
	docker build --tag ${NAME}:${TAG} -f ./Dockerfile .
	docker tag ${NAME}:${TAG} ${NAME}:latest

.PHONY: stop
stop:
	docker container stop ${NAME}

.PHONY: create_docker_network
create_docker_network:
	docker network create ${DOCKER_CLOUD_NETWORK} || true

.PHONY: watch
watch: copy_fonts
	PORT=${LOCALPORT} \
			 npm run dev

.PHONY: run
run: copy_fonts
	npm run build; \
		PORT=${LOCALPORT} \
		npm run start

.PHONY: format
format:
	npm install; \
		npm run format

.PHONY: run-docker
run-docker: destroy_container build create_docker_network
	docker container run \
		--detach \
		--name ${NAME} \
		--net ${DOCKER_CLOUD_NETWORK} \
		--restart always \
		${NAME}

.PHONY: ensure_builder
ensure_builder:
	docker buildx create --use --name multi-arch-builder || true

.PHONY: release
release: ensure_builder
	echo ${CR_PAT} | docker login ghcr.io --username ${CR_USER} --password-stdin
	docker buildx build \
		--platform linux/amd64 \
		--tag ghcr.io/${CR_USER}/${NAME}:${TAG} \
		--tag ghcr.io/${CR_USER}/${NAME}:latest \
		--push \
		-f ./Dockerfile .

.PHONY: deploy
deploy:
	ssh ${CLOUD_REMOTE} ' \
		echo ${CR_PAT} | docker login ghcr.io --username ${CR_USER} --password-stdin; \
		docker pull ghcr.io/${CR_USER}/${NAME}:${TAG}; \
		docker pull ghcr.io/${CR_USER}/${NAME}:latest; \
		docker container rm ${NAME} -f; \
		docker network create ${DOCKER_CLOUD_NETWORK} || true; \
		docker container run \
		--detach \
		--name ${NAME} \
		--net ${DOCKER_CLOUD_NETWORK} \
		--restart always \
		ghcr.io/${CR_USER}/${NAME}; \
		'
