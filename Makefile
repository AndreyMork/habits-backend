#! make

MAKEFLAGS += --silent
GIT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)

DIST_DIRECTORY="dist"
SRC_DIRECTORY="src"
TEST_DIRECTORY="__tests__"
PRETTIER_GLOB="{$(SRC_DIRECTORY),$(TEST_DIRECTORY)}/**/*.{js,ts,json,yaml,yml}"

# General

install:
	yarn install
.PHONY: install

clean:
	rm -rf \
		$(DIST_DIRECTORY) \
		node_modules \
		yarn.lock \
		yarn-error.log \
		coverage \
		reports
.PHONY: clean

clean-install: clean install
.PHONY: clean-install

# Build

# build-declaration:
# 	yarn tsc \
# 	--declaration \
# 	--declarationDir $(DIST_DIRECTORY) \
# 	--emitDeclarationOnly \
# 	--noEmit false
# .PHONY: build-declarations

build:
	NODE_ENV=production \
	yarn babel $(SRC_DIRECTORY) --out-dir $(DIST_DIRECTORY) \
		--delete-dir-on-start \
		--copy-files \
		--extensions ".js,.ts"
	# make build-declaration
.PHONY: build

# Tests

prettier-check:
	yarn prettier --check $(PRETTIER_GLOB)
.PHONY: prettier-check

format:
	yarn prettier --write $(PRETTIER_GLOB)
.PHONY: format

lint:
	yarn eslint . --ext ".js,.ts"
.PHONY: lint

typecheck:
	yarn tsc
.PHONY: typecheck

test: build-test-database
	NODE_ENV=test \
	yarn jest
.PHONY: test

full-test: prettier-check lint typecheck test
.PHONY: full-test

build-test-database:
	docker build -t habits-backend-test-db test-database
.PHONY: build-test-database

# Deploy

run-dev:
	yarn babel-node src/bin/startServer.ts -x .ts
.PHONY: run-dev

docker-build: build
	docker build -t habits-backend .
.PHONY: docker-build

deploy: full-test deploy-no-tests
.PHONY: deploy

deploy-no-tests: docker-build
	docker-compose up -d
.PHONY: deploy-no-tests
