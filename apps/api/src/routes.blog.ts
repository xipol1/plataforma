 import { Router } from "express";
 import { z } from "zod";
 
 import { prisma } from "./lib/prisma.js";
 import { authRequired, requireRole } from "./middleware/auth.js";
 
 const router = Router();
 
 const uuid = z
   .string()
   .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID");
 
 const periodEnum = z.enum(["7", "30", "90"]);
 
const blogCreateSchema = z.object({
   name: z.string().min(1).max(200),
  domain: z.string().min(3).max(200),
   language: z.string().min(2).max(5),
   country: z.string().min(2).max(50).optional(),
   categories: z.array(z.string()).min(1).max(10),
   monthlyTraffic: z.coerce.number().int().positive().optional(),
   DR: z.coerce.number().int().min(0).max(100).optional(),
   DA: z.coerce.number().int().min(0).max(100).optional(),
   indexedPages: z.coerce.number().int().positive().optional(),
 });
 
 const blogUpdateSchema = blogCreateSchema.partial().extend({
   status: z.enum(["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"]).optional(),
 });
 
 const offerCreateSchema = z.object({
   type: z.enum(["SPONSORED_POST", "LINK_INSERTION", "HOMEPAGE_MENTION"]),
   basePrice: z.coerce.number().int().positive(),
   currency: z.string().min(2).max(10).default("USD"),
   turnaroundDays: z.coerce.number().int().positive(),
   dofollow: z.boolean(),
   sponsoredLabel: z.boolean(),
   constraints: z.string().max(2000).optional(),
 });
 
 const offerUpdateSchema = offerCreateSchema.partial();
 
 const requestsQuerySchema = z.object({
   status: z.enum([
     "REQUESTED",
     "ACCEPTED",
     "REJECTED",
     "NEEDS_CHANGES",
     "IN_ESCROW",
     "PUBLISHED",
     "VERIFIED",
     "SETTLED",
     "CANCELED",
   ]).optional(),
   blogSiteId: uuid.optional(),
   limit: z.coerce.number().int().positive().max(50).default(20),
   offset: z.coerce.number().int().nonnegative().default(0),
 });
 
 const requestStatusSchema = z.object({
   status: z.enum(["ACCEPTED", "REJECTED", "NEEDS_CHANGES"]),
   reason: z.string().max(300).optional(),
 });
 
 const publishSchema = z.object({
   publishedUrl: z.string().url(),
   publishedAt: z.string().datetime(),
   notes: z.string().max(500).optional(),
 });
 
 router.get("/blogs", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   try {
     const ownerId = req.user!.role === "BLOG_ADMIN" ? req.user!.id : (req.query.ownerUserId as string | undefined);
    if (ownerId) {
      const parsed = uuid.safeParse(ownerId);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid ownerUserId" });
      }
    }

    const rows = ownerId
      ? await prisma.$queryRaw<{
          id: string;
          name: string;
          domain: string;
          status: string;
          monthlyTraffic: number | null;
          categories: string;
          offers: string;
        }>`
          SELECT
            b.id::text AS id,
            b.name,
            b.domain,
            b.status::text AS status,
            b."monthlyTraffic" AS "monthlyTraffic",
            b.categories,
            COALESCE((SELECT COUNT(*)::text FROM "BlogPlacementOffer" o WHERE o."blogSiteId" = b.id), '0') AS offers
          FROM "BlogSite" b
          WHERE b."ownerUserId" = ${ownerId}::uuid
          ORDER BY b."createdAt" DESC
          LIMIT 100
        `
      : await prisma.$queryRaw<{
          id: string;
          name: string;
          domain: string;
          status: string;
          monthlyTraffic: number | null;
          categories: string;
          offers: string;
        }>`
          SELECT
            b.id::text AS id,
            b.name,
            b.domain,
            b.status::text AS status,
            b."monthlyTraffic" AS "monthlyTraffic",
            b.categories,
            COALESCE((SELECT COUNT(*)::text FROM "BlogPlacementOffer" o WHERE o."blogSiteId" = b.id), '0') AS offers
          FROM "BlogSite" b
          WHERE TRUE
          ORDER BY b."createdAt" DESC
          LIMIT 100
        `;
     return res.status(200).json(rows.rows);
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.post("/blogs", authRequired, requireRole("BLOG_ADMIN"), async (req, res) => {
   const parsed = blogCreateSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
   }
   const data = parsed.data;
   try {
     const categories = data.categories.join(",");
     const result = await prisma.$queryRaw<{ id: string }>`
       INSERT INTO "BlogSite"("ownerUserId","name","domain","language","country","categories","status","monthlyTraffic","DR","DA","indexedPages","createdAt","updatedAt")
       VALUES (${req.user!.id}::uuid, ${data.name}, ${data.domain}, ${data.language}, ${data.country ?? null}, ${categories}, 'PENDING_VERIFICATION'::"BlogStatus",
               ${data.monthlyTraffic ?? null}, ${data.DR ?? null}, ${data.DA ?? null}, ${data.indexedPages ?? null}, NOW(), NOW())
       RETURNING id::text
     `;
     return res.status(201).json({ id: result.rows[0].id });
   } catch (e) {
     const maybeCode = (e as { code?: string }).code;
     if (maybeCode === "23505") {
       return res.status(409).json({ message: "Domain already exists" });
     }
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.patch("/blogs/:id", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   const id = String(req.params.id ?? "");
   const parsed = blogUpdateSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
   }
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT "ownerUserId"::text AS "ownerUserId"
       FROM "BlogSite"
       WHERE id = ${id}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Blog not found" });
     if (req.user!.role === "BLOG_ADMIN" && ownerUserId !== req.user!.id) {
       return res.status(403).json({ message: "Forbidden" });
     }
     const updates: string[] = [];
     const values: unknown[] = [];
     const b = parsed.data;
     if (b.name) values.push(b.name), updates.push(`name = $${values.length}`);
     if (b.domain) values.push(b.domain), updates.push(`domain = $${values.length}`);
     if (b.language) values.push(b.language), updates.push(`language = $${values.length}`);
     if (typeof b.country !== "undefined") values.push(b.country ?? null), updates.push(`country = $${values.length}`);
     if (b.categories) values.push(Array.isArray(b.categories) ? b.categories.join(",") : b.categories), updates.push(`categories = $${values.length}`);
     if (typeof b.monthlyTraffic !== "undefined") values.push(b.monthlyTraffic ?? null), updates.push(`"monthlyTraffic" = $${values.length}`);
     if (typeof b.DR !== "undefined") values.push(b.DR ?? null), updates.push(`"DR" = $${values.length}`);
     if (typeof b.DA !== "undefined") values.push(b.DA ?? null), updates.push(`"DA" = $${values.length}`);
     if (typeof b.indexedPages !== "undefined") values.push(b.indexedPages ?? null), updates.push(`"indexedPages" = $${values.length}`);
     if (b.status) values.push(b.status), updates.push(`status = $${values.length}::"BlogStatus"`);
     values.push(id);
     const idParam = `$${values.length}`;
     const q = `
       UPDATE "BlogSite"
       SET ${updates.join(", ")}, "updatedAt" = NOW()
       WHERE id = ${idParam}::uuid
       RETURNING id::text
     `;
     const result = await prisma.$query(q, values);
     if ((result.rowCount ?? 0) === 0) return res.status(404).json({ message: "Blog not found" });
     return res.status(200).json({ id });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.get("/blogs/:id/offers", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   const id = String(req.params.id ?? "");
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT "ownerUserId"::text AS "ownerUserId"
       FROM "BlogSite"
       WHERE id = ${id}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Blog not found" });
     if (req.user!.role === "BLOG_ADMIN" && ownerUserId !== req.user!.id) {
       return res.status(403).json({ message: "Forbidden" });
     }
     const rows = await prisma.$queryRaw<{
       id: string;
       type: string;
       basePrice: number;
       currency: string;
       turnaroundDays: number;
       dofollow: boolean;
       sponsoredLabel: boolean;
       constraints: string | null;
       createdAt: string;
     }>`
       SELECT
         o.id::text AS id,
         o.type::text AS type,
         o."basePrice" AS "basePrice",
         o.currency,
         o."turnaroundDays" AS "turnaroundDays",
         o.dofollow,
         o."sponsoredLabel" AS "sponsoredLabel",
         o.constraints,
         o."createdAt" AS "createdAt"
       FROM "BlogPlacementOffer" o
       WHERE o."blogSiteId" = ${id}::uuid
       ORDER BY o."createdAt" DESC
     `;
     return res.status(200).json(rows.rows);
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.post("/blogs/:id/offers", authRequired, requireRole("BLOG_ADMIN"), async (req, res) => {
   const id = String(req.params.id ?? "");
   const parsed = offerCreateSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
   }
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT "ownerUserId"::text AS "ownerUserId"
       FROM "BlogSite"
       WHERE id = ${id}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Blog not found" });
     if (ownerUserId !== req.user!.id) {
       return res.status(403).json({ message: "Forbidden" });
     }
     const o = parsed.data;
     const result = await prisma.$queryRaw<{ id: string }>`
       INSERT INTO "BlogPlacementOffer"("blogSiteId","type","basePrice","currency","turnaroundDays","dofollow","sponsoredLabel","constraints","createdAt","updatedAt")
       VALUES (${id}::uuid, ${o.type}::"BlogOfferType", ${o.basePrice}, ${o.currency}, ${o.turnaroundDays}, ${o.dofollow}, ${o.sponsoredLabel}, ${o.constraints ?? null}, NOW(), NOW())
       RETURNING id::text
     `;
     return res.status(201).json({ id: result.rows[0].id });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.patch("/offers/:offerId", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   const offerId = String(req.params.offerId ?? "");
   const parsed = offerUpdateSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
   }
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT b."ownerUserId"::text AS "ownerUserId"
       FROM "BlogPlacementOffer" o
       JOIN "BlogSite" b ON b.id = o."blogSiteId"
       WHERE o.id = ${offerId}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Offer not found" });
     if (req.user!.role === "BLOG_ADMIN" && ownerUserId !== req.user!.id) {
       return res.status(403).json({ message: "Forbidden" });
     }
     const updates: string[] = [];
     const values: unknown[] = [];
     const o = parsed.data;
     if (o.type) values.push(o.type), updates.push(`type = $${values.length}::"BlogOfferType"`);
     if (typeof o.basePrice !== "undefined") values.push(o.basePrice ?? null), updates.push(`"basePrice" = $${values.length}`);
     if (o.currency) values.push(o.currency), updates.push(`currency = $${values.length}`);
     if (typeof o.turnaroundDays !== "undefined") values.push(o.turnaroundDays ?? null), updates.push(`"turnaroundDays" = $${values.length}`);
     if (typeof o.dofollow !== "undefined") values.push(o.dofollow ?? null), updates.push(`dofollow = $${values.length}`);
     if (typeof o.sponsoredLabel !== "undefined") values.push(o.sponsoredLabel ?? null), updates.push(`"sponsoredLabel" = $${values.length}`);
     if (typeof o.constraints !== "undefined") values.push(o.constraints ?? null), updates.push(`constraints = $${values.length}`);
     values.push(offerId);
     const idParam = `$${values.length}`;
     const q = `
       UPDATE "BlogPlacementOffer"
       SET ${updates.join(", ")}, "updatedAt" = NOW()
       WHERE id = ${idParam}::uuid
       RETURNING id::text
     `;
     const result = await prisma.$query(q, values);
     if ((result.rowCount ?? 0) === 0) return res.status(404).json({ message: "Offer not found" });
     return res.status(200).json({ id: offerId });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.get("/blog-requests", authRequired, requireRole("BLOG_ADMIN"), async (req, res) => {
   const parsed = requestsQuerySchema.safeParse(req.query);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
   }
   const { status, blogSiteId, limit, offset } = parsed.data;
   try {
     const rows = await prisma.$queryRaw<{
       id: string;
       status: string;
       createdAt: string;
       blogName: string;
       type: string | null;
       proposedPrice: number;
       advertiserEmail: string;
     }>`
       SELECT
         r.id::text AS id,
         r.status::text AS status,
         r."createdAt" AS "createdAt",
         b.name AS "blogName",
         o.type::text AS type,
         r."proposedPrice" AS "proposedPrice",
         u.email AS "advertiserEmail"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       JOIN "User" u ON u.id = r."advertiserId"
       LEFT JOIN "BlogPlacementOffer" o ON o.id = r."offerId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         ${status ? `AND r.status = ${status}::"BlogOrderStatus"` : ""}
         ${blogSiteId ? `AND r."blogSiteId" = ${blogSiteId}::uuid` : ""}
       ORDER BY r."createdAt" DESC
       LIMIT ${limit}
       OFFSET ${offset}
     `;
     return res.status(200).json(rows.rows);
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
router.get("/blog-requests/:id", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
  const id = String(req.params.id ?? "");
  try {
    const row = await prisma.$queryRaw<{
      id: string;
      status: string;
      createdAt: string;
      blogName: string;
      targetUrl: string;
      anchorText: string;
      contentBrief: string;
      proposedPrice: number;
      finalPrice: number | null;
    }>`
      SELECT
        r.id::text AS id,
        r.status::text AS status,
        r."createdAt" AS "createdAt",
        b.name AS "blogName",
        r."targetUrl" AS "targetUrl",
        r."anchorText" AS "anchorText",
        r."contentBrief" AS "contentBrief",
        r."proposedPrice" AS "proposedPrice",
        r."finalPrice" AS "finalPrice"
      FROM "BlogOrderRequest" r
      JOIN "BlogSite" b ON b.id = r."blogSiteId"
      WHERE r.id = ${id}::uuid
        AND (b."ownerUserId" = ${req.user!.id}::uuid OR ${req.user!.role}::text = 'OPS')
      LIMIT 1
    `;
    const data = row.rows[0];
    if (!data) return res.status(404).json({ message: "Request not found" });
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

 router.patch("/blog-requests/:id", authRequired, requireRole("BLOG_ADMIN"), async (req, res) => {
   const id = String(req.params.id ?? "");
   const parsed = requestStatusSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid body", issues: parsed.error.flatten() });
   }
   const { status, reason } = parsed.data;
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT b."ownerUserId"::text AS "ownerUserId"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE r.id = ${id}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Request not found" });
     if (ownerUserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
     await prisma.$queryRaw`
       UPDATE "BlogOrderRequest"
       SET status = ${status}::"BlogOrderStatus", "updatedAt" = NOW(), notes = ${reason ?? null}
       WHERE id = ${id}::uuid
     `;
     return res.status(200).json({ id, status });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.post("/blog-requests/:id/publish", authRequired, requireRole("BLOG_ADMIN"), async (req, res) => {
   const id = String(req.params.id ?? "");
   const parsed = publishSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid body", issues: parsed.error.flatten() });
   }
   const { publishedUrl, publishedAt, notes } = parsed.data;
   try {
     const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
       SELECT b."ownerUserId"::text AS "ownerUserId"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE r.id = ${id}::uuid
       LIMIT 1
     `;
     const ownerUserId = ownRes.rows[0]?.ownerUserId;
     if (!ownerUserId) return res.status(404).json({ message: "Request not found" });
     if (ownerUserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
     await prisma.$queryRaw`
       INSERT INTO "BlogPublicationProof"("orderId","publishedUrl","publishedAt","proofStatus","notes")
       VALUES (${id}::uuid, ${publishedUrl}, ${publishedAt}::timestamptz, 'PENDING'::"ProofStatus", ${notes ?? null})
       ON CONFLICT ("orderId") DO UPDATE SET "publishedUrl" = EXCLUDED."publishedUrl", "publishedAt" = EXCLUDED."publishedAt", "notes" = EXCLUDED."notes", "proofStatus" = 'PENDING'::"ProofStatus"
     `;
     await prisma.$queryRaw`
       UPDATE "BlogOrderRequest"
       SET status = 'PUBLISHED'::"BlogOrderStatus", "updatedAt" = NOW()
       WHERE id = ${id}::uuid
     `;
     return res.status(200).json({ id, status: "PUBLISHED" });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.post("/blog-requests/:id/verify", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   const id = String(req.params.id ?? "");
   try {
     const dataRes = await prisma.$queryRaw<{ publishedUrl: string | null; targetUrl: string; anchorText: string }>`
       SELECT p."publishedUrl", r."targetUrl" AS "targetUrl", r."anchorText" AS "anchorText"
       FROM "BlogOrderRequest" r
       LEFT JOIN "BlogPublicationProof" p ON p."orderId" = r.id
       WHERE r.id = ${id}::uuid
       LIMIT 1
     `;
     const row = dataRes.rows[0];
     if (!row || !row.publishedUrl) return res.status(400).json({ message: "No published URL" });
     let ok = false;
     let body = "";
     try {
       const resp = await fetch(row.publishedUrl);
       ok = resp.ok;
       body = ok ? await resp.text() : "";
     } catch {}
     const containsTarget = body.includes(row.targetUrl) || body.includes(row.anchorText);
     const status = ok && containsTarget ? "VALID" : "INVALID";
     await prisma.$queryRaw`
       UPDATE "BlogPublicationProof"
       SET "proofStatus" = ${status}::"ProofStatus", "lastCheckedAt" = NOW()
       WHERE "orderId" = ${id}::uuid
     `;
     await prisma.$queryRaw`
       UPDATE "BlogOrderRequest"
       SET status = ${status === "VALID" ? 'VERIFIED' : 'NEEDS_CHANGES'}::"BlogOrderStatus", "updatedAt" = NOW()
       WHERE id = ${id}::uuid
     `;
     return res.status(200).json({ id, proof_status: status });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
 router.get("/dashboard/blog", authRequired, requireRole("BLOG_ADMIN", "OPS"), async (req, res) => {
   const parsed = z.object({ period: periodEnum.default("30") }).safeParse(req.query);
   if (!parsed.success) {
     return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
   }
   const window_days = Number(parsed.data.period);
   try {
     const earningsRes = await prisma.$queryRaw<{ settled: string }>`
       SELECT COALESCE(SUM(r."finalPrice")::text, '0') AS settled
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status = 'SETTLED'::"BlogOrderStatus"
         AND r."updatedAt" >= NOW() - (${String(window_days)} || ' days')::interval
     `;
     const pubsRes = await prisma.$queryRaw<{ count: string }>`
       SELECT COUNT(*)::text AS count
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND (r.status = 'PUBLISHED'::"BlogOrderStatus" OR r.status = 'VERIFIED'::"BlogOrderStatus")
         AND r."updatedAt" >= NOW() - (${String(window_days)} || ' days')::interval
     `;
     const newReqRes = await prisma.$queryRaw<{ count: string }>`
       SELECT COUNT(*)::text AS count
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status = 'REQUESTED'::"BlogOrderStatus"
         AND r."createdAt" >= NOW() - (${String(window_days)} || ' days')::interval
     `;
     const ttrRes = await prisma.$queryRaw<{ days: string | null }>`
       SELECT
         AVG(EXTRACT(EPOCH FROM (p."publishedAt" - r."updatedAt")) / 86400.0)::text AS days
       FROM "BlogOrderRequest" r
       JOIN "BlogPublicationProof" p ON p."orderId" = r.id
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status IN ('PUBLISHED'::"BlogOrderStatus",'VERIFIED'::"BlogOrderStatus")
         AND p."publishedAt" >= NOW() - (${String(window_days)} || ' days')::interval
     `;
 
     const priceAvgRes = await prisma.$queryRaw<{ avg: string | null }>`
       SELECT AVG(r."finalPrice")::text AS avg
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
     `;
     const requestedRes = await prisma.$queryRaw<{ requested: string; accepted: string }>`
       SELECT
         COALESCE((SELECT COUNT(*)::text FROM "BlogOrderRequest" r JOIN "BlogSite" b ON b.id = r."blogSiteId" WHERE b."ownerUserId" = ${req.user!.id}::uuid AND r.status = 'REQUESTED'::"BlogOrderStatus"), '0') AS requested,
         COALESCE((SELECT COUNT(*)::text FROM "BlogOrderRequest" r JOIN "BlogSite" b ON b.id = r."blogSiteId" WHERE b."ownerUserId" = ${req.user!.id}::uuid AND r.status = 'ACCEPTED'::"BlogOrderStatus"), '0') AS accepted
     `;
     const dofollowRes = await prisma.$queryRaw<{ total: string; dofollow: string }>`
       SELECT
         COALESCE((SELECT COUNT(*)::text FROM "BlogPlacementOffer" o JOIN "BlogSite" b ON b.id = o."blogSiteId" WHERE b."ownerUserId" = ${req.user!.id}::uuid), '0') AS total,
         COALESCE((SELECT COUNT(*)::text FROM "BlogPlacementOffer" o JOIN "BlogSite" b ON b.id = o."blogSiteId" WHERE b."ownerUserId" = ${req.user!.id}::uuid AND o.dofollow = TRUE), '0') AS dofollow
     `;
     const ctrRes = await prisma.$queryRaw<{ clicks: string; impressions: string }>`
       SELECT
         COALESCE(SUM(m.clicks)::text, '0') AS clicks,
         COALESCE(SUM(m.impressions)::text, '0') AS impressions
       FROM "BlogMetricsSnapshot" m
       JOIN "BlogOrderRequest" r ON r.id = m."orderId"
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND m."createdAt" >= NOW() - (${String(window_days)} || ' days')::interval
     `;
 
     const pendingReq = await prisma.$queryRaw<{ id: string; advertiserEmail: string; blogName: string; type: string | null; proposedPrice: number; status: string; createdAt: string }>`
       SELECT
         r.id::text AS id,
         u.email AS "advertiserEmail",
         b.name AS "blogName",
         o.type::text AS type,
         r."proposedPrice" AS "proposedPrice",
         r.status::text AS status,
         r."createdAt" AS "createdAt"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       JOIN "User" u ON u.id = r."advertiserId"
       LEFT JOIN "BlogPlacementOffer" o ON o.id = r."offerId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status = 'REQUESTED'::"BlogOrderStatus"
       ORDER BY r."createdAt" DESC
       LIMIT 20
     `;
 
     const upcoming = await prisma.$queryRaw<{ id: string; blogName: string; status: string; requestedStart: string | null }>`
       SELECT
         r.id::text AS id,
         b.name AS "blogName",
         r.status::text AS status,
         r."requestedPublishWindowStart" AS "requestedStart"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status IN ('ACCEPTED'::"BlogOrderStatus",'IN_ESCROW'::"BlogOrderStatus",'NEEDS_CHANGES'::"BlogOrderStatus",'REQUESTED'::"BlogOrderStatus")
       ORDER BY COALESCE(r."requestedPublishWindowStart", r."createdAt") ASC
       LIMIT 12
     `;
 
     const recent = await prisma.$queryRaw<{ id: string; blogName: string; publishedUrl: string; proofStatus: string }>`
       SELECT
         r.id::text AS id,
         b.name AS "blogName",
         p."publishedUrl" AS "publishedUrl",
         p."proofStatus"::text AS "proofStatus"
       FROM "BlogOrderRequest" r
       JOIN "BlogPublicationProof" p ON p."orderId" = r.id
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status IN ('PUBLISHED'::"BlogOrderStatus",'VERIFIED'::"BlogOrderStatus")
       ORDER BY p."publishedAt" DESC
       LIMIT 12
     `;
 
     const invoices = await prisma.$queryRaw<{ id: string; amount: number; status: string; updatedAt: string }>`
       SELECT
         r.id::text AS id,
         COALESCE(r."finalPrice", r."proposedPrice") AS amount,
         r.status::text AS status,
         r."updatedAt" AS "updatedAt"
       FROM "BlogOrderRequest" r
       JOIN "BlogSite" b ON b.id = r."blogSiteId"
       WHERE b."ownerUserId" = ${req.user!.id}::uuid
         AND r.status IN ('SETTLED'::"BlogOrderStatus",'IN_ESCROW'::"BlogOrderStatus",'ACCEPTED'::"BlogOrderStatus")
       ORDER BY r."updatedAt" DESC
       LIMIT 10
     `;
 
     return res.status(200).json({
       window_days,
       kpis: {
         revenue_usd: Number(earningsRes.rows[0]?.settled ?? 0),
         publications: Number(pubsRes.rows[0]?.count ?? 0),
         requests_new: Number(newReqRes.rows[0]?.count ?? 0),
         avg_turnaround_days: Number(ttrRes.rows[0]?.days ?? 0) || 0,
       },
       secondary: {
         avg_price_usd: Number(priceAvgRes.rows[0]?.avg ?? 0) || 0,
         fill_rate_pct: (() => {
           const requested = Number(requestedRes.rows[0]?.requested ?? 0);
           const accepted = Number(requestedRes.rows[0]?.accepted ?? 0);
           return requested ? Math.round((accepted / requested) * 100) : 0;
         })(),
         dofollow_rate_pct: (() => {
           const total = Number(dofollowRes.rows[0]?.total ?? 0);
           const dofollow = Number(dofollowRes.rows[0]?.dofollow ?? 0);
           return total ? Math.round((dofollow / total) * 100) : 0;
         })(),
         ctr_pct: (() => {
           const clicks = Number(ctrRes.rows[0]?.clicks ?? 0);
           const impressions = Number(ctrRes.rows[0]?.impressions ?? 0);
           return impressions ? Math.round((clicks / impressions) * 100) : null;
         })(),
       },
       requests_pending: pendingReq.rows,
       upcoming_publications: upcoming.rows,
       recent_publications: recent.rows,
       billing: {
         earnings_month_usd: Number(earningsRes.rows[0]?.settled ?? 0),
         pending_payouts_usd: 0,
         invoices: (invoices.rows ?? []).map((r) => ({
           code: `INV-${String(r.id ?? "").slice(0, 6).toUpperCase()}`,
           amount: r.amount ?? 0,
           status: r.status ?? "UNKNOWN",
           createdAt: r.updatedAt ?? "",
         })),
       },
       activity: [],
     });
   } catch {
     return res.status(500).json({ message: "Internal server error" });
   }
 });
 
router.post("/blog-requests/:id/settle", authRequired, requireRole("OPS"), async (req, res) => {
  const id = String(req.params.id ?? "");
  try {
    const updated = await prisma.$queryRaw`
      UPDATE "BlogOrderRequest"
      SET status = 'SETTLED'::"BlogOrderStatus", "updatedAt" = NOW()
      WHERE id = ${id}::uuid
      RETURNING id::text
    `;
    if ((updated.rowCount ?? 0) === 0) return res.status(404).json({ message: "Request not found" });
    return res.status(200).json({ id, status: "SETTLED" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

 export default router;
