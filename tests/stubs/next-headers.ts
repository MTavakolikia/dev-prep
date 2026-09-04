// stub: next/headers is unavailable outside a request scope under test
export const cookies = async (): Promise<never> => {
  throw new Error('next/headers is stubbed in tests');
};
export const headers = async (): Promise<never> => {
  throw new Error('next/headers is stubbed in tests');
};
