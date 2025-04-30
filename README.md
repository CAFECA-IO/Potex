# Potex
Real World Asset Exchange

## Pre Require
- install MySQL
- install Redis
- install ScyllaDB

## Deploy
```
pnpm install
```
```
pnpm run build:all
```
```
vi .env
```
```
mysql -u bicrypto_user -p bicrypto_db < initial.sql
```
```
pnpm seed
```
```
pnpm start
```
