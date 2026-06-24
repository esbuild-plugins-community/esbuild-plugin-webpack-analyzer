import fs from 'node:fs';
import http, { type Server, type ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Metafile } from 'esbuild';

import { getViewerData } from './analyzer.ts';
import { renderViewer } from './template.ts';
import type { TypeChartData } from './types.ts';

type ServerOptions = {
  port?: number;
  host?: string;
  title?: string;
};
type ViewerServerObj = {
  http: Server;
  updateChartData: (metafile: Metafile) => void;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getChartData(
  metafile: Metafile,
  extensionsSet: Set<string>
): { chartData: TypeChartData; entrypoints: Array<string> } | null {
  try {
    return getViewerData(metafile, extensionsSet);
  } catch (err) {
    console.error(`Couldn't analyze metafile:\n${err}`);
    console.debug((err as Error).stack);
    return null;
  }
}

export async function startServer(
  metafile: Metafile,
  extensionsSet: Set<string>,
  opts: ServerOptions
): Promise<ViewerServerObj> {
  const { port = 8888, host = '127.0.0.1', title = 'Analyzer' } = opts;

  const initialData = getChartData(metafile, extensionsSet);

  if (!initialData) {
    throw new Error("Can't get chart data");
  }

  let chartData = initialData.chartData;
  const entrypoints = initialData.entrypoints;

  const publicDir = path.join(__dirname, 'public');
  const eventClients = new Set<ServerResponse>();

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      const html = renderViewer({ title, chartData, entrypoints });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (req.method === 'GET' && req.url === '/viewer.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.createReadStream(path.join(publicDir, 'viewer.js')).pipe(res);
    } else if (req.method === 'GET' && req.url === '/viewer.css') {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      fs.createReadStream(path.join(publicDir, 'viewer.css')).pipe(res);
    } else if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });
      res.write('retry: 1000\n\n');

      eventClients.add(res);
      req.on('close', () => eventClients.delete(res));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      resolve();

      const boundAddress = server.address();
      const boundPort = boundAddress && typeof boundAddress !== 'string' ? boundAddress.port : port;

      console.info(
        `Esbuild Bundle Analyzer is started at http://${host}:${boundPort}\nUse Ctrl+C to close it`
      );
    });
  });

  function updateChartData(newMetafile: Metafile) {
    const newData = getChartData(newMetafile, extensionsSet);

    if (!newData) return;

    chartData = newData.chartData;

    const payload = JSON.stringify(newData.chartData);

    eventClients.forEach((client) => {
      client.write(`event: chartDataUpdated\ndata: ${payload}\n\n`);
    });
  }

  return {
    http: server,
    updateChartData,
  };
}
