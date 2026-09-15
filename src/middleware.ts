export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bets/:path*",
    "/bankroll/:path*",
    "/responsible-gambling/:path*",
    "/settings/:path*",
  ],
};
