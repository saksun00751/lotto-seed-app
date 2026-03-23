import { prisma } from "./prisma";

export interface ContactConfig {
  sitename:    string;
  lineid:      string;
  linelink:    string;
  website:     string;
  notice:      string | null;
  title:       string;
  description: string;
}

export async function getContactConfig(): Promise<ContactConfig | null> {
  const config = await prisma.configs.findFirst({
    select: { sitename: true, lineid: true, linelink: true, website: true, notice: true, title: true, description: true },
  });
  if (!config) return null;
  return {
    sitename:    config.sitename,
    lineid:      config.lineid,
    linelink:    config.linelink,
    website:     config.website,
    notice:      config.notice ?? null,
    title:       config.title,
    description: config.description,
  };
}
