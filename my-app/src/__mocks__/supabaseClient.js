// Test double for supabaseClient — wired via package.json jest.moduleNameMapper
const query = () => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    ilike: () => builder,
    in: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
  };
  return builder;
};

export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => query(),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ error: null }),
    }),
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
};
