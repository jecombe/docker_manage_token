require("dotenv").config;

module.exports = {
  reactStrictMode: false,
  env: {
    CONTRACT: process.env.CONTRACT,
  },
};
