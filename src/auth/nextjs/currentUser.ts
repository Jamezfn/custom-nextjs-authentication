import { cookies } from "next/headers";
import { cache } from "react";
import { getUserFromSession } from "../core/session";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";
import { redirect } from "next/navigation";

function getUserFromDb(id: string) {
    return db.query.UserTable.findFirst({
        columns: { id: true, email: true, role: true, name: true },
        where: eq(UserTable.id, id),
    });
}

type FullUser = Exclude<Awaited<ReturnType<typeof getUserFromDb>>, undefined | null>;
type User = Exclude<Awaited<ReturnType<typeof getUserFromSession>>, undefined | null>;

function _getCurrentUser(options: { withFullUser: true; redirectIfNotFound: true }): Promise<FullUser>
function _getCurrentUser(options: { withFullUser: true; redirectIfNotFound?: false }): Promise<FullUser | null>
function _getCurrentUser(options: { withFullUser?: false; redirectIfNotFound: true }): Promise<User>
function _getCurrentUser(options?: { withFullUser?: false; redirectIfNotFound?: false }): Promise<User | null>
async function _getCurrentUser({ withFullUser = false, redirectIfNotFound = false, } = {}) {
    const user = await getUserFromSession(await cookies());

    if (user == null) {
        if(redirectIfNotFound) return redirect("/sign-in");
        return null;
    }

    if (withFullUser) {
        const fullUser = await getUserFromDb(user.id);
        if (fullUser == null) throw new Error("User not found in database");

        return fullUser;
    }

    return user;
}

export const getCurrentUser = cache(_getCurrentUser); 