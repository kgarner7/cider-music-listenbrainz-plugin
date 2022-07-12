import { author, description, name, repository, version } from "../package.json";

export const USER_AGENT = `${name}/${version} { ${repository.url} }`;
export default { author, description, name, repository, version };