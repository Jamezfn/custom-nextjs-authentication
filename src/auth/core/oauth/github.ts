import { env } from "@/data/env/server";
import { OAuthClient } from "./base";
import { z } from "zod";

export function createGithubOAuthClient() {
    return new OAuthClient({
        provider: "github",
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scopes: ["user:email", "read:user"],
        urls: {
            auth: "https://github.com/login/oauth/authorize",
            token: "https://github.com/login/oauth/access_token",
            user: "https://api.github.com/user"
        },
        userInfo: {
            schema: z.object({
                id: z.number(),
                login: z.string(),
                name: z.string().nullable(),
                email: z.email().nullable(),
            }),
            parse: user => ({
                id: user.id.toString(),
                name: user.name ?? user.login,
                email: user.email ?? ""
            }),
        }
    })
}