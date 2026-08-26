const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

export async function api<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
  const token =
      typeof window !== "undefined"
          ? localStorage.getItem(
              "lingolearn_token",
          )
          : null;

  const headers = new Headers(
      options.headers,
  );

  if (
      !headers.has(
          "Content-Type",
      )
  ) {
    headers.set(
        "Content-Type",
        "application/json",
    );
  }

  if (token) {
    headers.set(
        "Authorization",
        `Bearer ${token}`,
    );
  }

  const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      },
  );

  if (!response.ok) {
    let message =
        `API request failed: ${response.status}`;

    try {
      const data =
          await response.json();

      if (data?.message) {
        message =
            Array.isArray(
                data.message,
            )
                ? data.message.join(
                    ", ",
                )
                : data.message;
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(message);
  }

  if (
      response.status === 204
  ) {
    return undefined as T;
  }

  return response.json();
}