const ALLOWED_ROLES = (process.env.ALLOWED_ROLES || "")
  .split(",")
  .map((role) => role.trim().toLowerCase())
  .filter(Boolean);

function normalizeRole(role) {
  if (typeof role !== "string") return "";
  return role.split("#").pop().trim().toLowerCase();
}

function hasAllowedRole(userRoles) {
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false;

  const normalizedAllowed = ALLOWED_ROLES.map(normalizeRole);
  const normalizedUser = userRoles.map(normalizeRole);

  return normalizedUser.some((role) => normalizedAllowed.includes(role));
}

module.exports = {
  ALLOWED_ROLES,
  normalizeRole,
  hasAllowedRole,
};
