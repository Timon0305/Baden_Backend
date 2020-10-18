const countries = require('./countries');

module.exports = countries;
module.exports.getAll = () => {
  return countries;
};
module.exports.getById = (id) => {
  for (let country of countries) {
    if (country.id === id) {
      return country;
    }
  }
  return null
};
