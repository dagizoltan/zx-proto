export const createKVPool = (size = 5) => {
  const connections = [];
  const available = [];
  const waiting = [];

  const initialize = async (path) => {
    for (let i = 0; i < size; i++) {
      const kv = await Deno.openKv(path);
      connections.push(kv);
      available.push(kv);
    }
  };

  const acquire = async () => {
    if (available.length > 0) {
      return available.pop();
    }
    // No connection available, wait in queue
    return new Promise(resolve => waiting.push(resolve));
  };

  const release = (kv) => {
    if (waiting.length > 0) {
      const resolve = waiting.shift();
      resolve(kv);
    } else {
      available.push(kv);
    }
  };

  const withConnection = async (fn) => {
    const kv = await acquire();
    try {
      return await fn(kv);
    } finally {
      release(kv);
    }
  };

  const close = async () => {
    for (const kv of connections) {
      await kv.close();
    }
    connections.length = 0;
    available.length = 0;
  };

  return { initialize, acquire, release, withConnection, close };
};
