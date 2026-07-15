// types/next.d.ts
import "next";

declare module "next" {
  interface PageProps {
    searchParams?: Record<string, string | string[] | undefined>;
  }
}
