import { createUserSession } from "@/auth/core/session";
import { getOAuthClient, OAuthClient } from "@/auth/core/oauth/base";
import { db } from "@/drizzle/db";
import { oAuthProvider, oAuthProviders, UserOAuthAccountTable, UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import z from "zod";

type Prop = {
    params: Promise<{ provider: string }>;
}

type PropUser = {
    id: string;
    email: string;
    name: string;
}

function connectUserToAccount({ id, email, name, }: PropUser, provider: oAuthProvider) {
    return db.transaction(async trx => {
        let user = await trx.query.UserTable.findFirst({
            where: eq(UserTable.email, email),
            columns: { id: true, role: true },
        });

        if (user == null) {
            const [newUser] = await trx
                .insert(UserTable)
                .values({
                    email: email,
                    name: name,
                })
                .returning({ id: UserTable.id, role: UserTable.role })
            user = newUser;
        }
        await trx
            .insert(UserOAuthAccountTable)
            .values({
                provider,
                providerAccountId: id,
                userId: user.id,
            })
            .onConflictDoNothing();

        return user;
    });
}

export async function GET(request: NextRequest, { params }: Prop) {
    const { provider: rawProvider } = await params;
    console.log(rawProvider);
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const provider = z.enum(oAuthProviders).parse(rawProvider);

    if (typeof code !== "string" || typeof state !== "string") {
        redirect(
            `/sign-in?oauthError=${encodeURIComponent(
                "Failed to connect. Please try again."
            )}`
        );
    }
    const oAuthClient = getOAuthClient(provider);

    try {
        const oAuthUser = await oAuthClient.fetchUser(code, state, await cookies());
        const user = await connectUserToAccount(oAuthUser, provider);
        await createUserSession(user, await cookies());
    } catch (error) {
        console.log(error);
        redirect(
            `/sign-in?oauthError=${encodeURIComponent(
                "Failed to connect. Please try again."
            )}`
        );
    }

    redirect("/");
}