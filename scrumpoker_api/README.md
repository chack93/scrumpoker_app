# scrumpoker_api

scrumpoker api

## Makefile and environment variables

Run **make help** to see all available tasks.

### environment variables

Check the Makefile to see the default values.  
You can override env-vars when calling make (except APP_NAME and VERSION)
Example:
```
PORT=1234 make run
```

__env-vars__
| env-var           | description                                                       |
| :---              | :---                                                              |
| APP_NAME          | app name, will be used as db-name and docker image/container-name |
| VERSION           | app version, will be added added as a tag to the docker image     |
| HOST              | host ip/name to listen for requests                               |
| PORT              | port to listen for requests                                       |
| DOCKER_NETWORK    | docker network to join in order to reach other containers         |
| DATABASE_URL      | postgres db url (or cockroach)                                    |
| MSGQUEUE_NATS_URL | nats server url                                                   |

### DATABASE_URL

value will be passed to gorm, check https://gorm.io/docs/connecting_to_the_database.html to see databases that work out of the box.

## run

run api locally

```
HOST=localhost \
PORT=8080 \
DATABASE_URL=postgresql://@localhost/db_override \
make run
```

## run docker container locally

Run docker container in an environment similar to production, locally.  
No ports are exposed, use a revers proxy.
For example Caddy: https://caddyserver.com/docs/quick-starts/reverse-proxy

```
HOST=localhost \
PORT=8080 \
DATABASE_URL=postgresql://@localhost/app_name \
make run
```

## deployment

### build & upload image

Builds a docker image & uploads it to the given GitHub Container Registry.  
Image name is APP_NAME:VERSION, check Makefile.

```
CR_PAT="GitHub Container Registry Private Access Token" \
CR_USER="GitHub Container Registry Username" \
make release
```

