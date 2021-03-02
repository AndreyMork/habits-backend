FROM habits-db:latest

ENV POSTGRES_DB habits
COPY data.sql /docker-entrypoint-initdb.d/100-data.sql

EXPOSE 5432
