import { z } from 'zod';

export const homepageProfileSchema = z.object({
  productName: z.string(),
  sourceFile: z.string(),
  title: z.string(),
  metaDescription: z.string(),
  headings: z.array(z.string()),
  heroMessages: z.array(z.string()),
  navigationItems: z.array(z.string()),
  callToActions: z.array(z.string()),
  productClaims: z.array(z.string()),
  targetUsers: z.array(z.string()),
  trustSignals: z.array(z.string()),
  developerSignals: z.array(z.string()),
  pricingSignals: z.array(z.string()),
  rawTextPreview: z.string(),
});

export const homepagePairSchema = z.object({
  self: homepageProfileSchema,
  competitor: homepageProfileSchema,
});

export type HomepageProfile = z.infer<typeof homepageProfileSchema>;
export type HomepagePair = z.infer<typeof homepagePairSchema>;

export const emptyHomepageProfile = (
  productName: string,
  sourceFile: string,
): HomepageProfile => ({
  productName,
  sourceFile,
  title: '',
  metaDescription: '',
  headings: [],
  heroMessages: [],
  navigationItems: [],
  callToActions: [],
  productClaims: [],
  targetUsers: [],
  trustSignals: [],
  developerSignals: [],
  pricingSignals: [],
  rawTextPreview: '',
});
