function createStorage(key: string) {
  return {
    get(): string {
      return localStorage.getItem(key) || ''
    },
    set(value: string) {
      localStorage.setItem(key, value)
    },
    remove() {
      localStorage.removeItem(key)
    },
  }
}

export const tokenStorage = createStorage('admin_token')
export const usernameStorage = createStorage('admin_username')
