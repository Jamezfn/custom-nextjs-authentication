"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { signInSchema, signUpSchema } from "./schemas";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";
import { comparePwd, genSalt, hashPassword } from "../core/passwordHasher";
import { createUserSession, removeUserFrmSession } from "../core/session";
import { cookies } from "next/headers";

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
    const { success, data } = signInSchema.safeParse(unsafeData);

    if (!success) return "Unable to log you in";

    const user = await db.query.UserTable.findFirst({
        columns: { password: true, salt: true, id: true, email: true, role: true },
        where: eq(UserTable.email, data.email),
    });

    if (user == null) {
        return "Unable to log you in";
    }

    const isCorrectPwd = await comparePwd({
        hashedPassword: user.password,
        password: data.password,
        salt: user.salt,
    });

    if (!isCorrectPwd) return "Unable to log you in";
    await createUserSession(user, await cookies());
    
    redirect("/");
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
    const { success, data } = signUpSchema.safeParse(unsafeData);

    if (!success) return "Unable to create account"

    const existingUser = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, data.email)
    });

    if (existingUser != null) return "Account already exists for this email";
    const salt = genSalt();
    const hashedPassword = await hashPassword(data.password, salt);

    try {
        const [user] = await db
        .insert(UserTable)
        .values({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            salt,
        })
        .returning({ id: UserTable.id, role: UserTable.role });

        if (user == null) return "unable to create account";
        await createUserSession(user, await cookies())

    } catch {
        return "unable to create account";
    }
    
    redirect("/");
}

export async function logOut() {
    await removeUserFrmSession(await cookies());
    redirect("/");
}

export async function oAuthSignIn() {
    redirect("/")
}