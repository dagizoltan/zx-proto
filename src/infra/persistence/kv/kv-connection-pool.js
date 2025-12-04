export const createKVPool = (size = 5) => {
  const connections = [];
  const available = [];

  const initialize = async () => {
    for (let i = 0; i < size; i++) {
      const kv = await Deno.openKv();
      connections.push(kv);
      available.push(kv);
    }
  };

  const acquire = async () => {
    while (available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return available.pop();
  };

  const release = (kv) => {
    available.push(kv);
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
