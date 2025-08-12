export type AuthBridge = {
  onLogout?: () => void
  onAccessTokenUpdated?: (access: string) => void
}

export const authBridge: AuthBridge = {}

export function registerAuthBridge(partial: AuthBridge) {
  Object.assign(authBridge, partial)
}