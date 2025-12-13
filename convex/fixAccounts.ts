import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Fix multi-account issue by creating both Instagram accounts
 */
export const createBothInstagramAccounts = action({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Create @abletonppr account
      const abletonId = await ctx.runMutation(api.socialMedia.connectSocialAccount, {
        storeId: args.storeId,
        userId: args.userId,
        platform: "instagram" as any,
        platformUserId: "17841463950870928_unique",
        platformUsername: "abletonppr",
        platformDisplayName: "Daily Ableton Live Tips and Tricks",
        profileImageUrl: "https://scontent-iad3-2.xx.fbcdn.net/v/t51.2885-15/425306623_1088401365922351_1013716047636930532_n.jpg",
        accessToken: "EAAbv3gGV0IMBQDmokj6ZCCEB5ZAKW2FLu99fmCJcYqJ7fd9iIcl2i5ihvaHRoKwbvStCAIxBZAXE38ZCNvLlKZBPMQo5dUAESg8IGUCHLsSddcEA8AWX01NdKNGIuu98iJoNlZAvxJafqv7pR9TIztROyKmlIl0aYORVFTmME6DJdCLelh10zBzQKXmiEOgLZCCOs04CSSCd6CiKqxzASRARkEY",
        grantedScopes: [],
        platformData: {
          facebookPageId: "885192451345466",
          facebookPageAccessToken: "EAAbv3gGV0IMBQH5MdfTuZC1XBL9XLycz5ZCg8EYPMFa6Mhtr1lUtYaZA0KVhmZCHeZCIdtvvjURaSchjnSZCPXkwZCvFgMx4dx3CargTnbPZCNXZANVVEGLitt69MLZAkET5BOVEQn9TIztROyKmlIl0aYORVFTmME6DJdCLelh10zBzQKXmiEOgLZCCOs04CSSCd6CiKqxzASRARkEY",
          instagramBusinessAccountId: "17841463950870928"
        }
      });

      // Create @pauseplayrepeat account 
      const pauseplayId = await ctx.runMutation(api.socialMedia.connectSocialAccount, {
        storeId: args.storeId,
        userId: args.userId,
        platform: "instagram" as any,
        platformUserId: "17841403218910700_unique",
        platformUsername: "pauseplayrepeat",
        platformDisplayName: "Daily Music Production Tips",
        profileImageUrl: "https://scontent-iad3-1.xx.fbcdn.net/v/t51.2885-15/425204432_1721434031680210_5379825876788453991_n.jpg",
        accessToken: "EAAbv3gGV0IMBQAeBhggq1fP73GZBJoLn41e5ku5SAeqUVe6gkRjZC1TAQ19sQTDq94AOZBRh2DfCQ4GEB5mp46jyh4gLQMDINU2QFbLChvqUnHzF1bNDFCixj246e9FNx6SIKzfSy3l1TykD5NscZCk4E2mokFhmIAnRZC82GT8VZAUDzQPZBtbAQ3iYiZBpC4tJXRJ7GRoIEzFZCkSvkpZAReHdCcUWCWWwJkrvRTheu4lyrzHjmxeCGCtTbdgdSgRPzFTBSStYI7Lf8B5nRp7MnvVchNEdXJ9gxU7QgkQGTuo4V9duEd9gZDZD",
        grantedScopes: [],
        platformData: {
          facebookPageId: "237190309967998",
          facebookPageAccessToken: "EAAbv3gGV0IMBQCLYgimEzIjcBUp5ksykwTyHmPMyFtb0FXCXsFmdbcDhbaZBlT0ZBIxzF5SyA6uSPy26zkZA6xurfN9ZBgSdR0vSpxuIIkha8gF7x5TmfYCYAYZABgKTWJy0RvyApYZBMPeciiwnvbQmpwj86kA9A91I8iusmDZC7cxGt2UuL9F0ZC7DhE9pcLI8XIbvs9QsW4YnF4SttPkZD",
          instagramBusinessAccountId: "17841403218910700"
        }
      });

      return {
        success: true,
        message: `Created both accounts: abletonppr (${abletonId}) and pauseplayrepeat (${pauseplayId})`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error}`
      };
    }
  },
});
