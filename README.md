# lesson2

Employee API from lesson1, with **PostgreSQL** instead of MongoDB.

## Windows setup

1. Install [Node.js 20+](https://nodejs.org/), [Git](https://git-scm.com/), and [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Open **Command Prompt** or **PowerShell**:

```cmd
git clone https://github.com/laviaver/lesson2.git
cd lesson2
copy .env.example .env
```

3. Edit `.env` and set a real `JWT_SECRET`.
4. Start Postgres and Redis, install packages, create tables, run the API:

```cmd
docker compose up -d postgres redis
npm install
npm run db:setup
npm start
```

The API listens on `http://localhost:3000`. Docker Postgres is published on host port **5433** so a local Postgres on 5432 can keep running. Inside Compose, the database still listens on 5432.

If `npm run db:setup` fails, wait a few seconds for Postgres to finish starting, then run it again.

### Tests

Tests run against a separate database: the name from `DATABASE_URL` with `_test` added (`employee_db_test`), or `TEST_DATABASE_URL` if set. Tests refuse to run against any database whose name does not end in `_test`, because they delete data.

One-time setup — create the test database and apply the Prisma migrations to it:

```cmd
docker compose exec postgres psql -U postgres -c "CREATE DATABASE employee_db_test;"
npm run db:test:migrate
```

Then run Jest:

```cmd
npm test
```

Run `npm run db:test:migrate` again after adding a new migration. Unit tests do not need Postgres; integration tests do.
