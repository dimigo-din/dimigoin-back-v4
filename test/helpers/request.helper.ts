import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { InjectOptions } from "fastify";
import type { InjectPayload } from "light-my-request";

export class RequestHelper {
  constructor(private app: NestFastifyApplication) {}

  async get(url: string, token?: string, headers: Record<string, string> = {}) {
    const options: InjectOptions = {
      method: "GET",
      url,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    return this.app.inject(options);
  }

  async post(
    url: string,
    payload: InjectPayload,
    token?: string,
    headers: Record<string, string> = {},
  ) {
    const options: InjectOptions = {
      method: "POST",
      url,
      payload,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    return this.app.inject(options);
  }

  async patch(
    url: string,
    payload: InjectPayload,
    token?: string,
    headers: Record<string, string> = {},
  ) {
    const options: InjectOptions = {
      method: "PATCH",
      url,
      payload,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    return this.app.inject(options);
  }

  async put(
    url: string,
    payload: InjectPayload,
    token?: string,
    headers: Record<string, string> = {},
  ) {
    const options: InjectOptions = {
      method: "PUT",
      url,
      payload,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    return this.app.inject(options);
  }

  async delete(url: string, token?: string, headers: Record<string, string> = {}) {
    const options: InjectOptions = {
      method: "DELETE",
      url,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    return this.app.inject(options);
  }

  async multipart(
    url: string,
    fields: Record<string, unknown>,
    files: { buffer: Buffer; name: string; type: string }[],
    token?: string,
  ) {
    const boundary = `----dimigoin-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    const chunks: Buffer[] = [];
    const crlf = "\r\n";

    for (const [key, value] of Object.entries(fields)) {
      const serializedValue =
        value === null || value === undefined
          ? ""
          : typeof value === "string"
            ? value
            : typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
      chunks.push(
        Buffer.from(
          `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${serializedValue}${crlf}`,
        ),
      );
    }

    for (const file of files) {
      chunks.push(
        Buffer.from(
          `--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="${file.name}"${crlf}Content-Type: ${file.type}${crlf}${crlf}`,
        ),
      );
      chunks.push(file.buffer);
      chunks.push(Buffer.from(crlf));
    }

    chunks.push(Buffer.from(`--${boundary}--${crlf}`));
    const payload = Buffer.concat(chunks);

    const options: InjectOptions = {
      method: "POST",
      url,
      payload,
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": payload.length.toString(),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };

    return this.app.inject(options);
  }

  parseBody<
    T = {
      status?: number;
      statusCode?: number;
      message?: unknown;
      error?: unknown;
    },
  >(response: { body: string }): T {
    return JSON.parse(response.body);
  }
}
