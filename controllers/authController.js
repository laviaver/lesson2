const authService = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  const user = await authService.register(username, password, role);
  res.status(201).json({ message: "Account created successfully", user });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const { token, role } = await authService.login(username, password);
  res.status(200).json({ token, role });
});

module.exports = { register, login };