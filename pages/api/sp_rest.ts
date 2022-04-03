const baseUrl = "/api/scrumpoker"

type RestBodyClient = {
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
type RestBodySession = {
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
type RestBodyHistory = {
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
type RestResponse = {
  head: Map<string, string>
  body: object
}
interface RestResponseClient extends RestResponse {
  body: RestBodyClient
}
interface RestResponseSession extends RestResponse {
  body: RestBodySession
}

export async function requestClientFetch(clientId: string): Promise<RestResponseClient> {
  return await request("GET", `${baseUrl}/client/${clientId}`) as RestResponseClient
}
export async function requestClientCreate(name: string, sessionId: string = "", viewer: boolean = false): Promise<RestResponseClient> {
  return await request("POST", `${baseUrl}/client`, {
    name,
    sessionId,
    viewer
  }) as RestResponseClient
}

export async function requestSessionFetch(sessionId: string): Promise<RestResponseSession> {
  return await request("GET", `${baseUrl}/session/${sessionId}`) as RestResponseSession
}
export async function requestSessionJoinCodeFetch(joinCode: string): Promise<RestResponseSession> {
  return await request("GET", `${baseUrl}/session/join/${joinCode}`) as RestResponseSession
}
export async function requestSessionCreate(
  ownerClientId: string,
  description: string = "",
  cardSelectionList: string = "",
): Promise<RestResponseSession> {
  return await request("POST", `${baseUrl}/session`, {
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
        const header = {}
        const headerEntries = response.headers.entries()
        for (let idx in headerEntries) {
          header[headerEntries[idx][0]] = headerEntries[idx][1]
        }
        if (response.status >= 200 && response.status < 300) return { body: await response.json(), header };
        else reject(Error(`${response.status} - ${response.statusText}`));
      })
      .then(({ body, header }) => {
        resolve({ body, header });
      })
      .catch((error) => {
        reject(error);
      });
  });
}


