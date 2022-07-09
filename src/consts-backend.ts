const pkg = require("./package.json");

export const USER_AGENT = `${pkg.name}/${pkg.version} { ${pkg.repository.url} }`;