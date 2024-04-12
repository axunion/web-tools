export class FetchError extends Error {
  constructor(resource: string, status: number, statusText: string) {
    super(`Failed to fetch data from ${resource}: ${status} ${statusText}`);
    this.name = "FetchError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const fetchJson = async <T>(
  resource: string,
  init?: RequestInit,
): Promise<T> => {
  try {
    const response = await fetch(resource, init);

    if (response.ok) {
      return response.json();
    } else {
      throw new FetchError(resource, response.status, response.statusText);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unexpected error occurred: ${String(error)}`);
    }
  }
};

export const fetchBlob = async (
  resource: string,
  init?: RequestInit,
): Promise<Uint8Array> => {
  try {
    const response = await fetch(resource, init);

    if (response.ok) {
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      return new Uint8Array(buffer);
    } else {
      throw new FetchError(resource, response.status, response.statusText);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unexpected error occurred: ${String(error)}`);
    }
  }
};
