function baseUrl(): string {
  return joinUrl(window.location.origin, "/scrumpoker/api")
}
function joinUrl(...args: string[]): string {
  return args
    .map(el => el.startsWith("/") ? el.substring(1) : el)
    .map(el => el.endsWith("/") ? el.substring(0, el.length - 1) : el)
    .join("/")
}

export type RestBodyClient = {
  createdAt: string
  deletedAt: string
  id: string
  updatedAt: string
  connected: boolean
  estimation: string
  name: string
  sessionId: string
  viewer: boolean
}
export type RestBodySession = {
  createdAt: string
  deletedAt: string
  id: string
  updatedAt: string
  cardSelectionList: string
  description: string
  gameStatus: string
  ownerClientId: string
  joinCode: string
}
export type RestBodyHistory = {
  createdAt: string
  deletedAt: string
  id: string
  updatedAt: string
  clientId: string
  clientName: string
  estimation: string
  sessionId: string
  gameId: string
}
export type RestResponse = {
  header: Map<string, string>
  body: object
}
export interface RestResponseClient extends RestResponse {
  body: RestBodyClient
}
export interface RestResponseSession extends RestResponse {
  body: RestBodySession
}

export async function requestClientFetch(clientId: string): Promise<RestResponseClient> {
  return await request("GET", `${baseUrl()}/client/${clientId}`) as RestResponseClient
}
export async function requestClientCreate(name: string, sessionId: string = "", viewer: boolean = false): Promise<RestResponseClient> {
  return await request("POST", `${baseUrl()}/client`, {
    name,
    sessionId,
    viewer
  }) as RestResponseClient
}
export async function requestClientUpdate(clientId: string, name: string, sessionId: string = "", viewer: boolean = false): Promise<RestResponseClient> {
  return await request("PUT", `${baseUrl()}/client/${clientId}`, {
    name,
    sessionId,
    viewer
  }) as RestResponseClient
}

export async function requestSessionFetch(sessionId: string): Promise<RestResponseSession> {
  return await request("GET", `${baseUrl()}/session/${sessionId}`) as RestResponseSession
}
export async function requestSessionJoinCodeFetch(joinCode: string): Promise<RestResponseSession> {
  return await request("GET", `${baseUrl()}/session/join/${joinCode}`) as RestResponseSession
}
export async function requestSessionCreate(
  ownerClientId: string,
  description: string = "",
  cardSelectionList: string = "",
): Promise<RestResponseSession> {
  return await request("POST", `${baseUrl()}/session`, {
    cardSelectionList,
    description,
    ownerClientId
  }) as RestResponseSession
}

export function request(method: string, path: string, body: object = undefined): Promise<RestResponse> {
  return new Promise((resolve, reject) => {
    fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body && JSON.stringify(body),
    })
      .then(async (response: Response) => {
        const header = new Map<string, string>()
        const headerEntries = response.headers.entries()
        for (let idx in headerEntries) {
          header[headerEntries[idx][0]] = headerEntries[idx][1]
        }
        response.body
        if (response.status >= 200 && response.status < 300) return {body: await response.text(), header};
        else reject(Error(`${response.status} - ${response.statusText}`));
      })
      .then(({body, header}) => {
        const bodyObject = body ? JSON.parse(body) : {}
        resolve({body: bodyObject, header});
      })
      .catch((error) => {
        reject(error);
      });
  });
}


