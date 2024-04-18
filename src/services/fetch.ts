export class FetchError extends Error {
  constructor(resource: string, status: number, statusText: string) {
    super(
      `Failed to fetch data from ${resource}${
        status ? `: ${status} ${statusText}` : ""
      }`,
    );

    this.name = "FetchError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const fetchJson = async <T>(
  resource: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(resource, init);

  if (response.ok) {
    return response.json();
  } else {
    throw new FetchError(resource, response.status, response.statusText);
  }
};

export const fetchBlob = async (
  resource: string,
  init?: RequestInit,
): Promise<Blob> => {
  const response = await fetch(resource, init);

  if (response.ok) {
    return await response.blob();
  } else {
    throw new FetchError(resource, response.status, response.statusText);
  }
};
