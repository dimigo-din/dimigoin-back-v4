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
    const FormData = (await import("form-data")).default;
    const form = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }

    for (const file of files) {
      form.append("file", file.buffer, {
        filename: file.name,
        contentType: file.type,
      });
    }

    const options: InjectOptions = {
      method: "POST",
      url,
      payload: form as InjectPayload,
      headers: {
        ...form.getHeaders(),
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
