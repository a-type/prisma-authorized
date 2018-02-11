export default (...paths: Array<?string>): string =>
  paths.filter(Boolean).join('.');
