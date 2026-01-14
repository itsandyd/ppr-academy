import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config.js";
import actionCache from "@convex-dev/action-cache/convex.config.js";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import actionRetrier from "@convex-dev/action-retrier/convex.config.js";

const app = defineApp();

// Core components
app.use(rateLimiter);
app.use(workflow);
app.use(actionCache);
app.use(actionRetrier);

// Multiple aggregate instances for different analytics use cases
app.use(aggregate, { name: "videoAnalytics" });
app.use(aggregate, { name: "courseAnalytics" });
app.use(aggregate, { name: "revenueAnalytics" });

export default app;
