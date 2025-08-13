function setSignedCookie(res, name, value, options = {}) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    ...options,
  });
}

function clearSignedCookie(res, name, options = {}) {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    ...options,
  });
}

module.exports = { setSignedCookie, clearSignedCookie };
