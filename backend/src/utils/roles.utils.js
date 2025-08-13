const ALLOWED_ROLES = (process.env.ALLOWED_ROLES || "")
  .split(",")
  .map((role) => role.trim().toLowerCase())
  .filter(Boolean);

function normalizeRole(role) {
  return role.split("#").pop().trim().toLowerCase();
}

function hasAllowedRole(userRoles) {
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false;

  return userRoles.some((role) => ALLOWED_ROLES.includes(normalizeRole(role)));
}

module.exports = {
  ALLOWED_ROLES,
  normalizeRole,
  hasAllowedRole,
};
