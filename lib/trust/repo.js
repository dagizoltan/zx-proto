import { Result, Errors } from './types.js';

/**
 * Trust Repository Factory
 * Composes middleware to create a functional repository.
 *
 * @param {Deno.Kv} kv
 * @param {Array<Function>} plugins
 */
export const createRepository = (kv, plugins = []) => {

  // Pipeline Runner
  const runPipeline = async (action, context, initialData) => {
    // Construct the chain: plugins are applied Right-to-Left (outermost first)
    // Plugin Signature: (next) => (ctx, data) => Promise<Result>

    const baseAction = async (ctx, data) => action(ctx, data);

    const chain = plugins.reduceRight(
        (nextFn, pluginFn) => pluginFn(nextFn),
        baseAction
    );

    return chain(context, initialData);
  };

  const save = async (tenantId, data) => {
    // The Base Action: Commit to KV
    const baseSave = async (ctx, d) => {
       if (!d.id) return Result.fail(Errors.Validation('ID is required'));

       // Multi-Tenant Key Structure
       const key = ['tenants', ctx.tenantId, 'data', ctx.schema?.name || 'unknown', d.id];

       // We can add optimistic check here if version exists in d._v

       await kv.set(key, d);
       return Result.ok(d);
    };

    // Context passed down the chain
    const ctx = { tenantId, kv, operation: 'save' };
    return runPipeline(baseSave, ctx, data);
  };

  const find = async (tenantId, query) => {
      // Base Action: Query by ID
      const baseFind = async (ctx, q) => {
          let id = typeof q === 'string' ? q : q.id;
          if (!id) return Result.fail(Errors.Validation('Query ID missing'));

          const key = ['tenants', ctx.tenantId, 'data', ctx.schema?.name || 'unknown', id];
          const entry = await kv.get(key);

          if (!entry.value) return Result.fail(Errors.NotFound(`Entity ${id} not found`));
          return Result.ok(entry.value);
      };

      const ctx = { tenantId, kv, operation: 'find' };
      return runPipeline(baseFind, ctx, query);
  };

  return { save, find };
};
