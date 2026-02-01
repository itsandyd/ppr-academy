"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Main workflow execution processor - called by cron every 5 minutes
 * Processes all due workflow executions
 */
export const processEmailWorkflowExecutions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get executions that are due to run
    const dueExecutions = await ctx.runQuery(internal.emailWorkflows.getDueExecutions, {});

    console.log(`[EmailWorkflows] Processing ${dueExecutions.length} due executions`);

    for (const execution of dueExecutions) {
      try {
        await ctx.runAction(internal.emailWorkflowActions.executeWorkflowNode, {
          executionId: execution._id,
        });
      } catch (error) {
        console.error(`[EmailWorkflows] Failed to process execution ${execution._id}:`, error);
        await ctx.runMutation(internal.emailWorkflows.markExecutionFailed, {
          executionId: execution._id,
          error: String(error),
        });
      }
    }

    return null;
  },
});

/**
 * Execute a single workflow node
 */
export const executeWorkflowNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(internal.emailWorkflows.getExecutionInternal, {
      executionId: args.executionId,
    });

    if (!execution) {
      console.error(`[EmailWorkflows] Execution ${args.executionId} not found`);
      return null;
    }

    if (execution.status === "completed" || execution.status === "failed") {
      return null;
    }

    const workflow = await ctx.runQuery(internal.emailWorkflows.getWorkflowInternal, {
      workflowId: execution.workflowId,
    });

    if (!workflow) {
      console.error(`[EmailWorkflows] Workflow not found for execution ${args.executionId}`);
      return null;
    }

    // Find current node
    const currentNode = workflow.nodes.find((n: any) => n.id === execution.currentNodeId);
    if (!currentNode) {
      console.log(`[EmailWorkflows] No current node, completing execution`);
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    console.log(`[EmailWorkflows] Executing node ${currentNode.id} (${currentNode.type}) for ${execution.customerEmail}`);

    // Execute based on node type
    if (currentNode.type === "email") {
      // Send email
      const templateId = currentNode.data?.templateId;
      const customSubject = currentNode.data?.subject;
      // Check both 'content' and 'body' fields (editor might use either)
      const customContent = currentNode.data?.content || currentNode.data?.body;

      console.log(`[EmailWorkflows] Email node data:`, JSON.stringify({
        templateId,
        subject: customSubject,
        hasContent: !!customContent,
        allData: currentNode.data,
      }));

      if (templateId) {
        console.log(`[EmailWorkflows] Sending template email ${templateId} to ${execution.customerEmail}`);
        await ctx.runAction(internal.emailWorkflowActions.sendWorkflowEmail, {
          contactId: execution.contactId,
          templateId,
          storeId: execution.storeId,
          customerEmail: execution.customerEmail,
        });
        console.log(`[EmailWorkflows] Template email sent successfully`);
      } else if (customSubject && customContent) {
        console.log(`[EmailWorkflows] Sending custom email "${customSubject}" to ${execution.customerEmail}`);
        await ctx.runAction(internal.emailWorkflowActions.sendCustomWorkflowEmail, {
          contactId: execution.contactId,
          subject: customSubject,
          content: customContent,
          storeId: execution.storeId,
          customerEmail: execution.customerEmail,
        });
        console.log(`[EmailWorkflows] Custom email sent successfully`);
      } else {
        console.error(`[EmailWorkflows] Email node has no template or custom content! Node data:`, currentNode.data);
      }
    } else if (currentNode.type === "delay") {
      // Delay is handled by scheduling - just log
      console.log(`[EmailWorkflows] Processing delay node for ${execution.customerEmail}`);
    } else if (currentNode.type === "condition") {
      // Evaluate the condition to determine which path to take
      console.log(`[EmailWorkflows] Processing condition node for ${execution.customerEmail}`, {
        conditionType: currentNode.data?.conditionType,
        nodeData: currentNode.data,
      });

      // Evaluate the condition
      const conditionResult = await ctx.runQuery(internal.emailWorkflows.evaluateWorkflowCondition, {
        contactId: execution.contactId,
        storeId: execution.storeId,
        customerEmail: execution.customerEmail,
        conditionType: currentNode.data?.conditionType,
        conditionData: currentNode.data,
      });

      console.log(`[EmailWorkflows] Condition "${currentNode.data?.conditionType}" evaluated to: ${conditionResult}`);

      // Find the correct outgoing edge based on condition result
      const sourceHandle = conditionResult ? "yes" : "no";
      const conditionEdge = workflow.edges?.find(
        (e: any) => e.source === currentNode.id && e.sourceHandle === sourceHandle
      );

      if (conditionEdge) {
        const nextConditionNode = workflow.nodes.find((n: any) => n.id === conditionEdge.target);
        if (nextConditionNode) {
          // Advance to the appropriate path
          await ctx.runMutation(internal.emailWorkflows.advanceExecution, {
            executionId: args.executionId,
            nextNodeId: nextConditionNode.id,
            scheduledFor: Date.now(),
          });
          console.log(`[EmailWorkflows] Condition branched to ${sourceHandle} path, node ${nextConditionNode.id}`);
          return null;
        }
      }

      // If no matching edge, try default connection (backwards compatibility)
      console.log(`[EmailWorkflows] No ${sourceHandle} edge found, falling through to default`);
    } else if (currentNode.type === "action") {
      // Handle action nodes (add tag, etc.)
      const actionType = currentNode.data?.actionType;
      console.log(`[EmailWorkflows] Processing action node (${actionType}) for ${execution.customerEmail}`, {
        nodeData: currentNode.data,
        contactId: execution.contactId,
      });

      if (actionType === "add_tag" && execution.contactId) {
        // Get tag ID - either from tagId field or look up by name from value field
        let tagId = currentNode.data?.tagId;

        if (!tagId && currentNode.data?.value) {
          // Backwards compatibility: look up tag by name
          console.log(`[EmailWorkflows] Looking up tag by name: ${currentNode.data.value}`);
          const tag = await ctx.runQuery(internal.emailWorkflows.getTagByNameInternal, {
            storeId: execution.storeId,
            name: currentNode.data.value,
          });
          if (tag) {
            tagId = tag._id;
            console.log(`[EmailWorkflows] Found tag ID: ${tagId}`);
          } else {
            // Auto-create the tag if it doesn't exist
            console.log(`[EmailWorkflows] Tag not found, creating: ${currentNode.data.value}`);
            tagId = await ctx.runMutation(internal.emailWorkflows.createTagInternal, {
              storeId: execution.storeId,
              name: currentNode.data.value,
            });
            console.log(`[EmailWorkflows] Created tag ID: ${tagId}`);
          }
        }

        if (tagId) {
          await ctx.runMutation(internal.emailWorkflows.addTagToContactInternal, {
            contactId: execution.contactId,
            tagId,
          });
          console.log(`[EmailWorkflows] Added tag ${tagId} to contact`);
        } else {
          console.log(`[EmailWorkflows] No tag ID found for add_tag action`);
        }
      } else if (actionType === "remove_tag" && execution.contactId) {
        // Get tag ID - either from tagId field or look up by name from value field
        let tagId = currentNode.data?.tagId;

        if (!tagId && currentNode.data?.value) {
          // Backwards compatibility: look up tag by name
          const tag = await ctx.runQuery(internal.emailWorkflows.getTagByNameInternal, {
            storeId: execution.storeId,
            name: currentNode.data.value,
          });
          if (tag) {
            tagId = tag._id;
          }
        }

        if (tagId) {
          await ctx.runMutation(internal.emailWorkflows.removeTagFromContactInternal, {
            contactId: execution.contactId,
            tagId,
          });
          console.log(`[EmailWorkflows] Removed tag ${tagId} from contact`);
        } else {
          console.log(`[EmailWorkflows] No tag ID found for remove_tag action`);
        }
      } else if (!execution.contactId) {
        console.log(`[EmailWorkflows] Cannot add/remove tag: no contactId on execution`);
      }
    } else if (currentNode.type === "notify") {
      // Notify node - send notification to team via email, Slack, or Discord
      const notifyMethod = currentNode.data?.notifyMethod || "email";
      const message = currentNode.data?.message || "Workflow notification triggered";

      console.log(`[EmailWorkflows] Processing notify node (${notifyMethod}) for ${execution.customerEmail}`);

      await ctx.runAction(internal.emailWorkflowActions.sendTeamNotification, {
        storeId: execution.storeId,
        notifyMethod,
        message,
        contactEmail: execution.customerEmail,
        contactName: execution.executionData?.customerName,
        workflowName: workflow.name,
        triggerType: execution.executionData?.triggerType,
      });

      console.log(`[EmailWorkflows] Team notification sent via ${notifyMethod}`);
    } else if (currentNode.type === "stop") {
      // Stop node - complete the workflow execution
      console.log(`[EmailWorkflows] Stop node reached, completing workflow for ${execution.customerEmail}`);
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    } else if (currentNode.type === "trigger") {
      // Trigger nodes don't need processing, just continue to next node
      console.log(`[EmailWorkflows] Skipping trigger node, moving to next`);
    } else if (currentNode.type === "courseCycle") {
      // Course Cycle node - select next unpurchased course and initialize cycle state
      console.log(`[EmailWorkflows] Processing courseCycle node for ${execution.customerEmail}`);

      const configId = currentNode.data?.courseCycleConfigId;
      if (!configId) {
        console.error(`[EmailWorkflows] No courseCycleConfigId configured`);
        await ctx.runMutation(internal.emailWorkflows.markExecutionFailed, {
          executionId: args.executionId,
          error: "No course cycle config ID configured",
        });
        return null;
      }

      // Get cycle config
      const config = await ctx.runQuery(internal.courseCycles.getConfig, {
        configId,
      });

      if (!config) {
        console.error(`[EmailWorkflows] Course cycle config not found`);
        await ctx.runMutation(internal.emailWorkflows.markExecutionFailed, {
          executionId: args.executionId,
          error: "Course cycle config not found",
        });
        return null;
      }

      // Get user's purchased courses
      const purchasedCourseIds = await ctx.runQuery(
        internal.courseCycles.getUserPurchasedCourses,
        {
          customerEmail: execution.customerEmail,
          courseIds: config.courseIds,
        }
      );

      // Get current cycle state from execution data
      const cycleData = execution.executionData || {};
      const currentIndex = cycleData.currentCourseIndex ?? 0;
      const cycleNumber = cycleData.currentCycleNumber ?? 1;

      // Find next unpurchased course
      let nextCourseIndex = -1;
      let loopedBack = false;

      for (let i = 0; i < config.courseIds.length; i++) {
        const checkIndex = (currentIndex + i) % config.courseIds.length;
        if (checkIndex < currentIndex && i > 0) {
          loopedBack = true;
        }
        if (!purchasedCourseIds.includes(config.courseIds[checkIndex])) {
          nextCourseIndex = checkIndex;
          break;
        }
      }

      if (nextCourseIndex === -1) {
        // All courses purchased - complete the cycle
        console.log(`[EmailWorkflows] All courses purchased, completing cycle for ${execution.customerEmail}`);
        await ctx.runMutation(internal.emailWorkflows.completeExecution, {
          executionId: args.executionId,
        });
        return null;
      }

      // Update execution data with cycle state
      const newCycleNumber = loopedBack ? cycleNumber + 1 : cycleNumber;
      await ctx.runMutation(internal.emailWorkflows.updateExecutionData, {
        executionId: args.executionId,
        executionData: {
          ...cycleData,
          courseCycleConfigId: configId,
          currentCourseIndex: nextCourseIndex,
          currentCycleNumber: newCycleNumber,
          currentPhase: "nurture",
          currentEmailIndex: 0,
          purchasedCourseIds,
        },
      });

      console.log(`[EmailWorkflows] Cycle state: course ${nextCourseIndex + 1}/${config.courseIds.length}, cycle #${newCycleNumber}`);
    } else if (currentNode.type === "courseEmail") {
      // Course Email node - send nurture or pitch email for current course
      console.log(`[EmailWorkflows] Processing courseEmail node for ${execution.customerEmail}`);

      const cycleData = execution.executionData || {};
      const configId = cycleData.courseCycleConfigId;
      const courseIndex = cycleData.currentCourseIndex ?? 0;
      const cycleNumber = cycleData.currentCycleNumber ?? 1;
      const emailIndex = cycleData.currentEmailIndex ?? 0;
      const emailPhase = currentNode.data?.emailPhase || "nurture";

      if (!configId) {
        console.error(`[EmailWorkflows] No course cycle config in execution data`);
        await ctx.runMutation(internal.emailWorkflows.markExecutionFailed, {
          executionId: args.executionId,
          error: "No course cycle config in execution data",
        });
        return null;
      }

      // Get config to get courseId
      const config = await ctx.runQuery(internal.courseCycles.getConfig, {
        configId,
      });

      if (!config || !config.courseIds[courseIndex]) {
        console.error(`[EmailWorkflows] Invalid course index`);
        return null;
      }

      const courseId = config.courseIds[courseIndex];

      // Determine which cycle content to use
      const contentCycleNumber = config.differentContentOnSecondCycle && cycleNumber > 1 ? 2 : 1;

      // Get the email content
      const email = await ctx.runQuery(internal.courseCycles.getCycleEmail, {
        courseCycleConfigId: configId,
        courseId,
        emailType: emailPhase,
        emailIndex,
        cycleNumber: contentCycleNumber,
      });

      if (email) {
        // Send the email
        await ctx.runAction(internal.emailWorkflowActions.sendCustomWorkflowEmail, {
          contactId: execution.contactId,
          subject: email.subject,
          content: email.htmlContent,
          storeId: execution.storeId,
          customerEmail: execution.customerEmail,
        });

        // Track email sent
        await ctx.runMutation(internal.courseCycles.trackEmailSent, {
          emailId: email._id,
        });

        console.log(`[EmailWorkflows] Sent ${emailPhase} email #${emailIndex + 1} for course ${courseIndex + 1}`);
      } else {
        console.log(`[EmailWorkflows] No email found for ${emailPhase} #${emailIndex}, course ${courseIndex}`);
      }

      // Increment email index
      await ctx.runMutation(internal.emailWorkflows.updateExecutionData, {
        executionId: args.executionId,
        executionData: {
          ...cycleData,
          currentEmailIndex: emailIndex + 1,
          currentPhase: emailPhase,
        },
      });
    } else if (currentNode.type === "purchaseCheck") {
      // Purchase Check node - check if user purchased current course and branch
      console.log(`[EmailWorkflows] Processing purchaseCheck node for ${execution.customerEmail}`);

      const cycleData = execution.executionData || {};
      const configId = cycleData.courseCycleConfigId;
      const courseIndex = cycleData.currentCourseIndex ?? 0;

      if (!configId) {
        console.error(`[EmailWorkflows] No course cycle config in execution data`);
        return null;
      }

      // Get config to get courseId
      const config = await ctx.runQuery(internal.courseCycles.getConfig, {
        configId,
      });

      if (!config || !config.courseIds[courseIndex]) {
        return null;
      }

      const courseId = config.courseIds[courseIndex];

      // Check if purchased
      const hasPurchased = await ctx.runQuery(internal.courseCycles.checkCoursePurchase, {
        customerEmail: execution.customerEmail,
        courseId,
      });

      // Find the appropriate branch edge
      const sourceHandle = hasPurchased ? "purchased" : "not_purchased";
      const branchEdge = workflow.edges?.find(
        (e: any) => e.source === currentNode.id && e.sourceHandle === sourceHandle
      );

      if (hasPurchased) {
        console.log(`[EmailWorkflows] User purchased course ${courseIndex + 1}`);

        // Add tag if configured
        const tagPrefix = currentNode.data?.purchaseTagPrefix || "purchased_course_";
        if (execution.contactId) {
          // Get course title for tag
          const course = await ctx.runQuery(internal.courses.getCourseById, {
            courseId,
          });
          const tagName = `${tagPrefix}${course?.title || courseId}`;

          try {
            await ctx.runMutation(internal.emailWorkflows.addTagByName, {
              contactId: execution.contactId,
              storeId: execution.storeId,
              tagName,
            });
          } catch (e) {
            console.log(`[EmailWorkflows] Could not add tag: ${e}`);
          }
        }

        // Update purchased list
        const updatedPurchased = [...(cycleData.purchasedCourseIds || []), courseId];
        await ctx.runMutation(internal.emailWorkflows.updateExecutionData, {
          executionId: args.executionId,
          executionData: {
            ...cycleData,
            purchasedCourseIds: updatedPurchased,
          },
        });
      } else {
        console.log(`[EmailWorkflows] User has NOT purchased course ${courseIndex + 1}`);
      }

      // Branch to appropriate path
      if (branchEdge) {
        const nextNode = workflow.nodes.find((n: any) => n.id === branchEdge.target);
        if (nextNode) {
          await ctx.runMutation(internal.emailWorkflows.advanceExecution, {
            executionId: args.executionId,
            nextNodeId: nextNode.id,
            scheduledFor: Date.now(),
          });
          return null; // Skip the normal "find next node" logic
        }
      }
    } else if (currentNode.type === "cycleLoop") {
      // Cycle Loop node - advance to next course or loop back
      console.log(`[EmailWorkflows] Processing cycleLoop node for ${execution.customerEmail}`);

      const cycleData = execution.executionData || {};
      const configId = cycleData.courseCycleConfigId;
      const currentIndex = cycleData.currentCourseIndex ?? 0;
      const cycleNumber = cycleData.currentCycleNumber ?? 1;
      const purchasedCourseIds = cycleData.purchasedCourseIds || [];

      if (!configId) {
        return null;
      }

      // Get config
      const config = await ctx.runQuery(internal.courseCycles.getConfig, {
        configId,
      });

      if (!config) {
        return null;
      }

      // Find next unpurchased course (starting from next index)
      const startIndex = (currentIndex + 1) % config.courseIds.length;
      let nextCourseIndex = -1;
      let loopedBack = false;

      for (let i = 0; i < config.courseIds.length; i++) {
        const checkIndex = (startIndex + i) % config.courseIds.length;
        if (checkIndex <= currentIndex && i > 0) {
          loopedBack = true;
        }
        if (!purchasedCourseIds.includes(config.courseIds[checkIndex])) {
          nextCourseIndex = checkIndex;
          break;
        }
      }

      if (nextCourseIndex === -1) {
        // All courses purchased - complete
        console.log(`[EmailWorkflows] All courses in cycle purchased, completing`);
        await ctx.runMutation(internal.emailWorkflows.completeExecution, {
          executionId: args.executionId,
        });
        return null;
      }

      // Check if we should loop
      if (loopedBack && !config.loopOnCompletion) {
        console.log(`[EmailWorkflows] Reached end of cycle, looping disabled`);
        await ctx.runMutation(internal.emailWorkflows.completeExecution, {
          executionId: args.executionId,
        });
        return null;
      }

      // Update to next course
      const newCycleNumber = loopedBack ? cycleNumber + 1 : cycleNumber;
      await ctx.runMutation(internal.emailWorkflows.updateExecutionData, {
        executionId: args.executionId,
        executionData: {
          ...cycleData,
          currentCourseIndex: nextCourseIndex,
          currentCycleNumber: newCycleNumber,
          currentPhase: "nurture",
          currentEmailIndex: 0,
        },
      });

      console.log(`[EmailWorkflows] Moving to course ${nextCourseIndex + 1}, cycle #${newCycleNumber}`);
    } else {
      console.log(`[EmailWorkflows] Unknown node type: ${currentNode.type}`);
    }

    // Find next node
    const connection = workflow.edges?.find((e: any) => e.source === currentNode.id);

    if (!connection) {
      // No more nodes - complete the workflow
      console.log(`[EmailWorkflows] No next node, completing workflow for ${execution.customerEmail}`);
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    const nextNode = workflow.nodes.find((n: any) => n.id === connection.target);
    if (!nextNode) {
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    // Calculate delay if next node is a delay node OR if current was delay
    let delayMs = 0;
    if (nextNode.type === "delay" || currentNode.type === "delay") {
      const delayNode = currentNode.type === "delay" ? currentNode : nextNode;
      const delayData = delayNode.data || {};
      const delayValue = delayData.delay || delayData.delayValue || 1;
      const delayUnit = delayData.delayUnit || "days";

      switch (delayUnit) {
        case "minutes":
          delayMs = delayValue * 60 * 1000;
          break;
        case "hours":
          delayMs = delayValue * 60 * 60 * 1000;
          break;
        case "days":
          delayMs = delayValue * 24 * 60 * 60 * 1000;
          break;
        default:
          delayMs = delayValue * 24 * 60 * 60 * 1000;
      }
    }

    // Schedule next node
    const scheduledFor = Date.now() + delayMs;

    await ctx.runMutation(internal.emailWorkflows.advanceExecution, {
      executionId: args.executionId,
      nextNodeId: nextNode.id,
      scheduledFor,
    });

    console.log(`[EmailWorkflows] Advanced to node ${nextNode.id}, scheduled for ${new Date(scheduledFor).toISOString()}`);

    return null;
  },
});

/**
 * Send a custom email (not from template) from workflow
 */
export const sendCustomWorkflowEmail = internalAction({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    subject: v.string(),
    content: v.string(),
    storeId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    // Get contact info if available
    let firstName = "there";
    let name = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(internal.emailWorkflows.getContactInternal, {
        contactId: args.contactId,
      });
      if (contact) {
        firstName = contact.firstName || contact.email.split("@")[0];
        name = contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "";
      }
    }

    // Get user stats for personalization (level, XP, courses, etc.)
    let userStats = {
      level: "1",
      xp: "0",
      coursesEnrolled: "0",
      lessonsCompleted: "0",
      storeName: "",
      memberSince: "",
      daysSinceJoined: "0",
      totalSpent: "$0",
    };

    try {
      const stats = await ctx.runQuery(internal.emailUserStats.getUserStatsForEmailByEmail, {
        email: args.customerEmail,
      });
      if (stats) {
        userStats = {
          level: String(stats.level || 1),
          xp: String(stats.xp || 0),
          coursesEnrolled: String(stats.coursesEnrolled || 0),
          lessonsCompleted: String(stats.lessonsCompleted || 0),
          storeName: stats.storeName || "",
          memberSince: stats.memberSince || "",
          daysSinceJoined: String(stats.daysSinceJoined || 0),
          totalSpent: `$${stats.totalSpent || 0}`,
        };
      }
    } catch (e) {
      console.log(`[WorkflowEmail] Could not fetch user stats for ${args.customerEmail}:`, e);
    }

    // Get platform stats for dynamic content
    let platformStats = {
      newCoursesCount: "0",
      latestCourseName: "",
      newSamplePacksCount: "0",
      newCreatorsCount: "0",
      topCourseThisWeek: "Production Essentials",
    };

    try {
      const pStats = await ctx.runQuery(internal.emailUserStats.getPlatformStatsForEmail, {});
      if (pStats) {
        platformStats = {
          newCoursesCount: String(pStats.newCoursesCount || 0),
          latestCourseName: pStats.latestCourseName || "",
          newSamplePacksCount: String(pStats.newSamplePacksCount || 0),
          newCreatorsCount: String(pStats.newCreatorsCount || 0),
          topCourseThisWeek: pStats.topCourseThisWeek || "Production Essentials",
        };
      }
    } catch (e) {
      console.log(`[WorkflowEmail] Could not fetch platform stats:`, e);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

    // Generate unsubscribe URL
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.customerEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.customerEmail).digest("base64url");
    const unsubscribeUrl = `${platformUrl}/unsubscribe/${emailBase64}.${signature}`;

    // Replace all template variables
    const replaceAllVariables = (text: string): string => {
      return text
        // User variables
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{name\}\}/g, name || "there")
        .replace(/\{\{email\}\}/g, args.customerEmail)
        .replace(/\{\{level\}\}/g, userStats.level)
        .replace(/\{\{xp\}\}/g, userStats.xp)
        .replace(/\{\{coursesEnrolled\}\}/g, userStats.coursesEnrolled)
        .replace(/\{\{lessonsCompleted\}\}/g, userStats.lessonsCompleted)
        .replace(/\{\{storeName\}\}/g, userStats.storeName)
        .replace(/\{\{memberSince\}\}/g, userStats.memberSince)
        .replace(/\{\{daysSinceJoined\}\}/g, userStats.daysSinceJoined)
        .replace(/\{\{totalSpent\}\}/g, userStats.totalSpent)
        // Platform variables
        .replace(/\{\{platformUrl\}\}/g, platformUrl)
        .replace(/\{\{newCoursesCount\}\}/g, platformStats.newCoursesCount)
        .replace(/\{\{latestCourseName\}\}/g, platformStats.latestCourseName)
        .replace(/\{\{newSamplePacksCount\}\}/g, platformStats.newSamplePacksCount)
        .replace(/\{\{newCreatorsCount\}\}/g, platformStats.newCreatorsCount)
        .replace(/\{\{topCourseThisWeek\}\}/g, platformStats.topCourseThisWeek)
        // Links
        .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
        .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl)
        // Clean up any Handlebars conditionals (basic support)
        .replace(/\{\{#if\s+\w+\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
    };

    const htmlContent = replaceAllVariables(args.content);
    const finalSubject = replaceAllVariables(args.subject);

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: args.customerEmail,
        subject: finalSubject,
        html: htmlContent,
      });

      console.log(`[WorkflowEmail] Sent custom email to ${args.customerEmail}: ${finalSubject}`);
    } catch (error) {
      console.error(`[WorkflowEmail] Failed to send custom email:`, error);
      throw error;
    }

    return null;
  },
});

/**
 * Send email from a workflow using a template
 * Used by the durable workflow system
 */
export const sendWorkflowEmail = internalAction({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    templateId: v.id("emailTemplates"),
    storeId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    // Get the template
    const template = await ctx.runQuery(internal.emailWorkflows.getEmailTemplateInternal, {
      templateId: args.templateId,
    });

    if (!template) {
      console.error(`[WorkflowEmail] Template ${args.templateId} not found`);
      return null;
    }

    // Get contact info if available
    let firstName = "there";
    let name = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(internal.emailWorkflows.getContactInternal, {
        contactId: args.contactId,
      });
      if (contact) {
        firstName = contact.firstName || contact.email.split("@")[0];
        name = contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "";
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate unsubscribe URL
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.customerEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.customerEmail).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    // Personalize content
    const htmlContent = (template.htmlContent || template.content || "")
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there")
      .replace(/\{\{email\}\}/g, args.customerEmail)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const subject = template.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: args.customerEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[WorkflowEmail] Sent email to ${args.customerEmail}: ${subject}`);
    } catch (error) {
      console.error(`[WorkflowEmail] Failed to send email:`, error);
      throw error;
    }

    return null;
  },
});

/**
 * Send team notification via email, Slack, or Discord
 * Used by notify workflow nodes
 */
export const sendTeamNotification = internalAction({
  args: {
    storeId: v.string(),
    notifyMethod: v.string(), // "email", "slack", "discord"
    message: v.string(),
    contactEmail: v.string(),
    contactName: v.optional(v.string()),
    workflowName: v.string(),
    triggerType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get store settings for webhook URLs
    const store = await ctx.runQuery(internal.emailWorkflows.getStoreByClerkId, {
      userId: args.storeId,
    });

    if (!store) {
      console.error(`[Notify] Store not found for ${args.storeId}`);
      return null;
    }

    const contactDisplay = args.contactName
      ? `${args.contactName} (${args.contactEmail})`
      : args.contactEmail;

    const notificationPayload = {
      message: args.message,
      contact: contactDisplay,
      workflow: args.workflowName,
      trigger: args.triggerType || "manual",
      timestamp: new Date().toISOString(),
    };

    if (args.notifyMethod === "slack") {
      const webhookUrl = store.notificationIntegrations?.slackWebhookUrl;
      if (!webhookUrl || !store.notificationIntegrations?.slackEnabled) {
        console.log(`[Notify] Slack not configured for store ${args.storeId}`);
        return null;
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "Workflow Notification",
                  emoji: true,
                },
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Message:*\n${args.message}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*Contact:*\n${contactDisplay}`,
                  },
                ],
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Workflow:*\n${args.workflowName}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*Trigger:*\n${args.triggerType || "manual"}`,
                  },
                ],
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `Sent from PPR Academy at ${new Date().toLocaleString()}`,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`[Notify] Slack webhook failed: ${response.status}`);
        } else {
          console.log(`[Notify] Slack notification sent for ${args.contactEmail}`);
        }
      } catch (error) {
        console.error(`[Notify] Slack webhook error:`, error);
      }
    } else if (args.notifyMethod === "discord") {
      const webhookUrl = store.notificationIntegrations?.discordWebhookUrl;
      if (!webhookUrl || !store.notificationIntegrations?.discordEnabled) {
        console.log(`[Notify] Discord not configured for store ${args.storeId}`);
        return null;
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "Workflow Notification",
                color: 0x5865f2, // Discord blurple
                fields: [
                  {
                    name: "Message",
                    value: args.message,
                    inline: false,
                  },
                  {
                    name: "Contact",
                    value: contactDisplay,
                    inline: true,
                  },
                  {
                    name: "Workflow",
                    value: args.workflowName,
                    inline: true,
                  },
                  {
                    name: "Trigger",
                    value: args.triggerType || "manual",
                    inline: true,
                  },
                ],
                footer: {
                  text: "PPR Academy",
                },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`[Notify] Discord webhook failed: ${response.status}`);
        } else {
          console.log(`[Notify] Discord notification sent for ${args.contactEmail}`);
        }
      } catch (error) {
        console.error(`[Notify] Discord webhook error:`, error);
      }
    } else {
      // Default: email notification to store owner
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Get store owner email from store config or default
      const ownerEmail =
        store.emailConfig?.adminNotifications?.notificationEmail ||
        store.emailConfig?.fromEmail ||
        process.env.ADMIN_EMAIL;

      if (!ownerEmail) {
        console.log(`[Notify] No admin email configured for store ${args.storeId}`);
        return null;
      }

      const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
      const fromName = process.env.FROM_NAME || "PPR Academy";

      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: ownerEmail,
          subject: `[Workflow] ${args.message}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Workflow Notification</h2>
              <p style="font-size: 16px; color: #555;">${args.message}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #888;">Contact:</td>
                  <td style="padding: 8px 0; color: #333;">${contactDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Workflow:</td>
                  <td style="padding: 8px 0; color: #333;">${args.workflowName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Trigger:</td>
                  <td style="padding: 8px 0; color: #333;">${args.triggerType || "manual"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">Sent from PPR Academy Workflow Automations</p>
            </div>
          `,
        });

        console.log(`[Notify] Email notification sent to ${ownerEmail}`);
      } catch (error) {
        console.error(`[Notify] Email notification error:`, error);
      }
    }

    return null;
  },
});
