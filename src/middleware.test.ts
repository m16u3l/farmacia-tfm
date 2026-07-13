jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;
    body: BodyInit | null;

    constructor(body: BodyInit | null = null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers ?? {});
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), { status: init?.status ?? 200, headers: init?.headers ?? {} });
    }
  }

  class MockNextRequest {
    method: string;
    nextUrl: URL;
    url: string;

    constructor(url: string, init?: { method?: string }) {
      this.url = url;
      this.method = init?.method ?? "GET";
      this.nextUrl = new URL(url);
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { getSessionFromRequest } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  getSessionFromRequest: jest.fn(),
}));

jest.mock("@/lib/permissions", () => ({
  roleCanAccess: jest.fn(() => true),
  roleCanAccessApi: jest.fn(() => true),
}));

describe("middleware CORS handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a preflight response for API OPTIONS requests with CORS headers", async () => {
    (getSessionFromRequest as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/inventory-validations", {
      method: "OPTIONS",
    });

    const response = await middleware(request as any);

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("OPTIONS");
  });
});
