const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

module.exports = {
  delay,
};
