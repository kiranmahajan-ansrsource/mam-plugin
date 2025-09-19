function unflatten(flatObj) {
  if (typeof flatObj !== "object" || flatObj === null) {
    throw new TypeError("Expected a non-null object");
  }

  const result = {};

  for (const [flatKey, value] of Object.entries(flatObj)) {
    const keys = flatKey.split(".");
    let curr = result;

    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        curr[key] = value;
      } else {
        if (!curr[key] || typeof curr[key] !== "object") {
          curr[key] = {};
        }
        curr = curr[key];
      }
    });
  }

  return result;
}

module.exports = { unflatten };
