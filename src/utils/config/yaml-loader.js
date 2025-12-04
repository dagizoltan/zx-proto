import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';

export const loadYaml = async (filePath) => {
  try {
    const content = await Deno.readTextFile(filePath);
    return parse(content);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
};
