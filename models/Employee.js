const { getPool } = require("../config/db");

const SORT_COLUMNS = {
  name: "name",
  department: "department",
  createdAt: "created_at",
};

function mapEmployee(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    department: row.department,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isInvalidUuidError(err) {
  return err.code === "22P02";
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function buildListFilters(filters = {}) {
  const where = [];
  const params = [];

  if (filters.department) {
    params.push(filters.department);
    where.push(`department = $${params.length}`);
  }

  if (filters.search && filters.search.trim() !== "") {
    params.push(`%${escapeLike(filters.search.trim())}%`);
    where.push(
      `(name ILIKE $${params.length} ESCAPE '\\' OR department ILIKE $${params.length} ESCAPE '\\')`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
}

async function findAll({ filters = {}, sortOption, skip, limit }) {
  const { whereSql, params } = buildListFilters(filters);

  let orderSql = "ORDER BY created_at DESC";
  if (sortOption) {
    const column = SORT_COLUMNS[sortOption.field];
    if (column) {
      const direction = sortOption.direction === 1 ? "ASC" : "DESC";
      orderSql = `ORDER BY ${column} ${direction}`;
    }
  }

  params.push(limit, skip);
  const { rows } = await getPool().query(
    `SELECT * FROM employees ${whereSql} ${orderSql} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows.map(mapEmployee);
}

async function count(filters = {}) {
  const { whereSql, params } = buildListFilters(filters);
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS total FROM employees ${whereSql}`,
    params
  );
  return rows[0].total;
}

async function findById(id) {
  try {
    const { rows } = await getPool().query(
      "SELECT * FROM employees WHERE id = $1",
      [id]
    );
    return mapEmployee(rows[0]);
  } catch (err) {
    if (isInvalidUuidError(err)) return null;
    throw err;
  }
}

async function create({ name, department }) {
  const { rows } = await getPool().query(
    `INSERT INTO employees (name, department)
     VALUES ($1, $2)
     RETURNING *`,
    [name, department]
  );
  return mapEmployee(rows[0]);
}

async function updateById(id, updates) {
  const fields = [];
  const params = [];

  if (updates.name !== undefined) {
    params.push(updates.name);
    fields.push(`name = $${params.length}`);
  }
  if (updates.department !== undefined) {
    params.push(updates.department);
    fields.push(`department = $${params.length}`);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push("updated_at = now()");
  params.push(id);

  try {
    const { rows } = await getPool().query(
      `UPDATE employees SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return mapEmployee(rows[0]);
  } catch (err) {
    if (isInvalidUuidError(err)) return null;
    throw err;
  }
}

async function deleteById(id) {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );
    return mapEmployee(rows[0]);
  } catch (err) {
    if (isInvalidUuidError(err)) return null;
    throw err;
  }
}

async function deleteMany() {
  await getPool().query("DELETE FROM employees");
}

module.exports = {
  findAll,
  count,
  findById,
  create,
  updateById,
  deleteById,
  deleteMany,
};
