export const APP_HOSTNAME = "app.youlearn.ai" as const;
export const MARKETING_HOSTNAME = "youlearn.ai" as const;
export const MARKETING_WWW_HOSTNAME = "www.youlearn.ai" as const;

export const getAppBaseUrl = (protocol: "https" | "http" = "https") =>
  `${protocol}://${APP_HOSTNAME}`;

export const getMarketingBaseUrl = (protocol: "https" | "http" = "https") =>
  `${protocol}://${MARKETING_HOSTNAME}`;

export const isAppHost = (host?: string | null): boolean => {
  if (!host) return false;
  return host === APP_HOSTNAME || host.endsWith(`.${APP_HOSTNAME}`);
};

export const isMarketingHost = (host?: string | null): boolean => {
  if (!host) return false;
  return (
    host === MARKETING_HOSTNAME ||
    host === MARKETING_WWW_HOSTNAME ||
    host.endsWith(`.${MARKETING_HOSTNAME}`)
  );
};
