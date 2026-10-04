const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { ConflictError, UnauthorizedError } = require("../errors");

async function register(username, password, role) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) throw new ConflictError("Username already taken");

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, password: hashedPassword, role },
  });

  return { id: user.id, username: user.username, role: user.role };
}

async function login(username, password) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new UnauthorizedError("Invalid credentials");

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token, role: user.role };
}

module.exports = { register, login };