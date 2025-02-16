/*import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertResourceSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'));
      return;
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Resources
  app.get("/api/resources", async (_req, res) => {
    const resources = await storage.getResources();
    const resourcesWithDetails = await Promise.all(
      resources.map(async (resource) => {
        const provider = await storage.getUser(resource.userId);

        return {
          ...resource,
          //ratings,
          provider: provider ? {
            id: provider.id,
            username: provider.username,
          } : null,
        };
      })
    );
    res.json(resourcesWithDetails);
  });

  app.get("/api/resources/owned", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resources = await storage.getUserResources(req.user.id);
    const resourcesWithRatings = await Promise.all(
      resources.map(async (resource) => {
        return { ...resource };
      })
    );
    res.json(resourcesWithRatings);
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const watchlistItems = await storage.getWatchlist(req.user.id);
      const resourcesWithDetails = await Promise.all(
        watchlistItems.map(async (item) => {
          const resource = await storage.getResource(item.resourceId);
          if (!resource) return null;
;
          return {
            ...resource,
            isWatched: true
          };
        })
      );

      // Filter out any null resources 
      const validResources = resourcesWithDetails.filter(r => r !== null);
      res.json(validResources);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });

  app.post("/api/watchlist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resourceId = Number(req.params.id);
    try {
      // Check if resource exists
      const resource = await storage.getResource(resourceId);
      if (!resource) return res.status(404).json({ message: 'Resource not found' });

      // Check if already in watchlist
      const existing = await storage.getWatchlistItem(req.user.id, resourceId);
      if (existing) return res.status(400).json({ message: 'Already in watchlist' });

      // Add to watchlist
      await storage.addToWatchlist(req.user.id, resourceId);
      res.status(201).json({ message: 'Added to watchlist' });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      res.status(500).json({ message: 'Failed to add to watchlist' });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resourceId = Number(req.params.id);
    try {
      await storage.removeFromWatchlist(req.user.id, resourceId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  });

  app.post("/api/resources", upload.array('images', 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const base64Image = file.buffer.toString('base64');
        imageUrls.push(`data:${file.mimetype};base64,${base64Image}`);
      }
    }

    const resourceData = {
      ...req.body,
      types: Array.isArray(req.body.types) ? req.body.types : [req.body.types],
      imageUrls,
    };

    const parsed = insertResourceSchema.safeParse(resourceData);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const resource = await storage.createResource({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(resource);
  });

  app.patch("/api/resources/:id", upload.array('images', 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resource = await storage.getResource(Number(req.params.id));
    if (!resource) return res.sendStatus(404);
    if (resource.userId !== req.user.id) return res.sendStatus(403);

    // Keep existing images and add new ones
    const imageUrls: string[] = [...(resource.imageUrls || [])];

    // Add new uploaded images
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const base64Image = file.buffer.toString('base64');
        imageUrls.push(`data:${file.mimetype};base64,${base64Image}`);
      }
    }

    const updateData = {
      ...req.body,
      types: Array.isArray(req.body.types) ? req.body.types : [req.body.types],
      imageUrls,
    };

    try {
      const updated = await storage.updateResource(resource.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(500).json({ message: 'Failed to update resource' });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resource = await storage.getResource(Number(req.params.id));
    if (!resource) return res.sendStatus(404);
    if (resource.userId !== req.user.id) return res.sendStatus(403);

    await storage.deleteResource(resource.id);
    res.sendStatus(204);
  });


  const httpServer = createServer(app);
  return httpServer;
}
*/

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertResourceSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'));
      return;
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Resources
  app.get("/api/resources", async (_req, res) => {
    const resources = await storage.getResources();
    const resourcesWithDetails = await Promise.all(
      resources.map(async (resource) => {
        const provider = await storage.getUser(resource.userId);
        return {
          ...resource,
          provider: provider ? {
            id: provider.id,
            username: provider.username,
          } : null,
        };
      })
    );
    res.json(resourcesWithDetails);
  });

  app.get("/api/resources/owned", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resources = await storage.getUserResources(req.user.id);
    res.json(resources);
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const watchlistItems = await storage.getWatchlist(req.user.id);
      const resourcesWithDetails = await Promise.all(
        watchlistItems.map(async (item) => {
          const resource = await storage.getResource(item.resourceId);
          if (!resource) return null;
          return {
            ...resource,
            isWatched: true
          };
        })
      );

      // Filter out any null resources (in case they were deleted)
      const validResources = resourcesWithDetails.filter(r => r !== null);
      res.json(validResources);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });

  app.post("/api/watchlist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resourceId = Number(req.params.id);
    try {
      // Check if resource exists
      const resource = await storage.getResource(resourceId);
      if (!resource) return res.status(404).json({ message: 'Resource not found' });

      // Check if already in watchlist
      const existing = await storage.getWatchlistItem(req.user.id, resourceId);
      if (existing) return res.status(400).json({ message: 'Already in watchlist' });

      // Add to watchlist
      await storage.addToWatchlist(req.user.id, resourceId);
      res.status(201).json({ message: 'Added to watchlist' });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      res.status(500).json({ message: 'Failed to add to watchlist' });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resourceId = Number(req.params.id);
    try {
      await storage.removeFromWatchlist(req.user.id, resourceId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  });

  app.post("/api/resources", upload.array('images', 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const base64Image = file.buffer.toString('base64');
        imageUrls.push(`data:${file.mimetype};base64,${base64Image}`);
      }
    }

    const resourceData = {
      ...req.body,
      types: Array.isArray(req.body.types) ? req.body.types : [req.body.types],
      imageUrls,
    };

    const parsed = insertResourceSchema.safeParse(resourceData);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const resource = await storage.createResource({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(resource);
  });

  app.patch("/api/resources/:id", upload.array('images', 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resource = await storage.getResource(Number(req.params.id));
    if (!resource) return res.sendStatus(404);
    if (resource.userId !== req.user.id) return res.sendStatus(403);

    try {
      // If only toggling availability, don't modify other fields
      if (Object.keys(req.body).length === 1 && 'available' in req.body) {
        const updated = await storage.updateResource(resource.id, {
          available: req.body.available
        });
        return res.json(updated);
      }

      // For full updates, handle all fields including images
      const imageUrls: string[] = [...(resource.imageUrls || [])];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const base64Image = file.buffer.toString('base64');
          imageUrls.push(`data:${file.mimetype};base64,${base64Image}`);
        }
      }

      const updateData = {
        ...req.body,
        types: Array.isArray(req.body.types) ? req.body.types : [req.body.types],
        imageUrls,
      };

      const updated = await storage.updateResource(resource.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(500).json({ message: 'Failed to update resource' });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const resource = await storage.getResource(Number(req.params.id));
    if (!resource) return res.sendStatus(404);
    if (resource.userId !== req.user.id) return res.sendStatus(403);

    await storage.deleteResource(resource.id);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}