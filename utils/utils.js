// utils.js
function extractCity(address) {
  if (!address) return "";

  // Split by comma (e.g. "Bhopal, MP")
  const parts = address.split(",");
  if (parts.length > 0) {
    return parts[0].trim(); // Take first part as city
  }

  return "";
}

module.exports = { extractCity };
