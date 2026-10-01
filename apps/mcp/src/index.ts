import { randomUUID } from "node:crypto";

import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";

import { createAwbaMcpServer } from "./server.js";

async function startStdio() {
  const server = createAwbaMcpServer();
  await server.connect(new StdioServerTransport());
  console.error("Awba MCP server connected over stdio");
}

async function startHttp() {
  const port = Number(process.env.MCP_PORT ?? 8787);
  const host = process.env.MCP_HOST ?? "127.0.0.1";
  const app = createMcpExpressApp({ host });
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  app.get("/healthz", (_request, response) => {
    response.json({ status: "ok", service: "awba-mcp", transport: "streamable-http" });
  });

  app.post("/mcp", async (request: Request, response: Response) => {
    try {
      const sessionId = request.header("mcp-session-id");
      let transport = sessionId ? sessions.get(sessionId) : undefined;

      if (!transport && !sessionId && isInitializeRequest(request.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          enableJsonResponse: true,
          onsessioninitialized: (id) => {
            sessions.set(id, transport!);
          },
        });
        transport.onclose = () => {
          if (transport?.sessionId) sessions.delete(transport.sessionId);
        };
        await createAwbaMcpServer().connect(transport);
      }

      if (!transport) {
        response.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Invalid or missing MCP session" },
          id: null,
        });
        return;
      }
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!response.headersSent) {
        response.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  const sessionRequest = async (request: Request, response: Response) => {
    const transport = sessions.get(request.header("mcp-session-id") ?? "");
    if (!transport) {
      response.status(400).send("Invalid or missing MCP session");
      return;
    }
    await transport.handleRequest(request, response);
  };
  app.get("/mcp", sessionRequest);
  app.delete("/mcp", sessionRequest);

  const listener = app.listen(port, host, () => {
    console.log(`Awba MCP listening at http://${host}:${port}/mcp`);
  });

  const shutdown = async () => {
    for (const transport of sessions.values()) await transport.close();
    listener.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.argv.includes("--stdio") || process.env.MCP_TRANSPORT === "stdio") {
  await startStdio();
} else {
  await startHttp();
}
