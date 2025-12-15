
export const createTestKvPool = async () => {
    const kv = await Deno.openKv(":memory:");
    return {
        withConnection: async (fn) => fn(kv),
        close: async () => kv.close()
    };
};
