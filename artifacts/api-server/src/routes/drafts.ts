import { Router, type IRouter } from "express";
import {
  CreateDraftBody,
  UpdateDraftBody,
  ImportDraftsBody,
  SyncedDraft,
  SimpleSuccessResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// Enforce authentication for all /drafts routes
router.use(requireAuth);

// GET /api/drafts - List authenticated user's drafts
router.get("/drafts", async (req: AuthenticatedRequest, res, next) => {
  try {
    const drafts = await db.getDraftsForUser(req.userId!);
    res.json(drafts);
  } catch (err) {
    next(err);
  }
});

// POST /api/drafts - Create draft
router.post("/drafts", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateDraftBody.parse(req.body);
    const draft = await db.createDraft(req.userId!, body);
    const data = SyncedDraft.parse(draft);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/drafts/:id - Update draft (strict per-user ownership check)
router.put("/drafts/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const draftId = String(req.params.id);
    const body = UpdateDraftBody.parse(req.body);
    const updated = await db.updateDraft(req.userId!, draftId, body);
    const data = SyncedDraft.parse(updated);
    res.json(data);
  } catch (err: any) {
    if (err?.message?.includes("Draft not found")) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
});

// DELETE /api/drafts/:id - Delete draft (strict per-user ownership check)
router.delete("/drafts/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const draftId = String(req.params.id);
    await db.deleteDraft(req.userId!, draftId);
    const data = SimpleSuccessResponse.parse({
      success: true,
      message: "Draft deleted from account.",
    });
    res.json(data);
  } catch (err: any) {
    if (err?.message?.includes("Draft not found")) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
});

// POST /api/drafts/import - Explicit import of local drafts
router.post("/drafts/import", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = ImportDraftsBody.parse(req.body);
    const imported = await db.importLocalDrafts(req.userId!, body.drafts);
    res.json({
      importedCount: imported.length,
      drafts: imported,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
