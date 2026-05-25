export const adminAuthHeader = "x-admin-key";

export function getAdminKeyFromRequest(request: Request) {
  const url = new URL(request.url);
  return request.headers.get(adminAuthHeader) ?? url.searchParams.get("admin_key") ?? "";
}

export function isAdminRequestAuthorized(request: Request) {
  const configuredSecret = process.env.ADMIN_DASHBOARD_SECRET;

  if (!configuredSecret) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return getAdminKeyFromRequest(request) === configuredSecret;
}
