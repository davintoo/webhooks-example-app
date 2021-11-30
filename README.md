### init

```
export SECRET=SECRET123
export MYSQL_SERVER=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dev_db-dev_1)
export MYSQL_USER=root
export MYSQL_PASSWORD=tests
export MYSQL_DATABASE=webhooks_example
npm start
```
