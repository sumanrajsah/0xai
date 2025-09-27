
interface ServerInfo {
    label: String,
    description: string,
    sid: String,
    uid: string,
    serverType: string,
    created_on: number,
    updated_on: number,
    auth: boolean,
    config: Config,
    tools: string[];
}
interface Config {
    url: String,
    header: Header,
    type: String,

}
interface Header {
    key: string;
    value: string
}