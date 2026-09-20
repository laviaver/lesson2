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

The API listens on `http://localhost:3000`.

If `npm run db:setup` fails, wait a few seconds for Postgres to finish starting, then run it again.

### Tests

Create a separate test database, then run Jest:

```cmd
docker compose exec postgres psql -U postgres -c "CREATE DATABASE employee_api_test;"
npm test
```

Unit tests do not need Postgres. Integration tests need Postgres (and Redis for create/delete cache/queue side effects).
