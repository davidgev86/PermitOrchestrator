import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["owner", "staff", "read_only"]);
export const caseStatusEnum = pgEnum("case_status", [
  "draft", 
  "precheck_ready", 
  "packaged", 
  "submitted", 
  "rfi", 
  "pending", 
  "approved", 
  "rejected", 
  "closed"
]);

// Organizations
export const orgs = pgTable("orgs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orgUsers = pgTable("org_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userEmail: text("user_email").notNull().unique(),
  role: roleEnum("role").notNull(),
  orgId: varchar("org_id").notNull().references(() => orgs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Locations
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postal: text("postal").notNull(),
  geoJson: json("geo_json"),
  parcelId: text("parcel_id"),
  ahjKey: text("ahj_key").notNull(), // e.g., "us/md/gaithersburg"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => orgs.id),
  name: text("name").notNull(),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  valuationUSD: integer("valuation_usd"),
  tradeTags: text("trade_tags").array(), // ["electrical","plumbing","structural"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permit Cases
export const permitCases = pgTable("permit_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => orgs.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  ahjKey: text("ahj_key").notNull(), // e.g., "us/md/montgomery_county"
  permitType: text("permit_type").notNull(), // e.g., "residential_kitchen_remodel"
  status: caseStatusEnum("status").notNull().default("draft"),
  portalCaseId: text("portal_case_id"),
  feeEstimateUSD: integer("fee_estimate_usd"),
  forms: json("forms").notNull().default({}), // manifest of required forms
  attachments: json("attachments").notNull().default({}), // expected attachments
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inspections
export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => permitCases.id),
  type: text("type").notNull(), // "framing","final","electrical_rough"
  requestedAt: timestamp("requested_at"),
  scheduledFor: timestamp("scheduled_for"),
  result: text("result"), // "pass"/"fail"/"partial"
  artifacts: json("artifacts"), // photo URIs, notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => orgs.id),
  kind: text("kind").notNull(), // "plans","site_plan","license","insurance_acord25"
  uri: text("uri").notNull(), // S3 URI
  checksum: text("checksum").notNull(),
  meta: json("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events (audit trail)
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => orgs.id),
  entity: text("entity").notNull(), // "PermitCase","Inspection","Document"
  entityId: varchar("entity_id").notNull(),
  actor: text("actor").notNull(), // user email or "system"
  action: text("action").notNull(), // "PRECHECK_DONE","PACKAGE_BUILT","SUBMITTED"
  before: json("before"),
  after: json("after"),
  evidence: text("evidence"), // S3 URI to screenshot or PDF
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth Sessions
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userEmail: text("user_email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const orgsRelations = relations(orgs, ({ many }) => ({
  users: many(orgUsers),
  projects: many(projects),
  documents: many(documents),
  events: many(events),
  permitCases: many(permitCases),
}));

export const orgUsersRelations = relations(orgUsers, ({ one }) => ({
  org: one(orgs, {
    fields: [orgUsers.orgId],
    references: [orgs.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  org: one(orgs, {
    fields: [projects.orgId],
    references: [orgs.id],
  }),
  location: one(locations, {
    fields: [projects.locationId],
    references: [locations.id],
  }),
  cases: many(permitCases),
}));

export const permitCasesRelations = relations(permitCases, ({ one, many }) => ({
  org: one(orgs, {
    fields: [permitCases.orgId],
    references: [orgs.id],
  }),
  project: one(projects, {
    fields: [permitCases.projectId],
    references: [projects.id],
  }),
  inspections: many(inspections),
  events: many(events),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  case: one(permitCases, {
    fields: [inspections.caseId],
    references: [permitCases.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  org: one(orgs, {
    fields: [documents.orgId],
    references: [orgs.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  org: one(orgs, {
    fields: [events.orgId],
    references: [orgs.id],
  }),
}));

// Insert Schemas
export const insertOrgSchema = createInsertSchema(orgs).omit({ id: true, createdAt: true });
export const insertOrgUserSchema = createInsertSchema(orgUsers).omit({ id: true, createdAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPermitCaseSchema = createInsertSchema(permitCases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInspectionSchema = createInsertSchema(inspections).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({ id: true, createdAt: true });

// Types
export type Org = typeof orgs.$inferSelect;
export type InsertOrg = z.infer<typeof insertOrgSchema>;
export type OrgUser = typeof orgUsers.$inferSelect;
export type InsertOrgUser = z.infer<typeof insertOrgUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type PermitCase = typeof permitCases.$inferSelect;
export type InsertPermitCase = z.infer<typeof insertPermitCaseSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
