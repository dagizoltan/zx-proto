
// Result Type for Functional Error Handling
export const Result = {
  ok: (value) => ({ ok: true, value }),
  fail: (error) => ({ ok: false, error }),
};

// Error Types
export const Errors = {
  Validation: (msg) => ({ type: 'Validation', message: msg }),
  Encryption: (msg) => ({ type: 'Encryption', message: msg }),
  Integrity: (msg) => ({ type: 'Integrity', message: msg }),
  NotFound: (msg) => ({ type: 'NotFound', message: msg }),
  Concurrency: (msg) => ({ type: 'Concurrency', message: msg }),
};
